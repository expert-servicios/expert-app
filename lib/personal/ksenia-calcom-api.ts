import 'server-only';

import { parsePersonalCalBookingUrl } from '@/lib/personal/ksenia-cal-booking-url';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function validCalSlug(value: unknown): string | null {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]+$/.test(value)
    ? value
    : null;
}

interface MatchingEvent {
  eventSlug: string;
  bookingOwnerSlug: string | null;
}

function findEventInGroup(group: unknown, id: number): MatchingEvent | null {
  const object = asRecord(group);
  if (!object) return null;
  const events = Array.isArray(object.eventTypes) ? object.eventTypes : [];
  const event = events.map(asRecord).find(entry =>
    entry !== null && Number(entry.id) === id && entry.hidden !== true
  );
  if (!event) return null;
  const eventSlug = validCalSlug(event.slug);
  if (!eventSlug) return null;
  const profile = asRecord(object.profile);
  return {
    eventSlug,
    bookingOwnerSlug: validCalSlug(profile?.slug)
      ?? validCalSlug(object.username),
  };
}

export function resolvePersonalCalEventFromResponse(
  response: unknown,
  id: number
): MatchingEvent | null {
  const envelope = asRecord(response);
  if (envelope?.status !== 'success') return null;
  const data = envelope.data;
  const dataObject = asRecord(data);
  const grouped = dataObject && Array.isArray(dataObject.eventTypeGroups)
    ? dataObject.eventTypeGroups : null;

  if (grouped) {
    for (const group of grouped) {
      const match = findEventInGroup(group, id);
      if (match) return match;
    }
  }

  const directEvents = Array.isArray(data) ? data
    : dataObject && Array.isArray(dataObject.eventTypes) ? dataObject.eventTypes
    : [];

  const match = directEvents.map(asRecord).find(event =>
    event !== null && Number(event.id) === id && event.hidden !== true
  );
  if (!match) return null;
  const eventSlug = validCalSlug(match.slug);
  return eventSlug
    ? {
        eventSlug,
        bookingOwnerSlug: validCalSlug(match.username)
          ?? validCalSlug(asRecord(match.profile)?.slug),
      }
    : null;
}

/**
 * Server-side, read-only API v2 lookup. Reuses the existing project-only
 * `cal_ksenia` secret (or CAL_API_KEY) and an explicitly selected
 * PERSONAL_CALCOM_EVENT_TYPE_ID (Config).
 *
 * An API key alone must never cause the first/any event to be published.
 * There are no mutations and no exposure of the token in browser code,
 * page source, errors, URLs or logs.
 */
export async function resolvePersonalCalBookingUrlByApi(): Promise<string | null> {
  // Vercel personal project already stores this credential as `cal_ksenia`.
  // Prefer a canonical future CAL_API_KEY, but never require copying the secret.
  const key = process.env.CAL_API_KEY?.trim() || process.env.cal_ksenia?.trim();
  const rawId = process.env.PERSONAL_CALCOM_EVENT_TYPE_ID?.trim();
  if (!key || !rawId || !/^\d{1,12}$/.test(rawId)) return null;
  const eventTypeId = Number(rawId);
  if (!Number.isSafeInteger(eventTypeId) || eventTypeId <= 0) return null;

  const headers = {
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
  };

  try {
    const eventsResponse = await fetch('https://api.cal.com/v2/event-types', {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });
    if (!eventsResponse.ok) return null;
    const event = resolvePersonalCalEventFromResponse(
      await eventsResponse.json() as unknown,
      eventTypeId
    );
    if (!event) return null;

    let owner = event.bookingOwnerSlug;
    if (!owner) {
      const meResponse = await fetch('https://api.cal.com/v2/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(6000),
      });
      if (!meResponse.ok) return null;
      const me = asRecord(await meResponse.json() as unknown);
      if (me?.status !== 'success') return null;
      owner = validCalSlug(asRecord(me.data)?.username);
    }

    return owner
      ? parsePersonalCalBookingUrl(`https://cal.com/${owner}/${event.eventSlug}`)
      : null;
  } catch {
    return null;
  }
}
