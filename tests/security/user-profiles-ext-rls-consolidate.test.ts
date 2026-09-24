import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20260924190000_user_profiles_ext_rls_consolidate.sql',
  'utf8',
);

describe('user_profiles_ext RLS consolidation', () => {
  it('removes all eight overlapping legacy policies', () => {
    for (const name of [
      'Admins can delete all profiles',
      'Users can delete own profile',
      'Admins can insert profiles',
      'Users can insert own profile',
      'Admins can view all profiles',
      'Users can view own profile',
      'Admins can update all profiles',
      'Users can update own profile',
    ]) {
      expect(migration).toContain(
        `drop policy if exists "${name}" on public.user_profiles_ext;`,
      );
    }
  });

  it('creates exactly one authenticated policy per CRUD command', () => {
    expect((migration.match(/create policy /g) ?? []).length).toBe(4);
    expect(migration).toContain('for select\n  to authenticated');
    expect(migration).toContain('for insert\n  to authenticated');
    expect(migration).toContain('for update\n  to authenticated');
    expect(migration).toContain('for delete\n  to authenticated');
  });

  it('preserves admin-or-own-row semantics', () => {
    expect(migration).toContain('is_admin_user()');
    expect(migration).toContain('((select auth.uid()) = id)');

    const updateStart = migration.indexOf(
      'create policy "user_profiles_ext authenticated update"',
    );
    const deleteStart = migration.indexOf(
      'create policy "user_profiles_ext authenticated delete"',
    );
    const updateBlock = migration.slice(updateStart, deleteStart);

    expect(updateBlock).toContain('with check');
    expect(
      (updateBlock.match(/\(\(select auth\.uid\(\)\) = id\)/g) ?? []).length,
    ).toBe(2);
  });

  it('does not alter grants, functions, schema, or data', () => {
    expect(migration).not.toMatch(/\bgrant\b/i);
    expect(migration).not.toMatch(/\brevoke\b/i);
    expect(migration).not.toMatch(/\balter\s+table\b/i);
    expect(migration).not.toMatch(/create\s+(or\s+replace\s+)?function/i);
    expect(migration).not.toMatch(/\binsert\s+into\b/i);
    expect(migration).not.toMatch(/\bupdate\s+public\.user_profiles_ext\b/i);
    expect(migration).not.toMatch(/\bdelete\s+from\b/i);
    expect(migration).not.toMatch(/\bto\s+public\b/i);
    expect(migration).not.toMatch(/\bto\s+anon\b/i);
  });
});
