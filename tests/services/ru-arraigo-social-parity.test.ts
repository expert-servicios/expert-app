import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getCatalogService } from '@/lib/utils/catalog';
import { getRuServicePath } from '@/lib/services/service-localized-content';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('RU Arraigo Social parity', () => {
  const service = getCatalogService('arraigo-social');

  it('reuses the canonical commercial source', () => {
    const ru = read('app/(localized)/ru/uslugi/arraigo-social/page.tsx');

    expect(service?.price).toBe('490 € + IVA');
    expect(service?.stripePriceId).toBeTruthy();
    expect(ru).toContain("const SERVICE_SLUG = 'arraigo-social'");
    expect(ru).toContain("getCatalogService(SERVICE_SLUG)");
    expect(ru).toContain("locale: 'ru' as const");
    expect(ru).not.toContain("stripePriceId: '");
  });

  it('keeps current 2026 legal rules in Russian', () => {
    const ru = read('app/(localized)/ru/uslugi/arraigo-social/page.tsx');

    expect(ru).toContain('не менее 2 лет');
    expect(ru).toContain('90 дней');
    expect(ru).toContain('EX-10');
    expect(ru).toContain('38,28 €');
    expect(ru).toContain('arraigo sociolaboral');
    expect(ru).not.toContain('3 года');
  });

  it('publishes reciprocal ES/RU SEO links', () => {
    const ru = read('app/(localized)/ru/uslugi/arraigo-social/page.tsx');
    const es = read('app/(public)/servicios/[categoria]/[servicio]/page.tsx');
    const sitemap = read('app/sitemap.ts');

    expect(ru).toContain("'es-ES': ES_URL");
    expect(ru).toContain("'ru-RU': RU_URL");
    expect(ru).toContain("'x-default': ES_URL");
    expect(getRuServicePath('arraigo-social')).toBe('/ru/uslugi/arraigo-social');
    expect(es).toContain('getRuServicePath(servicio)');
    expect(sitemap).toContain('/ru/uslugi/arraigo-social');
    expect(sitemap).toContain('/servicios/extranjeria-nacionalidad/arraigo-social');
  });

  it('keeps knowledge resources linked from the RU landing', () => {
    const ru = read('app/(localized)/ru/uslugi/arraigo-social/page.tsx');

    expect(ru).toContain('/docs/arraigo-social-requisitos-y-proceso');
    expect(ru).toContain('/docs/arraigo-social-acreditar-dos-anos');
    expect(ru).toContain('/docs/arraigo-social-vinculos-medios-e-informe-integracion');
    expect(ru).toContain('/blog/arraigo-social-vs-sociolaboral-2026');
  });
});
