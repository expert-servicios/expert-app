import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  CalendarMeetingCreationError,
  createCalendarMeetingSA,
  deleteCalendarEventSA,
  ensureCalendarMeetingUrlSA,
  hasCalendarSA,
  listCalendarBusyWindowsSA,
  updateCalendarMeetingSA,
} from '@/lib/integrations/google-calendar';
import {
  createMs365TeamsMeeting,
  deleteMs365CalendarEvent,
  getMs365TeamsMeetingUrl,
  listMs365CalendarBusyWindows,
  updateMs365TeamsMeeting,
  type Ms365StoredTokens,
} from '@/lib/integrations/microsoft365';

export type BookingCalendarProviderName = 'google' | 'ms365';
export type NativeBookingProvider = 'google_native' | 'ms365_native';

export interface BookingCalendarBusyWindow {
  start: string;
  end: string;
}

export interface BookingCalendarMeetingInput {
  summary: string;
  description?: string;
  start: string;
  end: string;
  attendeeEmail: string;
  timezone?: string;
  reminderMinutesBefore?: number[];
}

export interface BookingCalendarMeetingUpdate {
  summary?: string;
  description?: string;
  start?: string;
  end?: string;
  timezone?: string;
  reminderMinutesBefore?: number[];
}

export interface BookingCalendarMeetingResult {
  eventId: string;
  meetingUrl: string | null;
  provider: BookingCalendarProviderName;
  bookingProvider: NativeBookingProvider;
}

export class BookingCalendarCreationError extends Error {
  provider: BookingCalendarProviderName;
  eventId: string | null;
  cleanupFailed: boolean;
  meetingUrl: string | null;

  constructor(
    message: string,
    provider: BookingCalendarProviderName,
    eventId: string | null,
    cleanupFailed = false,
    cause?: unknown,
    meetingUrl: string | null = null
  ) {
    super(message, { cause });
    this.name = 'BookingCalendarCreationError';
    this.provider = provider;
    this.eventId = eventId;
    this.cleanupFailed = cleanupFailed;
    this.meetingUrl = meetingUrl;
  }
}

export class BookingCalendarUpdateError extends Error {
  provider: BookingCalendarProviderName;
  eventId: string;
  remoteUpdated: boolean;

  constructor(
    message: string,
    provider: BookingCalendarProviderName,
    eventId: string,
    remoteUpdated: boolean,
    cause?: unknown
  ) {
    super(message, { cause });
    this.name = 'BookingCalendarUpdateError';
    this.provider = provider;
    this.eventId = eventId;
    this.remoteUpdated = remoteUpdated;
  }
}

export class BookingCalendarDeletionError extends Error {
  provider: BookingCalendarProviderName;
  eventId: string;
  remoteDeleted: boolean;

  constructor(
    message: string,
    provider: BookingCalendarProviderName,
    eventId: string,
    remoteDeleted: boolean,
    cause?: unknown
  ) {
    super(message, { cause });
    this.name = 'BookingCalendarDeletionError';
    this.provider = provider;
    this.eventId = eventId;
    this.remoteDeleted = remoteDeleted;
  }
}

function configuredProviderName(): BookingCalendarProviderName {
  return process.env.BOOKING_CALENDAR_PROVIDER?.trim().toLowerCase() === 'ms365'
    ? 'ms365'
    : 'google';
}

async function getMs365StoredTokens(): Promise<Ms365StoredTokens> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('ms365_tokens')
    .select('access_token,refresh_token,expires_at')
    .eq('id', 'admin')
    .maybeSingle();

  if (error) throw error;
  if (!data?.access_token || !data.refresh_token || !data.expires_at) {
    throw new Error('Microsoft 365 calendar is not connected');
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Number(data.expires_at),
  };
}

async function persistMs365Refresh(refreshed: Ms365StoredTokens | null): Promise<void> {
  if (!refreshed) return;
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('ms365_tokens')
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: refreshed.expires_at,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 'admin');
  if (error) throw error;
}

export function getConfiguredBookingCalendarProvider(): BookingCalendarProviderName {
  return configuredProviderName();
}

export function bookingProviderForCalendar(
  provider: BookingCalendarProviderName
): NativeBookingProvider {
  return provider === 'ms365' ? 'ms365_native' : 'google_native';
}

export function calendarProviderFromBookingProvider(
  bookingProvider: string | null | undefined
): BookingCalendarProviderName | null {
  if (bookingProvider === 'google_native') return 'google';
  if (bookingProvider === 'ms365_native') return 'ms365';
  return null;
}

export async function isBookingCalendarConfigured(
  provider = configuredProviderName()
): Promise<boolean> {
  if (provider === 'google') return hasCalendarSA();

  if (!process.env.MS365_CLIENT_ID || !process.env.MS365_CLIENT_SECRET) return false;
  try {
    await getMs365StoredTokens();
    return true;
  } catch {
    return false;
  }
}

export async function listBookingCalendarBusyWindows(
  timeMin: string,
  timeMax: string,
  provider = configuredProviderName()
): Promise<BookingCalendarBusyWindow[]> {
  if (provider === 'google') {
    return listCalendarBusyWindowsSA(timeMin, timeMax);
  }

  const stored = await getMs365StoredTokens();
  const result = await listMs365CalendarBusyWindows(stored, timeMin, timeMax);
  await persistMs365Refresh(result.refreshed);
  return result.windows;
}

