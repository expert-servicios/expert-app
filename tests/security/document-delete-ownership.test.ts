import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('document delete ownership boundary', () => {
  it('allows clients to delete only documents they uploaded themselves', () => {
    const route = source('app/api/documents/[id]/route.ts');

    expect(route).toContain("select('id, file_path, client_id, uploaded_by_role, created_at')");
    expect(route).toContain("doc.client_id !== user.id");
    expect(route).toContain("doc.uploaded_by_role !== 'client'");
    expect(route).toContain("roleFlagReliable");
    expect(route).toContain("2026-06-07T00:00:00.000Z");
    expect(route).toContain("document_delete_managed_forbidden");
  });

  it('keeps admin and owner deletion available for managed cleanup', () => {
    const route = source('app/api/documents/[id]/route.ts');

    expect(route).toContain("profile?.role === 'admin' || profile?.role === 'owner'");
    expect(route).toContain('if (!isAdmin) {');
  });
});
