import { describe, expect, it } from 'vitest';
import {
  getQuoteLineCatalog,
  quoteLineTotalCents,
  resolveQuoteLineSnapshots,
} from '@/lib/quotes/quote-line-catalog';

describe('quote line catalog', () => {
  it('prices the Holded labor migration per employee and enforces minimum 5', () => {
    const lines = resolveQuoteLineSnapshots([
      { serviceSlug: 'holded-migracion-laboral', quantity: 11 },
    ]);

    expect(lines[0].unitAmountCents).toBe(5000);
    expect(lines[0].quantity).toBe(11);
    expect(quoteLineTotalCents(lines)).toBe(55000);

    expect(() => resolveQuoteLineSnapshots([
      { serviceSlug: 'holded-migracion-laboral', quantity: 4 },
    ])).toThrow(/entre 5 y 500/);
  });

  it('supports migration plus Holded training as a structured bundle', () => {
    const lines = resolveQuoteLineSnapshots([
      { serviceSlug: 'holded-migracion-laboral', quantity: 11 },
      { serviceSlug: 'holded-modulo-formacion', quantity: 1 },
    ]);

    expect(quoteLineTotalCents(lines)).toBe(73000);
    expect(lines.map((line) => line.serviceSlug)).toEqual([
      'holded-migracion-laboral',
      'holded-modulo-formacion',
    ]);
  });

  it('rejects client-controlled quantities for fixed-unit services', () => {
    expect(() => resolveQuoteLineSnapshots([
      { serviceSlug: 'holded-modulo-formacion', quantity: 2 },
    ])).toThrow(/debe ser 1/);
  });

  it('only exposes fixed-price Stripe-backed services', () => {
    const catalog = getQuoteLineCatalog();
    expect(catalog.some((item) => item.slug === 'holded-migracion-laboral')).toBe(true);
    expect(catalog.some((item) => item.slug === 'holded-modulo-formacion')).toBe(true);
    expect(catalog.every((item) => item.unitAmountCents > 0)).toBe(true);
  });
});
