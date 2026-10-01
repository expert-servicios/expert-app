import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('multi-plan subscription cart', () => {
  it('adds recurring plans to the shared cart instead of opening Stripe directly', () => {
    const plans = source('components/subscriptions/SubscriptionPlanCards.tsx');
    expect(plans).toContain("itemType: 'subscription' as const");
    expect(plans).toContain("addItem(cartItem)");
    expect(plans).not.toContain("fetch('/api/subscriptions/checkout'");
  });

  it('preserves quantities and routes recurring carts to the bundle endpoint', () => {
    const cart = source('contexts/CartContext.tsx');
    expect(cart).toContain("quantity?");
    expect(cart).toContain("setQuantity");
    expect(cart).toContain("'/api/subscriptions/cart-checkout'");
    expect(cart).toContain("items: items.map");
  });

  it('creates one subscription checkout with multiple recurring line items', () => {
    const checkout = source('app/api/subscriptions/cart-checkout/route.ts');
    expect(checkout).toContain("mode: 'subscription'");
    expect(checkout).toContain("line_items: resolvedItems.map");
    expect(checkout).toContain("quantity: item.quantity");
    expect(checkout).toContain("product_type: 'subscription_bundle'");
    expect(checkout).toContain("recurring_total_cents");
    expect(checkout).toContain("mixed_recurring_one_time_not_enabled");
  });

  it('keeps monthly and annual plans in separate bundle checkouts', () => {
    const checkout = source('app/api/subscriptions/cart-checkout/route.ts');
    expect(checkout).toContain("intervals.size !== 1");
    expect(checkout).toContain("mixed_billing_intervals");
  });

  it('persists all Stripe subscription items and totals quantity-aware recurring revenue', () => {
    const webhook = source('app/api/stripe/webhook/route.ts');
    expect(webhook).toContain("stripe_items: stripeItems");
    expect(webhook).toContain("(item.quantity ?? 1)");
    expect(webhook).toContain("sub.items.data.reduce");
    expect(webhook).toContain("recurring_total_cents");
  });

  it('preserves bundle items when profile completion is required mid-checkout', () => {
    const quickProfile = source('components/cart/QuickProfileGate.tsx');
    const page = source('app/(public)/carrito/page.tsx');
    const sidebar = source('components/cart/CartSidebar.tsx');
    expect(quickProfile).toContain("getCartCheckoutEndpoint(checkoutItems)");
    expect(quickProfile).toContain("...(items.length > 0 ? { items } : {})");
    expect(page).toContain("items={items.map");
    expect(sidebar).toContain("items={items.map");
  });
});
