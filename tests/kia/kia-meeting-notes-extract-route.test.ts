import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'app/api/admin/kia/meeting-notes/extract/route.ts'), 'utf8');

describe('KIA Gemini notes: authorized read-only export', () => {
  it('checks staff role, company and a finished canonical Google appointment', () => {
    expect(source).toContain("requireActiveActor(request, ['admin', 'owner'])");
    expect(source).toContain("appointment.booking_provider !== 'google_native'");
    expect(source).toContain("end > Date.now()");
    expect(source).toContain("subject.company_id !== company.id");
  });
  it('checks exact file attachment membership before accessing Google Drive', () => {
    expect(source).toContain("discovery.candidates.find((item) => item.fileId === parsed.data.fileId)");
    expect(source).toContain("if (!candidate) return reply");
    expect(source).toContain("scopes: ['https://www.googleapis.com/auth/drive.readonly']");
  });
  it('exports only Google Docs and never writes to external systems', () => {
    expect(source).toContain("file.data.mimeType !== 'application/vnd.google-apps.document'");
    expect(source).toContain("mimeType: 'text/plain'");
    expect(source).toContain("authorityDecisions: []");
    expect(source).toContain('writesPerformed: false');
    expect(source).not.toMatch(/admin\.from\([^)]*\)\.(?:insert|upsert|update|delete)\(/);
    expect(source).not.toContain('sendEmail(');
  });
});