import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('document mirror providers', () => {
  const mirror = read('lib/documents/document-mirror.ts');
  const microsoft = read('lib/integrations/microsoft365.ts');
  const google = read('lib/integrations/google-drive.ts');
  const route = read('app/api/cases/[id]/documents/route.ts');
  const env = read('.env.example');

  it('keeps Google as the default and Supabase as canonical storage', () => {
    expect(mirror).toContain("return 'google'");
    expect(mirror).toContain("DOCUMENT_MIRROR_PROVIDER");
    expect(route).toContain('Supabase Storage + documents remains');
    expect(route).toContain('syncDocumentToMirror');
    expect(google).toContain('syncDocumentToDrive');
  });

  it('uses provider-aware external ids without rewriting historical rows', () => {
    expect(mirror).toContain("storageId: `google:${result.fileId}`");
    expect(mirror).toContain("storageId: `ms365:${result.fileId}`");
    expect(route).toContain('.update({ drive_file_id: mirrorResult.storageId })');
  });

  it('adds least-privilege delegated Microsoft files access', () => {
    expect(microsoft).toContain("'Files.ReadWrite'");
    expect(microsoft).not.toContain("'Sites.ReadWrite.All'");
    expect(microsoft).toContain("MS365_SHAREPOINT_DRIVE_ID");
    expect(mirror).toContain("MS365_FILES_ROOT_FOLDER_ID");
    expect(env).toContain('DOCUMENT_MIRROR_PROVIDER=google');
    expect(env).toContain('MS365_FILES_TARGET=onedrive');
    expect(env).toContain('MS365_SHAREPOINT_DRIVE_ID=');
  });

  it('supports OneDrive and explicit SharePoint drives through the same folder flow', () => {
    expect(microsoft).toContain("return 'https://graph.microsoft.com/v1.0/me/drive'");
    expect(microsoft).toContain("https://graph.microsoft.com/v1.0/drives/");
    expect(microsoft).toContain('findOrCreateMs365Folder');
    expect(microsoft).toContain('syncDocumentToMs365Files');
    expect(microsoft).toContain("'@microsoft.graph.conflictBehavior': 'fail'");
    expect(microsoft).toContain("'@odata.nextLink'");
    expect(microsoft).toContain('pagination safety limit');
    expect(microsoft).toContain('conflictBehavior=rename');
  });

  it('keeps the external mirror non-blocking for case uploads', () => {
    expect(route).toContain("console.error('[Document mirror]'");
    expect(route).toContain('void (async () => {');
    expect(route.indexOf(".from('documents')\n      .insert")).toBeLessThan(
      route.indexOf('await syncDocumentToMirror({')
    );
  });
});
