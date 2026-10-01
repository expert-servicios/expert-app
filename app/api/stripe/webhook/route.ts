import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient } from '@/lib/integrations/stripe';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { notifyAdmins } from '@/lib/integrations/push';
import { notifyAdminsTelegram } from '@/lib/integrations/telegram';
import { sendEmail } from '@/lib/email/send';
import { syncOrderToHolded, syncSubscriptionToHolded } from '@/lib/integrations/holded';
import { computeProfileReadiness } from '@/lib/utils/profile-readiness';
import { generateContractHtml, contractToBuffer } from '@/lib/utils/contract';
import { ensureOnboardingTask, findOpenOnboardingCase } from '@/lib/admin/onboarding-followup';
import { getCalOnboardingUrl, getCalFormacionUrl } from '@/lib/utils/cal';
import {
  createPrivateBookingAuthorization,
  withPrivateBookingAuthorization,
} from '@/lib/booking/private-booking-authorization';
import { persistAcademyCertificationPayment, persistAcademyProgramPayment } from '@/lib/payments/academy-fulfillment';
import { legacyOrderFields, requireCreatedOrderId } from '@/lib/payments/non-academy-order';
import { ensureServiceOrderFulfillment } from '@/lib/payments/service-order-fulfillment';
import { getServiceOperationalBlueprint } from '@/lib/services/service-operational-blueprints';
import { describeContentOrigin } from '@/lib/marketing/content-origin';
import {
  academyEnrollmentConfirmed,
  academyEnrollmentConfirmedAdmin,
  academyEnrollmentPendingLink,
  academyEnrollmentPendingLinkAdmin,
  academyCertificationPaid,
  academyCertificationPaidAdmin,
  holdedFormacionConfirmed,
  holdedMigrationConfirmed,
  paymentConfirmed,
  servicePaymentConfirmed,
  servicePaymentConfirmedAdmin,
  subscriptionActivatedOnboarding,
  subscriptionOnboardingAdmin,
  subscriptionPaymentFailed
} from '@/lib/email/templates';

async function getAuthorizedPrivateBookingUrl(
  session: Stripe.Checkout.Session,
  service: 'onboarding' | 'formacion-holded',
  baseUrl: string,
  email: string,
): Promise<string> {
  if (!baseUrl) return '';

  const token = await createPrivateBookingAuthorization({
    service,
    email,
    clientId: session.client_reference_id ?? session.metadata?.user_id ?? null,
    companyId: session.metadata?.company_id ?? null,
    source: 'stripe',
    sourceRef: session.id,
  });

  return withPrivateBookingAuthorization(baseUrl, token);
}

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? 'info@expertconsulting.es')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
}

const LEGACY_QUOTE_SERVICE_SLUGS: Record<string, string> = {
  noResidentes: 'no-residentes',
};

function canonicalQuoteServiceSlug(value: string): string {
  const trimmed = value.trim();
  return LEGACY_QUOTE_SERVICE_SLUGS[trimmed] ?? trimmed;
}

function splitQuoteServiceSlugs(values: Array<string | null | undefined>): string[] {
  return [...new Set(
    values
      .flatMap((value) => String(value ?? '').split(','))
      .map(canonicalQuoteServiceSlug)
      .filter(Boolean),
  )];
}

function checkoutContentOriginLabel(session: Stripe.Checkout.Session): string | null {
  const raw = session.metadata?.content_origins ?? session.metadata?.content_origin ?? '';
  const origins = [...new Set(
    raw
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
  )];
  if (origins.length === 0) return null;
  return origins.map((origin) => describeContentOrigin(origin)).join(' · ');
}

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;
type SubscriptionRecord = { clientId: string; companyId: string | null; planName: string; periodEnd: string | null };


function getPlanName(priceId: string, fallback?: string | null): string {
  if (fallback) return fallback;

  const map: Record<string, string> = {
    [process.env.STRIPE_PLAN_MONTHLY_49 ?? '']: 'Plan Supervisión',
    [process.env.STRIPE_PLAN_MONTHLY_99 ?? '']: 'Plan Avanzado',
    [process.env.STRIPE_PLAN_MONTHLY_199 ?? '']: 'Plan Colaborativo',
    [process.env.STRIPE_PLAN_MONTHLY_349 ?? '']: 'Plan Presupuesto Personalizado',
  };
  return map[priceId] ?? 'Suscripción';
}

function getStripeCustomerId(customer: Stripe.Subscription['customer']): string | null {
  return typeof customer === 'string' ? customer : customer?.id ?? null;
}

function getAllowedSubscriptionStatus(status: Stripe.Subscription.Status) {
  const allowed = ['active', 'canceled', 'past_due', 'unpaid', 'trialing'] as const;
  return allowed.includes(status as (typeof allowed)[number]) ? status : null;
}

function isActivatedSubscriptionStatus(status: string | undefined | null): boolean {
  return status === 'active' || status === 'trialing';
}

async function linkStripeCustomer(
  supabaseAdmin: SupabaseAdmin,
  clientId: string,
  customerId: string,
  companyId?: string | null,
): Promise<void> {
  if (!companyId) {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', clientId);
    if (profileError) throw new Error(`Could not persist legacy Stripe customer: ${profileError.message}`);
    return;
  }

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('profile_companies')
    .select('company_id')
    .eq('profile_id', clientId)
    .eq('company_id', companyId)
    .maybeSingle();
  if (membershipError) throw new Error(`Could not verify subscription company membership: ${membershipError.message}`);
  if (!membership) throw new Error(`Stripe subscription company ${companyId} does not belong to client ${clientId}`);

  const { data: company, error: companyError } = await supabaseAdmin
    .from('companies')
    .select('id,stripe_customer_id')
    .eq('id', companyId)
    .maybeSingle();
  if (companyError) throw new Error(`Could not load subscription company: ${companyError.message}`);
  if (!company) throw new Error(`Stripe subscription company ${companyId} was not found`);

  if (company.stripe_customer_id && company.stripe_customer_id !== customerId) {
    throw new Error(`Stripe customer conflict for company ${companyId}; manual review required`);
  }

  if (!company.stripe_customer_id) {
    const { error: updateError } = await supabaseAdmin
      .from('companies')
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq('id', companyId);
    if (updateError) throw new Error(`Could not persist company Stripe customer: ${updateError.message}`);
  }
}

