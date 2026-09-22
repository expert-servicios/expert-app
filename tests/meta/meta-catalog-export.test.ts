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
  it('marks a fully populated, ready service as marketingReady with no warnings', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'catalog_services') {
        return { select: () => queryResult([{ id: 's1', slug: 'demo-service', category_key: 'declaraciones-impuestos', status: 'active' }]) };
      }
      if (table === 'service_contents') {
        return { select: () => queryResult([{ id: 'c1', service_id: 's1', locale: 'es', name: 'Demo', short_description: 'short', description: 'long', landing_path: '/servicios/declaraciones-impuestos/demo-service', image_url: '/catalog/servicios/demo.png', status: 'active' }]) };
      }
      if (table === 'commercial_offers') {
        return { select: () => queryResult([{ id: 'o1', service_id: 's1', code: 'default', price_mode: 'fixed', amount_cents: 15000, status: 'active' }]) };
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
      retailerId: 'demo-service',
      name: 'Demo',
      landingUrl: 'https://expertconsulting.es/servicios/declaraciones-impuestos/demo-service',
      imageUrl: 'https://expertconsulting.es/catalog/servicios/demo.png',
      price: { amount: 150, currency: 'EUR', taxIncluded: false },
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
        return { select: () => queryResult([{ id: 'o4', service_id: 's4', code: 'default', price_mode: 'from', amount_cents: 5000, status: 'active' }]) };
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
    expect(draft.price).toEqual({ amount: 50, currency: 'EUR', taxIncluded: false });
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
