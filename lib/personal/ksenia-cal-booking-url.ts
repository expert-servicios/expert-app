/**
 * Only public, event-specific Cal.com URLs may be embedded on the personal site.
 * Never expose API keys, event ids, or webhook secrets through public configuration.
 */
export function parsePersonalCalBookingUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'cal.com') return null;
    if (url.username || url.password || url.port) return null;
    const segments = url.pathname.split('/').filter(Boolean);
    // A Cal.com profile alone is not a bookable event.
    if (segments.length < 2) return null;
    if (segments.some(segment => segment === '.' || segment === '..')) return null;
    return `https://cal.com${url.pathname.replace(/\/+$/, '')}`;
  } catch {
    return null;
  }
}
