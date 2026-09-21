import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Meta catalog C2 backfill script', () => {
  it('defaults to a dry run and only writes when --apply is passed', () => {
    const script = read('scripts/backfill-meta-catalog-c2.ts');
    expect(script).toContain("process.argv.includes('--apply')");
    expect(script).toContain('if (!APPLY || !admin) continue;');
  });

  it('only upserts the C2 tables, never deletes or retires a row', () => {
    const script = read('scripts/backfill-meta-catalog-c2.ts');
    expect(script).toContain(".from('catalog_services')");
    expect(script).toContain(".from('service_contents')");
    expect(script).toContain(".from('commercial_offers')");
    expect(script).not.toContain('.delete(');
    expect(script).not.toContain('.update(');
  });

  it('keeps the read-only Meta catalog preview API admin-gated and read-only', () => {
    const route = read('app/api/admin/meta/catalog/route.ts');
    expect(route).toContain('requireAdmin');
    expect(route).toContain('buildMetaCatalogDrafts');
    expect(route).not.toContain('.insert(');
    expect(route).not.toContain('.update(');
    expect(route).not.toContain('.delete(');
  });
});
