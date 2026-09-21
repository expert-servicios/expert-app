import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20260921164500_harden_tenant_integration_secrets_acl.sql',
  'utf8',
);

describe('tenant integration secret ACL hardening', () => {
  it('revokes direct API-role privileges while preserving the server-side model', () => {
    expect(migration).toContain(
      'revoke all privileges on table public.tenant_integration_secrets from anon, authenticated;',
    );
    expect(migration).not.toContain('drop policy');
    expect(migration).not.toContain('disable row level security');
  });
});
