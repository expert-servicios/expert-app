import { describe, expect, it } from 'vitest';
import { parseServicePrice } from '@/lib/marketing/meta-catalog-pricing';

describe('parseServicePrice', () => {
  it('parses a fixed price with VAT excluded', () => {
    const result = parseServicePrice('150 € + IVA');
    expect(result).toEqual({
      priceMode: 'fixed',
      amountCents: 15000,
      currency: 'EUR',
      vatTreatment: 'plus_vat',
      perUnit: null,
      warnings: [],
    });
  });

  it('parses a four-digit price with a thousands separator', () => {
    const result = parseServicePrice('1.199 € + IVA');
    expect(result.amountCents).toBe(119900);
    expect(result.priceMode).toBe('fixed');
  });

  it('parses a "Desde" price as price_mode "from"', () => {
    const result = parseServicePrice('Desde 80 € + IVA / modelo');
    expect(result.priceMode).toBe('from');
    expect(result.amountCents).toBe(8000);
    expect(result.perUnit).toBe('modelo');
    expect(result.warnings).toContain('per_unit_pricing:modelo');
  });

  it('treats a fixed price with a per-unit suffix as "from", since the total varies', () => {
    const result = parseServicePrice('50 € + IVA / empleado');
    expect(result.priceMode).toBe('from');
    expect(result.amountCents).toBe(5000);
    expect(result.perUnit).toBe('empleado');
    expect(result.warnings).toContain('per_unit_pricing:empleado');
  });

  it('treats "Consultar" as a quote requiring manual review', () => {
    const result = parseServicePrice('Consultar');
    expect(result.priceMode).toBe('quote');
    expect(result.amountCents).toBeNull();
    expect(result.vatTreatment).toBe('manual_review');
    expect(result.warnings).toEqual([]);
  });

  it('treats a missing price as a quote and flags it', () => {
    const result = parseServicePrice(undefined);
    expect(result.priceMode).toBe('quote');
    expect(result.warnings).toContain('missing_price');
  });

  it('falls back to quote and flags unrecognized formats instead of guessing', () => {
    const result = parseServicePrice('A convenir según volumen');
    expect(result.priceMode).toBe('quote');
    expect(result.amountCents).toBeNull();
    expect(result.warnings[0]).toContain('unparsed_price_format');
  });
});
