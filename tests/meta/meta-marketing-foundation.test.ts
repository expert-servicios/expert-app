import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMetaMarketingConfigStatus } from '@/lib/integrations/meta/config';
import { mapServiceToMetaCatalogDraft } from '@/lib/integrations/meta/catalog-mapper';
import type { Service } from '@/lib/utils/catalog';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe('Meta Marketing foundation', () => {
  it('fails closed while configuration is incomplete', () => {
    delete process.env.META_MARKETING_APP_ID;
    delete process.env.META_MARKETING_APP_SECRET;
    delete process.env.META_MARKETING_SYSTEM_USER_ACCESS_TOKEN;
    delete process.env.META_MARKETING_BUSINESS_ID;
    delete process.env.META_MARKETING_CATALOG_ID;
    delete process.env.META_MARKETING_GRAPH_API_VERSION;
    process.env.META_MARKETING_ENABLED = 'false';

    const status = getMetaMarketingConfigStatus();
    expect(status.enabled).toBe(false);
    expect(status.configured).toBe(false);
    expect(status.missing).toContain('META_MARKETING_CATALOG_ID');
  });

  it('does not expose secret values through diagnostics', () => {
    process.env.META_MARKETING_APP_SECRET = 'secret-value';
    process.env.META_MARKETING_SYSTEM_USER_ACCESS_TOKEN = 'token-value';
    const status = getMetaMarketingConfigStatus();
    expect(JSON.stringify(status)).not.toContain('secret-value');
    expect(JSON.stringify(status)).not.toContain('token-value');
  });

  it('marks variable prices for manual review instead of inventing a Meta price', () => {
    const service: Service = {
      slug: 'variable-price-test',
      categoria: 'declaraciones-impuestos',
      name: 'Servicio variable',
      shortDescription: 'Servicio con precio variable',
      description: 'Detalle',
      price: 'Desde 80 € + IVA',
      includes: [],
      faqs: [],
    };

    const item = mapServiceToMetaCatalogDraft(service);
    expect(item.price).toBeNull();
    expect(item.marketingReady).toBe(false);
    expect(item.warnings).toContain('price_requires_manual_review');
  });

  it('maps fixed public prices without treating VAT as included', () => {
    const service: Service = {
      slug: 'fixed-price-test',
      categoria: 'declaraciones-impuestos',
      name: 'Servicio fijo',
      shortDescription: 'Servicio con precio fijo',
      description: 'Detalle',
      price: '150 € + IVA',
      includes: [],
      faqs: [],
    };

    const item = mapServiceToMetaCatalogDraft(service);
    expect(item.price).toEqual({ amount: 150, currency: 'EUR', taxIncluded: false });
    expect(item.marketingReady).toBe(true);
  });
});
