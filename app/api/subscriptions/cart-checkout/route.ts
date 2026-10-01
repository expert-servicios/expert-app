import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripeClient, toStripeAscii } from '@/lib/integrations/stripe';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getPublicAppUrl } from '@/lib/utils/app-url';
import { isCompanyBillingReady, missingCompanyBillingFields } from '@/lib/companies/billing-readiness';
import {
  claimSubscriptionCheckout,
  expireSubscriptionCheckoutClaim,
  finalizeSubscriptionCheckoutClaim,
  flagSubscriptionCheckoutClaimReview,
  newSubscriptionCheckoutOwnerToken,
} from '@/lib/subscriptions/checkout-claim';

type BillingInterval = 'month' | 'year';

type PlanConfig = {
  priceId: string;
  name: string;
  amountEur: number;
  interval: BillingInterval;
};

const PLAN_CHECKOUTS: PlanConfig[] = [
  { priceId: process.env.STRIPE_PLAN_MONTHLY_49 ?? '', name: 'Plan Supervisión', amountEur: 49, interval: 'month' },
  { priceId: process.env.STRIPE_PLAN_MONTHLY_99 ?? '', name: 'Plan Avanzado', amountEur: 99, interval: 'month' },
  { priceId: process.env.STRIPE_PLAN_MONTHLY_199 ?? '', name: 'Plan Colaborativo', amountEur: 199, interval: 'month' },
  { priceId: process.env.STRIPE_PLAN_ANNUAL_49 ?? '', name: 'Plan Supervisión', amountEur: 490, interval: 'year' },
  { priceId: process.env.STRIPE_PLAN_ANNUAL_99 ?? '', name: 'Plan Avanzado', amountEur: 990, interval: 'year' },
  { priceId: process.env.STRIPE_PLAN_ANNUAL_199 ?? '', name: 'Plan Colaborativo', amountEur: 1990, interval: 'year' },
].filter((plan): plan is PlanConfig => Boolean(plan.priceId));

const PLAN_BY_PRICE = new Map(PLAN_CHECKOUTS.map(plan => [plan.priceId, plan]));

const bodySchema = z.object({
  companyId: z.string().uuid().optional(),
  items: z.array(z.object({
    priceId: z.string().min(1),
    quantity: z.number().int().min(1).max(20).default(1),
    itemType: z.enum(['subscription', 'service']).default('subscription'),
    billingInterval: z.enum(['month', 'year']).optional(),
    beneficiaryCompanyId: z.string().uuid().optional(),
  })).min(1).max(10),
});

function normalizeBundle(items: Array<{ priceId: string; quantity: number }>) {
  return [...items]
    .sort((a, b) => a.priceId.localeCompare(b.priceId))
    .map(item => `${item.priceId}:${item.quantity}`)
    .join('|');
}

