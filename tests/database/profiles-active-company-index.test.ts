import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20260921212000_index_profiles_active_company.sql',
  'utf8',
);

describe('profiles active_company_id index', () => {
  it('creates exactly the intended covering index', () => {
    expect(migration).toContain(
      'create index if not exists profiles_active_company_id_idx',
    );
    expect(migration).toContain(
      'on public.profiles(active_company_id);',
    );
    expect((migration.match(/create index/gi) ?? []).length).toBe(1);
  });

  it('does not modify data, constraints, RLS, or grants', () => {
    expect(migration).not.toMatch(/\bgrant\b/i);
    expect(migration).not.toMatch(/\brevoke\b/i);
    expect(migration).not.toMatch(/\balter\s+table\b/i);
    expect(migration).not.toMatch(/\binsert\s+into\b/i);
    expect(migration).not.toMatch(/\bupdate\s+public\.profiles\b/i);
    expect(migration).not.toMatch(/\bdelete\s+from\b/i);
    expect(migration).not.toMatch(/policy/i);
  });
});
