import { z } from 'zod';

export const SUPPORTED_LOCALES = ['es', 'ru', 'en'] as const;
export const DEFAULT_LOCALE = 'es' as const;

export const localeSchema = z.enum(SUPPORTED_LOCALES);
export type SupportedLocale = z.infer<typeof localeSchema>;

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return localeSchema.safeParse(value).success;
}

export function normalizeLocale(value: unknown): SupportedLocale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}
