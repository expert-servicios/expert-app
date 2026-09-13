import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  normalizeLocale,
} from '@/lib/i18n/config';
import { isLocalePubliclyEnabled, shouldIndexLocale } from '@/lib/i18n/feature-flags';

describe('locale configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('keeps Spanish as the unprefixed default locale', () => {
    expect(DEFAULT_LOCALE).toBe('es');
    expect(SUPPORTED_LOCALES).toEqual(['es', 'ru', 'en']);
  });

  it('validates and normalizes locale values safely', () => {
    expect(isSupportedLocale('ru')).toBe(true);
    expect(isSupportedLocale('de')).toBe(false);
    expect(normalizeLocale('en')).toBe('en');
    expect(normalizeLocale('de')).toBe('es');
    expect(normalizeLocale(undefined)).toBe('es');
  });

  it('keeps RU and EN unpublished by default', () => {
    expect(isLocalePubliclyEnabled('es')).toBe(true);
    expect(isLocalePubliclyEnabled('ru')).toBe(false);
    expect(isLocalePubliclyEnabled('en')).toBe(false);
    expect(shouldIndexLocale('ru')).toBe(false);
  });

  it('enables each localized surface only through its explicit public flag', () => {
    vi.stubEnv('NEXT_PUBLIC_RU_ENABLED', 'true');
    vi.stubEnv('NEXT_PUBLIC_EN_ENABLED', '1');

    expect(isLocalePubliclyEnabled('ru')).toBe(true);
    expect(isLocalePubliclyEnabled('en')).toBe(true);
    expect(shouldIndexLocale('ru')).toBe(true);
  });
});
