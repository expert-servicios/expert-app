import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const subscriptionRoute = fs.readFileSync(
  path.join(process.cwd(), 'app/api/admin/subscriptions/send-link/route.ts'),
  'utf8',
);
const quoteRoute = fs.readFileSync(
  path.join(process.cwd(), 'app/api/admin/quotes/route.ts'),
  'utf8',
);
const quoteResendRoute = fs.readFileSync(
  path.join(process.cwd(), 'app/api/admin/quotes/[id]/resend/route.ts'),
  'utf8',
);
const resendWebhook = fs.readFileSync(
  path.join(process.cwd(), 'app/api/resend/webhook/route.ts'),
  'utf8',
);
const emailSend = fs.readFileSync(
  path.join(process.cwd(), 'lib/email/send.ts'),
  'utf8',
);
const authCallback = fs.readFileSync(
  path.join(process.cwd(), 'app/auth/callback/route.ts'),
  'utf8',
);

describe('critical payment-link email compensation', () => {
  it('expires a new subscription checkout when invite delivery fails', () => {
    expect(subscriptionRoute).toContain('await stripe.checkout.sessions.expire(session.id)');
    expect(subscriptionRoute).toContain('email_delivery_failed: true');
    expect(subscriptionRoute).toContain('email_failed_manual_review');
    expect(subscriptionRoute).toContain('email_failed_safe_retry');
  });

  it('does not claim safe retry if Stripe expiration fails', () => {
    expect(subscriptionRoute).toContain("status: expireFailed ? 'open' : 'expired'");
  });

  it('keeps quote validity independent from Stripe Checkout lifetime', () => {
    expect(quoteRoute).not.toContain('stripe.checkout.sessions.create');
    expect(quoteRoute).toContain('/dashboard/presupuestos');
    expect(quoteRoute).toContain("code: 'email_failed_safe_retry'");
    expect(quoteRoute).toContain("code: 'email_failed_cleanup_manual_review'");
  });

  it('resends the quote through EXPERT without creating or replacing Stripe sessions', () => {
    expect(quoteResendRoute).not.toContain('stripe.checkout.sessions.create');
    expect(quoteResendRoute).toContain('/dashboard/presupuestos');
    expect(quoteResendRoute).toContain("code: 'quote_expired'");
    expect(quoteResendRoute).toContain("code: 'email_failed_safe_retry'");
  });
});

describe('Resend delivery attribution', () => {
  it('uses the webhook recipient together with resend_id', () => {
    expect(resendWebhook).toContain('to?: string[] | string');
    expect(resendWebhook).toContain(".eq('resend_id', resendId)");
    expect(resendWebhook).toContain(".ilike('recipient_email', recipient)");
  });

  it('keeps a backwards-compatible fallback when old payloads omit data.to', () => {
    expect(resendWebhook).toContain('if (recipients.length)');
    expect(resendWebhook).toContain('Backwards-compatible fallback');
  });

  it('fails the webhook when status persistence fails so Resend can retry it', () => {
    expect(resendWebhook).toContain("return NextResponse.json({ error: 'Webhook persistence failed' }, { status: 500 });");
  });
});

describe('durable email idempotency', () => {
  it('passes the effective idempotency key to Resend and records it in email_events', () => {
    expect(emailSend).toContain('await resend.emails.send(payload, { idempotencyKey: effectiveIdempotencyKey })');
    expect(emailSend).toContain('idempotency_key: idempotencyKey');
  });

  it('suppresses a logical retry once Resend previously accepted the intent', () => {
    expect(emailSend).toContain(".contains('metadata', { idempotency_key: idempotencyKey })");
    expect(emailSend).toContain(".not('resend_id', 'is', null)");
    expect(emailSend).toContain('if (existingResendId)');
    expect(emailSend).toContain('return { sent: false, resendId: existingResendId }');
  });

  it('uses one deterministic welcome intent per user', () => {
    expect(authCallback).toContain('sendEmailOnce({');
    expect(authCallback).toContain('idempotencyKey: `user-welcome/${user.id}`');
  });
});