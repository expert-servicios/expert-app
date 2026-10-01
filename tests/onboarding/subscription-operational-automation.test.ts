import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('subscription post-payment operational automation', () => {
  const webhook = source('app/api/stripe/webhook/route.ts');
  const templates = source('lib/email/templates.ts');
  const contract = source('lib/utils/contract.ts');
  const dailySummary = source('app/api/cron/daily-summary/route.ts');

  it('sends the accepted subscription contract after Stripe activation', () => {
    expect(webhook).toContain("eventType: 'subscription.activated_onboarding'");
    expect(webhook).toContain('generateContractHtml({');
    expect(webhook).toContain("contractType: 'subscription'");
    expect(webhook).toContain('reference: `SUB-${sub.id}`');
    expect(webhook).toContain('attachments: [{');
    expect(contract).toContain('reference?: string | null');
  });

  it('creates the onboarding case and canonical admin task after activation', () => {
    expect(webhook).toContain('ensureSubscriptionOnboardingCase');
    expect(webhook).toContain('ensureOnboardingTask({');
    expect(webhook).toContain("next_action: 'Reservar reunión de onboarding'");
    expect(webhook).toContain("priority: 'alta'");
  });

  it('creates a protected onboarding booking link for the activated subscription', () => {
    expect(webhook).toContain("service: 'onboarding'");
    expect(webhook).toContain("source: 'stripe'");
    expect(webhook).toContain('withPrivateBookingAuthorization(onboardingBaseUrl, token)');
    expect(templates).toContain('Reservar reunión de onboarding');
  });

  it('notifies admin immediately through push email and Telegram', () => {
    expect(webhook).toContain('notifyAdminsTelegram(');
    expect(webhook).toContain("eventType: 'subscription.activated_onboarding.admin'");
    expect(webhook).toContain('await notifyAdmins({');
  });

  it('reminds due and overdue internal tasks every day by email Telegram and push', () => {
    expect(dailySummary).toContain(".from('internal_tasks')");
    expect(dailySummary).toContain(".lte('due_date', madridDate)");
    expect(dailySummary).toContain("eventType: 'admin.task_reminder'");
    expect(dailySummary).toContain('notifyAdminsTelegram([');
    expect(dailySummary).toContain("url: '/admin/tareas'");
  });

  it('keeps recurring subscriptions and one-time services in separate checkouts', () => {
    const cartCheckout = source('app/api/subscriptions/cart-checkout/route.ts');
    expect(cartCheckout).toContain("code: 'subscription_cart_disabled'");
    expect(cartCheckout).toContain('status: 410');
  });
});