async function upsertSubscriptionFromStripe(
  supabaseAdmin: SupabaseAdmin,
  sub: Stripe.Subscription,
  userIdHint?: string | null,
  companyIdHint?: string | null,
): Promise<SubscriptionRecord | null> {
  const customerId = getStripeCustomerId(sub.customer);
  const priceId = sub.items.data[0]?.price.id ?? '';
  const status = getAllowedSubscriptionStatus(sub.status);

  if (!customerId || !priceId || !status) {
    console.warn('[webhook] subscription skipped: unsupported or incomplete data', {
      subscription: sub.id,
      status: sub.status,
      hasCustomer: Boolean(customerId),
      hasPrice: Boolean(priceId)
    });
    return null;
  }

  let clientId = userIdHint ?? sub.metadata?.user_id ?? null;
  const companyId = companyIdHint ?? sub.metadata?.company_id ?? null;

  if (!clientId && !companyId) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    clientId = profile?.id ?? null;
  }

  if (!clientId) {
    console.error('[webhook] subscription has no resolvable EXPERT user', {
      subscription: sub.id,
      customer: customerId,
      company: companyId
    });
    return null;
  }

  const firstItem = sub.items.data[0];
  const periodStart = firstItem?.current_period_start
    ? new Date(firstItem.current_period_start * 1000).toISOString()
    : null;
  const periodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000).toISOString()
    : null;
  const planName = getPlanName(priceId, sub.metadata?.plan_name);
  const stripeItems = sub.items.data.map((item) => ({
    subscription_item_id: item.id,
    price_id: item.price.id,
    quantity: item.quantity ?? 1,
    unit_amount: item.price.unit_amount ?? null,
    currency: item.price.currency,
    interval: item.price.recurring?.interval ?? null,
  }));

  await linkStripeCustomer(supabaseAdmin, clientId, customerId, companyId);

  const { error: subscriptionError } = await supabaseAdmin.from('subscriptions').upsert(
    {
      client_id: clientId,
      company_id: companyId,
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      plan_name: planName,
      status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      metadata: {
        stripe_items: stripeItems,
        stripe_subscription_metadata: sub.metadata ?? {},
        recurring_total_cents: stripeItems.reduce(
          (sum, item) => sum + ((item.unit_amount ?? 0) * item.quantity),
          0,
        ),
      },
      updated_at: new Date().toISOString()
    },
    { onConflict: 'stripe_subscription_id' }
  );

  if (subscriptionError) {
    throw new Error(`Could not persist Stripe subscription ${sub.id}: ${subscriptionError.message}`);
  }

  return { clientId, companyId, planName, periodEnd };
}

async function getClientEmail(userId: string): Promise<{ email: string; name: string } | null> {
  const supabase = getSupabaseAdmin();
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const email = authUser?.user?.email;
  if (!email) return null;

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
  return { email, name: profile?.full_name ?? email.split('@')[0] };
}

// ── IMP-005: Durable Holded job queue helpers ─────────────────────────────────

async function enqueueHoldedSync(
  supabaseAdmin: SupabaseAdmin,
  jobType: string,
  metadata: Record<string, unknown>,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('holded_sync_jobs')
    .insert({ job_type: jobType, status: 'queued', attempts: 0, metadata })
    .select('id')
    .single();
  if (error) {
    console.error('[holded queue] enqueue failed:', error.message);
    return null;
  }
  return data?.id ?? null;
}

async function resolveHoldedJob(
  supabaseAdmin: SupabaseAdmin,
  jobId: string | null,
  status: 'success' | 'failed',
  errorMsg?: string,
): Promise<void> {
  if (!jobId) return;
  await supabaseAdmin
    .from('holded_sync_jobs')
    .update({
      status,
      finished_at: new Date().toISOString(),
      attempts: 1,
      error: errorMsg ? errorMsg.slice(0, 500) : null,
    })
    .eq('id', jobId)
    .then(() => null, () => null);
}

async function startHoldedJob(
  supabaseAdmin: SupabaseAdmin,
  jobId: string | null,
): Promise<void> {
  if (!jobId) return;
  await supabaseAdmin
    .from('holded_sync_jobs')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .then(() => null, () => null);
}

async function ensureSubscriptionOnboardingCase(
  supabaseAdmin: SupabaseAdmin,
  input: { clientId: string; companyId: string | null; planName: string; subscriptionId: string },
): Promise<string | null> {
  const existing = await findOpenOnboardingCase(input.clientId, input.companyId).catch(() => null);
  if (existing?.id) {
    await supabaseAdmin.from('cases').update({
      next_action: 'Reservar reunión de onboarding',
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id);
    return existing.id;
  }

  const { data, error } = await supabaseAdmin
    .from('cases')
    .insert({
      client_id: input.clientId,
      company_id: input.companyId,
      category: 'onboarding',
      service: 'Alta de usuario',
      state: 'en_proceso',
      status: 'nuevo',
      priority: 'alta',
      next_action: 'Reservar reunión de onboarding',
      admin_note: `Expediente creado automáticamente tras activar la suscripción ${input.subscriptionId} (${input.planName}).`,
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    console.error('[webhook] could not create subscription onboarding case:', error);
    return null;
  }
  return data.id;
}

async function getSubscriptionContractParty(
  supabaseAdmin: SupabaseAdmin,
  clientId: string,
  companyId: string | null,
  fallbackName: string,
  email: string,
) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name,company,tax_id,address,city')
    .eq('id', clientId)
    .maybeSingle();

  let company: {
    razon_social?: string | null;
    cif_nif?: string | null;
    direccion?: string | null;
    ciudad?: string | null;
  } | null = null;

  if (companyId) {
    const { data } = await supabaseAdmin
      .from('companies')
      .select('razon_social,cif_nif,direccion,ciudad')
      .eq('id', companyId)
      .maybeSingle();
    company = data ?? null;
  }

  const clientName = profile?.full_name ?? fallbackName;
  const clientCompany = company?.razon_social ?? profile?.company ?? null;
  const clientTaxId = company?.cif_nif ?? profile?.tax_id ?? null;
  const clientAddress = company?.ciudad
    ? `${company.direccion ?? ''}, ${company.ciudad}`.trim().replace(/^,\s*/, '')
    : company?.direccion ?? (profile?.city
      ? `${profile.address ?? ''}, ${profile.city}`.trim().replace(/^,\s*/, '')
      : profile?.address ?? null);

  return { clientName, clientEmail: email, clientCompany, clientTaxId, clientAddress };
}

async function handleSubscriptionActivation(
  supabaseAdmin: SupabaseAdmin,
  sub: Stripe.Subscription,
  subscriptionRecord: SubscriptionRecord,
): Promise<void> {
  const clientInfo = await getClientEmail(subscriptionRecord.clientId);
  if (!clientInfo) return;

  const recurringAmount = sub.items.data.reduce(
    (sum, item) => sum + ((item.price.unit_amount ?? 0) * (item.quantity ?? 1)),
    0,
  ) / 100;
  const billingInterval = sub.items.data[0]?.price.recurring?.interval === 'year' ? 'year' : 'month';

  const onboardingCaseId = await ensureSubscriptionOnboardingCase(supabaseAdmin, {
    clientId: subscriptionRecord.clientId,
    companyId: subscriptionRecord.companyId,
    planName: subscriptionRecord.planName,
    subscriptionId: sub.id,
  });

  const onboardingTaskId = await ensureOnboardingTask({
    clientId: subscriptionRecord.clientId,
    companyId: subscriptionRecord.companyId,
    caseId: onboardingCaseId,
    dueDate: new Date().toISOString().slice(0, 10),
    priority: 'alta',
    description: 'Suscripción activa. Comprobar que el cliente reserva onboarding; después verificar conexión Holded, coordinación del traspaso si procede y cierre del alta.',
  }).catch((error) => {
    console.error('[webhook] onboarding task creation failed:', error);
    return null;
  });

  const onboardingBaseUrl = getCalOnboardingUrl() ?? '';
  let onboardingUrl = onboardingBaseUrl;
  if (onboardingBaseUrl) {
    try {
      const token = await createPrivateBookingAuthorization({
        service: 'onboarding',
        email: clientInfo.email,
        clientId: subscriptionRecord.clientId,
        companyId: subscriptionRecord.companyId,
        source: 'stripe',
        sourceRef: sub.id,
      });
      onboardingUrl = withPrivateBookingAuthorization(onboardingBaseUrl, token);
    } catch (error) {
      console.error('[webhook] subscription onboarding authorization failed:', error);
    }
  }

  const party = await getSubscriptionContractParty(
    supabaseAdmin,
    subscriptionRecord.clientId,
    subscriptionRecord.companyId,
    clientInfo.name,
    clientInfo.email,
  );
  const contractDate = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Madrid',
  });
  const contractHtml = generateContractHtml({
    ...party,
    serviceTitle: subscriptionRecord.planName,
    serviceDescription: 'Suscripción EXPERT para gestión fiscal, contable y administrativa continua según el alcance del plan contratado.',
    amountEur: recurringAmount,
    amountIncludesTax: false,
    contractDate,
    contractType: 'subscription',
    planName: subscriptionRecord.planName,
    billingInterval,
    reference: `SUB-${sub.id}`,
  });

  const tpl = subscriptionActivatedOnboarding({
    name: clientInfo.name,
    planName: subscriptionRecord.planName,
    periodEnd: subscriptionRecord.periodEnd,
    onboardingUrl,
  });
  await sendEmail({
    to: clientInfo.email,
    eventType: 'subscription.activated_onboarding',
    ...tpl,
    metadata: {
      subscription_id: sub.id,
      plan: subscriptionRecord.planName,
      company_id: subscriptionRecord.companyId,
      onboarding_case_id: onboardingCaseId,
      onboarding_task_id: onboardingTaskId,
    },
    attachments: [{
      filename: `Contrato_Suscripcion_${subscriptionRecord.planName.replace(/\s+/g, '_')}.html`,
      content: contractToBuffer(contractHtml),
      type: 'text/html',
    }],
    idempotencyKey: `stripe/subscription-activation/client/${sub.id}`,
  });

  await notifyAdmins({
    title: `Nueva suscripción — ${clientInfo.name}`,
    body: `${subscriptionRecord.planName} · onboarding pendiente`.slice(0, 240),
    url: onboardingCaseId ? `/admin/expedientes/${onboardingCaseId}` : '/admin/tareas',
    tag: `sub-${sub.id}`,
  }).catch(() => {});

  await notifyAdminsTelegram(
    [
      '<b>Nueva suscripción activa</b>',
      `Cliente: ${clientInfo.name}`,
      `Plan: ${subscriptionRecord.planName}`,
      `Cuota: ${recurringAmount.toFixed(2)} EUR + IVA`,
      'Siguiente acción: comprobar reserva de onboarding y completar el alta.',
    ].join('\n'),
  ).catch(() => {});

  const adminEmails = getAdminEmails();
  if (adminEmails.length) {
    const adminTpl = subscriptionOnboardingAdmin({
      name: clientInfo.name,
      email: clientInfo.email,
      planName: subscriptionRecord.planName,
      amount: recurringAmount,
      caseId: onboardingCaseId,
    });
    await sendEmail({
      to: adminEmails,
      eventType: 'subscription.activated_onboarding.admin',
      ...adminTpl,
      metadata: {
        subscription_id: sub.id,
        plan: subscriptionRecord.planName,
        company_id: subscriptionRecord.companyId,
        onboarding_case_id: onboardingCaseId,
        onboarding_task_id: onboardingTaskId,
      },
      idempotencyKey: `stripe/subscription-activation/admin/${sub.id}`,
    });
  }

  const subJobId = await enqueueHoldedSync(supabaseAdmin, 'sync_subscription_holded', {
    clientName: clientInfo.name, clientEmail: clientInfo.email,
    planName: subscriptionRecord.planName, amountEur: recurringAmount,
    subscriptionId: sub.id, companyId: subscriptionRecord.companyId,
    localEntity: 'stripe_subscriptions',
  });
  await startHoldedJob(supabaseAdmin, subJobId);
  syncSubscriptionToHolded({
    clientName: clientInfo.name,
    clientEmail: clientInfo.email,
    planName: subscriptionRecord.planName,
    amountEur: recurringAmount,
    subscriptionId: sub.id,
    localEntity: 'stripe_subscriptions'
  }).then((result) => {
    void resolveHoldedJob(supabaseAdmin, subJobId, result.error ? 'failed' : 'success', result.error);
    if (result.invoiceId) {
      void (async () => {
        const { data: currentSubscription } = await supabaseAdmin
          .from('subscriptions')
          .select('metadata')
          .eq('stripe_subscription_id', sub.id)
          .maybeSingle();
        const currentMetadata =
          currentSubscription?.metadata && typeof currentSubscription.metadata === 'object'
            ? currentSubscription.metadata as Record<string, unknown>
            : {};
        await supabaseAdmin.from('subscriptions').update({
          metadata: {
            ...currentMetadata,
            holded: {
              contact_id: result.contactId,
              invoice_id: result.invoiceId,
              sync_event_id: result.syncEventId
            }
          }
        }).eq('stripe_subscription_id', sub.id);
      })();
    }
  }).catch((err) => {
    console.error('[webhook] holded sync (subscription) failed:', err);
    void resolveHoldedJob(supabaseAdmin, subJobId, 'failed', err instanceof Error ? err.message : String(err));
  });
}

