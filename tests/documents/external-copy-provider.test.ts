import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('provider-neutral external document copies', () => {
  const provider = source('lib/documents/external-copy-provider.ts');
  const microsoft = source('lib/integrations/microsoft365.ts');
  const uploadRoute = source('app/api/cases/[id]/documents/route.ts');
  const listRoute = source('app/api/admin/cases/[id]/drive-files/route.ts');

  it('keeps Google as the default and Microsoft opt-in', () => {
    expect(provider).toContain("process.env.DOCUMENT_COPY_PROVIDER?.trim().toLowerCase() === 'ms365'");
    expect(provider).toContain(": 'google'");
    expect(provider).toContain("provider === 'ms365' ? 'ms365_drive' : 'google_drive'");
  });

  it('uses durable external mappings and unique external file names', () => {
    expect(provider).toContain('findExternalMapping');
    expect(provider).toContain('upsertExternalMapping');
    expect(provider).toContain("localEntity: 'documents'");
    expect(provider).toContain("externalEntity: 'file'");
    expect(provider).toContain('input.documentId');
    expect(provider).toContain('input.fileName');
  });

  it('preserves Supabase as canonical storage and Google legacy compatibility only', () => {
    expect(uploadRoute).toContain('Supabase Storage + documents remains the canonical record');
    expect(uploadRoute).toContain('syncDocumentExternalCopy');
    expect(uploadRoute).toContain("copyResult?.provider === 'google'");
    expect(uploadRoute).toContain('.update({ drive_file_id: copyResult.fileId })');
  });

  it('supports OneDrive or an explicit SharePoint drive using delegated Files.ReadWrite', () => {
    expect(microsoft).toContain("'Files.ReadWrite'");
    expect(microsoft).toContain('MS365_DOCUMENT_DRIVE_ID');
    expect(microsoft).toContain("'/me/drive'");
    expect(microsoft).toContain('MS365_DOCUMENTS_ROOT_FOLDER');
    expect(microsoft).toContain("method: 'PUT'");
    expect(microsoft).toContain('new Uint8Array(input.fileBuffer)');
  });

  it('keeps the existing Admin drive-files endpoint provider-aware', () => {
    expect(listRoute).toContain('getConfiguredDocumentCopyProvider');
    expect(listRoute).toContain('listExternalDocumentCopiesForClient');
    expect(listRoute).toContain('provider,');
  });
});
