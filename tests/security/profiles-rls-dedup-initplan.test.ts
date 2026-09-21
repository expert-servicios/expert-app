import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260921190000_profiles_rls_dedup_initplan.sql',
  ),
  'utf8',
);

describe('profiles RLS dedup/initplan migration', () => {
  it('drops only the two known duplicate user policies', () => {
    expect(migration).toContain(
      'drop policy if exists "user own profile" on public.profiles;',
    );
    expect(migration).toContain(
      'drop policy if exists "user update own profile" on public.profiles;',
    );

    expect(migration).not.toContain('Admins can manage all profiles');
    expect(migration).not.toContain('Admins can view all profiles');
    expect(migration).not.toContain('admin all profiles');
    expect(migration).not.toContain('tenant_admin select profiles');
  });

  it('preserves own-row semantics while using initPlan-friendly auth.uid()', () => {
    expect(migration).toContain(
      'alter policy "Users can view own profile"',
    );
    expect(migration).toContain(
      'alter policy "Users can update own profile"',
    );

    const wrappedUid = '(select auth.uid()) = id';
    expect(migration.split(wrappedUid).length - 1).toBe(3);
    expect(migration).toContain('with check ((select auth.uid()) = id)');
  });

  it('does not alter table grants, RLS enablement, or data', () => {
    expect(migration).not.toMatch(/\bgrant\b/i);
    expect(migration).not.toMatch(/\brevoke\b/i);
    expect(migration).not.toMatch(/enable\s+row\s+level\s+security/i);
    expect(migration).not.toMatch(/disable\s+row\s+level\s+security/i);
    expect(migration).not.toMatch(/\binsert\s+into\b/i);
    expect(migration).not.toMatch(/\bupdate\s+public\.profiles\b/i);
    expect(migration).not.toMatch(/\bdelete\s+from\b/i);
  });
});