// ── Order Holded trace helper ─────────────────────────────────────────────────

async function updateOrderHoldedResult(
  supabaseAdmin: SupabaseAdmin,
  orderId: string | undefined,
  result: { contactId: string | null; invoiceId: string | null; syncEventId: string | null; error?: string },
  baseMetadata: Record<string, unknown> = {}
) {
  if (!orderId) return;

  const holded = {
    contact_id: result.contactId,
    invoice_id: result.invoiceId,
    sync_event_id: result.syncEventId,
    error: result.error ?? null
  };

  const { error } = await supabaseAdmin
    .from('orders')
    .update({
      status: result.invoiceId ? 'paid' : 'paid_invoice_error',
      holded_invoice_id: result.invoiceId,
      holded_sync_event_id: result.syncEventId,
      holded_sync_error: result.error ?? null,
      holded_synced_at: new Date().toISOString(),
      metadata: { ...baseMetadata, holded }
    })
    .eq('id', orderId);

  if (error) {
    console.error('[webhook] holded order trace update failed:', error);
  }
}

// Shared by the checkout.session.completed (payment_status === 'paid') and
// checkout.session.async_payment_succeeded handlers below — a delayed
// payment method (e.g. SEPA debit) can make Stripe send "completed" with
// payment_status still 'unpaid', with the actual confirmation arriving
// later as async_payment_succeeded. Fulfilling only on a definitively
// paid session avoids granting access for a payment that can still fail.
async function fulfillAcademyCertification(supabaseAdmin: SupabaseAdmin, session: Stripe.Checkout.Session) {
  const enrollmentId = session.metadata?.enrollment_id ?? '';
  if (!enrollmentId) return;

  const programSlug = session.metadata?.program_slug ?? '';
  const programName = session.metadata?.program_name ?? 'Programa EXPERT Business Academy';
  const clientId = session.client_reference_id ?? session.metadata?.user_id ?? null;
  const amountEur = Number(session.amount_total ?? 0) / 100;
  const paymentId = (session.payment_intent as string) ?? session.id;
  const customerEmail = session.customer_email ?? (session.customer_details as { email?: string } | null)?.email;
  const customerName =
    (session.customer_details as { name?: string } | null)?.name ??
    customerEmail?.split('@')[0] ??
    'Cliente';

  const persisted = await persistAcademyCertificationPayment(supabaseAdmin, {
    paymentId, sessionId: session.id, enrollmentId, clientId, customerEmail: customerEmail ?? null,
    programSlug, amountEur, currency: session.currency?.toUpperCase() ?? 'EUR',
  });
  if (!persisted.created) return;

  if (customerEmail) {
    const tpl = academyCertificationPaid(customerName, programName, amountEur);
    await sendEmail({
      to: customerEmail,
      eventType: 'academy.certification.paid',
      ...tpl,
      metadata: { session_id: session.id, enrollment_id: enrollmentId },
    });

    const adminEmails = getAdminEmails();
    if (adminEmails.length) {
      const adminTpl = academyCertificationPaidAdmin(customerName, customerEmail, programName, amountEur);
      sendEmail({
        to: adminEmails,
        eventType: 'academy.certification.paid.admin',
        ...adminTpl,
        metadata: { session_id: session.id, enrollment_id: enrollmentId },
      }).catch((err) => console.error('[webhook] admin certification email failed:', err));
    }

    notifyAdmins({
      title: `🎓 Certificación oficial pagada — ${customerName}`,
      body : `${programName.slice(0, 60)} · €${amountEur.toFixed(0)}`,
      url  : '/admin/academy-matriculas',
      tag  : `academy-certification-${session.id}`,
    }).catch(() => {});
  }

  console.log(JSON.stringify({ webhook: 'stripe', event: 'checkout.session.completed', product_type: 'academy_certification', enrollment_id: enrollmentId, session_id: session.id }));
}

