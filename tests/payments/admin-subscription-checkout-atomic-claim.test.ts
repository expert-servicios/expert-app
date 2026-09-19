import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(
  resolve(process.cwd(), 'app/api/admin/subscriptions/send-link/route.ts'),
  'utf8',
);

describe('admin subscription checkout atomic claim', () => {
  it('claims before creating the Stripe Checkout Session', () => {
    const claimIndex = source.indexOf('await claimSubscriptionCheckout');
    const stripeIndex = source.indexOf('stripe.checkout.sessions.create');
    expect(claimIndex).toBeGreaterThan(-1);
    expect(stripeIndex).toBeGreaterThan(-1);
    expect(claimIndex).toBeLessThan(stripeIndex);
  });

  it('removes the old non-atomic checkout_sessions precheck', () => {
    expect(source).not.toContain('const { data: existingCheckout, error: checkoutLookupError }');
  });

  it('reconciles an existing winning claim without creating another Stripe session', () => {
    expect(source).toContain("claim.state === 'open'");
    expect(source).toContain('stripe.checkout.sessions.retrieve(claim.stripeSessionId)');
    expect(source).toContain("existingSession.status === 'expired' || existingSession.status === 'complete'");
    expect(source).toContain("'checkout_retry'");
  });

  it('compensates claim state on Stripe and persistence failures', () => {
    expect(source).toContain('await expireSubscriptionCheckoutClaim');
    expect(source).toContain('await flagSubscriptionCheckoutClaimReview');
    expect(source).toContain('checkout_persistence_failed_and_stripe_expire_failed');
  });

  it('finalizes only after checkout_sessions persistence', () => {
    const persistIndex = source.indexOf("admin.from('checkout_sessions').insert");
    const finalizeIndex = source.indexOf('await finalizeSubscriptionCheckoutClaim');
    expect(persistIndex).toBeGreaterThan(-1);
    expect(finalizeIndex).toBeGreaterThan(persistIndex);
  });
});
