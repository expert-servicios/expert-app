import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  META_CATALOG_LOCALIZATION_LOCALES,
  buildMetaLocalizedRequest,
  hashMetaLocalizedRequest,
} from '@/lib/integrations/meta/catalog-localization-sync';
import type { MetaServiceCatalogDraft } from '@/lib/integrations/meta/types';

const read = (path: string) => readFileSync(path, 'utf8');

function ruDraft(): MetaServiceCatalogDraft {
  return {
    retailerId: 'certificado-digital-persona-fisica',
    offerId: 'offer-1',
    name: 'Цифровой сертификат для физического лица',
    description: 'Квалифицированный цифровой сертификат для идентификации и электронной подписи.',
    serviceCategory: 'certificado-digital',
    sourceCategorySlug: 'certificado-digital',
    landingUrl: 'https://expertconsulting.es/ru/servicios/certificado-digital-persona-fisica',
    imageUrl: 'https://example.supabase.co/storage/v1/object/public/user-files/meta-catalog/item/ru/image.webp',
    price: {
      amount: 108.9,
      currency: 'EUR',
      taxIncluded: true,
      vatTreatment: 'plus_vat',
    },
    availability: 'in stock',
    marketingReady: true,
    warnings: [],
  };
}

describe('Meta RU localized catalog', () => {
  it('uses the official Russian Meta locale and keeps the base retailer ID', () => {
    const request = buildMetaLocalizedRequest(ruDraft(), 'ru');

    expect(META_CATALOG_LOCALIZATION_LOCALES.ru).toBe('ru_RU');
    expect(request.method).toBe('UPDATE');
    expect(request.data.id).toBe('certificado-digital-persona-fisica');
    expect(request.localization).toEqual({
      type: 'LANGUAGE',
      value: 'ru_RU',
    });
  });

  it('sends only fields allowed in a language localization', () => {
    const request = buildMetaLocalizedRequest(ruDraft(), 'ru');
    const data = request.data as Record<string, unknown>;

    expect(data.title).toContain('Цифровой');
    expect(data.description).toBeTruthy();
    expect(data.link).toContain('/ru/');
    expect(data.image).toBeTruthy();

    for (const forbidden of [
      'price',
      'sale_price',
      'unit_price',
      'base_price',
      'status',
      'availability',
    ]) {
      expect(data).not.toHaveProperty(forbidden);
    }
  });

  it('uses the localized image structure instead of image_link', () => {
    const request = buildMetaLocalizedRequest(ruDraft(), 'ru');
    const data = request.data as Record<string, unknown>;

    expect(data).not.toHaveProperty('image_link');
    expect(data.image).toEqual([
      {
        url: ruDraft().imageUrl,
        tag: ['Localized'],
      },
    ]);
  });

  it('hashes localized payloads deterministically for stale detection', () => {
    const first = buildMetaLocalizedRequest(ruDraft(), 'ru');
    const second = buildMetaLocalizedRequest(ruDraft(), 'ru');
    expect(hashMetaLocalizedRequest(first)).toBe(hashMetaLocalizedRequest(second));
  });

  it('uses localized_items_batch and checks the asynchronous handle before success', () => {
    const source = read('lib/integrations/meta/catalog-localization-sync.ts');

    expect(source).toContain('/localized_items_batch');
    expect(source).toContain('PRODUCT_ITEM');
    expect(source).toContain('check_batch_request_status');
    expect(source).toContain("batch.status !== 'finished'");
    expect(source).toContain("sync_status: 'pending'");
    expect(source).toContain("sync_status: nextStatus");
  });

  it('stores RU bookkeeping on the Meta channel instead of creating duplicate base catalog items', () => {
    const source = read('lib/integrations/meta/catalog-localization-sync.ts');

    expect(source).toContain("from('service_channel_configs')");
    expect(source).toContain('editorial_overrides');
    expect(source).toContain("from('meta_catalog_items')");
    expect(source).not.toContain("insert({\n        service_id");
  });

  it('exposes separate ES and RU operational controls in the Admin catalog', () => {
    const page = read('app/(protected)/admin/marketing-hub/page.tsx');

    expect(page).toContain('Meta RU');
    expect(page).toContain('Preparar RU');
    expect(page).toContain('Sincronizar RU');
    expect(page).toContain('Comprobar RU');
    expect(page).toContain('Sincronizados RU');
  });
  it('requires the base ES product to be current before RU preparation or sync', () => {
    const source = read('lib/integrations/meta/catalog-localization-sync.ts');

    expect(source).toContain('hashMetaProductPayload');
    expect(source).toContain('buildMetaProductPayload');
    expect(source).toContain('last_payload_hash');
    expect(source).toContain('El producto base ES tiene cambios pendientes de sincronizar');
  });

  it('rechecks production_ready immediately before the external RU write', () => {
    const source = read('lib/integrations/meta/catalog-localization-sync.ts');

    expect(source).toContain('const productionReady = productionReadyRetailerIds()');
    expect(source).toContain('if (!productionReady.has(retailerId))');
  });

  it('recovers pending RU state that lost its Meta batch handle', () => {
    const source = read('lib/integrations/meta/catalog-localization-sync.ts');

    expect(source).toContain("state?.sync_status !== 'pending'");
    expect(source).toContain('if (!state.batch_handle)');
    expect(source).toContain("last_error_code: 'missing_batch_handle'");
    expect(source).toContain('ya puede reintentarse');
  });

  it('surfaces local bookkeeping failures as manual review', () => {
    const source = read('lib/integrations/meta/catalog-localization-sync.ts');

    expect(source).toContain('Promise<string | null>');
    expect(source).toContain("'local_bookkeeping_incomplete'");
    expect(source).toContain("sync_status: 'manual_review'");
  });

  it('preserves localization bookkeeping during publication review', () => {
    const orchestrator = read('lib/services/service-publication-orchestrator.ts');

    expect(orchestrator).toContain('existingOverridesByChannel');
    expect(orchestrator).toContain('...(existingOverridesByChannel.get(channel) ?? {})');
  });

  it('includes RU failures in the Admin error filter', () => {
    const page = read('app/(protected)/admin/marketing-hub/page.tsx');

    expect(page).toContain("draft.meta.ru?.syncStatus === 'failed'");
    expect(page).toContain("draft.meta.ru?.syncStatus === 'manual_review'");
  });

});
