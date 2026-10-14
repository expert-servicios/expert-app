import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { normalizeGoogleMeetingAttachments } from '../../lib/integrations/google-meeting-notes';

const FILE_ID = '1US-fsBrXD1cNK6VG2Zqu47l7X8cVmbR929poHWMA2Y0';
const EVENT_ID = '4292qev4ostl7qseu3r9lk5ct0';
const attachment = {
  fileId: FILE_ID,
  mimeType: 'application/vnd.google-apps.document',
  fileUrl: 'https://docs.google.com/document/d/' + FILE_ID + '/edit',
  title: 'Gemini meeting notes',
};

describe('KIA Google Meet note discovery', () => {
  it('returns a linked Docs file as a candidate pending review', () => {
    const [candidate] = normalizeGoogleMeetingAttachments(EVENT_ID, [attachment]);
    expect(candidate.reviewStatus).toBe('pending_review');
    expect(candidate.sourceKey).toContain(EVENT_ID);
    expect(candidate.sourceUrl).toContain(FILE_ID);
  });
  it('deduplicates and rejects arbitrary or hostile links', () => {
    const result = normalizeGoogleMeetingAttachments(EVENT_ID, [
      attachment,
      attachment,
      { ...attachment, fileUrl: 'https://evil.example/document/d/' + FILE_ID + '/edit' },
      { ...attachment, fileId: 'invalid' },
      { ...attachment, mimeType: 'application/pdf' },
    ]);
    expect(result).toHaveLength(1);
  });
  it('recognizes genuine Gemini Calendar links even without fileId or with tracking query', () => {
    const actual = normalizeGoogleMeetingAttachments(EVENT_ID, [{
      mimeType: 'application/vnd.google-apps.document',
      fileUrl: 'https://docs.google.com/document/d/' + FILE_ID + '/edit?usp=meet_tnfm_calendar',
      title: 'Notas de Gemini',
    }]);
    expect(actual).toHaveLength(1);
    expect(actual[0].fileId).toBe(FILE_ID);
  });
  it('does not accept cancelled or unbound arbitrary event ids in the route', () => {
    const route = readFileSync(resolve(process.cwd(), 'app/api/admin/kia/meeting-notes/discover/route.ts'), 'utf8');
    expect(route).toContain("['admin', 'owner']");
    expect(route).toContain(".eq('id', body.data.appointmentId)");
    expect(route).toContain("appointment.booking_provider !== 'google_native'");
    expect(route).toContain('appointment.appointment_end');
    expect(route).toContain('endedMs > Date.now()');
    expect(route).not.toMatch(/admin\.from\([^)]*\)\.(?:insert|upsert|update|delete)\(/);
    expect(route).toContain('writesPerformed: false');
  });
});