// Shared by checkout.session.completed (payment_status === 'paid') and
// checkout.session.async_payment_succeeded — same rationale as
// fulfillAcademyCertification above: a delayed payment method can leave a
// session "completed" but still unpaid, with the real confirmation arriving
// later via the async event. Internal /api/academy/checkout Sessions carry
// client_reference_id (login required); external Payment Link purchases
// (e.g. Gestión Laboral Integral) don't require login before paying, so we
// fall back to matching the buyer's checkout email against an existing
// profile.
async function fulfillAcademyProgram(supabaseAdmin: SupabaseAdmin, session: Stripe.Checkout.Session) {
  const programSlug = session.metadata?.program_slug ?? '';
  const programName = session.metadata?.program_name ?? 'Programa EXPERT Business Academy';
  const amountEur = Number(session.amount_total ?? 0) / 100;
  const paymentId = (session.payment_intent as string) ?? session.id;
  const customerEmail = session.customer_email ?? (session.customer_details as { email?: string } | null)?.email;
  const customerName =
    (session.customer_details as { name?: string } | null)?.name ??
    customerEmail?.split('@')[0] ??
    'Cliente';

  let clientId = session.client_reference_id ?? session.metadata?.user_id ?? null;
  if (!clientId && customerEmail) {
    const { data: matchedProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .maybeSingle();
    clientId = matchedProfile?.id ?? null;
  }

  const persisted = await persistAcademyProgramPayment(supabaseAdmin, {
    paymentId, sessionId: session.id, clientId, customerEmail: customerEmail ?? null,
    programSlug, programName, amountEur, currency: session.currency?.toUpperCase() ?? 'EUR',
  });
  if (!persisted.created) return;

  if (clientId) {

    if (customerEmail) {
      const tpl = academyEnrollmentConfirmed(customerName, programName, amountEur);
      await sendEmail({
        to: customerEmail,
        eventType: 'academy.enrollment.confirmed',
        ...tpl,
        metadata: { session_id: session.id, program_slug: programSlug },
      });

      const adminEmails = getAdminEmails();
      if (adminEmails.length) {
        const adminTpl = academyEnrollmentConfirmedAdmin(customerName, customerEmail, programName, amountEur);
        sendEmail({
          to: adminEmails,
          eventType: 'academy.enrollment.confirmed.admin',
          ...adminTpl,
          metadata: { session_id: session.id, program_slug: programSlug },
        }).catch((err) => console.error('[webhook] admin academy email failed:', err));
      }

      notifyAdmins({
        title: `🎓 Nueva matrícula Academy — ${customerName}`,
        body : `${programName.slice(0, 60)} · €${amountEur.toFixed(0)}`,
        url  : '/admin/pagos',
        tag  : `academy-enrollment-${session.id}`,
      }).catch(() => {});
    }
  } else if (customerEmail) {
    // Payment Link purchase with no matching profile yet — record the
    // payment (orders row above) but leave academy_enrollments empty
    // until an admin links it after the buyer creates/logs into an
    // account with the same email.
    const tpl = academyEnrollmentPendingLink(customerName, programName);
    await sendEmail({
      to: customerEmail,
      eventType: 'academy.enrollment.pending_link',
      ...tpl,
      metadata: { session_id: session.id, program_slug: programSlug },
    });

    const adminEmails = getAdminEmails();
    if (adminEmails.length) {
      const adminTpl = academyEnrollmentPendingLinkAdmin(customerName, customerEmail, programName, amountEur);
      sendEmail({
        to: adminEmails,
        eventType: 'academy.enrollment.pending_link.admin',
        ...adminTpl,
        metadata: { session_id: session.id, program_slug: programSlug },
      }).catch((err) => console.error('[webhook] admin pending-link email failed:', err));
    }

    notifyAdmins({
      title: `⚠️ Matrícula Academy sin vincular — ${customerName}`,
      body : `${programName.slice(0, 60)} · €${amountEur.toFixed(0)} · sin cuenta con ese email`,
      url  : '/admin/pagos',
      tag  : `academy-enrollment-pending-${session.id}`,
    }).catch(() => {});
  }

  console.log(JSON.stringify({ webhook: 'stripe', event: session.payment_status === 'paid' ? 'checkout.session.completed' : 'checkout.session.async_payment_succeeded', product_type: 'academy_program', program_slug: programSlug, session_id: session.id, linked: Boolean(clientId) }));
}

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    console.error('Stripe webhook verify failed:', error);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: claimed, error: claimError } = await supabaseAdmin.rpc('claim_stripe_event', {
    p_event_id: event.id, p_event_type: event.type, p_lease_seconds: 300,
  });
  if (claimError) {
    console.error('[stripe webhook] event claim failed:', claimError.message);
    return NextResponse.json({ error: 'Webhook persistence unavailable' }, { status: 500 });
  }
  if (!claimed) return NextResponse.json({ received: true });

  try {

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode === 'payment') {
      // client_reference_id is now user.id for catalog payments — use metadata.quote_id only
      const quoteId = session.metadata?.quote_id ?? null;
      if (quoteId) {
        const { data: quote, error: quoteFetchError } = await supabaseAdmin
          .from('quotes')
          .select('client_id,lead_id,title,docs_checklist,company_id,service_slugs')
          .eq('id', quoteId)
          .single();

        if (!quote || quoteFetchError) {
          console.error('Quote not found for webhook:', quoteFetchError);
        } else {
          const amountEur = Number(session.amount_total ?? 0) / 100;
          const paymentId = (session.payment_intent as string) ?? session.id;
          const currency = session.currency?.toUpperCase() ?? 'EUR';

          const { data: quoteItems, error: quoteItemsError } = await supabaseAdmin
            .from('quote_items')
            .select('service_slug')
            .eq('quote_id', quoteId)
            .order('position', { ascending: true });
          if (quoteItemsError) {
            throw new Error(`Could not resolve quote service lines ${quoteId}: ${quoteItemsError.message}`);
          }

          let leadService: string | null = null;
          let leadRequestedServices: string[] = [];
          if (quote.lead_id) {
            const { data: lead, error: leadError } = await supabaseAdmin
              .from('leads')
              .select('service,metadata')
              .eq('id', quote.lead_id)
              .maybeSingle();
            if (leadError) {
              throw new Error(`Could not resolve quote lead service ${quoteId}: ${leadError.message}`);
            }
            leadService = lead?.service ?? null;
            const leadMetadata =
              lead?.metadata && typeof lead.metadata === 'object' && !Array.isArray(lead.metadata)
                ? lead.metadata as Record<string, unknown>
                : {};
            const conversion =
              leadMetadata.conversion && typeof leadMetadata.conversion === 'object' && !Array.isArray(leadMetadata.conversion)
                ? leadMetadata.conversion as Record<string, unknown>
                : {};
            leadRequestedServices = Array.isArray(conversion.requested_services)
              ? conversion.requested_services.filter((value): value is string => typeof value === 'string')
              : [];
          }

          const persistedQuoteServiceSlugs = splitQuoteServiceSlugs([
            session.metadata?.service_slugs,
            session.metadata?.service_slug,
            ...(Array.isArray(quote.service_slugs) ? quote.service_slugs : []),
            ...(quoteItems ?? []).map((line) => line.service_slug),
          ]);
          const leadServiceSlugs = splitQuoteServiceSlugs([
            ...leadRequestedServices,
            leadService,
          ]);
          const quoteServiceSlugs = persistedQuoteServiceSlugs.length > 0
            ? persistedQuoteServiceSlugs
            : leadServiceSlugs;

          // ── Idempotency: protect both the Stripe payment and the quote itself ──
          const [{ data: existingOrder }, { data: existingQuoteOrder }] = await Promise.all([
            supabaseAdmin
              .from('orders')
              .select('id')
              .eq('stripe_payment_id', paymentId)
              .maybeSingle(),
            supabaseAdmin
              .from('orders')
              .select('id,stripe_payment_id')
              .eq('quote_id', quoteId)
              .limit(1)
              .maybeSingle(),
          ]);

          if (existingOrder) {
            // A previous delivery attempt may have inserted the order and then failed
            // while creating/linking the case. Fulfillment is idempotent, so retry it.
            await supabaseAdmin
              .from('quotes')
              .update({ status: 'paid', stripe_checkout_id: session.id })
              .eq('id', quoteId);

            let retriedSpecializedCaseId: string | null = null;
            if (quote.client_id && quoteServiceSlugs.length > 0) {
              retriedSpecializedCaseId = await ensureServiceOrderFulfillment(supabaseAdmin, {
                orderId: existingOrder.id,
                serviceSlug: quoteServiceSlugs[0],
                serviceSlugs: quoteServiceSlugs,
                serviceName: quote.title ?? 'Servicio contratado',
                clientId: quote.client_id,
                companyId: quote.company_id ?? null,
                checkoutLocale: 'es',
              });

              if (retriedSpecializedCaseId) {
                const { error: quoteCaseLinkError } = await supabaseAdmin
                  .from('cases')
                  .update({ quote_id: quoteId })
                  .eq('id', retriedSpecializedCaseId)
                  .is('quote_id', null);
                if (quoteCaseLinkError) {
                  throw new Error(`Could not link retried quote case ${retriedSpecializedCaseId}: ${quoteCaseLinkError.message}`);
                }
              }
            }

            if (quote.client_id && !retriedSpecializedCaseId) {
              const { data: existingCase } = await supabaseAdmin
                .from('cases')
                .select('id')
                .eq('quote_id', quoteId)
                .maybeSingle();

              if (!existingCase) {
                const { error: fallbackCaseError } = await supabaseAdmin.from('cases').insert({
                  quote_id: quoteId,
                  client_id: quote.client_id,
                  company_id: quote.company_id ?? null,
                  category: 'presupuesto',
                  service: quote.title ?? 'servicio',
                  state: Array.isArray(quote.docs_checklist) && quote.docs_checklist.length > 0 ? 'docs_pendientes' : 'nuevo',
                  docs_checklist: Array.isArray(quote.docs_checklist) ? quote.docs_checklist : []
                });
                if (fallbackCaseError) {
                  throw new Error(`Could not create fallback case for retried quote ${quoteId}: ${fallbackCaseError.message}`);
                }
              }
            }

            console.log('[webhook] order already exists for payment', paymentId, '— fulfillment retried');
          } else if (existingQuoteOrder) {
            console.error('[webhook] duplicate payment detected for quote', {
              quoteId,
              existingPaymentId: existingQuoteOrder.stripe_payment_id,
              newPaymentId: paymentId,
              sessionId: session.id,
            });
            await supabaseAdmin.from('audit_logs').insert({
              action: 'quote.duplicate_payment_detected',
              entity: 'quotes',
              entity_id: quoteId,
              metadata: {
                existing_order_id: existingQuoteOrder.id,
                existing_payment_id: existingQuoteOrder.stripe_payment_id,
                new_payment_id: paymentId,
                new_session_id: session.id,
              }
            }).then(() => {});
            notifyAdmins({
              title: '⚠️ Pago duplicado detectado en presupuesto',
              body: `${quote.title ?? 'Presupuesto'} · requiere revisión manual en Stripe`,
              url: '/admin/presupuestos',
              tag: `quote-duplicate-payment-${quoteId}`,
            }).catch(() => {});
          } else {
            await supabaseAdmin
              .from('quotes')
              .update({ status: 'paid', stripe_checkout_id: session.id })
              .eq('id', quoteId);

            // ── Insert order ──
            const orderMetadata = {
              checkout_session: {
                id: session.id,
                payment_intent: session.payment_intent,
                customer_email: session.customer_email
              },
              service_slugs: quoteServiceSlugs,
            };

            const { data: newOrder, error: orderError } = await supabaseAdmin.from('orders').insert({
              source: 'quote',
              quote_id: quoteId,
              client_id: quote.client_id,
              company_id: quote.company_id ?? null,
              stripe_payment_id: paymentId,
              amount_eur: amountEur,
              ...legacyOrderFields(amountEur, quote.title),
              currency,
              status: 'paid',
              service_slugs: quoteServiceSlugs.length > 0 ? quoteServiceSlugs.join(',') : null,
              metadata: orderMetadata
            }).select('id').single();

            const newOrderId = requireCreatedOrderId('quote', orderError, newOrder?.id);

            let specializedQuoteCaseId: string | null = null;
            if (quote.client_id && quoteServiceSlugs.length > 0) {
              specializedQuoteCaseId = await ensureServiceOrderFulfillment(supabaseAdmin, {
                orderId: newOrderId,
                serviceSlug: quoteServiceSlugs[0],
                serviceSlugs: quoteServiceSlugs,
                serviceName: quote.title ?? 'Servicio contratado',
                clientId: quote.client_id,
                companyId: quote.company_id ?? null,
                checkoutLocale: 'es',
              });

              if (specializedQuoteCaseId) {
                const { error: quoteCaseLinkError } = await supabaseAdmin
                  .from('cases')
                  .update({ quote_id: quoteId })
                  .eq('id', specializedQuoteCaseId)
                  .is('quote_id', null);
                if (quoteCaseLinkError) {
                  throw new Error(`Could not link fulfilled quote case ${specializedQuoteCaseId}: ${quoteCaseLinkError.message}`);
                }
              }
            }

            if (quote.client_id && !specializedQuoteCaseId) {
              const { data: existingCase } = await supabaseAdmin
                .from('cases')
                .select('id')
                .eq('quote_id', quoteId)
                .maybeSingle();

              if (!existingCase) {
                await supabaseAdmin.from('cases').insert({
                  quote_id: quoteId,
                  client_id: quote.client_id,
                  company_id: quote.company_id ?? null,
                  category: 'presupuesto',
                  service: quote.title ?? 'servicio',
                  state: Array.isArray(quote.docs_checklist) && quote.docs_checklist.length > 0 ? 'docs_pendientes' : 'nuevo',
                  docs_checklist: Array.isArray(quote.docs_checklist) ? quote.docs_checklist : []
                });
              }
            }

            const clientEmail =
              session.customer_email ?? (session.customer_details as { email?: string } | null)?.email;

            if (clientEmail) {
              let clientName = clientEmail.split('@')[0];
              if (quote.client_id) {
                const info = await getClientEmail(quote.client_id);
                if (info) clientName = info.name;
              }

              const tpl = paymentConfirmed(clientName, amountEur, quote.title ?? 'Servicio contratado');
              await sendEmail({
                to: clientEmail,
                eventType: 'payment.confirmed',
                ...tpl,
                metadata: { quote_id: quoteId, session_id: session.id }
              });

              notifyAdmins({
                title: `💰 Pago recibido — ${clientName}`,
                body:  `${(quote.title ?? 'Presupuesto').slice(0, 60)} · €${amountEur.toFixed(0)}`,
                url:   `/admin/presupuestos`,
                tag:   `payment-${quoteId}`,
              }).catch(() => {});

              {
                const adminEmails = getAdminEmails();
                if (adminEmails.length) {
                  const adminTpl = servicePaymentConfirmedAdmin(clientName, clientEmail, amountEur, quote.title ?? 'Presupuesto');
                  sendEmail({
                    to: adminEmails,
                    eventType: 'payment.confirmed.admin',
                    ...adminTpl,
                    metadata: { quote_id: quoteId, session_id: session.id }
                  }).catch((err) => {
                    console.error('[webhook] admin payment email failed (quote):', err);
                  });
                }
              }

              // IMP-005: enqueue job BEFORE the async call so it survives
              // if the serverless function is killed before .then() runs.
              const quoteJobId = await enqueueHoldedSync(supabaseAdmin, 'sync_order_holded', {
                clientName, clientEmail,
                description: quote.title ?? 'Servicio EXPERT',
                amountEur, orderId: newOrderId, companyId: quote.company_id ?? null, localEntity: 'orders',
              });
              await startHoldedJob(supabaseAdmin, quoteJobId);
              syncOrderToHolded({
                clientName,
                clientEmail,
                description: quote.title ?? 'Servicio EXPERT',
                amountEur,
                orderId: newOrderId,
                companyId: quote.company_id ?? null,
                localEntity: 'orders'
              }).then((result) => {
                void resolveHoldedJob(supabaseAdmin, quoteJobId, result.error ? 'failed' : 'success', result.error);
                updateOrderHoldedResult(supabaseAdmin, newOrderId, result, orderMetadata).catch((err) => {
                  console.error('[webhook] holded trace update failed:', err);
                });
              }).catch((err) => {
                console.error('[webhook] holded sync failed:', err);
                void resolveHoldedJob(supabaseAdmin, quoteJobId, 'failed', err instanceof Error ? err.message : String(err));
                updateOrderHoldedResult(
                  supabaseAdmin,
                  newOrderId,
                  { contactId: null, invoiceId: null, syncEventId: null, error: err instanceof Error ? err.message : String(err) },
                  orderMetadata
                ).catch(() => {});
              });
            }
          }
        }
      }
    }

    const productType = session.metadata?.product_type;

    if (session.mode === 'payment' && productType === 'academy_program' && session.payment_status === 'paid') {
      await fulfillAcademyProgram(supabaseAdmin, session);
    }

    if (session.mode === 'payment' && productType === 'academy_certification' && session.payment_status === 'paid') {
      await fulfillAcademyCertification(supabaseAdmin, session);
    }

    if (session.mode === 'payment' && (productType === 'service' || productType === 'cart') && session.payment_status === 'paid') {
      const customerEmail = session.customer_email ?? (session.customer_details as { email?: string } | null)?.email;
      const customerName =
        (session.customer_details as { name?: string } | null)?.name ??
        customerEmail?.split('@')[0] ??
        'Cliente';
      const serviceName =
        session.metadata?.service_name ??
        session.metadata?.service_names ??
        'Servicio EXPERT';
      const amountEur = Number(session.amount_total ?? 0) / 100;
      const paymentId  = (session.payment_intent as string) ?? session.id;
      const contentOriginLabel = checkoutContentOriginLabel(session);
      let catalogOrderMetadata: Record<string, unknown> = {
        checkout_session: {
          id             : session.id,
          payment_intent : session.payment_intent,
          customer_email : customerEmail ?? null,
          product_type   : productType,
        },
        billing_scope   : session.metadata?.billing_scope ?? null,
        checkout_locale : session.metadata?.checkout_locale ?? null,
        service_slug    : session.metadata?.service_slug ?? null,
        service_slugs   : session.metadata?.service_slugs ?? null,
        content_origin  : session.metadata?.content_origin ?? null,
        content_origins : session.metadata?.content_origins ?? null,
      };

      // ── Idempotency: create order record for catalog payment ──
      const { data: existingCatalogOrder } = await supabaseAdmin
        .from('orders')
        .select('id,metadata')
        .eq('stripe_payment_id', paymentId)
        .maybeSingle();

      let catalogOrderId: string | undefined;
      if (!existingCatalogOrder) {
        const { data: newCatalogOrder, error: catalogOrderError } = await supabaseAdmin
          .from('orders')
          .insert({
            source          : 'catalog',
            client_id       : session.client_reference_id ?? null,
            company_id      : session.metadata?.company_id ?? null,
            stripe_payment_id: paymentId,
            amount_eur      : amountEur,
            ...legacyOrderFields(amountEur, serviceName),
            currency        : session.currency?.toUpperCase() ?? 'EUR',
            status          : 'paid',
            service_slugs   : session.metadata?.service_slugs ?? session.metadata?.service_slug ?? null,
            metadata        : catalogOrderMetadata,
          })
          .select('id')
          .single();

        catalogOrderId = requireCreatedOrderId('catalog', catalogOrderError, newCatalogOrder?.id);
      } else {
        catalogOrderId = existingCatalogOrder.id;
        catalogOrderMetadata = (existingCatalogOrder.metadata ?? catalogOrderMetadata) as Record<string, unknown>;
      }

      if (!catalogOrderId) throw new Error('Catalog order id missing after persistence');

      const catalogServiceSlugs = (session.metadata?.service_slugs ?? session.metadata?.service_slug ?? '')
        .split(',')
        .map((slug) => slug.trim())
        .filter(Boolean);
      const catalogServiceSlug = catalogServiceSlugs[0] ?? '';

      await ensureServiceOrderFulfillment(supabaseAdmin, {
        orderId: catalogOrderId,
        serviceSlug: catalogServiceSlug,
        serviceSlugs: catalogServiceSlugs,
        serviceName,
        clientId: session.client_reference_id ?? null,
        companyId: session.metadata?.company_id ?? null,
        checkoutLocale: session.metadata?.checkout_locale === 'ru' ? 'ru' : 'es',
      });

      // Operational blueprints create/reconcile the case and its task plan.
      // Existing database-triggered cases remain idempotently supported.
      // Re-read the order so notifications always resolve the linked case.

      const { data: fulfilledCatalogOrder, error: fulfilledCatalogOrderError } = await supabaseAdmin
        .from('orders')
        .select('id,case_id')
        .eq('id', catalogOrderId)
        .maybeSingle();
      if (fulfilledCatalogOrderError) {
        throw new Error(`Could not resolve catalog order fulfillment ${catalogOrderId}: ${fulfilledCatalogOrderError.message}`);
      }
      const catalogCaseId = fulfilledCatalogOrder?.case_id ?? null;

      // ── Sync Stripe-collected billing data back into profiles (best-effort, non-blocking) ──
      if (session.client_reference_id) {
        try {
          const details = session.customer_details as {
            address?: { line1?: string | null; city?: string | null; postal_code?: string | null; state?: string | null; country?: string | null } | null;
            tax_ids?: Array<{ type: string; value: string | null }> | null;
          } | null;
          const addr = details?.address;
          const taxIdEntry = details?.tax_ids?.[0];

          const { data: currentProfile } = await supabaseAdmin
            .from('profiles')
            .select('full_name,phone,client_type,tax_id,address,city,postal_code,province,billing_country,habitual_address,habitual_city,habitual_postal_code')
            .eq('id', session.client_reference_id)
            .maybeSingle();

          const profileUpdates: Record<string, unknown> = {};
          if (addr?.line1)       profileUpdates.address = addr.line1;
          if (addr?.city)        profileUpdates.city = addr.city;
          if (addr?.postal_code) profileUpdates.postal_code = addr.postal_code;
          if (addr?.state)       profileUpdates.province = addr.state;
          if (addr?.country)     profileUpdates.billing_country = addr.country;
          if (taxIdEntry?.value) profileUpdates.tax_id = taxIdEntry.value;

          if (Object.keys(profileUpdates).length > 0 && currentProfile) {
            const merged = { ...currentProfile, ...profileUpdates };
            const readiness = computeProfileReadiness(merged);

            await supabaseAdmin
              .from('profiles')
              .update({
                ...profileUpdates,
                profile_completed: readiness.profileCompleted,
                billing_ready: readiness.billingReady,
                habitual_address_ready: readiness.habitualAddressReady,
                updated_at: new Date().toISOString(),
              })
              .eq('id', session.client_reference_id);
          }
        } catch (err) {
          console.error('[webhook] profile billing sync failed:', err);
        }
      }

      if (customerEmail) {
        const slugsRaw = session.metadata?.service_slugs ?? session.metadata?.service_slug ?? '';
        const slugList = slugsRaw.split(',').map((s: string) => s.trim());
        const holdedPackageSlugs = ['holded-pack-starter', 'holded-migracion-sin-inventario', 'holded-migracion-con-inventario'];
        const isHoldedMigration = slugList.some((s: string) => holdedPackageSlugs.includes(s));
        const isHoldedFormacion = slugList.includes('holded-modulo-formacion');
        const calOnboarding = await getAuthorizedPrivateBookingUrl(
          session,
          'onboarding',
          getCalOnboardingUrl() ?? '',
          customerEmail
        );
        const calFormacion = await getAuthorizedPrivateBookingUrl(
          session,
          'formacion-holded',
          getCalFormacionUrl() ?? '',
          customerEmail
        );

        if (isHoldedMigration) {
          const packageName = serviceName;
          const tpl = holdedMigrationConfirmed(customerName, packageName, calOnboarding, calFormacion);
          await sendEmail({
            to: customerEmail,
            eventType: 'holded.migration.confirmed',
            ...tpl,
            metadata: { session_id: session.id, package_name: packageName }
          });
        } else if (isHoldedFormacion) {
          const tpl = holdedFormacionConfirmed(customerName, calFormacion);
          await sendEmail({
            to: customerEmail,
            eventType: 'holded.formacion.confirmed',
            ...tpl,
            metadata: { session_id: session.id }
          });
        } else {
          const tpl = servicePaymentConfirmed(customerName, amountEur, serviceName);
          await sendEmail({
            to: customerEmail,
            eventType: 'service.payment.confirmed',
            ...tpl,
            metadata: {
              session_id: session.id,
              service_slug: session.metadata?.service_slug ?? session.metadata?.service_slugs ?? null,
              stripe_total_cents: session.amount_total ?? null,
              stripe_tax_cents: session.total_details?.amount_tax ?? null,
            }
          });
        }

        // ── Notify admins: new catalog/cart payment (email + push) ──
        const adminEmails = getAdminEmails();
        if (adminEmails.length) {
          const adminTpl = servicePaymentConfirmedAdmin(customerName, customerEmail, amountEur, serviceName, contentOriginLabel);
          sendEmail({
            to: adminEmails,
            eventType: 'service.payment.confirmed.admin',
            ...adminTpl,
            metadata: {
              session_id: session.id,
              product_type: productType,
              order_id: catalogOrderId ?? null,
              case_id: catalogCaseId,
              service_slug: session.metadata?.service_slug ?? session.metadata?.service_slugs ?? null,
              stripe_total_cents: session.amount_total ?? null,
              stripe_tax_cents: session.total_details?.amount_tax ?? null,
              content_origin: session.metadata?.content_origin ?? null,
              content_origins: session.metadata?.content_origins ?? null,
            }
          }).catch((err) => {
            console.error('[webhook] admin payment email failed:', err);
          });
        }
        notifyAdmins({
          title: `💰 Pago recibido — ${customerName}`,
          body:  `${serviceName.slice(0, 60)} · €${amountEur.toFixed(0)}${contentOriginLabel ? ` · ${contentOriginLabel}` : ''}`.slice(0, 240),
          url:   catalogCaseId ? `/admin/expedientes/${catalogCaseId}` : '/admin/pagos',
          tag:   `catalog-payment-${session.id}`,
        }).catch(() => {});

        const catalogJobId = await enqueueHoldedSync(supabaseAdmin, 'sync_order_holded', {
          clientName: customerName, clientEmail: customerEmail,
          description: serviceName, amountEur,
          orderId: catalogOrderId ?? session.id, companyId: session.metadata?.company_id ?? null, localEntity: 'orders',
        });
        await startHoldedJob(supabaseAdmin, catalogJobId);
        syncOrderToHolded({
          clientName: customerName,
          clientEmail: customerEmail,
          description: serviceName,
          amountEur,
          orderId: catalogOrderId ?? session.id,
          companyId: session.metadata?.company_id ?? null,
          localEntity: 'orders'
        }).then((result) => {
          void resolveHoldedJob(supabaseAdmin, catalogJobId, result.error ? 'failed' : 'success', result.error);
          updateOrderHoldedResult(supabaseAdmin, catalogOrderId, result, catalogOrderMetadata).catch((err) => {
            console.error('[webhook] holded trace update (catalog) failed:', err);
          });
        }).catch((err) => {
          console.error('[webhook] holded sync (catalog) failed:', err);
          void resolveHoldedJob(supabaseAdmin, catalogJobId, 'failed', err instanceof Error ? err.message : String(err));
          updateOrderHoldedResult(
            supabaseAdmin,
            catalogOrderId,
            { contactId: null, invoiceId: null, syncEventId: null, error: err instanceof Error ? err.message : String(err) },
            catalogOrderMetadata
          ).catch(() => {});
        });
      }
    }

    if (productType === 'holded' || productType === 'holded_formacion') {
      const customerEmail = session.customer_email ?? (session.customer_details as { email?: string } | null)?.email;
      const customerName =
        (session.customer_details as { name?: string } | null)?.name ??
        customerEmail?.split('@')[0] ??
        'Cliente';

      if (customerEmail) {
        const calOnboarding = await getAuthorizedPrivateBookingUrl(
          session,
          'onboarding',
          getCalOnboardingUrl() ?? '',
          customerEmail
        );
        const calFormacion = await getAuthorizedPrivateBookingUrl(
          session,
          'formacion-holded',
          getCalFormacionUrl() ?? '',
          customerEmail
        );
        const holdedAmountEur = Number(session.amount_total ?? 0) / 100;
        if (productType === 'holded') {
          const packageName = session.metadata?.package_name ?? 'Paquete Holded';
          const tpl = holdedMigrationConfirmed(customerName, packageName, calOnboarding, calFormacion);
          await sendEmail({
            to: customerEmail,
            eventType: 'holded.migration.confirmed',
            ...tpl,
            metadata: { session_id: session.id, package_name: packageName }
          });
          // IMP-005: queue first, then fire-and-forget
          void enqueueHoldedSync(supabaseAdmin, 'sync_holded_migration', {
            clientName: customerName, clientEmail: customerEmail,
            description: packageName, amountEur: holdedAmountEur,
            orderId: session.id, companyId: session.metadata?.company_id ?? null, localEntity: 'stripe_checkout_sessions',
          }).then((migJobId) => {
            startHoldedJob(supabaseAdmin, migJobId).then(() => syncOrderToHolded({
              clientName: customerName, clientEmail: customerEmail,
              description: packageName, amountEur: holdedAmountEur,
              orderId: session.id, companyId: session.metadata?.company_id ?? null, localEntity: 'stripe_checkout_sessions',
            })).then((result) => resolveHoldedJob(supabaseAdmin, migJobId, result.error ? 'failed' : 'success', result.error))
              .catch((err) => {
                console.error('[webhook] holded sync (migration) failed:', err);
                return resolveHoldedJob(supabaseAdmin, migJobId, 'failed', err instanceof Error ? err.message : String(err));
              });
          });
        } else {
          const tpl = holdedFormacionConfirmed(customerName, calFormacion);
          await sendEmail({
            to: customerEmail,
            eventType: 'holded.formacion.confirmed',
            ...tpl,
            metadata: { session_id: session.id }
          });
          // IMP-005: queue first, then fire-and-forget
          void enqueueHoldedSync(supabaseAdmin, 'sync_holded_formacion', {
            clientName: customerName, clientEmail: customerEmail,
            description: 'Formación EXPERT — sesión 2 h', amountEur: holdedAmountEur,
            orderId: session.id, companyId: session.metadata?.company_id ?? null, localEntity: 'stripe_checkout_sessions',
          }).then((formJobId) => {
            startHoldedJob(supabaseAdmin, formJobId).then(() => syncOrderToHolded({
              clientName: customerName, clientEmail: customerEmail,
              description: 'Formación EXPERT — sesión 2 h', amountEur: holdedAmountEur,
              orderId: session.id, companyId: session.metadata?.company_id ?? null, localEntity: 'stripe_checkout_sessions',
            })).then((result) => resolveHoldedJob(supabaseAdmin, formJobId, result.error ? 'failed' : 'success', result.error))
              .catch((err) => {
                console.error('[webhook] holded sync (formacion) failed:', err);
                return resolveHoldedJob(supabaseAdmin, formJobId, 'failed', err instanceof Error ? err.message : String(err));
              });
          });
        }
      }
    }

    if (session.mode === 'subscription') {
      const userId = session.client_reference_id ?? session.metadata?.user_id ?? null;
      const companyId = session.metadata?.company_id ?? null;
      const subscriptionId =
        typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

      const { error: checkoutStatusError } = await supabaseAdmin
        .from('checkout_sessions')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('stripe_session_id', session.id);
      if (checkoutStatusError) throw new Error(`Could not mark checkout ${session.id} completed: ${checkoutStatusError.message}`);

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertSubscriptionFromStripe(supabaseAdmin, subscription, userId, companyId);
      } else if (userId && session.customer) {
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer.id;
        await linkStripeCustomer(supabaseAdmin, userId, customerId, companyId);
      }
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { error: checkoutStatusError } = await supabaseAdmin
      .from('checkout_sessions')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('stripe_session_id', session.id);
    if (checkoutStatusError) throw new Error(`Could not mark checkout ${session.id} expired: ${checkoutStatusError.message}`);
  }

  // Delayed payment methods (e.g. SEPA debit) can leave a Checkout Session
  // "completed" but not yet paid — Stripe confirms success later via this
  // event. Both academy flows use fulfillment helpers that are safe to call
  // from either event (idempotent on orders.stripe_payment_id).
  if (event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.product_type === 'academy_certification') {
      await fulfillAcademyCertification(supabaseAdmin, session);
    } else if (session.metadata?.product_type === 'academy_program') {
      await fulfillAcademyProgram(supabaseAdmin, session);
    }
  }

  if (event.type === 'customer.subscription.created') {
    const sub = event.data.object as Stripe.Subscription;
    const subscriptionRecord = await upsertSubscriptionFromStripe(supabaseAdmin, sub);
    if (subscriptionRecord && isActivatedSubscriptionStatus(sub.status)) {
      await handleSubscriptionActivation(supabaseAdmin, sub, subscriptionRecord);
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription;
    const prevAttributes = event.data.previous_attributes as Record<string, unknown> | undefined;
    const prevStatus = prevAttributes?.status as string | undefined;

    const subscriptionRecord = await upsertSubscriptionFromStripe(supabaseAdmin, sub);
    const becameActivated = isActivatedSubscriptionStatus(sub.status) && !isActivatedSubscriptionStatus(prevStatus);
    if (subscriptionRecord && becameActivated) {
      await handleSubscriptionActivation(supabaseAdmin, sub, subscriptionRecord);
    }

    if (sub.status === 'past_due' && prevStatus !== 'past_due') {
      const { data: dbSub } = await supabaseAdmin
        .from('subscriptions')
        .select('client_id,plan_name')
        .eq('stripe_subscription_id', sub.id)
        .maybeSingle();

      const clientId = subscriptionRecord?.clientId ?? dbSub?.client_id;
      const planName = subscriptionRecord?.planName ?? dbSub?.plan_name ?? 'Suscripción';

      if (clientId) {
        const clientInfo = await getClientEmail(clientId);
        if (clientInfo) {
          const tpl = subscriptionPaymentFailed(clientInfo.name, planName);
          await sendEmail({
            to: clientInfo.email,
            eventType: 'subscription.payment_failed',
            ...tpl,
            metadata: { subscription_id: sub.id, company_id: subscriptionRecord?.companyId ?? null }
          });
        }
      }
    }
  }

  if (event.type === 'invoice.payment_failed') {
    // customer.subscription.updated only notifies on the *first* transition
    // into past_due; Stripe also fires this event on each dunning retry
    // without necessarily changing subscription status again, so it needs
    // its own notification path or later retries go silent.
    const invoice = event.data.object as Stripe.Invoice;
    const parentSub = invoice.parent?.subscription_details?.subscription;
    const subscriptionId = typeof parentSub === 'string' ? parentSub : parentSub?.id;

    if (subscriptionId) {
      const { data: dbSub } = await supabaseAdmin
        .from('subscriptions')
        .select('client_id,plan_name,company_id')
        .eq('stripe_subscription_id', subscriptionId)
        .maybeSingle();

      if (dbSub?.client_id) {
        const clientInfo = await getClientEmail(dbSub.client_id);
        if (clientInfo) {
          const tpl = subscriptionPaymentFailed(clientInfo.name, dbSub.plan_name ?? 'Suscripción');
          await sendEmail({
            to: clientInfo.email,
            eventType: 'subscription.payment_failed',
            ...tpl,
            metadata: { subscription_id: subscriptionId, invoice_id: invoice.id, company_id: dbSub.company_id ?? null }
          });
        }
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const { error: deleteUpdateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', sub.id);
    if (deleteUpdateError) {
      throw new Error(`Could not persist canceled Stripe subscription ${sub.id}: ${deleteUpdateError.message}`);
    }
  }

    const { error: completeError } = await supabaseAdmin.rpc('complete_stripe_event', { p_event_id: event.id });
    if (completeError) throw new Error(`Could not complete Stripe event: ${completeError.message}`);
    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[stripe webhook] processing failed:', event.id, message);
    await supabaseAdmin.rpc('fail_stripe_event', { p_event_id: event.id, p_error: message });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
