import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('operational Meta catalog sync', () => {
  it('keeps preparation limited to production-ready services and requires an explicit admin confirmation', () => {
    const source = read('lib/integrations/meta/catalog-sync.ts');
    const route = read('app/api/admin/meta/catalog/[retailerId]/prepare/route.ts');

    expect(source).toContain("entry.stage === 'production_ready'");
    expect(source).toContain('prepareMetaCatalogRetailer');
    expect(route).toContain("confirm: z.literal('prepare_meta_catalog_item')");
  });

  it('separates Meta publication from Stripe checkout reconciliation', () => {
    const source = read('lib/integrations/meta/catalog-sync.ts');

    expect(source).not.toContain('stripe_price_bindings');
    expect(source).toContain('Oferta canónica activa no encontrada');
    expect(source).toContain('draft.offerId !== canonicalOffer.id');
  });

  it('preflights every selected service before any external write', () => {
    const source = read('lib/integrations/meta/catalog-sync.ts');
    const prepareAll = source.indexOf('const prepared: PreparedItem[] = staged.map');
    const claim = source.indexOf("sync_status: 'pending'", prepareAll);
    const graph = source.indexOf('metaGraphRequest<{ id?: string }>', prepareAll);

    expect(prepareAll).toBeGreaterThan(-1);
    expect(claim).toBeGreaterThan(prepareAll);
    expect(graph).toBeGreaterThan(claim);
    expect(source).toContain('staged.length !== requestedRetailerIds.length');
  });

  it('caps selected external sync batches and deduplicates ids', () => {
    const source = read('lib/integrations/meta/catalog-sync.ts');

    expect(source).toContain('MAX_META_CATALOG_SYNC_BATCH = 25');
    expect(source).toContain('Array.from(new Set(');
  });

  it('requires explicit confirmation for selected-service writes', () => {
    const route = read('app/api/admin/meta/catalog/sync/route.ts');

    expect(route).toContain("confirm: z.literal('sync_meta_catalog_items')");
    expect(route).toContain('.min(1).max(25)');
  });

  it('keeps save and publish as separate user actions in the Admin UI', () => {
    const page = read('app/(protected)/admin/marketing-hub/page.tsx');

    expect(page).toContain('Preparar cambios');
    expect(page).toContain('Preparar ES (');
    expect(page).toContain('Sincronizar ES (');
    expect(page).toContain('Preparar RU');
    expect(page).toContain('Sincronizar RU');
    expect(page).toContain('window.confirm');
    expect(page).toContain('Bloqueado');
  });
});
