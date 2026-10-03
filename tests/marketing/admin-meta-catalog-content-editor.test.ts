import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Admin Meta Catalog content editor', () => {
  it('writes ES/RU content only through canonical service_contents', () => {
    const route = read('app/api/admin/meta/catalog/[retailerId]/content/route.ts');

    expect(route).toContain(".from('service_contents')");
    expect(route).toContain("z.enum(['es', 'ru'])");
    expect(route).toContain("onConflict: 'service_id,locale'");
    expect(route).not.toContain('meta_catalog_items');
  });

  it('provides the full editorial fields required by the catalog workflow', () => {
    const editor = read('components/admin/MetaCatalogContentEditor.tsx');

    for (const field of [
      'shortDescription',
      'description',
      'metaTitle',
      'metaDescription',
      'landingPath',
      'imageUrl',
      'status',
    ]) {
      expect(editor).toContain(field);
    }

    expect(editor).toContain("(['es', 'ru'] as const)");
    expect(editor).toContain('Nuevo borrador RU');
  });

  it('marks synchronized ES content as stale from the canonical Meta payload hash', () => {
    const page = read('app/(protected)/admin/marketing-hub/page.tsx');
    const route = read('app/api/admin/meta/catalog/route.ts');

    expect(route).toContain('last_payload_hash');
    expect(route).toContain('hashMetaProductPayload');
    expect(route).toContain('currentPayloadHash !== meta.es.last_payload_hash');
    expect(page).toContain('Cambios pendientes');
    expect(page).toContain('draft.meta.es?.isStale');
  });

  it('opens editing from the compact catalog row', () => {
    const page = read('app/(protected)/admin/marketing-hub/page.tsx');

    expect(page).toContain('setEditingRetailerId');
    expect(page).toContain('MetaCatalogContentEditor');
    expect(page).toContain('Editar contenido, idiomas e imagen');
  });
});
