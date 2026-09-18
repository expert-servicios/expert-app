import { getResendClient } from '@/lib/integrations/resend';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { BRAND } from './templates';
import {
  calculateRussianNationalityAmounts,
  isRussianNationalityPayment,
  russianNationalityPaymentConfirmedAdmin,
  russianNationalityPaymentConfirmedClient,
} from './service-payment-ru';

export interface EmailAttachment {
  filename: string;
  content: string; // base64
  type?: string;
}

interface SendEmailOptions {
  to: string | string[];
  eventType: string;
  subject: string;
  html: string;
  metadata?: Record<string, unknown>;
  attachments?: EmailAttachment[];
  idempotencyKey?: string;
}

function stringMetadata(metadata: Record<string, unknown> | undefined, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function centsMetadata(metadata: Record<string, unknown>, key: string): number | null {
  const raw = metadata[key];
  const parsed = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : Number.NaN;
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

async function localizeServicePaymentEmail(input: {
  eventType: string;
  subject: string;
  html: string;
  metadata?: Record<string, unknown>;
}): Promise<{
  subject: string;
  html: string;
  metadata?: Record<string, unknown>;
}> {
  if (input.eventType !== 'service.payment.confirmed' && input.eventType !== 'service.payment.confirmed.admin') {
    return input;
  }

  const sessionId = stringMetadata(input.metadata, 'session_id');
  if (!sessionId) return input;

  const supabase = getSupabaseAdmin();
  const { data: checkout, error: checkoutError } = await supabase
    .from('checkout_sessions')
    .select('user_id,metadata')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (checkoutError || !checkout) {
    if (checkoutError) console.error('[email] checkout locale lookup failed:', checkoutError.message);
    return input;
  }

  const checkoutMetadata = asRecord(checkout.metadata);
  const checkoutLocale = typeof checkoutMetadata.checkout_locale === 'string'
    ? checkoutMetadata.checkout_locale
    : null;
  const serviceSlug = typeof checkoutMetadata.service_slug === 'string' && checkoutMetadata.service_slug
    ? checkoutMetadata.service_slug
    : stringMetadata(input.metadata, 'service_slug');

  if (!isRussianNationalityPayment({
    eventType: input.eventType,
    checkoutLocale,
    serviceSlug,
  })) {
    return input;
  }

  const amounts = calculateRussianNationalityAmounts({
    professionalNetCents: centsMetadata(checkoutMetadata, 'revenue_amount_cents'),
    disbursementCents: centsMetadata(checkoutMetadata, 'disbursement_total_cents'),
  });

  const localizedMetadata = {
    ...(input.metadata ?? {}),
    checkout_locale: 'ru',
    service_slug: serviceSlug,
    professional_net_cents: amounts.professionalNetCents,
    professional_vat_cents: amounts.professionalVatCents,
    professional_gross_cents: amounts.professionalGrossCents,
    disbursement_total_cents: amounts.disbursementCents,
    stripe_total_cents: amounts.totalCents,
  };

  if (input.eventType === 'service.payment.confirmed') {
    const template = russianNationalityPaymentConfirmedClient(amounts);
    return { ...template, metadata: localizedMetadata };
  }

  let customerName: string | null = null;
  let customerEmail: string | null = null;
  if (typeof checkout.user_id === 'string' && checkout.user_id) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name,email')
      .eq('id', checkout.user_id)
      .maybeSingle();
    if (profileError) {
      console.error('[email] admin profile lookup failed:', profileError.message);
    } else if (profile) {
      customerName = typeof profile.full_name === 'string' ? profile.full_name : null;
      customerEmail = typeof profile.email === 'string' ? profile.email : null;
    }

    if (!customerEmail) {
      const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(checkout.user_id);
      if (authUserError) {
        console.error('[email] admin auth email lookup failed:', authUserError.message);
      } else {
        customerEmail = authUser.user?.email ?? null;
      }
    }
  }

  const template = russianNationalityPaymentConfirmedAdmin({
    customerName,
    customerEmail,
    checkoutSessionId: sessionId,
    orderId: stringMetadata(input.metadata, 'order_id'),
    caseId: stringMetadata(input.metadata, 'case_id'),
    amounts,
  });
  return { ...template, metadata: localizedMetadata };
}

function deriveIdempotencyKey(
  eventType: string,
  metadata: Record<string, unknown> | undefined,
): string | undefined {
  const sessionId = stringMetadata(metadata, 'session_id');
  if (sessionId) return `email/${eventType}/session/${sessionId}`.slice(0, 256);

  const invoiceId = stringMetadata(metadata, 'invoice_id');
  if (invoiceId) return `email/${eventType}/invoice/${invoiceId}`.slice(0, 256);

  // A subscription is created only once. Do not apply this fallback to
  // subscription.payment_failed because the same subscription can fail again
  // legitimately in a later billing cycle; those notifications use invoice_id.
  const subscriptionId = stringMetadata(metadata, 'subscription_id');
  if (subscriptionId && (eventType === 'subscription.created' || eventType === 'subscription.created.admin')) {
    return `email/${eventType}/subscription/${subscriptionId}`.slice(0, 256);
  }

  return undefined;
}

function withIntentMetadata(
  metadata: Record<string, unknown> | undefined,
  idempotencyKey: string | undefined,
): Record<string, unknown> | null {
  if (!metadata && !idempotencyKey) return null;
  return {
    ...(metadata ?? {}),
    ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
  };
}

async function findAcceptedIntent(idempotencyKey: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error } = await supabase
    .from('email_events')
    .select('resend_id')
    .contains('metadata', { idempotency_key: idempotencyKey })
    .not('resend_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`[email] idempotency lookup failed: ${error.message}`);
  return existing?.resend_id ?? null;
}

export async function sendEmail({
  to,
  eventType,
  subject,
  html,
  metadata,
  attachments,
  idempotencyKey,
}: SendEmailOptions): Promise<string> {
  const recipients = Array.isArray(to) ? to : [to];
  const supabase = getSupabaseAdmin();
  const localized = await localizeServicePaymentEmail({ eventType, subject, html, metadata });
  subject = localized.subject;
  html = localized.html;
  metadata = localized.metadata;

  const effectiveIdempotencyKey = idempotencyKey ?? deriveIdempotencyKey(eventType, metadata);

  if (effectiveIdempotencyKey) {
    if (effectiveIdempotencyKey.length > 256) {
      throw new Error('Email idempotency key must contain 1-256 characters');
    }
    const acceptedResendId = await findAcceptedIntent(effectiveIdempotencyKey);
    if (acceptedResendId) return acceptedResendId;
  }

  const eventMetadata = withIntentMetadata(metadata, effectiveIdempotencyKey);
  const resend = getResendClient();
  const payload = {
    from: BRAND.from,
    to: recipients,
    subject,
    html,
    ...(attachments?.length
      ? {
          attachments: attachments.map((a) => ({
            filename: a.filename,
            content: Buffer.from(a.content, 'base64'),
            ...(a.type ? { type: a.type } : {})
          }))
        }
      : {})
  };

  const { data, error } = effectiveIdempotencyKey
    ? await resend.emails.send(payload, { idempotencyKey: effectiveIdempotencyKey })
    : await resend.emails.send(payload);

  if (error) {
    const errMsg = (error as { message?: string }).message ?? String(error);
    await Promise.all(
      recipients.map((email) =>
        supabase.from('email_events').insert({
          event_type: eventType,
          recipient_email: email,
          subject,
          html,
          resend_id: null,
          status: 'failed',
          last_error: errMsg,
          metadata: eventMetadata
        })
      )
    ).catch(() => null);
    throw new Error(`Resend rejected ${eventType}: ${errMsg}`);
  }

  const resendId = data!.id;

  await Promise.all(
    recipients.map((email) =>
      supabase.from('email_events').insert({
        event_type: eventType,
        recipient_email: email,
        subject,
        html,
        resend_id: resendId,
        status: 'sent',
        metadata: eventMetadata
      })
    )
  ).catch(() => null); // best-effort — don't fail delivery because audit log failed

  return resendId;
}

/**
 * Sends one logical email intent at most once from EXPERT's point of view.
 *
 * The durable email_events lookup suppresses retries even after Resend's
 * 24-hour idempotency window. Resend's own idempotency key closes the race
 * between concurrent callers that both pass the lookup before either audit
 * row is visible.
 *
 * A failed provider request has resend_id = null and remains retryable.
 * Once Resend accepted the request (resend_id != null), later delivery/bounce
 * status must not cause the same logical email to be sent again.
 */
export async function sendEmailOnce(
  options: SendEmailOptions & { idempotencyKey: string },
): Promise<{ sent: boolean; resendId: string | null }> {
  const key = options.idempotencyKey.trim();
  if (!key || key.length > 256) {
    throw new Error('Email idempotency key must contain 1-256 characters');
  }

  const existingResendId = await findAcceptedIntent(key);
  if (existingResendId) {
    return { sent: false, resendId: existingResendId };
  }

  const resendId = await sendEmail({ ...options, idempotencyKey: key });
  return { sent: true, resendId };
}
