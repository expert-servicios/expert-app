import { describe, expect, it } from 'vitest';
import { getQuoteLineCatalog, resolveQuoteLineSnapshots } from '@/lib/quotes/quote-line-catalog';

describe('Holded labor migration quantity checkout safety', () => {
  it('keeps labor migration available for structured quotes without direct checkout', () => {
    const item = getQuoteLineCatalog().find((service) => service.slug === 'holded-migracion-laboral');

    expect(item).toBeDefined();
    expect(item?.unitAmountCents).toBe(5000);
    expect(item?.minQuantity).toBe(5);
    expect(item?.stripePriceId).toBeNull();
  });

  it('still calculates 11 employees server-side', () => {
    const [line] = resolveQuoteLineSnapshots([
      { serviceSlug: 'holded-migracion-laboral', quantity: 11 },
    ]);

    expect(line.quantity).toBe(11);
    expect(line.unitAmountCents).toBe(5000);
    expect(line.stripePriceId).toBeNull();
  });
});
