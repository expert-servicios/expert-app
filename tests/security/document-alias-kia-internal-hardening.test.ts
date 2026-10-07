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

  it('hides internal documents at RLS and route boundaries', () => {
    const migration = source('supabase/migrations/20261007105246_hide_internal_documents_from_clients.sql');
    const caseRoute = source('app/api/cases/[id]/documents/route.ts');
    const downloadRoute = source('app/api/documents/[id]/download/route.ts');

    expect(migration).toContain('kind <> \'internal\'');
    expect(migration).toContain('to authenticated');
    expect(caseRoute).toContain(".neq('kind', 'internal')");
    expect(downloadRoute).toContain("doc.kind === 'internal'");
    expect(downloadRoute).toContain("select('id, file_path, original_name, client_id, case_id, kind')");
  });

  it('provisions the canonical private bucket with application-compatible limits', () => {
    const migration = source('supabase/migrations/20261007105433_provision_client_documents_bucket.sql');

    expect(migration).toContain("'client-documents'");
    expect(migration).toContain('20971520');
    expect(migration).toContain('public = false');
    expect(migration).toContain("'image/webp'");
    expect(migration).toContain("'image/heic'");
    expect(migration).toContain("'text/csv'");
    expect(migration).toContain('on conflict (id) do update');
  });

  it('aligns tenant uploads with the canonical document contract', () => {
    const route = source('app/api/tenant/cases/[id]/documents/route.ts');

    expect(route).toContain('TENANT_DOCUMENT_MAX_BYTES');
    expect(route).toContain('validateClientDocumentFile');
    expect(route).toContain("owner_type: 'case'");
    expect(route).toContain('owner_id: caseId');
    expect(route).toContain("kind: 'client_document'");
    expect(route).toContain('company_id: caseData.company_id ?? null');
    expect(route).toContain('mime_type: validation.contentType');
    expect(route).toContain("storage.from('client-documents').remove([uploadData.path])");
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
