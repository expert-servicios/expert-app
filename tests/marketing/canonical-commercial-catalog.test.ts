import { describe, expect, it } from 'vitest';
import { buildCanonicalShadowCatalog } from '@/lib/services/canonical-commercial-catalog';

describe('canonical commercial catalog C1 shadow model', () => {
  it('builds one canonical identity per public service without changing legacy sources', () => {
    const catalog = buildCanonicalShadowCatalog();

    expect(catalog.length).toBeGreaterThan(0);
    expect(new Set(catalog.map((item) => item.identity.serviceId)).size).toBe(catalog.length);
    expect(catalog.every((item) => item.identity.status === 'active')).toBe(true);
  });

  it('separates editorial content from commercial offers', () => {
    const catalog = buildCanonicalShadowCatalog();
    const irpf = catalog.find((item) => item.identity.slug === 'irpf');

    expect(irpf).toBeDefined();
    expect(irpf?.contentEs.name).toContain('Renta');
    expect(irpf?.offers.length).toBeGreaterThan(0);
    expect(irpf?.offers[0].source).toBe('legacy_public');
  });

  it('keeps legacy price conflicts visible instead of resolving them', () => {
    const catalog = buildCanonicalShadowCatalog();
    const irpf = catalog.find((item) => item.identity.slug === 'irpf');

    expect(irpf?.warnings).toContain('legacy_price_conflict');
    expect(irpf?.offers.some((offer) => offer.source === 'legacy_admin')).toBe(true);
  });

  it('models Desde and Consultar as non-fixed offers', () => {
    const catalog = buildCanonicalShadowCatalog();
    const nonResidents = catalog.find((item) => item.identity.slug === 'no-residentes');
    const modelo151 = catalog.find((item) => item.identity.slug === 'modelo-151');

    expect(nonResidents?.offers[0].priceMode).toBe('from');
    expect(nonResidents?.offers[0].amountCents).toBe(8000);
    expect(modelo151?.offers[0].priceMode).toBe('quote');
    expect(modelo151?.offers[0].amountCents).toBeNull();
  });

  it('preserves Stripe as a binding, not the canonical identity', () => {
    const catalog = buildCanonicalShadowCatalog();
    const irpf = catalog.find((item) => item.identity.slug === 'irpf');

    expect(irpf?.identity.serviceId).toBe('irpf');
    expect(irpf?.offers[0].stripePriceId).toMatch(/^price_/);
  });

  it('attaches declared legacy aliases to the canonical identity', () => {
    const catalog = buildCanonicalShadowCatalog();
    const nationalityMinor = catalog.find(
      (item) => item.identity.slug === 'nacionalidad-espanola-menor-nacido-en-espana'
    );
    const matriculation = catalog.find((item) => item.identity.slug === 'matriculacion');

    expect(nationalityMinor?.aliases).toContain('nacionalidad-menor-nacido-espana');
    expect(matriculation?.aliases).toContain('matriculacion-vehiculo');
  });

  it('models Holded 2h and 4h training variants as offers of one service identity', () => {
    const catalog = buildCanonicalShadowCatalog();
    const holdedTraining = catalog.find((item) => item.identity.slug === 'formacion-holded');

    expect(holdedTraining).toBeDefined();
    expect(holdedTraining?.offers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          serviceId: 'formacion-holded',
          sourceId: 'formacion-holded-2h',
          code: 'holded-2h',
          amountCents: 18000,
        }),
        expect.objectContaining({
          serviceId: 'formacion-holded',
          sourceId: 'formacion-holded-4h',
          code: 'holded-4h',
          amountCents: 32000,
        }),
      ])
    );
  });

  it('maps an Admin alias offer onto the canonical service without changing its source id', () => {
    const catalog = buildCanonicalShadowCatalog();
    const nationalityMinor = catalog.find(
      (item) => item.identity.slug === 'nacionalidad-espanola-menor-nacido-en-espana'
    );
    const adminOffer = nationalityMinor?.offers.find(
      (offer) => offer.sourceId === 'nacionalidad-menor-nacido-espana'
    );

    expect(adminOffer?.serviceId).toBe('nacionalidad-espanola-menor-nacido-en-espana');
    expect(adminOffer?.source).toBe('legacy_admin');
  });
});
