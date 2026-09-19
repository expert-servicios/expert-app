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
const stripeWebhookRoute = readFileSync(
  resolve(process.cwd(), 'app/api/stripe/webhook/route.ts'),
  'utf8',
);
const dashboardQuotePage = readFileSync(
  resolve(process.cwd(), 'app/(protected)/dashboard/presupuestos/page.tsx'),
  'utf8',
);

describe('structured quote checkout contract', () => {
  it('persists quote_items but defers Stripe creation until the client chooses to pay', () => {
    expect(adminQuoteRoute).toContain(".from('quote_items').insert");
    expect(adminQuoteRoute).not.toContain('stripe.checkout.sessions.create');
    expect(adminQuoteRoute).toContain('/dashboard/presupuestos');
  });

  it('rebuilds authenticated checkout from persisted quote_items', () => {
    expect(clientCheckoutRoute).toContain(".from('quote_items')");
    expect(clientCheckoutRoute).toContain("code: 'quote_total_mismatch'");
    expect(clientCheckoutRoute).toContain('unit_amount: Number(line.unit_amount_cents)');
    expect(clientCheckoutRoute).toContain('quantity: Number(line.quantity)');
    expect(clientCheckoutRoute).toContain('stripe.checkout.sessions.create');
  });

  it('reuses an open Stripe session and compensates a losing concurrent session', () => {
    expect(clientCheckoutRoute).toContain("previousSession.status === 'open'");
    expect(clientCheckoutRoute).toContain('reused: true');
    expect(clientCheckoutRoute).toContain('stripe.checkout.sessions.expire(session.id)');
    expect(clientCheckoutRoute).toContain("code: 'quote_checkout_race'");
  });

  it('revalidates company ownership before starting payment', () => {
    expect(clientCheckoutRoute).toContain(".from('profile_companies')");
    expect(clientCheckoutRoute).toContain("code: 'quote_company_forbidden'");
  });

  it('detects a second payment for the same quote before creating another order', () => {
    expect(stripeWebhookRoute).toContain(".eq('quote_id', quoteId)");
    expect(stripeWebhookRoute).toContain("action: 'quote.duplicate_payment_detected'");
    expect(stripeWebhookRoute).toContain('Pago duplicado detectado en presupuesto');
  });

  it('shows persisted concepts and quantities to the client before payment', () => {
    expect(dashboardQuotePage).toContain('quote.quote_items');
    expect(dashboardQuotePage).toContain('Base imponible');
    expect(dashboardQuotePage).toContain('item.quantity');
    expect(dashboardQuotePage).toContain('unit_amount_cents');
  });
});
