import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20260921170000_harden_legacy_rls_no_policy_acl.sql',
  'utf8',
);

const tables = [
  'faqs',
  'faq_submissions',
  'kia_feedback',
  'user_training_credits',
  'usuarios',
] as const;

describe('legacy RLS/no-policy ACL hardening', () => {
  it('revokes direct anon/authenticated privileges from each audited table', () => {
    for (const table of tables) {
      expect(migration).toContain(
        `revoke all privileges on table public.${table} from anon, authenticated;`,
      );
    }
  });

  it('does not alter RLS policies, service_role or table data', () => {
    expect(migration).not.toContain('drop policy');
    expect(migration).not.toContain('create policy');
    expect(migration).not.toContain('disable row level security');
    expect(migration).not.toContain('service_role');
    expect(migration).not.toMatch(/\b(insert|update|delete|truncate)\b/i);
  });
});
