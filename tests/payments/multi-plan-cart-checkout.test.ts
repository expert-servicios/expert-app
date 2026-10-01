import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('entity-scoped subscription checkout', () => {
  it('does not add subscription plans to the shared services cart', () => {
    const plans = source('components/subscriptions/SubscriptionPlanCards.tsx');
    expect(plans).toContain("fetch('/api/subscriptions/checkout'");
    expect(plans).toContain('companyId');
    expect(plans).not.toContain('addItem(cartItem)');
    expect(plans).not.toContain("itemType: 'subscription'");
  });

  it('keeps the former multi-plan endpoint disabled', () => {
    const endpoint = source('app/api/subscriptions/cart-checkout/route.ts');
    expect(endpoint).toContain("code: 'subscription_cart_disabled'");
    expect(endpoint).toContain('status: 410');
  });

  it('creates one recurring line for one fiscal entity', () => {
    const checkout = source('app/api/subscriptions/checkout/route.ts');
    expect(checkout).toContain('companyId');
    expect(checkout).toContain("mode: 'subscription'");
    expect(checkout).toContain('quantity: 1');
    expect(checkout).toContain("product_type: 'suscripcion'");
  });
});
