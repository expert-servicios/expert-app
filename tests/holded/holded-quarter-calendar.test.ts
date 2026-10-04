import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { currentQuarter } from '@/lib/holded/quarter-data';

describe('Holded quarter calendar semantics', () => {
  it('uses Europe/Madrid for the current quarter around UTC boundaries', () => {
    expect(currentQuarter(new Date('2026-09-30T21:59:59Z'))).toEqual({ year: 2026, quarter: 3 });
    expect(currentQuarter(new Date('2026-09-30T22:00:00Z'))).toEqual({ year: 2026, quarter: 4 });
  });
});


describe('Holded quarter currency safety', () => {
  it('keeps aggregated quarter KPIs on EUR documents only', () => {
    const quarter = readFileSync(resolve(process.cwd(), 'lib/holded/quarter-data.ts'), 'utf8');
    expect(quarter).toContain("const eurSales = sales.filter");
    expect(quarter).toContain("const eurPurchases = purchases.filter");
    expect(quarter).toContain('dataWarnings');
    expect(quarter).toContain("currency: String(d.currency ?? 'EUR').toUpperCase()");
  });
});
