export const COOKIE_CONSENT_KEY = 'expert-cookie-consent-v3';
export const COOKIE_CONSENT_EVENT = 'expert:cookie-consent-changed';
export const OPEN_COOKIE_SETTINGS_EVENT = 'expert:open-cookie-settings';
export const COOKIE_CONSENT_TTL_MS = 730 * 24 * 60 * 60 * 1000;

export type CookieConsentValue = 'accepted' | 'rejected';
export type StoredCookieConsent = { value: CookieConsentValue; decidedAt: number };

export function readCookieConsent(): StoredCookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCookieConsent;
    if (
      (parsed.value !== 'accepted' && parsed.value !== 'rejected') ||
      !Number.isFinite(parsed.decidedAt) ||
      Date.now() - parsed.decidedAt > COOKIE_CONSENT_TTL_MS
    ) {
      window.localStorage.removeItem(COOKIE_CONSENT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeCookieConsent(value: CookieConsentValue): StoredCookieConsent {
  const next = { value, decidedAt: Date.now() } satisfies StoredCookieConsent;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(next));
    } catch {
      // Privacy choices still apply for the current page even if storage is unavailable.
    }
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: next }));
  }
  return next;
}

export function clearAnalyticsCookies() {
  if (typeof document === 'undefined') return;
  const analyticsPrefixes = ['_ga', '_gid', '_gac_', '_gat', '_gat_'];
  for (const raw of document.cookie.split(';')) {
    const name = raw.split('=')[0]?.trim();
    if (!name || !analyticsPrefixes.some((prefix) => name === prefix || name.startsWith(prefix))) continue;
    for (const domain of ['', location.hostname, '.expertconsulting.es']) {
      const domainPart = domain ? `; Domain=${domain}` : '';
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domainPart}`;
    }
  }
}
