import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20260921203000_profiles_rls_consolidate.sql',
  'utf8',
);

describe('profiles RLS consolidation', () => {
  it('removes the six overlapping legacy policies', () => {
    const legacyPolicies = [
      'Admins can manage all profiles',
      'Admins can view all profiles',
      'Users can update own profile',
      'Users can view own profile',
      'admin all profiles',
      'tenant_admin select profiles',
    ];

    for (const name of legacyPolicies) {
      expect(migration).toContain(
        `drop policy if exists "${name}" on public.profiles;`,
      );
    }
  });

  it('creates exactly one authenticated policy per CRUD command', () => {
    expect(migration).toContain('create policy "profiles authenticated select"');
    expect(migration).toContain('for select\n  to authenticated');
    expect(migration).toContain('create policy "profiles authenticated update"');
    expect(migration).toContain('for update\n  to authenticated');
    expect(migration).toContain('create policy "profiles admin insert"');
    expect(migration).toContain('for insert\n  to authenticated');
    expect(migration).toContain('create policy "profiles admin delete"');
    expect(migration).toContain('for delete\n  to authenticated');

    expect((migration.match(/create policy /g) ?? []).length).toBe(4);
  });

  it('preserves the current authorization union', () => {
    expect(migration).toContain('is_admin()');
    expect(migration).toContain('is_admin_email()');
    expect(migration).toContain('((select auth.uid()) = id)');
    expect(migration).toContain(
      '(is_tenant_admin() and tenant_id = auth_tenant_id())',
    );

    const updateStart = migration.indexOf(
      'create policy "profiles authenticated update"',
    );
    const insertStart = migration.indexOf('create policy "profiles admin insert"');
    const updateBlock = migration.slice(updateStart, insertStart);

    expect(updateBlock).toContain('with check');
    expect((updateBlock.match(/\(\(select auth\.uid\(\)\) = id\)/g) ?? []).length).toBe(2);
  });

  it('does not change grants, RLS enablement, functions, or rows', () => {
    expect(migration).not.toMatch(/\bgrant\b/i);
    expect(migration).not.toMatch(/\brevoke\b/i);
    expect(migration).not.toMatch(/enable\s+row\s+level\s+security/i);
    expect(migration).not.toMatch(/disable\s+row\s+level\s+security/i);
    expect(migration).not.toMatch(/create\s+(or\s+replace\s+)?function/i);
    expect(migration).not.toMatch(/\binsert\s+into\b/i);
    expect(migration).not.toMatch(/\bupdate\s+public\.profiles\b/i);
    expect(migration).not.toMatch(/\bdelete\s+from\b/i);
  });

  it('does not create policies for public or anon', () => {
    expect(migration).not.toMatch(/\bto\s+public\b/i);
    expect(migration).not.toMatch(/\bto\s+anon\b/i);
  });
});
