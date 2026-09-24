/**
 * Google Calendar OAuth2 + API helper.
 * Requires `googleapis` package: npm install googleapis
 * Requires env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_APP_URL
 */

// Dynamic import so the module doesn't crash at build time if googleapis isn't installed yet.
// Once googleapis is installed, these functions work normally.

import { absoluteAppUrl } from '@/lib/utils/app-url';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

const CALENDAR_SA_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
];

const MEET_SA_SCOPES = [
  'https://www.googleapis.com/auth/meetings.space.settings',
  'https://www.googleapis.com/auth/meetings.space.readonly',
];
const CALENDAR_SA_IMPERSONATE = 'info@expertconsulting.es';

export function hasCalendarSA(): boolean {
  return !!(process.env.GOOGLE_GMAIL_SA_EMAIL && process.env.GOOGLE_GMAIL_SA_PRIVATE_KEY);
}

async function getMeetSAAuthClient() {
  if (!hasCalendarSA()) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { google } = (await import('googleapis')) as any;
  return new google.auth.JWT({
    email: process.env.GOOGLE_GMAIL_SA_EMAIL!,
    key: process.env.GOOGLE_GMAIL_SA_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    scopes: MEET_SA_SCOPES,
    subject: CALENDAR_SA_IMPERSONATE,
  });
}

async function getCalendarSAAuthClient() {
  if (!hasCalendarSA()) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { google } = (await import('googleapis')) as any;
  return new google.auth.JWT({
    email: process.env.GOOGLE_GMAIL_SA_EMAIL!,
    key: process.env.GOOGLE_GMAIL_SA_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    scopes: CALENDAR_SA_SCOPES,
    subject: CALENDAR_SA_IMPERSONATE,
  });
}

async function getCalendarSAClient() {
  const auth = await getCalendarSAAuthClient();
  if (!auth) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { google } = (await import('googleapis')) as any;
  return google.calendar({ version: 'v3', auth });
}

export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  scope?: string;
}

function getRedirectUri(): string {
  return absoluteAppUrl('/api/auth/google-calendar/callback');
}

async function getOAuth2Client(tokens?: StoredTokens) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { google } = (await import('googleapis')) as any;
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri()
  );
  if (tokens) client.setCredentials(tokens);
  return client;
}

export async function getAuthUrl(state?: string): Promise<string> {
  const client = await getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state,
  });
}

export async function exchangeCode(code: string): Promise<StoredTokens> {
  const client = await getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    expiry_date: tokens.expiry_date!,
    scope: tokens.scope,
  };
}

export async function refreshTokensIfNeeded(stored: StoredTokens): Promise<StoredTokens> {
  if (stored.expiry_date > Date.now() + 60_000) return stored;
  const client = await getOAuth2Client(stored);
  const { credentials } = await client.refreshAccessToken();
  return {
    access_token: credentials.access_token!,
    refresh_token: credentials.refresh_token ?? stored.refresh_token,
    expiry_date: credentials.expiry_date!,
    scope: credentials.scope ?? stored.scope,
  };
}

export interface CalendarEventInput {
  summary: string;
  description?: string;
  date: string; // YYYY-MM-DD (all-day OR the date part of a timed event)
  // Optional fields for timed events (e.g. citas)
  startTime?: string;        // HH:MM (24h), makes it a timed event instead of all-day
  endTime?: string;          // HH:MM (24h), defaults to startTime + 60 min
  timezone?: string;         // IANA tz, defaults to 'Europe/Madrid'
  reminderDaysBefore?: number[];
  reminderMinutesBefore?: number[]; // Used for timed events instead of day-based
}

