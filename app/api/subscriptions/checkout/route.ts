import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripeClient, toStripeAscii } from '@/lib/integrations/stripe';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getPublicAppUrl } from '@/lib/utils/app-url';
import { isCompanyBillingReady, missingCompanyBillingFields } from '@/lib/companies/billing-readiness';
import { resolveCompanyCommercialCoverage } from '@/lib/subscriptions/company-commercial-coverage';
import { MONTHLY_CALENDAR_BILLING_METADATA, nextMonthlyCalendarBillingAnchor } from '@/lib/subscriptions/calendar-month-billing';
import {
  getSubscriptionInvitePlanByPriceId,
  getSubscriptionInvitePlanByServiceSlug,
} from '@/lib/subscriptions/invitation-plans';
import {
  claimSubscriptionCheckout,
  expireSubscriptionCheckoutClaim,
  finalizeSubscriptionCheckoutClaim,
  flagSubscriptionCheckoutClaimReview,
  newSubscriptionCheckoutOwnerToken,
} from '@/lib/subscriptions/checkout-claim';

const bodySchema = z.object({
  priceId: z.string().min(1),
  companyId: z.string().uuid().optional(),
  quoteId: z.string().uuid().optional(),
});

type BillingInterval = 'month' | 'year';

interface PlanConfig {
  priceId: string;
  name: string;
  amountEur: number;
  interval: BillingInterval;
}

const PLAN_CHECKOUTS: PlanConfig[] = [
  { priceId: process.env.STRIPE_PLAN_MONTHLY_49 ?? '', name: 'Plan Supervisión', amountEur: 49, interval: 'month' },
  { priceId: process.env.STRIPE_PLAN_MONTHLY_99 ?? '', name: 'Plan Avanzado', amountEur: 99, interval: 'month' },
  { priceId: process.env.STRIPE_PLAN_MONTHLY_199 ?? '', name: 'Plan Colaborativo', amountEur: 199, interval: 'month' },
  { priceId: process.env.STRIPE_PLAN_ANNUAL_49 ?? '', name: 'Plan Supervisión', amountEur: 490, interval: 'year' },
  { priceId: process.env.STRIPE_PLAN_ANNUAL_99 ?? '', name: 'Plan Avanzado', amountEur: 990, interval: 'year' },
  { priceId: process.env.STRIPE_PLAN_ANNUAL_199 ?? '', name: 'Plan Colaborativo', amountEur: 1990, interval: 'year' },
].filter((plan): plan is PlanConfig => Boolean(plan.priceId));

