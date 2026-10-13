import { describe, expect, it } from 'vitest';
import { auditRuServiceCatalog } from '@/lib/i18n/catalog-parity-audit';
import { services } from '@/lib/utils/catalog';

describe('Russian catalog parity audit', () => {
  it('uses only the canonical service data and never generates payment products', () => {
    const report = auditRuServiceCatalog();
    expect(report.total).toBeGreaterThan(10);
    expect(report.localized).toBeGreaterThan(10);
    expect(report.total).toBeLessThanOrEqual(services.length);
    expect(report.localized + report.missing).toBe(report.total);
    expect(report.items.every(i => i.esPath.startsWith('/servicios/'))).toBe(true);
  });
  it('never pretends an untranslated path is a Russian service', () => {
    const report = auditRuServiceCatalog();
    expect(report.items.filter(i => i.missingRuPage).every(i => i.ruPath === i.esPath)).toBe(true);
    expect(report.items.some(i => i.hasRuPresentation && i.ruPath.startsWith('/ru/uslugi/'))).toBe(true);
  });
});
