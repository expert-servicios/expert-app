import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260919073400_tenant_admin_readonly_cases_documents.sql'),
  'utf8',
);

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('tenant_admin cases/documents read-only hardening', () => {
  it('drops stale FOR ALL policies and recreates SELECT-only policies', () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "tenant_admin all cases"');
    expect(migration).toContain('DROP POLICY IF EXISTS "tenant_admin all documents"');
    expect(migration).toContain('CREATE POLICY "tenant_admin select cases"');
    expect(migration).toContain('CREATE POLICY "tenant_admin select documents"');
    expect(migration.match(/FOR SELECT/g)?.length).toBe(2);
    expect(migration).not.toMatch(/CREATE POLICY[\s\S]*FOR ALL/);
  });

  it('preserves the client upload trust boundary', () => {
    const uploadRoute = source('app/api/cases/[id]/documents/route.ts');
    expect(uploadRoute).toContain("getSupabaseAdmin");
    expect(uploadRoute).toContain(".from('documents')");
  });

  it('does not revoke authenticated INSERT on documents', () => {
    expect(migration).not.toContain('REVOKE INSERT');
    expect(migration).toContain('client insert own documents');
  });
});
