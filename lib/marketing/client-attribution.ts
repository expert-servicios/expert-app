import type { LeadAttribution, LeadSource } from '@/lib/marketing/acquisition-taxonomy';
import type { SupportedLocale } from '@/lib/i18n/config';

export const ACQUISITION_STORAGE_KEY = 'expert_acquisition_v1';
export const ACQUISITION_COOKIE_NAME = 'expert_acquisition';

function localeFromPath(pathname: string): SupportedLocale {
  if (pathname === '/ru' || pathname.startsWith('/ru/')) return 'ru';
  if (pathname === '/en' || pathname.startsWith('/en/')) return 'en';
  return 'es';
}

export function inferLeadSource(utmSource: string | null | undefined, utmMedium: string | null | undefined): LeadSource {
  const source = (utmSource ?? '').trim().toLowerCase();
  const medium = (utmMedium ?? '').trim().toLowerCase();

  if (source === 'telegram') return 'telegram';
  if (source === 'whatsapp' || source === 'wa') return 'whatsapp';
  if (source === 'email' || medium === 'email') return 'email';
  if (source === 'webinar' || medium === 'webinar') return 'webinar';
  if (source === 'partner' || medium === 'partner') return 'partner';
  if (medium === 'referral') return 'referral';
  if (['cpc', 'ppc', 'paid', 'paid_search', 'sem'].includes(medium)) return 'paid_search';
  if (medium === 'organic') return 'organic_search';
  if (
    ['social', 'social-media'].includes(medium) ||
    ['instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'x', 'twitter'].includes(source)
  ) return 'social';
  if (source || medium) return 'other';
  return 'direct';
}

function safeString(value: string | null, max: number): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, max) : undefined;
}

function readStored(): Partial<LeadAttribution> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(ACQUISITION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed as Partial<LeadAttribution> : null;
  } catch {
    return null;
  }
}

function persistAttribution(attribution: LeadAttribution) {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(attribution);

  try {
    window.sessionStorage.setItem(ACQUISITION_STORAGE_KEY, serialized);
  } catch {
    // Attribution must never block navigation or a lead form.
  }

  try {
    document.cookie = `${ACQUISITION_COOKIE_NAME}=${encodeURIComponent(serialized)}; Path=/; SameSite=Lax`;
  } catch {
    // The first-party cookie is best-effort; sessionStorage remains the client fallback.
  }
}

export function captureClientAttribution(): LeadAttribution | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const stored = readStored();
  const hasCurrentCampaign = Boolean(
    params.get('utm_source') ||
    params.get('utm_medium') ||
    params.get('utm_campaign') ||
    params.get('campaign'),
  );

  const attribution: LeadAttribution = {
    locale: localeFromPath(window.location.pathname),
    source: hasCurrentCampaign
      ? inferLeadSource(params.get('utm_source'), params.get('utm_medium'))
      : stored?.source ?? 'direct',
    usesHolded: stored?.usesHolded ?? 'unknown',
    originPath: stored?.originPath ?? window.location.pathname.slice(0, 500),
    ...(safeString(params.get('utm_source'), 120) || stored?.utmSource
      ? { utmSource: safeString(params.get('utm_source'), 120) ?? stored?.utmSource }
      : {}),
    ...(safeString(params.get('utm_medium'), 120) || stored?.utmMedium
      ? { utmMedium: safeString(params.get('utm_medium'), 120) ?? stored?.utmMedium }
      : {}),
    ...(safeString(params.get('utm_campaign'), 160) || stored?.utmCampaign
      ? { utmCampaign: safeString(params.get('utm_campaign'), 160) ?? stored?.utmCampaign }
      : {}),
    ...(safeString(params.get('campaign'), 120) || safeString(params.get('utm_campaign'), 120) || stored?.campaign
      ? { campaign: safeString(params.get('campaign'), 120) ?? safeString(params.get('utm_campaign'), 120) ?? stored?.campaign }
      : {}),
    ...(stored?.intent ? { intent: stored.intent } : {}),
    ...(stored?.customerType ? { customerType: stored.customerType } : {}),
  };

  persistAttribution(attribution);
  return attribution;
}

export function readClientAttribution(): LeadAttribution | null {
  if (typeof window === 'undefined') return null;
  return captureClientAttribution();
}