const VALID_PLAN_IDS = PLAN_CHECKOUTS.map((plan) => plan.priceId);

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const parseResult = bodySchema.safeParse(await request.json());
    if (!parseResult.success) {
      return NextResponse.json({ error: 'priceId requerido y companyId debe ser UUID si se indica' }, { status: 400 });
    }

    const { priceId, companyId: requestedCompanyId, quoteId } = parseResult.data;
    if (!VALID_PLAN_IDS.includes(priceId)) {
      return NextResponse.json({ error: 'Plan no valido' }, { status: 400 });
    }

    const configuredPlan = PLAN_CHECKOUTS.find((plan) => plan.priceId === priceId);
    if (!configuredPlan) {
      return NextResponse.json({ error: 'Plan no valido' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    let invitationQuote: {
      id: string;
      status: string;
      company_id: string | null;
      claim_email: string | null;
      expires_at: string | null;
      amount_eur: number | string;
      service_slugs: string[] | null;
    } | null = null;

    if (quoteId) {
      const { data: quote, error: quoteError } = await admin
        .from('quotes')
        .select('id,client_id,status,company_id,claim_email,expires_at,amount_eur,service_slugs')
        .eq('id', quoteId)
        .maybeSingle();

      if (quoteError || !quote) {
        return NextResponse.json({ error: 'Presupuesto de suscripción no encontrado.' }, { status: 404 });
      }
      if (quote.client_id !== user.id) {
        return NextResponse.json({ error: 'Este presupuesto no pertenece a tu cuenta.' }, { status: 403 });
      }
      if (!['sent', 'accepted'].includes(quote.status)) {
        return NextResponse.json({ error: 'Este presupuesto ya no admite contratación.' }, { status: 409 });
      }
      if (quote.expires_at && new Date(quote.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ error: 'Este presupuesto ha caducado.' }, { status: 410 });
      }
      const userEmail = user.email?.trim().toLowerCase() ?? '';
      const claimEmail = quote.claim_email?.trim().toLowerCase() ?? '';
      if (claimEmail && claimEmail !== userEmail) {
        return NextResponse.json({ error: 'Accede con el email que recibió esta propuesta.' }, { status: 403 });
      }

      const planService = Array.isArray(quote.service_slugs)
        ? quote.service_slugs.find((slug) => typeof slug === 'string' && slug.startsWith('plan-'))
        : null;
      const { data: quoteItem, error: quoteItemError } = await admin
        .from('quote_items')
        .select('service_slug,stripe_price_id,unit_amount_cents')
        .eq('quote_id', quote.id)
        .eq('position', 0)
        .maybeSingle();
      if (quoteItemError) {
        return NextResponse.json({ error: 'No se pudo verificar la modalidad contractual del plan.' }, { status: 500 });
      }

      const invitePlan = quoteItem?.stripe_price_id
        ? getSubscriptionInvitePlanByPriceId(quoteItem.stripe_price_id)
        : getSubscriptionInvitePlanByServiceSlug(planService, 'monthly');
      if (
        !invitePlan
        || invitePlan.serviceSlug !== planService
        || invitePlan.priceId !== priceId
        || invitePlan.amountEur !== configuredPlan.amountEur
        || invitePlan.interval !== configuredPlan.interval
        || (quoteItem && quoteItem.stripe_price_id !== priceId)
      ) {
        return NextResponse.json({ error: 'El plan o la modalidad no coinciden con el presupuesto aceptado.' }, { status: 409 });
      }
      if (
        Number(quote.amount_eur) !== configuredPlan.amountEur
        || (quoteItem && Number(quoteItem.unit_amount_cents) !== Math.round(configuredPlan.amountEur * 100))
      ) {
        return NextResponse.json({ error: 'El importe del presupuesto no coincide con el plan.' }, { status: 409 });
      }

      invitationQuote = quote;
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('profile_completed,active_company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'No se pudo resolver tu perfil de contratación' }, { status: 500 });
    }

    if (!profile.profile_completed) {
      return NextResponse.json(
        { error: 'Completa tu perfil antes de suscribirte.', code: 'profile_required' },
        { status: 409 }
      );
    }

    const companyId = requestedCompanyId ?? profile.active_company_id ?? null;
    if (!companyId) {
      return NextResponse.json(
        { error: 'Selecciona o crea la entidad fiscal que va a contratar el plan.', code: 'company_required' },
        { status: 409 }
      );
    }

    if (invitationQuote?.company_id && invitationQuote.company_id !== companyId) {
      return NextResponse.json({
        error: 'Este presupuesto ya está vinculado a otra entidad fiscal.',
        code: 'quote_company_conflict',
      }, { status: 409 });
    }

    const { data: membership, error: membershipError } = await admin
      .from('profile_companies')
      .select('role')
      .eq('profile_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (membershipError) {
      return NextResponse.json({ error: 'No se pudo validar la entidad seleccionada' }, { status: 500 });
    }
    if (!membership) {
      return NextResponse.json({ error: 'La entidad seleccionada no pertenece al usuario', code: 'company_forbidden' }, { status: 403 });
    }

    const { data: company, error: companyError } = await admin
      .from('companies')
      .select('stripe_customer_id,razon_social,cif_nif,direccion,ciudad,codigo_postal,pais')
      .eq('id', companyId)
      .maybeSingle();
    if (companyError || !company) {
      return NextResponse.json({ error: 'No se pudo resolver la entidad seleccionada' }, { status: 500 });
    }

    if (!isCompanyBillingReady(company)) {
      return NextResponse.json({
        error: 'Completa los datos fiscales de la entidad seleccionada antes de suscribirte.',
        code: 'billing_required',
        companyId,
        missingFields: missingCompanyBillingFields(company),
      }, { status: 409 });
    }

    const coverage = await resolveCompanyCommercialCoverage(admin, user.id, companyId);
    if (coverage.covered && coverage.source === 'included_entity') {
      return NextResponse.json({
        error: coverage.primaryCompanyName
          ? `Esta entidad ya está incluida en la cobertura de ${coverage.primaryCompanyName}.`
          : 'Esta entidad ya está incluida en otra suscripción activa de tu cuenta.',
        code: 'company_covered',
        coverage,
      }, { status: 409 });
    }

    const { data: existingSubscriptions, error: existingSubscriptionError } = await admin
      .from('subscriptions')
      .select('id,status,plan_name')
      .eq('client_id', user.id)
      .eq('company_id', companyId)
      .in('status', ['active', 'trialing', 'past_due', 'unpaid'])
      .limit(1);
    if (existingSubscriptionError) {
      return NextResponse.json({ error: 'No se pudo comprobar la suscripción actual' }, { status: 500 });
    }
    if (existingSubscriptions?.[0]) {
      return NextResponse.json({
        error: 'Esta entidad ya tiene una suscripción vigente o pendiente de regularizar.',
        code: 'subscription_exists',
        subscriptionId: existingSubscriptions[0].id,
      }, { status: 409 });
    }

    const stripeCustomerId = company.stripe_customer_id ?? null;
    const stripe = getStripeClient();
    const appUrl = getPublicAppUrl();
    const ownerToken = newSubscriptionCheckoutOwnerToken();

    let claim;
    try {
      claim = await claimSubscriptionCheckout(admin, {
        userId: user.id,
        companyId,
        priceId,
        ownerToken,
      });
    } catch (claimError) {
      console.error('[subscriptions/checkout] failed to acquire atomic claim:', claimError);
      return NextResponse.json(
        { error: 'No se pudo reservar de forma segura la contratación. Inténtalo de nuevo.', code: 'checkout_claim_error' },
        { status: 500 }
      );
    }

    if (!claim.acquired) {
      if (claim.state === 'open' && claim.stripeSessionId) {
        try {
          const existingSession = await stripe.checkout.sessions.retrieve(claim.stripeSessionId);
          if (existingSession.status === 'open' && existingSession.url) {
            return NextResponse.json({
              url: existingSession.url,
              sessionId: existingSession.id,
              companyId,
              reused: true,
            });
          }

          if (existingSession.status === 'expired' || existingSession.status === 'complete') {
            const localStatus = existingSession.status === 'complete' ? 'completed' : 'expired';
            const { error: syncError } = await admin
              .from('checkout_sessions')
              .update({ status: localStatus })
              .eq('stripe_session_id', existingSession.id)
              .in('status', ['open', 'pending']);

            if (syncError) {
              console.error('[subscriptions/checkout] failed to reconcile stale checkout:', syncError);
              return NextResponse.json(
                { error: 'La contratación anterior requiere revisión antes de crear otra sesión.', code: 'checkout_manual_review' },
                { status: 409 }
              );
            }

            return NextResponse.json(
              {
                error: existingSession.status === 'complete'
                  ? 'La sesión anterior ya se completó y está siendo procesada.'
                  : 'La sesión anterior estaba caducada. Repite la contratación para generar un enlace nuevo.',
                code: existingSession.status === 'complete' ? 'checkout_completed' : 'checkout_retry',
              },
              { status: 409 }
            );
          }
        } catch (reconcileError) {
          console.error('[subscriptions/checkout] failed to reconcile existing Stripe session:', reconcileError);
          return NextResponse.json(
            { error: 'Hay una contratación previa que no se puede verificar automáticamente.', code: 'checkout_manual_review' },
            { status: 409 }
          );
        }
      }

      if (claim.state === 'manual_review') {
        return NextResponse.json(
          { error: 'La contratación anterior requiere revisión antes de crear otra sesión.', code: 'checkout_manual_review' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Ya hay una contratación en curso para esta entidad y plan.', code: 'checkout_in_progress' },
        { status: 409 }
      );
    }

    if (!claim.claimId) {
      console.error('[subscriptions/checkout] acquired claim without claim_id');
      return NextResponse.json(
        { error: 'No se pudo reservar de forma segura la contratación.', code: 'checkout_claim_error' },
        { status: 500 }
      );
    }

    const isMonthlyCalendarPlan = configuredPlan.interval === 'month';
    const calendarBillingMetadata = isMonthlyCalendarPlan ? MONTHLY_CALENDAR_BILLING_METADATA : {};
    const entityMetadata = {
      user_id: user.id,
      company_id: companyId,
      plan_name: configuredPlan.name,
      billing: configuredPlan.interval,
      product_type: 'suscripcion',
      ...calendarBillingMetadata,
      ...(quoteId ? { quote_id: quoteId } : {}),
    };

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: stripeCustomerId ?? undefined,
        customer_email: stripeCustomerId ? undefined : user.email,
        client_reference_id: user.id,
        billing_address_collection: 'required',
        tax_id_collection: { enabled: true, required: 'if_supported' },
        automatic_tax: { enabled: true },
        ...(stripeCustomerId ? { customer_update: { address: 'auto' as const, name: 'auto' as const } } : {}),
        metadata: entityMetadata,
        subscription_data: {
          metadata: {
            ...entityMetadata,
            configured_price_id: priceId,
          },
          ...(isMonthlyCalendarPlan ? {
            billing_cycle_anchor: nextMonthlyCalendarBillingAnchor(),
            proration_behavior: 'none' as const,
          } : {}),
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'eur',
              unit_amount: Math.round(configuredPlan.amountEur * 100),
              tax_behavior: 'exclusive',
              recurring: { interval: configuredPlan.interval },
              product_data: {
                name: toStripeAscii(configuredPlan.name),
                metadata: {
                  configured_price_id: priceId,
                  billing: configuredPlan.interval,
                  ...calendarBillingMetadata,
                  billing_component: 'recurring',
                },
              },
            },
          },
          ...(isMonthlyCalendarPlan ? [{
            quantity: 1,
            price_data: {
              currency: 'eur',
              unit_amount: Math.round(configuredPlan.amountEur * 100),
              tax_behavior: 'exclusive' as const,
              product_data: {
                name: toStripeAscii(`${configuredPlan.name} - mes natural en curso`),
                metadata: {
                  configured_price_id: priceId,
                  billing: configuredPlan.interval,
                  ...MONTHLY_CALENDAR_BILLING_METADATA,
                  billing_component: 'initial_full_calendar_month',
                },
              },
            },
          }] : []),
        ],
        success_url: `${appUrl}/dashboard/post-compra?origin=subscription`,
        cancel_url: `${appUrl}/dashboard/suscripciones`
      });
    } catch (stripeError) {
      console.error('[subscriptions/checkout] Stripe session creation failed:', stripeError);
      try {
        await expireSubscriptionCheckoutClaim(admin, {
          claimId: claim.claimId,
          ownerToken,
          error: 'stripe_session_create_failed',
        });
      } catch (claimCleanupError) {
        console.error('[subscriptions/checkout] failed to release claim after Stripe create error:', claimCleanupError);
      }
      return NextResponse.json({ error: 'Error al crear la sesión de pago' }, { status: 502 });
    }

    const { error: persistError } = await admin.from('checkout_sessions').insert({
      stripe_session_id: session.id,
      user_id: user.id,
      company_id: companyId,
      status: 'open',
      metadata: {
        product_type: 'subscription',
        plan_name: configuredPlan.name,
        plan_price_id: priceId,
        billing: configuredPlan.interval,
        amount_eur: configuredPlan.amountEur,
        automatic_tax: true,
        tax_behavior: 'exclusive',
        ...calendarBillingMetadata,
        ...(quoteId ? { quote_id: quoteId } : {}),
      }
    });

    if (persistError) {
      console.error('[subscriptions/checkout] checkout persistence failed:', persistError);
      let stripeExpired = false;
      try {
        await stripe.checkout.sessions.expire(session.id);
        stripeExpired = true;
      } catch (expireError) {
        console.error('[subscriptions/checkout] failed to expire orphan Stripe session:', expireError);
      }

      try {
        if (stripeExpired) {
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
      } catch (claimCleanupError) {
        console.error('[subscriptions/checkout] failed to reconcile claim after persistence error:', claimCleanupError);
      }

      return NextResponse.json({ error: 'No se pudo registrar de forma segura la sesión de contratación' }, { status: 500 });
    }

    if (quoteId) {
      const { data: linkedQuote, error: quoteLinkError } = await admin
        .from('quotes')
        .update({
          company_id: companyId,
          status: 'accepted',
          stripe_checkout_id: session.id,
        })
        .eq('id', quoteId)
        .eq('client_id', user.id)
        .in('status', ['sent', 'accepted'])
        .select('id')
        .maybeSingle();

      if (quoteLinkError || !linkedQuote) {
        console.error('[subscriptions/checkout] failed to bind invitation quote:', quoteLinkError);
        let stripeExpired = false;
        try {
          await stripe.checkout.sessions.expire(session.id);
          stripeExpired = true;
        } catch (expireError) {
          console.error('[subscriptions/checkout] failed to expire session after quote bind error:', expireError);
        }

        if (stripeExpired) {
          await admin
            .from('checkout_sessions')
            .update({ status: 'expired' })
            .eq('stripe_session_id', session.id)
            .in('status', ['open', 'pending']);

          await expireSubscriptionCheckoutClaim(admin, {
            claimId: claim.claimId,
            ownerToken,
            error: 'quote_binding_failed',
          }).catch(() => {});
        } else {
          await flagSubscriptionCheckoutClaimReview(admin, {
            claimId: claim.claimId,
            ownerToken,
            error: 'quote_binding_failed_and_session_expire_failed',
          }).catch(() => {});
        }

        return NextResponse.json({
          error: 'No se pudo vincular de forma segura el pago al presupuesto.',
          code: stripeExpired ? 'quote_binding_retry' : 'checkout_manual_review',
        }, { status: 500 });
      }
    }

    try {
      await finalizeSubscriptionCheckoutClaim(admin, {
        claimId: claim.claimId,
        ownerToken,
        stripeSessionId: session.id,
      });
    } catch (finalizeError) {
      console.error('[subscriptions/checkout] failed to finalize checkout claim:', finalizeError);

      let stripeExpired = false;
      try {
        await stripe.checkout.sessions.expire(session.id);
        stripeExpired = true;
      } catch (expireError) {
        console.error('[subscriptions/checkout] failed to expire session after claim finalization error:', expireError);
      }

      if (stripeExpired) {
        const { error: localExpireError } = await admin
          .from('checkout_sessions')
          .update({ status: 'expired' })
          .eq('stripe_session_id', session.id)
          .in('status', ['open', 'pending']);
        if (localExpireError) {
          console.error('[subscriptions/checkout] failed to mark local session expired:', localExpireError);
        }
      }

      try {
        await flagSubscriptionCheckoutClaimReview(admin, {
          claimId: claim.claimId,
          ownerToken,
          error: stripeExpired
            ? 'claim_finalize_failed_session_expired'
            : 'claim_finalize_failed_session_may_be_open',
        });
      } catch (reviewError) {
        console.error('[subscriptions/checkout] failed to flag claim for manual review:', reviewError);
      }

      return NextResponse.json(
        { error: 'No se pudo confirmar de forma segura la sesión de contratación.', code: 'checkout_manual_review' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url, sessionId: session.id, companyId, quoteId: quoteId ?? null });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    return NextResponse.json({ error: 'Error al crear la sesion de pago' }, { status: 500 });
  }
}