export async function createBookingCalendarMeeting(
  input: BookingCalendarMeetingInput,
  provider = configuredProviderName()
): Promise<BookingCalendarMeetingResult> {
  if (provider === 'google') {
    try {
      const result = await createCalendarMeetingSA(input);
      return {
        eventId: result.eventId,
        meetingUrl: result.meetUrl,
        provider,
        bookingProvider: 'google_native',
      };
    } catch (error) {
      if (error instanceof CalendarMeetingCreationError) {
        throw new BookingCalendarCreationError(
          error.message,
          'google',
          error.eventId,
          error.cleanupFailed,
          error
        );
      }
      throw new BookingCalendarCreationError(
        error instanceof Error ? error.message : 'Google Calendar meeting creation failed',
        'google',
        null,
        false,
        error
      );
    }
  }

  const stored = await getMs365StoredTokens();
  try {
    const result = await createMs365TeamsMeeting(stored, input);

    try {
      await persistMs365Refresh(result.refreshed);
    } catch (persistError) {
      const cleanupTokens = result.refreshed
        ? { ...stored, ...result.refreshed }
        : stored;

      try {
        await deleteMs365CalendarEvent(cleanupTokens, result.eventId);
      } catch (cleanupError) {
        throw new BookingCalendarCreationError(
          'Microsoft token persistence failed after event creation and cleanup failed',
          'ms365',
          result.eventId,
          true,
          cleanupError,
          result.meetingUrl
        );
      }

      throw new BookingCalendarCreationError(
        'Microsoft token persistence failed after event creation; remote event was compensated',
        'ms365',
        null,
        false,
        persistError
      );
    }

    if (!result.meetingUrl) {
      try {
        const cleanupTokens = result.refreshed
          ? { ...stored, ...result.refreshed }
          : stored;
        const cleanup = await deleteMs365CalendarEvent(cleanupTokens, result.eventId);
        await persistMs365Refresh(cleanup.refreshed);
        throw new BookingCalendarCreationError(
          'Microsoft Teams meeting URL was not created',
          'ms365',
          result.eventId,
          false
        );
      } catch (cleanupError) {
        if (cleanupError instanceof BookingCalendarCreationError) throw cleanupError;
        throw new BookingCalendarCreationError(
          'Microsoft Teams meeting URL was not created and cleanup failed',
          'ms365',
          result.eventId,
          true,
          cleanupError
        );
      }
    }

    return {
      eventId: result.eventId,
      meetingUrl: result.meetingUrl,
      provider,
      bookingProvider: 'ms365_native',
    };
  } catch (error) {
    if (error instanceof BookingCalendarCreationError) throw error;
    throw new BookingCalendarCreationError(
      error instanceof Error ? error.message : 'Microsoft Calendar meeting creation failed',
      'ms365',
      null,
      false,
      error
    );
  }
}

export async function ensureBookingCalendarMeetingUrl(
  eventId: string,
  provider = configuredProviderName()
): Promise<string> {
  if (provider === 'google') {
    return ensureCalendarMeetingUrlSA(eventId);
  }

  const stored = await getMs365StoredTokens();
  const result = await getMs365TeamsMeetingUrl(stored, eventId);
  await persistMs365Refresh(result.refreshed);

  if (!result.meetingUrl) {
    throw new Error('Microsoft Teams URL could not be recovered for the existing event');
  }

  return result.meetingUrl;
}

export async function updateBookingCalendarMeeting(
  eventId: string,
  input: BookingCalendarMeetingUpdate,
  provider = configuredProviderName()
): Promise<string> {
  if (provider === 'google') {
    return updateCalendarMeetingSA(eventId, input);
  }

  const stored = await getMs365StoredTokens();
  let result: Awaited<ReturnType<typeof updateMs365TeamsMeeting>>;

  try {
    result = await updateMs365TeamsMeeting(stored, eventId, input);
  } catch (error) {
    throw new BookingCalendarUpdateError(
      'Microsoft Calendar event update failed',
      'ms365',
      eventId,
      false,
      error
    );
  }

  try {
    await persistMs365Refresh(result.refreshed);
  } catch (error) {
    throw new BookingCalendarUpdateError(
      'Microsoft Calendar event was updated but refreshed token persistence failed',
      'ms365',
      result.eventId,
      true,
      error
    );
  }

  return result.eventId;
}

export async function deleteBookingCalendarEvent(
  eventId: string,
  provider = configuredProviderName()
): Promise<void> {
  if (provider === 'google') {
    try {
      await deleteCalendarEventSA(eventId);
      return;
    } catch (error) {
      throw new BookingCalendarDeletionError(
        'Google Calendar event deletion failed',
        'google',
        eventId,
        false,
        error
      );
    }
  }

  const stored = await getMs365StoredTokens();
  let result: Awaited<ReturnType<typeof deleteMs365CalendarEvent>>;

  try {
    result = await deleteMs365CalendarEvent(stored, eventId);
  } catch (error) {
    throw new BookingCalendarDeletionError(
      'Microsoft Calendar event deletion failed',
      'ms365',
      eventId,
      false,
      error
    );
  }

  try {
    await persistMs365Refresh(result.refreshed);
  } catch (error) {
    throw new BookingCalendarDeletionError(
      'Microsoft Calendar event was deleted but refreshed token persistence failed',
      'ms365',
      eventId,
      true,
      error
    );
  }
}
