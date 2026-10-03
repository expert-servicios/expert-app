import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Admin Meta Catalog Manager', () => {
  it('exposes real Meta sync metadata and ES/RU content state', () => {
    const route = read('app/api/admin/meta/catalog/route.ts');

    expect(route).toContain('meta_item_id');
    expect(route).toContain('last_synced_at');
    expect(route).toContain("in('locale', ['es', 'ru'])");
    expect(route).toContain('syncedCount');
    expect(route).toContain('complete: initialBatchSyncedCount');
  });

  it('keeps catalog operations compact and separates readiness from sync state', () => {
    const page = read('app/(protected)/admin/marketing-hub/page.tsx');

    expect(page).toContain("type Panel = 'catalog' | 'readiness' | 'settings'");
    expect(page).toContain('Catálogo Meta');
    expect(page).toContain('Sincronizados ES');
    expect(page).toContain('RU pendientes');
    expect(page).toContain('MetaStatusBadge');
    expect(page).toContain('metaItemId');
    expect(page).toContain('lastSyncedAt');
  });

  it('renders ES/RU chips and clickable image previews', () => {
    const page = read('app/(protected)/admin/marketing-hub/page.tsx');

    expect(page).toContain('<LocaleChip locale="ES"');
    expect(page).toContain('<LocaleChip locale="RU"');
    expect(page).toContain('setImagePreview');
    expect(page).toContain('Vista previa de imagen');
    expect(page).toContain('next/image');
  });

  it('supports operational filters including missing Russian content', () => {
    const page = read('app/(protected)/admin/marketing-hub/page.tsx');

    expect(page).toContain("'missing-ru'");
    expect(page).toContain('Falta RU');
    expect(page).toContain('draft.locales.ru.exists');
  });
});