function buildEventResource(input: CalendarEventInput) {
  const tz = input.timezone ?? 'Europe/Madrid';
  const overrides = input.startTime
    ? (input.reminderMinutesBefore ?? [60, 15]).map((m) => ({ method: 'email', minutes: m }))
    : (input.reminderDaysBefore ?? [7, 1]).map((d) => ({ method: 'email', minutes: d * 24 * 60 }));

  if (input.startTime) {
    // Timed event
    const startDt = `${input.date}T${input.startTime}:00`;
    let endDt: string;
    if (input.endTime) {
      endDt = `${input.date}T${input.endTime}:00`;
    } else {
      // default +60 min
      const [h, m] = input.startTime.split(':').map(Number);
      const endH = String(Math.floor((h * 60 + m + 60) / 60) % 24).padStart(2, '0');
      const endM = String((m + 60) % 60).padStart(2, '0');
      endDt = `${input.date}T${endH}:${endM}:00`;
    }
    return {
      summary: input.summary,
      description: input.description,
      start: { dateTime: startDt, timeZone: tz },
      end: { dateTime: endDt, timeZone: tz },
      reminders: { useDefault: false, overrides },
    };
  }

  // All-day event
  return {
    summary: input.summary,
    description: input.description,
    start: { date: input.date },
    end: { date: input.date },
    reminders: { useDefault: false, overrides },
  };
}

async function upsertEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cal: any,
  calendarId: string,
  input: CalendarEventInput,
  existingEventId?: string | null
): Promise<string> {
  const resource = buildEventResource(input);
  if (existingEventId) {
    const { data } = await cal.events.update({ calendarId, eventId: existingEventId, resource });
    return data.id as string;
  }
  const { data } = await cal.events.insert({ calendarId, resource });
  return data.id as string;
}

// ── OAuth2 (per-user) path ─────────────────────────────────────────────────

export async function upsertCalendarEvent(
  tokens: StoredTokens,
  input: CalendarEventInput,
  existingEventId?: string | null
): Promise<string> {
  const fresh = await refreshTokensIfNeeded(tokens);
  const client = await getOAuth2Client(fresh);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { google } = (await import('googleapis')) as any;
  const cal = google.calendar({ version: 'v3', auth: client });
  return upsertEvent(cal, 'primary', input, existingEventId);
}

export async function deleteCalendarEvent(tokens: StoredTokens, eventId: string): Promise<void> {
  const fresh = await refreshTokensIfNeeded(tokens);
  const client = await getOAuth2Client(fresh);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { google } = (await import('googleapis')) as any;
  const cal = google.calendar({ version: 'v3', auth: client });
  await cal.events.delete({ calendarId: 'primary', eventId }).catch(() => {});
}

// ── Service Account path (info@expertconsulting.es) ────────────────────────
// Requires Google Workspace Admin Console → DWD → add scope:
//   https://www.googleapis.com/auth/calendar.events
// to the Gmail SA client ID.

export async function upsertCalendarEventSA(
  input: CalendarEventInput,
  existingEventId?: string | null
): Promise<string | null> {
  const cal = await getCalendarSAClient();
  if (!cal) return null;
  try {
    return await upsertEvent(cal, 'primary', input, existingEventId);
  } catch (err) {
    console.error('[Calendar SA] upsertCalendarEventSA:', err);
    return null;
  }
}

export interface CalendarBusyWindow {
  start: string;
  end: string;
}

export async function listCalendarBusyWindowsSA(
  timeMin: string,
  timeMax: string
): Promise<CalendarBusyWindow[]> {
  const cal = await getCalendarSAClient();
  if (!cal) throw new Error('Google Calendar service account is not configured');

  const { data } = await cal.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    showDeleted: false,
    maxResults: 2500,
  });

  type BusyEvent = {
    status?: string | null;
    transparency?: string | null;
    start?: { dateTime?: string | null; date?: string | null } | null;
    end?: { dateTime?: string | null; date?: string | null } | null;
  };

  const items = (data.items ?? []) as BusyEvent[];
  return items
    .filter((event) => event.status !== 'cancelled' && event.transparency !== 'transparent')
    .map((event) => ({
      start: event.start?.dateTime ?? event.start?.date ?? '',
      end: event.end?.dateTime ?? event.end?.date ?? '',
    }))
    .filter((window: CalendarBusyWindow) => Boolean(window.start && window.end));
}

export interface MeetAutoArtifactsResult {
  configured: boolean;
  spaceName: string | null;
  error: string | null;
}

function envEnabled(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return defaultValue;
  return !['0', 'false', 'off', 'no'].includes(raw);
}

function meetCodeFromUrl(meetUrl: string): string | null {
  try {
    const url = new URL(meetUrl);
    if (url.hostname !== 'meet.google.com') return null;
    const code = url.pathname.split('/').filter(Boolean)[0];
    return code || null;
  } catch {
    return null;
  }
}

