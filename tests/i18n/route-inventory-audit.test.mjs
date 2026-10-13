import { describe, expect, it } from 'vitest';
import { auditRouteParity, buildParityReport, normalizePageRoute } from '../../scripts/audit-es-ru-parity.mjs';

describe('ES/RU parity inventory', () => {
  it('normalizes pages and does not invent a matching translation', () => {
    expect(normalizePageRoute('app/(public)/page.tsx', 'app/(public)')).toBe('/');
    expect(normalizePageRoute('app/(public)/servicios/page.tsx', 'app/(public)')).toBe('/servicios');
  });
  it('distinguishes a concrete localized page from catch-all and missing pages', () => {
    const report = auditRouteParity([
      'app/(public)/page.tsx',
      'app/(public)/blog/guia-ex11-larga-duracion-nacional/page.tsx',
      'app/(public)/contacto/page.tsx',
      'app/(public)/blog/[slug]/page.tsx',
    ], [
      'app/(localized)/ru/[[...slug]]/page.tsx',
      'app/(localized)/ru/blog/instruktsiya-ex11-larga-duracion/page.tsx',
    ]);
    expect(report.pairs.find((x) => x.es === '/')?.kind).toBe('catchall');
    expect(report.pairs.find((x) => x.es === '/blog/guia-ex11-larga-duracion-nacional')?.kind).toBe('direct');
    expect(report.pairs.find((x) => x.es === '/contacto')?.kind).toBe('unmapped');
    expect(report.pairs.find((x) => x.es === '/blog/[slug]')?.kind).toBe('dynamic_unverified');
  });
  it('surfaces actual shell differences for remediation', () => {
    const report = buildParityReport();
    expect(report.routes.esRouteCount).toBeGreaterThan(20);
    expect(report.routes.ruRouteCount).toBeGreaterThan(10);
    expect(report.shellDifferences.map((x) => x.feature)).toContain('header');
    expect(report.shellDifferences.map((x) => x.feature)).toContain('kia');
  });
});
