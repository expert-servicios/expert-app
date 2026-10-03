import { afterEach, describe, expect, it, vi } from 'vitest';

function queryResult<T>(data: T, error: { message: string } | null = null) {
  const result = { data, error };
  const builder: PromiseLike<typeof result> & { eq: () => typeof builder } = {
    eq: () => builder,
    then: (resolve: (value: typeof result) => unknown) => resolve(result) as unknown as void,
  } as never;
  return builder;
}

const fromMock = vi.fn();

vi.mock('@/lib/integrations/supabase', () => ({
  getSupabaseAdmin: () => ({ from: fromMock }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('buildMetaCatalogDrafts', () => {
  it('preserves absolute public asset URLs and resolves relative assets against EXPERT', async () => {
    const { resolveMetaPublicAssetUrl } = await import('@/lib/integrations/meta/catalog-export');

    expect(resolveMetaPublicAssetUrl('/catalog/servicios/demo.png')).toBe(
      'https://expertconsulting.es/catalog/servicios/demo.png',
    );
    expect(resolveMetaPublicAssetUrl('https://ybtpqscmqrrjjmuoryap.supabase.co/storage/v1/object/public/user-files/meta-catalog/demo/es/image.webp')).toBe(
      'https://ybtpqscmqrrjjmuoryap.supabase.co/storage/v1/object/public/user-files/meta-catalog/demo/es/image.webp',
    );
    expect(resolveMetaPublicAssetUrl('javascript:alert(1)')).toBeNull();
    expect(resolveMetaPublicAssetUrl('data:image/png;base64,AAAA')).toBeNull();
    expect(resolveMetaPublicAssetUrl('ftp://example.com/image.png')).toBeNull();
    expect(resolveMetaPublicAssetUrl('https://[')).toBeNull();
  });

  it('marks malformed or non-web image URLs as missing instead of marketing ready', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'catalog_services') {
        return { select: () => queryResult([{ id: 's-invalid-image', slug: 'invalid-image-service', category_key: 'administrativos', status: 'active' }]) };
      }
      if (table === 'service_contents') {
        return { select: () => queryResult([{ id: 'c-invalid-image', service_id: 's-invalid-image', locale: 'es', name: 'Invalid image', short_description: 'short', description: 'long', landing_path: '/servicios/administrativos/invalid-image-service', image_url: 'javascript:alert(1)', status: 'active' }]) };
      }
      if (table === 'commercial_offers') {
        return { select: () => queryResult([{ id: 'o-invalid-image', service_id: 's-invalid-image', code: 'default', price_mode: 'fixed', amount_cents: 1000, vat_treatment: 'vat_included', status: 'active' }]) };
      }
      if (table === 'service_channel_configs') {
        return { select: () => queryResult([{ service_id: 's-invalid-image', enabled: true, publish_status: 'ready' }]) };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const { buildMetaCatalogDrafts } = await import('@/lib/integrations/meta/catalog-export');
    const result = await buildMetaCatalogDrafts();

    expect(result.readyCount).toBe(0);
    expect(result.blockedCount).toBe(1);
    expect(result.drafts[0].imageUrl).toBeNull();
    expect(result.drafts[0].warnings).toContain('missing_image');
  });

  it('marks a fully populated, ready service as marketingReady with no warnings', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'catalog_services') {
        return { select: () => queryResult([{ id: 's1', slug: 'certificado-digital-persona-fisica', category_key: 'certificado-digital', status: 'active' }]) };
      }
      if (table === 'service_contents') {
        return { select: () => queryResult([{ id: 'c1', service_id: 's1', locale: 'es', name: 'Certificado PF', short_description: 'short', description: 'long', landing_path: '/servicios/certificado-digital/certificado-digital-persona-fisica', image_url: '/catalog/servicios/certificado-pf.png', status: 'active' }]) };
      }
      if (table === 'commercial_offers') {
        return { select: () => queryResult([{ id: 'o1', service_id: 's1', code: 'default', price_mode: 'fixed', amount_cents: 15000, vat_treatment: 'plus_vat', status: 'active' }]) };
      }
      if (table === 'service_channel_configs') {
        return { select: () => queryResult([{ service_id: 's1', enabled: true, publish_status: 'ready' }]) };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const { buildMetaCatalogDrafts } = await import('@/lib/integrations/meta/catalog-export');
    const result = await buildMetaCatalogDrafts();

    expect(result.drafts).toHaveLength(1);
    expect(result.readyCount).toBe(1);
    expect(result.blockedCount).toBe(0);
    expect(result.drafts[0]).toMatchObject({
      retailerId: 'certificado-digital-persona-fisica',
      offerId: 'o1',
      name: 'Certificado PF',
      landingUrl: 'https://expertconsulting.es/servicios/certificado-digital/certificado-digital-persona-fisica',
      imageUrl: 'https://expertconsulting.es/catalog/servicios/certificado-pf.png',
      price: { amount: 181.5, currency: 'EUR', taxIncluded: true, vatTreatment: 'plus_vat' },
      availability: 'in stock',
      marketingReady: true,
      warnings: [],
    });
  });

  it('excludes a "Consultar" (quote price) service from the catalog outright instead of listing it blocked', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'catalog_services') {
        return { select: () => queryResult([{ id: 's2', slug: 'quote-service', category_key: 'notaria-propiedades', status: 'active' }]) };
      }
      if (table === 'service_contents') {
        return { select: () => queryResult([{ id: 'c2', service_id: 's2', locale: 'es', name: 'Quote service', short_description: 'short', description: 'long', landing_path: '/servicios/notaria-propiedades/quote-service', image_url: null, status: 'active' }]) };
      }
      if (table === 'commercial_offers') {
        return { select: () => queryResult([{ id: 'o2', service_id: 's2', code: 'default', price_mode: 'quote', amount_cents: null, status: 'active' }]) };
      }
      if (table === 'service_channel_configs') {
        return { select: () => queryResult([]) };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const { buildMetaCatalogDrafts } = await import('@/lib/integrations/meta/catalog-export');
    const result = await buildMetaCatalogDrafts();

    expect(result.drafts).toHaveLength(0);
    expect(result.readyCount).toBe(0);
    expect(result.blockedCount).toBe(0);
    expect(result.excluded).toEqual([{ retailerId: 'quote-service', name: 'Quote service', reason: 'quote_price' }]);
  });

  it('excludes a paused (archived) service outright, even when it has a real price', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'catalog_services') {
        return { select: () => queryResult([{ id: 's5', slug: 'paused-service', category_key: 'empresas-autonomos', status: 'paused' }]) };
      }
      if (table === 'service_contents') {
        return { select: () => queryResult([{ id: 'c5', service_id: 's5', locale: 'es', name: 'Paused service', short_description: 'short', description: 'long', landing_path: '/servicios/empresas-autonomos/paused-service', image_url: '/catalog/servicios/paused-service.png', status: 'active' }]) };
      }
      if (table === 'commercial_offers') {
        return { select: () => queryResult([{ id: 'o5', service_id: 's5', code: 'default', price_mode: 'from', amount_cents: 8000, status: 'active' }]) };
      }
      if (table === 'service_channel_configs') {
        return { select: () => queryResult([{ service_id: 's5', enabled: true, publish_status: 'ready' }]) };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const { buildMetaCatalogDrafts } = await import('@/lib/integrations/meta/catalog-export');
    const result = await buildMetaCatalogDrafts();

    expect(result.drafts).toHaveLength(0);
    expect(result.excluded).toEqual([{ retailerId: 'paused-service', name: 'Paused service', reason: 'archived' }]);
  });

  it('excludes a service with no commercial offer at all', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'catalog_services') {
        return { select: () => queryResult([{ id: 's3', slug: 'no-offer-service', category_key: 'notaria-propiedades', status: 'active' }]) };
      }
      if (table === 'service_contents') {
        return { select: () => queryResult([{ id: 'c3', service_id: 's3', locale: 'es', name: 'No offer service', short_description: 'short', description: 'long', landing_path: '/servicios/notaria-propiedades/no-offer-service', image_url: null, status: 'active' }]) };
      }
      if (table === 'commercial_offers') {
        return { select: () => queryResult([]) };
      }
      if (table === 'service_channel_configs') {
        return { select: () => queryResult([]) };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const { buildMetaCatalogDrafts } = await import('@/lib/integrations/meta/catalog-export');
    const result = await buildMetaCatalogDrafts();

    expect(result.drafts).toHaveLength(0);
    expect(result.excluded).toEqual([{ retailerId: 'no-offer-service', name: 'No offer service', reason: 'missing_offer' }]);
  });

  it('flags a priced service missing an image and with the Meta channel not ready, without excluding it', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'catalog_services') {
        return { select: () => queryResult([{ id: 's4', slug: 'blocked-service', category_key: 'notaria-propiedades', status: 'active' }]) };
      }
      if (table === 'service_contents') {
        return { select: () => queryResult([{ id: 'c4', service_id: 's4', locale: 'es', name: 'Blocked service', short_description: 'short', description: 'long', landing_path: '/servicios/notaria-propiedades/blocked-service', image_url: null, status: 'active' }]) };
      }
      if (table === 'commercial_offers') {
        return { select: () => queryResult([{ id: 'o4', service_id: 's4', code: 'default', price_mode: 'from', amount_cents: 5000, vat_treatment: 'vat_included', status: 'active' }]) };
      }
      if (table === 'service_channel_configs') {
        return { select: () => queryResult([]) };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const { buildMetaCatalogDrafts } = await import('@/lib/integrations/meta/catalog-export');
    const result = await buildMetaCatalogDrafts();

    expect(result.excluded).toEqual([]);
    expect(result.readyCount).toBe(0);
    expect(result.blockedCount).toBe(1);
    const draft = result.drafts[0];
    expect(draft.marketingReady).toBe(false);
    expect(draft.price).toEqual({ amount: 50, currency: 'EUR', taxIncluded: true, vatTreatment: 'vat_included' });
    expect(draft.warnings).toEqual(expect.arrayContaining(['missing_image', 'meta_channel_not_ready']));
  });

  it('throws instead of silently exporting a partial catalog when a C2 table read fails', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'catalog_services') {
        return { select: () => queryResult(null, { message: 'boom' }) };
      }
      return { select: () => queryResult([]) };
    });

    const { buildMetaCatalogDrafts } = await import('@/lib/integrations/meta/catalog-export');
    await expect(buildMetaCatalogDrafts()).rejects.toThrow(/catalog_services/);
  });
});