async function getMeetSABearerToken(): Promise<string> {
  const auth = await getMeetSAAuthClient();
  if (!auth) throw new Error('Google Workspace service account is not configured');
  const credentials = await auth.authorize();
  const token = credentials.access_token;
  if (!token) throw new Error('Google Workspace service account did not return an access token');
  return token;
}

export async function configureMeetAutoArtifactsSA(
  meetUrl: string
): Promise<MeetAutoArtifactsResult> {
  const smartNotes = envEnabled('GOOGLE_MEET_AUTO_SMART_NOTES', true);
  const transcription = envEnabled('GOOGLE_MEET_AUTO_TRANSCRIPTION', true);

  if (!smartNotes && !transcription) {
    return { configured: false, spaceName: null, error: null };
  }

  const meetingCode = meetCodeFromUrl(meetUrl);
  if (!meetingCode) {
    return {
      configured: false,
      spaceName: null,
      error: 'Google Meet URL did not contain a valid meeting code',
    };
  }

  try {
    const token = await getMeetSABearerToken();
    const getResponse = await fetch(
      `https://meet.googleapis.com/v2/spaces/${encodeURIComponent(meetingCode)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!getResponse.ok) {
      const detail = await getResponse.text().catch(() => '');
      throw new Error(`Meet spaces.get failed: ${getResponse.status} ${detail}`.trim());
    }

    const space = await getResponse.json() as { name?: string };
    if (!space.name) throw new Error('Google Meet did not return a canonical space name');

    const artifactConfig: Record<string, unknown> = {};
    const updateMask: string[] = [];

    if (transcription) {
      artifactConfig.transcriptionConfig = { autoGenerationType: 'ON' };
      updateMask.push('config.artifactConfig.transcriptionConfig.autoGenerationType');
    }
    if (smartNotes) {
      artifactConfig.smartNotesConfig = { autoGenerationType: 'ON' };
      updateMask.push('config.artifactConfig.smartNotesConfig.autoGenerationType');
    }

    const patchResponse = await fetch(
      `https://meet.googleapis.com/v2/${space.name}?updateMask=${encodeURIComponent(updateMask.join(','))}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            artifactConfig,
          },
        }),
      }
    );

    if (!patchResponse.ok) {
      const detail = await patchResponse.text().catch(() => '');
      throw new Error(`Meet spaces.patch failed: ${patchResponse.status} ${detail}`.trim());
    }

    return { configured: true, spaceName: space.name, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Meet auto artifacts]', message);
    return { configured: false, spaceName: null, error: message };
  }
}

export interface CalendarMeetingInput {
  summary: string;
  description?: string;
  start: string;
  end: string;
  attendeeEmail: string;
  timezone?: string;
  reminderMinutesBefore?: number[];
}

export interface CalendarMeetingResult {
  eventId: string;
  meetUrl: string | null;
  autoArtifacts?: MeetAutoArtifactsResult;
}

export class CalendarMeetingCreationError extends Error {
  eventId: string;
  cleanupFailed: boolean;

  constructor(message: string, eventId: string, cleanupFailed: boolean, cause?: unknown) {
    super(message, { cause });
    this.name = 'CalendarMeetingCreationError';
    this.eventId = eventId;
    this.cleanupFailed = cleanupFailed;
  }
}

