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

/** Account-scoped, read-only Cal.com v2 event list mapper.
 * Cal.com has shipped both grouped (legacy) and flat (versioned) responses.
 * Only individual public events attributable to the authenticated /me user
 * can be exposed; team, hidden and gated meetings are excluded.
 */
export function parsePersonalCalEventsResponse(
  response: unknown,
  authenticatedUsername: string
): PersonalCalEvent[] {
  if (!/^[a-zA-Z0-9_-]+$/.test(authenticatedUsername)) return [];
  const body = objectValue(response);
  if (body?.status !== 'success') return [];
  const data = objectValue(body.data);
  const groups = Array.isArray(data?.eventTypeGroups) ? data.eventTypeGroups : [];
  const candidates: unknown[] = [];

  for (const groupInput of groups) {
    const group = objectValue(groupInput);
    if (!group || group.teamId != null) continue;
    const profile = objectValue(group.profile);
    const ownerSlug = typeof profile?.slug === 'string' ? profile.slug : group.username;
    if (typeof ownerSlug !== 'string'
      || ownerSlug.toLowerCase() !== authenticatedUsername.toLowerCase()) continue;
    if (Array.isArray(group.eventTypes)) candidates.push(...group.eventTypes);
  }
  if (Array.isArray(body.data)) candidates.push(...body.data);
  if (data && Array.isArray(data.eventTypes)) candidates.push(...data.eventTypes);

  const events: PersonalCalEvent[] = [];
  const used = new Set<number>();
  for (const input of candidates) {
    const event = objectValue(input);
    if (!event || event.hidden === true || event.bookingRequiresAuthentication === true
      || event.schedulingType != null || event.teamId != null) continue;
    const id = event.id;
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0 || used.has(id)) continue;
    const title = typeof event.title === 'string' ? event.title.trim() : '';
    const slug = typeof event.slug === 'string' ? event.slug.trim() : '';
    if (!title || title.length > 160 || !/^[a-zA-Z0-9_-]+$/.test(slug)) continue;
    if (Array.isArray(event.users) && event.users.length > 0
      && !event.users.some(user => {
        const username = objectValue(user)?.username;
        return typeof username === 'string'
          && username.toLowerCase() === authenticatedUsername.toLowerCase();
      })) continue;

    // Prefer provider-returned URL; otherwise form the standard path only
    // from the /me-verified username and an exact event slug from Cal.com.
    const candidateUrl = typeof event.bookingUrl === 'string'
      ? event.bookingUrl : 'https://cal.com/' + authenticatedUsername + '/' + slug;
    const bookingUrl = parsePersonalCalBookingUrl(candidateUrl);
    if (!bookingUrl) continue;
    const urlSegments = new URL(bookingUrl).pathname.split('/').filter(Boolean);
    if (urlSegments.length !== 2
      || urlSegments[0].toLowerCase() !== authenticatedUsername.toLowerCase()
      || urlSegments[1] !== slug) continue;

    const minutes = event.lengthInMinutes ?? event.length;
    const durationMinutes = typeof minutes === 'number'
      && Number.isSafeInteger(minutes) && minutes > 0 && minutes <= 1440
      ? minutes : null;
    used.add(id);
    events.push({ id, title, durationMinutes, bookingUrl });
  }
  return events.slice(0, 50);
}
