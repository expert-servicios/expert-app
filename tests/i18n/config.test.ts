import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  normalizeLocale,
} from '@/lib/i18n/config';
import {
  isLocaleIndexingEnabled,
  isLocalePubliclyEnabled,
  shouldIndexLocale,
} from '@/lib/i18n/feature-flags';

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

  it('keeps RU and EN unpublished and non-indexable by default', () => {
    expect(isLocalePubliclyEnabled('es')).toBe(true);
    expect(isLocalePubliclyEnabled('ru')).toBe(false);
    expect(isLocalePubliclyEnabled('en')).toBe(false);
    expect(isLocaleIndexingEnabled('ru')).toBe(false);
    expect(shouldIndexLocale('ru')).toBe(false);
  });

  it('allows preview visibility without enabling search indexing', () => {
    vi.stubEnv('NEXT_PUBLIC_RU_ENABLED', 'true');

    expect(isLocalePubliclyEnabled('ru')).toBe(true);
    expect(isLocaleIndexingEnabled('ru')).toBe(false);
    expect(shouldIndexLocale('ru')).toBe(false);
  });

  it('indexes a localized surface only when both release gates are enabled', () => {
    vi.stubEnv('NEXT_PUBLIC_RU_ENABLED', 'true');
    vi.stubEnv('NEXT_PUBLIC_RU_INDEX_ENABLED', '1');
    vi.stubEnv('NEXT_PUBLIC_EN_ENABLED', 'true');
    vi.stubEnv('NEXT_PUBLIC_EN_INDEX_ENABLED', 'on');

    expect(isLocalePubliclyEnabled('ru')).toBe(true);
    expect(isLocaleIndexingEnabled('ru')).toBe(true);
    expect(shouldIndexLocale('ru')).toBe(true);
    expect(shouldIndexLocale('en')).toBe(true);
  });
});