export async function createCalendarMeetingSA(
  input: CalendarMeetingInput
): Promise<CalendarMeetingResult> {
  const cal = await getCalendarSAClient();
  if (!cal) throw new Error('Google Calendar service account is not configured');

  const reminders = input.reminderMinutesBefore ?? [1440, 60];
  const requestId = `expert-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const { data } = await cal.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    resource: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.start, timeZone: input.timezone ?? 'Europe/Madrid' },
      end: { dateTime: input.end, timeZone: input.timezone ?? 'Europe/Madrid' },
      attendees: [{ email: input.attendeeEmail }],
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      reminders: {
        useDefault: false,
        overrides: reminders.map((minutes) => ({ method: 'email', minutes })),
      },
    },
  });

  if (!data.id) throw new Error('Google Calendar did not return an event id');
  if (data.hangoutLink) {
    const autoArtifacts = await configureMeetAutoArtifactsSA(data.hangoutLink);
    return { eventId: data.id, meetUrl: data.hangoutLink, autoArtifacts };
  }

  try {
    // Conference creation may complete asynchronously. Do not confirm the local
    // appointment until Google exposes the Meet link or reports failure.
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 250 : 500));
      const { data: refreshed } = await cal.events.get({
        calendarId: 'primary',
        eventId: data.id,
      });
      if (refreshed.hangoutLink) {
        const autoArtifacts = await configureMeetAutoArtifactsSA(refreshed.hangoutLink);
        return {
          eventId: data.id,
          meetUrl: refreshed.hangoutLink,
          autoArtifacts,
        };
      }
      const status = refreshed.conferenceData?.createRequest?.status?.statusCode;
      if (status === 'failure') {
        throw new Error('Google Meet conference creation failed');
      }
    }

    throw new Error('Google Meet conference creation did not complete in time');
  } catch (error) {
    try {
      await cal.events.delete({
        calendarId: 'primary',
        eventId: data.id,
        sendUpdates: 'all',
      });
      throw new CalendarMeetingCreationError(
        error instanceof Error ? error.message : 'Google Meet creation failed',
        data.id,
        false,
        error
      );
    } catch (cleanupError) {
      if (cleanupError instanceof CalendarMeetingCreationError) throw cleanupError;
      console.error('[Calendar SA] cleanup after Meet creation failure:', cleanupError);
      throw new CalendarMeetingCreationError(
        error instanceof Error ? error.message : 'Google Meet creation failed',
        data.id,
        true,
        cleanupError
      );
    }
  }
}

export async function ensureCalendarMeetingUrlSA(eventId: string): Promise<string> {
  const cal = await getCalendarSAClient();
  if (!cal) throw new Error('Google Calendar service account is not configured');

  const readMeetUrl = async (): Promise<string | null> => {
    const { data } = await cal.events.get({
      calendarId: 'primary',
      eventId,
    });
    return data.hangoutLink ?? null;
  };

  const existing = await readMeetUrl();
  if (existing) return existing;

  const requestId = `expert-recover-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await cal.events.patch({
    calendarId: 'primary',
    eventId,
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    resource: {
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  });

  for (let attempt = 0; attempt < 6; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 250 : 500));
    const meetingUrl = await readMeetUrl();
    if (meetingUrl) return meetingUrl;
  }

  throw new Error('Google Meet URL could not be recovered for the existing event');
}

export async function updateCalendarMeetingSA(
  eventId: string,
  input: {
    summary?: string;
    description?: string;
    start?: string;
    end?: string;
    timezone?: string;
    reminderMinutesBefore?: number[];
  }
): Promise<string> {
  const cal = await getCalendarSAClient();
  if (!cal) throw new Error('Google Calendar service account is not configured');

  const resource: Record<string, unknown> = {};
  if (input.summary !== undefined) resource.summary = input.summary;
  if (input.description !== undefined) resource.description = input.description;
  if (input.start) {
    resource.start = {
      dateTime: input.start,
      timeZone: input.timezone ?? 'Europe/Madrid',
    };
  }
  if (input.end) {
    resource.end = {
      dateTime: input.end,
      timeZone: input.timezone ?? 'Europe/Madrid',
    };
  }
  if (input.reminderMinutesBefore) {
    resource.reminders = {
      useDefault: false,
      overrides: input.reminderMinutesBefore.map((minutes) => ({
        method: 'email',
        minutes,
      })),
    };
  }

  const { data } = await cal.events.patch({
    calendarId: 'primary',
    eventId,
    sendUpdates: 'all',
    conferenceDataVersion: 1,
    resource,
  });

  if (!data.id) throw new Error('Google Calendar did not return the updated event id');
  return data.id;
}

export async function deleteCalendarEventSA(eventId: string): Promise<void> {
  const cal = await getCalendarSAClient();
  if (!cal) throw new Error('Google Calendar service account is not configured');

  try {
    await cal.events.delete({ calendarId: 'primary', eventId, sendUpdates: 'all' });
  } catch (error) {
    const status = (error as { response?: { status?: number }; code?: number }).response?.status
      ?? (error as { code?: number }).code;
    if (status === 404 || status === 410) return;
    throw error;
  }
}
