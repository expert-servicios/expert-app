import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const adminQuoteRoute = readFileSync(
  resolve(process.cwd(), 'app/api/admin/quotes/route.ts'),
  'utf8',
);
const clientCheckoutRoute = readFileSync(
  resolve(process.cwd(), 'app/api/quotes/[id]/checkout/route.ts'),
  'utf8',
);

describe('structured quote checkout contract', () => {
  it('persists quote_items before creating the admin Stripe session', () => {
    const persistIndex = adminQuoteRoute.indexOf(".from('quote_items').insert");
    const stripeIndex = adminQuoteRoute.indexOf('stripe.checkout.sessions.create');

    expect(persistIndex).toBeGreaterThan(-1);
    expect(stripeIndex).toBeGreaterThan(persistIndex);
    expect(adminQuoteRoute).toContain("structured_quote: 'true'");
  });

  it('rebuilds authenticated checkout from persisted quote_items', () => {
    expect(clientCheckoutRoute).toContain(".from('quote_items')");
    expect(clientCheckoutRoute).toContain("code: 'quote_total_mismatch'");
    expect(clientCheckoutRoute).toContain('unit_amount: Number(line.unit_amount_cents)');
    expect(clientCheckoutRoute).toContain('quantity: Number(line.quantity)');
  });

  it('expires Stripe checkout when persistence of the session id fails', () => {
    expect(clientCheckoutRoute).toContain('stripe.checkout.sessions.expire(session.id)');
  });
});
