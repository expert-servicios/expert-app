import { describe, expect, it } from 'vitest';
import {
  evaluateServiceContentReadiness,
  SERVICE_PRODUCTION_STANDARD_VERSION,
} from '@/lib/services/service-production-readiness';

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

  it('fails closed for an unknown service', () => {
    const result = evaluateServiceContentReadiness('servicio-inexistente');
    expect(result.issues.some((issue) => issue.code === 'service_missing')).toBe(true);
  });

  it('reports editorial gaps instead of treating partial services as ready', () => {
    const result = evaluateServiceContentReadiness('nacionalidad-espanola-menor-nacido-en-espana');
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
