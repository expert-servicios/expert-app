import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'app/api/admin/kia/meeting-notes/review/route.ts'), 'utf8');

describe('KIA meeting notes: admin preview boundary', () => {
  it('authenticates admin before parsing meeting data', () => {
    expect(source.indexOf('requireActiveActor(request')).toBeLessThan(source.indexOf('request.text()'));
    expect(source).toContain("['admin', 'owner']");
  });

  it('accepts no client-provided permissions, approvals or evidence', () => {
    expect(source).toContain('}).strict()');
    expect(source).toContain('authorityDecisions: []');
    expect(source).toContain('verified: false');
    expect(source).not.toContain('body.data.authorityDecisions');
  });

  it('requires canonical subject to be bound to the exact company', () => {
    expect(source).toContain("subject.company_id !== company.id");
    expect(source).toContain('subject.merged_into_subject_id');
  });

  it('never mutates, creates tasks or sends emails from the preview', () => {
    expect(source).not.toMatch(/admin\.from\([^)]*\)\.(?:insert|upsert|update|delete)\(/);
    expect(source).not.toContain('sendEmail(');
    expect(source).toContain('writesPerformed: false');
    expect(source).toContain('previewOnly: true');
  });

  it('supports bounded claims, the private response, and Google Drive notes', () => {
    expect(source).toContain('.max(40)');
    expect(source).toContain("'Cache-Control': 'private, no-store'");
    expect(source).toContain("'docs.google.com'");
    expect(source).toContain("'drive.google.com'");
  });
});
