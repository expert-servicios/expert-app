import type { SupportedLocale } from '@/lib/i18n/config';

function enabled(value: string | undefined): boolean {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export function isLocalePubliclyEnabled(locale: SupportedLocale): boolean {
  if (locale === 'es') return true;
  if (locale === 'ru') return enabled(process.env.NEXT_PUBLIC_RU_ENABLED);
  return enabled(process.env.NEXT_PUBLIC_EN_ENABLED);
}

export function isLocaleIndexingEnabled(locale: SupportedLocale): boolean {
  if (locale === 'es') return true;
  if (!isLocalePubliclyEnabled(locale)) return false;
  if (locale === 'ru') return enabled(process.env.NEXT_PUBLIC_RU_INDEX_ENABLED);
  return enabled(process.env.NEXT_PUBLIC_EN_INDEX_ENABLED);
}

/**
 * Visibility and SEO release are deliberately separate. A localized surface can
 * be enabled for preview/review while remaining noindex until its content is
 * approved for public search.
 */
export function shouldIndexLocale(locale: SupportedLocale): boolean {
  return isLocaleIndexingEnabled(locale);
}
