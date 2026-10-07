import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('document alias and KIA internal-document hardening', () => {
  it('revokes direct authenticated inserts into documents', () => {
    const migration = source('supabase/migrations/20261007104950_revoke_client_documents_insert.sql');

    expect(migration).toContain('drop policy if exists "client insert own documents" on public.documents');
    expect(migration).toContain('revoke insert on table public.documents from authenticated');
    expect(migration).toContain('revoke insert on table public.documents from anon');
  });

  it('keeps client uploads behind the validated server-side route', () => {
    const route = source('app/api/cases/[id]/documents/route.ts');

    expect(route).toContain('getSupabaseAdmin');
    expect(route).toContain("owner_type: 'case'");
    expect(route).toContain("kind: 'client_document'");
    expect(route).toContain('.insert({');
  });

  it('excludes internal documents from KIA context and client-facing tools', () => {
    const context = source('lib/ai/kia/kia-context-builder.ts');
    const tools = source('lib/ai/kia/kia-tool-executor.ts');

    expect(context).toContain(".neq('kind', 'internal')");
    expect((tools.match(/\.neq\('kind', 'internal'\)/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect(tools).toContain("case 'get_user_pending_docs':");
    expect(tools).toContain("case 'get_case_documents':");
    expect(tools).toContain("case 'get_case_timeline':");
  });
});
