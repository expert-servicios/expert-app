import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const route = readFileSync('app/api/admin/leads/[id]/timeline/route.ts', 'utf8');
const page = readFileSync('app/(protected)/admin/leads/[id]/timeline/page.tsx', 'utf8');
describe('Lead timeline explicit attribution', () => {
  it('requires an admin and validates the requested lead id', () => {
    expect(route).toContain('requireAdminClient(request)');
    expect(route).toContain('uuid.safeParse');
    expect(route).toContain('.eq(\'id\', leadId)');
  });
  it('loads only relations with direct lead ids and bounded source queries', () => {
    expect((route.match(/\.eq\('lead_id', leadId\)/g) ?? []).length).toBe(4);
    expect(route).toContain("from('kia_conversations')");
    expect(route).toContain("from('internal_tasks')");
    expect(route).toContain("from('next_best_actions')");
    expect(route).toContain("from('quotes')");
    expect(route).toContain("Cache-Control': 'no-store'");
    expect(route).not.toContain('.ilike(');
    expect(route).not.toContain('auth.admin.createUser');
  });
  it('provides source traceability and explicit loading/error/partial states', () => {
    expect(page).toContain('event.source');
    expect(page).toContain('role="alert"');
    expect(page).toContain('role="status"');
    expect(page).toContain('Object.values(data.limited).some(Boolean)');
    expect(readFileSync('app/(protected)/admin/directorio/page.tsx','utf8')).toContain('/timeline');
    expect(readFileSync('app/(protected)/admin/leads/page.tsx','utf8')).toContain('Ver historial verificado');
  });
});
