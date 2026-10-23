import { parsePersonalCalBookingUrl } from '@/lib/personal/ksenia-cal-booking-url';

export interface PersonalCalEvent {
  id: number;
  title: string;
  durationMinutes: number | null;
  bookingUrl: string;
}

type ObjectValue = Record<string, unknown>;

function objectValue(value: unknown): ObjectValue | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as ObjectValue
    : null;
}

/**
 * Cal.com v2 GET /event-types returns {status:"success",data:[...]}.
 * Only explicitly public, event-specific URLs belonging to the authenticated
 * personal username may be exposed; no hidden or team events are promoted.
 */
export function parsePersonalCalEventsResponse(
  response: unknown,
  authenticatedUsername: string
): PersonalCalEvent[] {
  if (!/^[a-zA-Z0-9_-]+$/.test(authenticatedUsername)) return [];
  const body = objectValue(response);
  if (body?.status !== 'success' || !Array.isArray(body.data)) return [];

  const events: PersonalCalEvent[] = [];
  const used = new Set<number>();

  for (const rawEvent of body.data) {
    const event = objectValue(rawEvent);
    if (!event || event.hidden === true || event.bookingRequiresAuthentication === true) continue;
    const id = event.id;
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0 || used.has(id)) continue;
    const title = typeof event.title === 'string' ? event.title.trim() : '';
    if (!title || title.length > 160) continue;

    // Use the URL returned by Cal.com, never synthesize a slug or expose a
    // URL that points at another owner / an organization or team.
    const bookingUrl = typeof event.bookingUrl === 'string'
      ? parsePersonalCalBookingUrl(event.bookingUrl)
      : null;
    if (!bookingUrl) continue;
    const path = new URL(bookingUrl).pathname.split('/').filter(Boolean);
    if (path.length !== 2 || path[0].toLowerCase() !== authenticatedUsername.toLowerCase()) continue;
    if (Array.isArray(event.users) && event.users.length > 0
      && !event.users.some(user => {
        const username = objectValue(user)?.username;
        return typeof username === 'string'
          && username.toLowerCase() === authenticatedUsername.toLowerCase();
      })) continue;

    const minutes = event.lengthInMinutes;
    const durationMinutes = typeof minutes === 'number'
      && Number.isSafeInteger(minutes) && minutes > 0 && minutes <= 1440
      ? minutes : null;
    used.add(id);
    events.push({ id, title, durationMinutes, bookingUrl });
  }

  return events;
}
