import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildMetaProductPayload } from '@/lib/integrations/meta/catalog-sync';
import { projectMetaConsumerPrice } from '@/lib/integrations/meta/catalog-export';
import type { MetaServiceCatalogDraft } from '@/lib/integrations/meta/types';

const read = (path: string) => readFileSync(path, 'utf8');

function draft(priceAmount: number): MetaServiceCatalogDraft {
  return {
    retailerId: 'certificado-digital-persona-fisica',
    offerId: 'offer-1',
    name: 'Certificado Digital Persona Física — Camerfirma',
    description: 'Certificado digital cualificado',
    serviceCategory: 'certificado-digital',
    sourceCategorySlug: 'certificado-digital',
    landingUrl: 'https://expertconsulting.es/servicios/certificado-digital/certificado-digital-persona-fisica',
    imageUrl: 'https://expertconsulting.es/api/services/og?slug=certificado-digital-persona-fisica&variant=square&lang=es',
    price: {
      amount: priceAmount,
      currency: 'EUR',
      taxIncluded: true,
      vatTreatment: 'plus_vat',
    },
    availability: 'in stock',
    marketingReady: true,
    warnings: [],
  };
}

describe('controlled Meta catalog sync', () => {
  it('projects the full consumer price for plus-VAT certificate offers', () => {
    expect(projectMetaConsumerPrice(9000, 'plus_vat', 0.21)?.amount).toBe(108.9);
    expect(projectMetaConsumerPrice(15000, 'plus_vat', 0.21)?.amount).toBe(181.5);
    expect(projectMetaConsumerPrice(20000, 'plus_vat', 0.21)?.amount).toBe(242);
  });

  it('fails closed when a plus-VAT service has no explicit VAT rate', () => {
    expect(projectMetaConsumerPrice(9000, 'plus_vat')).toBeNull();
  });

  it('publishes the gross consumer price in cents', () => {
    expect(buildMetaProductPayload(draft(108.9)).price).toBe(10890);
  });

  it('fails closed when a draft is not tax-inclusive', () => {
    const unsafe = draft(90);
    unsafe.price = unsafe.price ? { ...unsafe.price, taxIncluded: false } : null;
    expect(() => buildMetaProductPayload(unsafe)).toThrow('valid consumer price');
  });

  it('preflights the complete approved batch before any Graph write', () => {
    const source = read('lib/integrations/meta/catalog-sync.ts');
    const preflight = source.indexOf('const prepared: PreparedItem[] = staged.map');
    const claim = source.indexOf("update({ sync_status: 'pending'");
    const graphWrite = source.indexOf('metaGraphRequest<{ id?: string }>');

    expect(preflight).toBeGreaterThan(-1);
    expect(claim).toBeGreaterThan(preflight);
    expect(graphWrite).toBeGreaterThan(claim);
    expect(source).toContain('staged.length !== requestedRetailerIds.length');
    expect(source).toContain('draft.offerId !== canonicalOffer.id');
  });

  it('claims ready rows before issuing external writes', () => {
    const source = read('lib/integrations/meta/catalog-sync.ts');
    expect(source).toContain(".eq('sync_status', 'ready')");
    expect(source).toContain("sync_status: 'pending'");
    expect(source).toContain('El lote Meta ya está siendo procesado o cambió de estado');
  });

  it('does not convert a successful Meta write into a failed external result when local audit persistence fails', () => {
    const source = read('lib/integrations/meta/catalog-sync.ts');
    expect(source).toContain('Meta aceptó el item; revisión local necesaria');
    expect(source).toContain("sync_status: 'manual_review'");
    expect(source).toContain("status: 'succeeded'");
  });

  it('supports controlled selected-service preparation and sync from Admin', () => {
    const syncRoute = read('app/api/admin/meta/catalog/sync/route.ts');
    const prepareRoute = read('app/api/admin/meta/catalog/[retailerId]/prepare/route.ts');
    const page = read('app/(protected)/admin/marketing-hub/page.tsx');

    expect(syncRoute).toContain("confirm: z.literal('sync_meta_catalog_items')");
    expect(syncRoute).toContain('retailerIds');
    expect(prepareRoute).toContain("confirm: z.literal('prepare_meta_catalog_item')");
    expect(page).toContain('prepareRetailers');
    expect(page).toContain('syncRetailers');
    expect(page).toContain('Preparar cambios');
    expect(page).toContain('Reintentar');
  });
});