function bundleIntentKey(userId: string, companyId: string, normalized: string) {
  const digest = createHash('sha256')
    .update(`${userId}:${companyId}:${normalized}`)
    .digest('hex')
    .slice(0, 32);
  return `subscription_bundle:${digest}`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado', requiresAuth: true }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Cesta de suscripción no válida.' }, { status: 400 });
    }

    if (parsed.data.items.some(item => item.itemType !== 'subscription')) {
      return NextResponse.json({
        error: 'De momento los servicios de pago único se tramitan en un pedido separado de la suscripción.',
        code: 'mixed_recurring_one_time_not_enabled',
      }, { status: 409 });
    }

    const resolvedItems = parsed.data.items.map(item => {
      const plan = PLAN_BY_PRICE.get(item.priceId);
      if (!plan) {
        throw Object.assign(new Error('Uno de los planes ya no está disponible.'), { _userError: true });
      }
      if (item.billingInterval && item.billingInterval !== plan.interval) {
        throw Object.assign(new Error('La periodicidad del plan no coincide con el precio configurado.'), { _userError: true });
      }
      return { ...item, plan };
    });

    const intervals = new Set(resolvedItems.map(item => item.plan.interval));
    if (intervals.size !== 1) {
      return NextResponse.json({
        error: 'Los planes mensuales y anuales deben contratarse en pedidos separados.',
        code: 'mixed_billing_intervals',
      }, { status: 409 });
    }

    const admin = getSupabaseAdmin();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('profile_completed,active_company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'No se pudo resolver tu perfil de contratación.' }, { status: 500 });
    }
    if (!profile.profile_completed) {
      return NextResponse.json({
        error: 'Completa tu perfil antes de suscribirte.',
        code: 'profile_required',
      }, { status: 409 });
    }

    const companyId = parsed.data.companyId ?? profile.active_company_id ?? null;
    if (!companyId) {
      return NextResponse.json({
        error: 'Selecciona o crea la entidad fiscal que va a pagar la suscripción.',
        code: 'company_required',
      }, { status: 409 });
    }

    const { data: membership, error: membershipError } = await admin
      .from('profile_companies')
      .select('role')
      .eq('profile_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle();
    if (membershipError) {
      return NextResponse.json({ error: 'No se pudo validar la entidad seleccionada.' }, { status: 500 });
    }
    if (!membership) {
      return NextResponse.json({
        error: 'La entidad seleccionada no pertenece al usuario.',
        code: 'company_forbidden',
      }, { status: 403 });
    }

    const { data: company, error: companyError } = await admin
      .from('companies')
      .select('stripe_customer_id,razon_social,cif_nif,direccion,ciudad,codigo_postal,pais')
      .eq('id', companyId)
      .maybeSingle();
    if (companyError || !company) {
      return NextResponse.json({ error: 'No se pudo resolver la entidad seleccionada.' }, { status: 500 });
    }
    if (!isCompanyBillingReady(company)) {
      return NextResponse.json({
        error: 'Completa los datos fiscales de la entidad seleccionada antes de suscribirte.',
        code: 'billing_required',
        companyId,
        missingFields: missingCompanyBillingFields(company),
      }, { status: 409 });
    }

    const { data: existingSubscriptions, error: existingError } = await admin
      .from('subscriptions')
      .select('id,status,plan_name')
      .eq('client_id', user.id)
      .eq('company_id', companyId)
      .in('status', ['active', 'trialing', 'past_due', 'unpaid'])
      .limit(1);
    if (existingError) {
      return NextResponse.json({ error: 'No se pudo comprobar la suscripción actual.' }, { status: 500 });
    }
    if (existingSubscriptions?.[0]) {
      return NextResponse.json({
        error: 'Esta entidad ya tiene una suscripción vigente o pendiente de regularizar.',
        code: 'subscription_exists',
        subscriptionId: existingSubscriptions[0].id,
      }, { status: 409 });
    }

    const normalized = normalizeBundle(resolvedItems);
    const intentKey = bundleIntentKey(user.id, companyId, normalized);
    const ownerToken = newSubscriptionCheckoutOwnerToken();
    const stripe = getStripeClient();

    let claim;
    try {
      claim = await claimSubscriptionCheckout(admin, {
        userId: user.id,
        companyId,
        intentKey,
        ownerToken,
      });
    } catch (claimError) {
      console.error('[subscriptions/cart-checkout] claim failed:', claimError);
      return NextResponse.json({
        error: 'No se pudo reservar de forma segura la contratación.',
        code: 'checkout_claim_error',
      }, { status: 500 });
    }

    if (!claim.acquired) {
      if (claim.state === 'open' && claim.stripeSessionId) {
        try {
          const existing = await stripe.checkout.sessions.retrieve(claim.stripeSessionId);
          if (existing.status === 'open' && existing.url) {
            return NextResponse.json({
              url: existing.url,
              sessionId: existing.id,
              companyId,
              reused: true,
            });
          }
        } catch (error) {
          console.error('[subscriptions/cart-checkout] existing session verification failed:', error);
        }
      }
      return NextResponse.json({
        error: 'Ya existe una contratación equivalente en curso o pendiente de revisión.',
        code: claim.state === 'manual_review' ? 'checkout_manual_review' : 'checkout_in_progress',
      }, { status: 409 });
    }

    if (!claim.claimId) {
      return NextResponse.json({
        error: 'No se pudo reservar de forma segura la contratación.',
        code: 'checkout_claim_error',
      }, { status: 500 });
    }

    const recurringTotalCents = resolvedItems.reduce(
      (sum, item) => sum + Math.round(item.plan.amountEur * 100) * item.quantity,
      0,
    );
    const bundleLabel = resolvedItems
      .map(item => `${item.plan.name} × ${item.quantity}`)
      .join(' + ');
    const interval = resolvedItems[0].plan.interval;
    const bundleItems = resolvedItems.map(item => ({
      priceId: item.priceId,
      planName: item.plan.name,
      quantity: item.quantity,
      amountEur: item.plan.amountEur,
      interval: item.plan.interval,
      beneficiaryCompanyId: item.beneficiaryCompanyId ?? null,
    }));

    const entityMetadata = {
      user_id: user.id,
      company_id: companyId,
      plan_name: `Bundle EXPERT — ${bundleLabel}`.slice(0, 500),
      billing: interval,
      product_type: 'subscription_bundle',
      bundle_key: intentKey,
      recurring_total_cents: String(recurringTotalCents),
    };

    const appUrl = getPublicAppUrl();
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: company.stripe_customer_id ?? undefined,
        customer_email: company.stripe_customer_id ? undefined : user.email,
        client_reference_id: user.id,
        billing_address_collection: 'required',
        tax_id_collection: { enabled: true, required: 'if_supported' },
        automatic_tax: { enabled: true },
        ...(company.stripe_customer_id
          ? { customer_update: { address: 'auto' as const, name: 'auto' as const } }
          : {}),
        metadata: entityMetadata,
        subscription_data: { metadata: entityMetadata },
        line_items: resolvedItems.map(item => ({
          quantity: item.quantity,
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(item.plan.amountEur * 100),
            tax_behavior: 'exclusive' as const,
            recurring: { interval: item.plan.interval },
            product_data: {
              name: toStripeAscii(item.plan.name),
              metadata: {
                configured_price_id: item.priceId,
                bundle_key: intentKey,
              },
            },
          },
        })),
        success_url: `${appUrl}/dashboard/post-compra?origin=subscription-bundle`,
        cancel_url: `${appUrl}/carrito`,
      });
    } catch (stripeError) {
      console.error('[subscriptions/cart-checkout] Stripe session creation failed:', stripeError);
      try {
        await expireSubscriptionCheckoutClaim(admin, {
          claimId: claim.claimId,
          ownerToken,
          error: 'stripe_session_create_failed',
        });
      } catch {}
      return NextResponse.json({ error: 'Error al crear la sesión de pago.' }, { status: 502 });
    }

    const { error: persistError } = await admin.from('checkout_sessions').insert({
      stripe_session_id: session.id,
      user_id: user.id,
      company_id: companyId,
      status: 'open',
      metadata: {
        product_type: 'subscription_bundle',
        bundle_key: intentKey,
        bundle_label: bundleLabel,
        bundle_items: bundleItems,
        recurring_total_cents: recurringTotalCents,
        billing: interval,
        automatic_tax: true,
        tax_behavior: 'exclusive',
      },
    });

    if (persistError) {
      console.error('[subscriptions/cart-checkout] persistence failed:', persistError);
      let expired = false;
      try {
        await stripe.checkout.sessions.expire(session.id);
        expired = true;
      } catch {}
      try {
        if (expired) {
          await expireSubscriptionCheckoutClaim(admin, {
            claimId: claim.claimId,
            ownerToken,
            error: 'checkout_persistence_failed',
          });
        } else {
          await flagSubscriptionCheckoutClaimReview(admin, {
            claimId: claim.claimId,
            ownerToken,
            error: 'checkout_persistence_failed_and_stripe_expire_failed',
          });
        }
      } catch {}
      return NextResponse.json({
        error: 'No se pudo registrar de forma segura la contratación.',
      }, { status: 500 });
    }

    try {
      await finalizeSubscriptionCheckoutClaim(admin, {
        claimId: claim.claimId,
        ownerToken,
        stripeSessionId: session.id,
      });
    } catch (error) {
      console.error('[subscriptions/cart-checkout] claim finalize failed:', error);
      try { await stripe.checkout.sessions.expire(session.id); } catch {}
      try {
        await flagSubscriptionCheckoutClaimReview(admin, {
          claimId: claim.claimId,
          ownerToken,
          error: 'claim_finalize_failed',
        });
      } catch {}
      return NextResponse.json({
        error: 'No se pudo confirmar de forma segura la contratación.',
        code: 'checkout_manual_review',
      }, { status: 500 });
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      companyId,
      recurringTotalCents,
      bundleLabel,
    });
  } catch (error) {
    const typed = error as { _userError?: boolean; message?: string };
    if (typed._userError) {
      return NextResponse.json({ error: typed.message ?? 'Cesta no válida.' }, { status: 400 });
    }
    console.error('[subscriptions/cart-checkout] unexpected error:', error);
    return NextResponse.json({ error: 'Error al crear la suscripción.' }, { status: 500 });
  }
}
