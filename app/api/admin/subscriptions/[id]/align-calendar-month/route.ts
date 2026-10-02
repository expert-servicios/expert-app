import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getStripeClient } from '@/lib/integrations/stripe';
import { currentCalendarMonthBillingWindow, MONTHLY_CALENDAR_BILLING_POLICY } from '@/lib/subscriptions/calendar-month-billing';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' || profile?.role === 'owner' ? { admin, actorId: user.id } : null;
}

function subscriptionCustomerId(subscription: Stripe.Subscription) {
  return typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const { admin, actorId } = auth;

  const { data: localSub, error: localError } = await admin
    .from('subscriptions')
    .select('id,status,stripe_subscription_id,client_id,company_id,plan_name')
    .eq('id', id)
    .maybeSingle();

  if (localError) return NextResponse.json({ error: 'No se pudo cargar la suscripción' }, { status: 500 });
  if (!localSub?.stripe_subscription_id) {
    return NextResponse.json({ error: 'Suscripción Stripe no encontrada' }, { status: 404 });
  }

  const stripe = getStripeClient();
  const stripeSub = await stripe.subscriptions.retrieve(localSub.stripe_subscription_id);
  const item = stripeSub.items.data[0];

  if (!item || stripeSub.items.data.length !== 1) {
    return NextResponse.json({ error: 'La suscripción requiere revisión manual: estructura de líneas no estándar.' }, { status: 409 });
  }
  if (item.price.recurring?.interval !== 'month') {
    return NextResponse.json({ error: 'Solo se pueden alinear planes mensuales al día 1.' }, { status: 409 });
  }
  if (!['active', 'trialing'].includes(stripeSub.status)) {
    return NextResponse.json({ error: `Estado Stripe no alineable: ${stripeSub.status}` }, { status: 409 });
  }

  const window = currentCalendarMonthBillingWindow();
  const alignmentKey = `calendar-month:${stripeSub.id}:${window.key}`;
  const customerId = subscriptionCustomerId(stripeSub);
  const quantity = item.quantity ?? 1;
  const unitAmount = item.price.unit_amount;

  if (unitAmount == null || unitAmount <= 0) {
    return NextResponse.json({ error: 'El precio mensual no tiene un importe fijo válido.' }, { status: 409 });
  }

  const alreadyAligned =
    stripeSub.metadata?.billing_policy === MONTHLY_CALENDAR_BILLING_POLICY
    && Number(stripeSub.billing_cycle_anchor) === window.nextAnchor;

  const invoices = await stripe.invoices.list({ customer: customerId, limit: 100 });
  let invoice = invoices.data.find((candidate) => {
    if (candidate.metadata?.alignment_key === alignmentKey) return true;
    const sameBillingMonth =
      candidate.metadata?.billing_policy === MONTHLY_CALENDAR_BILLING_POLICY
      && candidate.metadata?.billing_month === window.key;
    const parentSubscription = candidate.parent?.subscription_details?.subscription;
    const sameSubscription =
      (typeof parentSubscription === 'string' ? parentSubscription : parentSubscription?.id) === stripeSub.id;
    return sameBillingMonth && sameSubscription && candidate.status !== 'void';
  }) ?? null;

  if (!alreadyAligned) {
    await stripe.subscriptions.update(
      stripeSub.id,
      {
        trial_end: window.nextAnchor,
        proration_behavior: 'none',
        metadata: {
          ...stripeSub.metadata,
          billing_policy: MONTHLY_CALENDAR_BILLING_POLICY,
          billing_anchor_day: '1',
          alignment_effective: new Date(window.nextAnchor * 1000).toISOString().slice(0, 10),
          alignment_month: window.key,
          alignment_key: alignmentKey,
          alignment_actor: actorId,
        },
      },
      { idempotencyKey: `align-subscription-${alignmentKey}` },
    );
  }

  if (!invoice) {
    const product = typeof item.price.product === 'string' ? item.price.product : item.price.product.id;
    await stripe.invoiceItems.create(
      {
        customer: customerId,
        subscription: stripeSub.id,
        price_data: {
          currency: item.price.currency,
          product,
          unit_amount: unitAmount,
          tax_behavior: item.price.tax_behavior === 'inclusive' ? 'inclusive' : 'exclusive',
        },
        quantity,
        description: `${localSub.plan_name ?? stripeSub.metadata?.plan_name ?? 'Suscripción EXPERT'} — ${window.key} (mes natural completo)`,
        period: { start: window.start, end: window.end },
        metadata: {
          billing_policy: MONTHLY_CALENDAR_BILLING_POLICY,
          billing_month: window.key,
          alignment_key: alignmentKey,
          source: 'admin_calendar_month_alignment',
        },
      },
      { idempotencyKey: `align-invoice-item-${alignmentKey}` },
    );

    invoice = await stripe.invoices.create(
      {
        customer: customerId,
        subscription: stripeSub.id,
        collection_method: 'charge_automatically',
        auto_advance: false,
        automatic_tax: { enabled: stripeSub.automatic_tax.enabled },
        default_payment_method:
          typeof stripeSub.default_payment_method === 'string'
            ? stripeSub.default_payment_method
            : stripeSub.default_payment_method?.id,
        description: `${localSub.plan_name ?? stripeSub.metadata?.plan_name ?? 'Suscripción EXPERT'} — ${window.key} (mes natural completo)`,
        metadata: {
          billing_policy: MONTHLY_CALENDAR_BILLING_POLICY,
          billing_month: window.key,
          alignment_key: alignmentKey,
          source: 'admin_calendar_month_alignment',
          actor_id: actorId,
        },
      },
      { idempotencyKey: `align-invoice-${alignmentKey}` },
    );
  }

  if (invoice.status === 'draft') {
    invoice = await stripe.invoices.finalizeInvoice(invoice.id, { auto_advance: true });
  }

  if (invoice.status === 'open') {
    try {
      invoice = await stripe.invoices.pay(invoice.id);
    } catch (paymentError) {
      const message = paymentError instanceof Error ? paymentError.message : String(paymentError);
      return NextResponse.json({
        ok: false,
        aligned: true,
        invoiceId: invoice.id,
        invoiceStatus: invoice.status,
        amountDue: invoice.amount_due,
        nextBillingAt: new Date(window.nextAnchor * 1000).toISOString(),
        error: `La suscripción quedó alineada, pero el cobro requiere revisión: ${message}`,
      }, { status: 402 });
    }
  }

  return NextResponse.json({
    ok: true,
    aligned: true,
    alreadyAligned,
    invoiceId: invoice.id,
    invoiceNumber: invoice.number,
    invoiceStatus: invoice.status,
    amountPaid: invoice.amount_paid,
    amountDue: invoice.amount_due,
    currency: invoice.currency,
    nextBillingAt: new Date(window.nextAnchor * 1000).toISOString(),
  });
}
