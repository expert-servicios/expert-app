import { describe, expect, it } from 'vitest';
import { getService } from '@/lib/services/service-registry';

describe('service registry billing readiness', () => {
  it.each([
    'irpf',
    'arraigo-social',
    'nacionalidad-espanola',
    'alta-autonomo',
    'constitucion-sl',
    'certificado-digital-persona-fisica',
  ])('does not require profile billing readiness for personal service %s', (slug) => {
    expect(getService(slug)?.requiresBillingReady).toBe(false);
  });

  it('requires entity billing readiness for an entity certificate', () => {
    expect(getService('certificado-digital-entidad')?.requiresBillingReady).toBe(true);
  });

  it.each([
    'holded-pack-starter',
    'holded-migracion-sin-inventario',
    'holded-migracion-con-inventario',
    'holded-modulo-formacion',
  ])('does not force company billing readiness for flexible service %s', (slug) => {
    expect(getService(slug)?.requiresBillingReady).toBe(false);
  });
});
