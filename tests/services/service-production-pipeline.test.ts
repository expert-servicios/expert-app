import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  evaluateServiceContentReadiness,
  SERVICE_PRODUCTION_STANDARD_VERSION,
} from '@/lib/services/service-production-readiness';
import { serviceProductionManifest } from '@/lib/services/service-production-manifest';
import { getLocalizedServicePresentation } from '@/lib/services/service-localized-content';

const read = (path: string) => readFileSync(path, 'utf8');

const CURRENT_REFERENCE_SERVICES = [
  'certificado-digital-persona-fisica',
  'certificado-digital-entidad',
  'pack-certificados-digitales',
] as const;

describe('service production pipeline v1', () => {
  it('uses a versioned production standard', () => {
    expect(SERVICE_PRODUCTION_STANDARD_VERSION).toBe('1.0');
  });

  for (const slug of CURRENT_REFERENCE_SERVICES) {
    it(`${slug} passes the reusable content/channel gate`, () => {
      const result = evaluateServiceContentReadiness(slug);
      expect(result.issues).toEqual([]);
      expect(result.blogCount).toBeGreaterThanOrEqual(3);
      expect(result.knowledgeCount).toBeGreaterThanOrEqual(3);
      expect(result.socialCounts.facebook).toBeGreaterThanOrEqual(3);
      expect(result.socialCounts.instagram).toBeGreaterThanOrEqual(3);
      expect(result.socialCounts.linkedin).toBeGreaterThanOrEqual(3);
      expect(result.socialCounts.google).toBeGreaterThanOrEqual(3);
    });
  }

  it('requires every service marked production_ready to pass the reusable content gate', () => {
    const productionReady = serviceProductionManifest.filter((entry) => entry.stage === 'production_ready');
    expect(productionReady.length).toBeGreaterThan(0);

    for (const entry of productionReady) {
      const result = evaluateServiceContentReadiness(entry.slug);
      expect(result.issues, entry.slug).toEqual([]);
    }
  });

  it('requires RU presentation metadata for manifest entries that require Russian', () => {
    const ruEntries = serviceProductionManifest.filter((entry) => entry.ruRequired);
    for (const entry of ruEntries.filter((item) => item.stage === 'production_ready')) {
      const localized = getLocalizedServicePresentation(entry.slug, 'ru');
      expect(localized, entry.slug).toBeDefined();
      expect(localized?.path.startsWith('/ru/')).toBe(true);
      expect(localized?.title.trim().length).toBeGreaterThan(10);
      expect(localized?.summary.trim().length).toBeGreaterThan(20);
    }
  });

  it('fails closed for an unknown service', () => {
    const result = evaluateServiceContentReadiness('servicio-inexistente');
    expect(result.issues.some((issue) => issue.code === 'service_missing')).toBe(true);
  });

  it('keeps social image rendering generic rather than hardcoding RU service maps', () => {
    const og = read('app/api/services/og/route.tsx');
    expect(og).toContain('getLocalizedServicePresentation(service.slug, lang)');
    expect(og).not.toContain('const ruCopy');
  });

  it('reports editorial gaps instead of treating partial services as ready', () => {
    const result = evaluateServiceContentReadiness('nacionalidad-espanola-menor-nacido-en-espana');
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
