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

/**
 * Localized pages stay non-indexable until their release gate is explicitly enabled.
 * Spanish remains the canonical default locale and is always indexable.
 */
export function shouldIndexLocale(locale: SupportedLocale): boolean {
  return isLocalePubliclyEnabled(locale);
}
