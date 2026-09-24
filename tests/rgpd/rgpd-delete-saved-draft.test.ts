import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const route = source('app/api/rgpd/projects/[id]/route.ts');
const ui = source('components/tools/RgpdAccountSave.tsx');

describe('RGPD saved draft deletion', () => {
  it('requires authentication and exact ownership', () => {
    expect(route).toContain('supabase.auth.getUser()');
    expect(route).toContain('const admin = getSupabaseAdmin()');
    expect(route).toContain(".eq('user_id', user.id)");
    expect(route).toContain(".eq('id', id)");
  });

  it('allows self-service deletion only while the snapshot is draft', () => {
    expect(route).toContain("existing.status !== 'draft'");
    expect(route).toContain('project_locked_for_professional_traceability');
    expect(route).toContain(".eq('status', 'draft')");
  });

  it('requires explicit confirmation and preserves the local workspace', () => {
    expect(ui).toContain('window.confirm');
    expect(ui).toContain('Tu copia local no se borrará');
    expect(ui).toContain("project.status === 'draft'");
  });
});
