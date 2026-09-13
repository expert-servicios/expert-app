import { describe, expect, it } from 'vitest';
import { localeFromAcceptLanguage, resolveLocale } from '@/lib/i18n/resolve-locale';

describe('locale resolver', () => {
  it('uses the documented precedence order', () => {
    expect(resolveLocale({
      explicit: 'ru',
      profile: 'en',
      route: 'es',
      cookie: 'en',
      acceptLanguage: 'es-ES',
    })).toEqual({ locale: 'ru', source: 'explicit' });

    expect(resolveLocale({ profile: 'en', route: 'ru', cookie: 'es' })).toEqual({
      locale: 'en',
      source: 'profile',
    });

    expect(resolveLocale({ route: 'ru', cookie: 'en', acceptLanguage: 'es-ES' })).toEqual({
      locale: 'ru',
      source: 'route',
    });

    expect(resolveLocale({ cookie: 'en', acceptLanguage: 'ru-RU' })).toEqual({
      locale: 'en',
      source: 'cookie',
    });
  });

  it('resolves supported browser languages by quality and base language', () => {
    expect(localeFromAcceptLanguage('de-DE;q=1, ru-RU;q=0.9, en-US;q=0.8')).toBe('ru');
    expect(localeFromAcceptLanguage('en-GB;q=0.7, es-ES;q=0.9')).toBe('es');
    expect(localeFromAcceptLanguage('uk-UA, de-DE;q=0.9')).toBeNull();
  });

  it('ignores invalid candidates and falls back to Spanish', () => {
    expect(resolveLocale({
      explicit: 'de',
      profile: 'uk',
      route: null,
      cookie: 'fr',
      acceptLanguage: 'de-DE, uk-UA;q=0.9',
    })).toEqual({ locale: 'es', source: 'default' });
  });

  it('never derives locale from nationality-like values', () => {
    expect(resolveLocale({ profile: 'russian', cookie: 'ukrainian' })).toEqual({
      locale: 'es',
      source: 'default',
    });
  });
});
