import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const migration = source('supabase/migrations/20260924161500_rgpd_server_only_writes.sql');
const projects = source('app/api/rgpd/projects/route.ts');
const review = source('app/api/rgpd/projects/[id]/request-review/route.ts');

describe('RGPD server-only writes', () => {
  it('revokes direct authenticated writes while keeping read policy separate', () => {
    expect(migration).toContain('revoke insert, update, delete');
    expect(migration).toContain('from authenticated');
    expect(migration).toContain('drop policy if exists "rgpd projects insert own"');
    expect(migration).toContain('drop policy if exists "rgpd projects update own"');
    expect(migration).toContain('drop policy if exists "rgpd projects delete own"');
    expect(migration).not.toContain('drop policy if exists "rgpd projects select own"');
  });

  it('authenticates the user but performs project creation through server admin', () => {
    expect(projects).toContain('supabase.auth.getUser()');
    expect(projects).toContain('const admin = getSupabaseAdmin()');
    expect(projects).toContain("await admin\n    .from('rgpd_self_implementation_projects')");
  });

  it('allows review request only from a draft owned by the authenticated user', () => {
    expect(review).toContain('const admin = getSupabaseAdmin()');
    expect(review).toContain(".eq('user_id', user.id)");
    expect(review).toContain("project.status !== 'draft'");
    expect(review).toContain('project_not_draft');
  });
});
