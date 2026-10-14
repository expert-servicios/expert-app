/**
 * Google Meet note discovery: read-only Calendar metadata.
 *
 * Gemini does not guarantee a dedicated "smart notes ready" webhook. We must
 * obtain candidate attachments from an existing, authorized Calendar event.
 * A linked Google Doc is a CANDIDATE, not a confirmed transcript or a decision.
 */
export interface GoogleCalendarMeetingAttachment {
  fileId?: string | null;
  fileUrl?: string | null;
  mimeType?: string | null;
  title?: string | null;
}

export interface GoogleMeetingNotesCandidate {
  fileId: string;
  title: string;
  sourceUrl: string;
  sourceKey: string;
  reviewStatus: 'pending_review';
}

export interface MeetingNoteDiscoveryResult {
  eventId: string;
  meetUrl: string | null;
  endedAt: string | null;
  candidates: GoogleMeetingNotesCandidate[];
}

const DRIVE_DOC_MIME = 'application/vnd.google-apps.document';
const SAFE_FILE_ID = /^[a-zA-Z0-9_-]{15,128}$/;
const SAFE_EVENT_ID = /^[a-zA-Z0-9_-]{8,256}$/;

export function normalizeGoogleMeetingAttachments(
  eventId: string,
  attachments: readonly GoogleCalendarMeetingAttachment[],
): GoogleMeetingNotesCandidate[] {
  if (!SAFE_EVENT_ID.test(eventId)) throw new Error('invalid_calendar_event_id');
  const seen = new Set<string>();
  const candidates: GoogleMeetingNotesCandidate[] = [];

  for (const item of attachments.slice(0, 50)) {
    const directId = item.fileId?.trim() ?? '';
    if (item.mimeType !== DRIVE_DOC_MIME) continue;

    // A Calendar attachment does not prove the doc contains Gemini notes.
    // We do not read, classify or act on its contents here.
    let url: URL;
    try {
      url = new URL(item.fileUrl ?? '');
    } catch {
      continue;
    }
    const match = url.pathname.match(/^\/document\/d\/([a-zA-Z0-9_-]{15,128})\/edit$/);
    if (url.protocol !== 'https:' || url.hostname !== 'docs.google.com' || !match) continue;
    const fileId = match[1];
    if (!SAFE_FILE_ID.test(fileId) || (directId && directId !== fileId) || seen.has(fileId)) continue;

    seen.add(fileId);
    candidates.push({
      fileId,
      title: String(item.title || 'Documento vinculado a reunión').slice(0, 160),
      sourceUrl: url.origin + url.pathname,
      sourceKey: ['google-calendar-attachment', eventId, fileId].join(':'),
      reviewStatus: 'pending_review',
    });
    if (candidates.length >= 12) break;
  }
  return candidates;
}

export async function discoverCalendarMeetingNoteCandidates(
  eventId: string,
): Promise<MeetingNoteDiscoveryResult> {
  if (!SAFE_EVENT_ID.test(eventId)) throw new Error('invalid_calendar_event_id');
  const email = process.env.GOOGLE_GMAIL_SA_EMAIL;
  const key = process.env.GOOGLE_GMAIL_SA_PRIVATE_KEY;
  if (!email || !key) throw new Error('google_calendar_service_account_unavailable');

  // Use existing Calendar delegation. No new scopes, credentials or Drive
  // document content access is needed for this first-stage discovery.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { google } = (await import('googleapis')) as any;
  const auth = new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
    subject: 'info@expertconsulting.es',
  });
  const calendar = google.calendar({ version: 'v3', auth });
  const { data } = await calendar.events.get({
    calendarId: 'primary',
    eventId,
    fields: 'id,status,hangoutLink,end,attachments(fileId,fileUrl,mimeType,title)',
  });
  if (data.status !== 'confirmed' || data.id !== eventId) {
    throw new Error('calendar_event_unavailable');
  }

  return {
    eventId,
    meetUrl: data.hangoutLink ?? null,
    endedAt: data.end?.dateTime ?? null,
    candidates: normalizeGoogleMeetingAttachments(eventId, data.attachments ?? []),
  };
}
