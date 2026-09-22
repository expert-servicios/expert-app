import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20260922103000_training_orders_rls_consolidate.sql',
  'utf8',
);

describe('training_orders RLS consolidation', () => {
  it('removes the four overlapping legacy policies', () => {
    for (const name of [
      'Admins full access',
      'Users can insert own training orders',
      'Users can update own training orders',
      'Users can view own training orders',
    ]) {
      expect(migration).toContain(
        `drop policy if exists "${name}" on public.training_orders;`,
      );
    }
  });

  it('creates one authenticated policy per CRUD command', () => {
    expect((migration.match(/create policy /g) ?? []).length).toBe(4);
    expect(migration).toContain('for select\n  to authenticated');
    expect(migration).toContain('for insert\n  to authenticated');
    expect(migration).toContain('for update\n  to authenticated');
    expect(migration).toContain('for delete\n  to authenticated');
  });

  it('preserves admin and own-row semantics', () => {
    expect(migration).toContain('is_admin_email()');
    expect(migration).toContain('((select auth.uid()) = user_id)');

    const updateStart = migration.indexOf(
      'create policy "training_orders authenticated update"',
    );
    const deleteStart = migration.indexOf(
      'create policy "training_orders admin delete"',
    );
    const updateBlock = migration.slice(updateStart, deleteStart);

    expect(updateBlock).toContain('with check');
    expect(
      (updateBlock.match(/\(\(select auth\.uid\(\)\) = user_id\)/g) ?? []).length,
    ).toBe(2);
  });

  it('does not grant user deletes or change schema/data', () => {
    const deleteStart = migration.indexOf(
      'create policy "training_orders admin delete"',
    );
    const deleteBlock = migration.slice(deleteStart);

    expect(deleteBlock).not.toContain('auth.uid()');
    expect(migration).not.toMatch(/\bgrant\b/i);
    expect(migration).not.toMatch(/\brevoke\b/i);
    expect(migration).not.toMatch(/\balter\s+table\b/i);
    expect(migration).not.toMatch(/\binsert\s+into\b/i);
    expect(migration).not.toMatch(/\bupdate\s+public\.training_orders\b/i);
    expect(migration).not.toMatch(/\bdelete\s+from\b/i);
    expect(migration).not.toMatch(/\bto\s+public\b/i);
    expect(migration).not.toMatch(/\bto\s+anon\b/i);
  });
});
