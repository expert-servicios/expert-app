import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from '@/lib/i18n/config';

export type LocaleResolutionSource =
  | 'explicit'
  | 'profile'
  | 'route'
  | 'cookie'
  | 'accept-language'
  | 'default';

export interface LocaleResolutionInput {
  explicit?: unknown;
  profile?: unknown;
  route?: unknown;
  cookie?: unknown;
  acceptLanguage?: string | null;
}

export interface LocaleResolution {
  locale: SupportedLocale;
  source: LocaleResolutionSource;
}

function normalizeLanguageTag(value: string): SupportedLocale | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === '*') return null;

  if (isSupportedLocale(normalized)) return normalized;

  const base = normalized.split('-')[0];
  return isSupportedLocale(base) ? base : null;
}

export function localeFromAcceptLanguage(header: string | null | undefined): SupportedLocale | null {
  if (!header) return null;

  const candidates = header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.find((param) => param.trim().startsWith('q='));
      const parsedQ = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      const quality = Number.isFinite(parsedQ) ? parsedQ : 0;

      return { tag, quality, index };
    })
    .filter((candidate) => candidate.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const candidate of candidates) {
    const locale = normalizeLanguageTag(candidate.tag);
    if (locale) return locale;
  }

  return null;
}

export function resolveLocale(input: LocaleResolutionInput = {}): LocaleResolution {
  const orderedCandidates: Array<[LocaleResolutionSource, unknown]> = [
    ['explicit', input.explicit],
    ['profile', input.profile],
    ['route', input.route],
    ['cookie', input.cookie],
  ];

  for (const [source, candidate] of orderedCandidates) {
    if (isSupportedLocale(candidate)) {
      return { locale: candidate, source };
    }
  }

  const browserLocale = localeFromAcceptLanguage(input.acceptLanguage);
  if (browserLocale) {
    return { locale: browserLocale, source: 'accept-language' };
  }

  return { locale: DEFAULT_LOCALE, source: 'default' };
}
