import { describe, expect, it } from 'vitest';
import {
  detectKiaMessageLocale,
  normalizeKiaPreferredLanguage,
  resolveKiaLocale,
} from '@/lib/ai/kia/kia-locale';

describe('Kia locale contract', () => {
  it('uses an explicit ES/RU locale first', () => {
    expect(resolveKiaLocale({ explicit: 'es', preferredLanguage: 'ru', latestMessage: 'Привет' })).toBe('es');
    expect(resolveKiaLocale({ explicit: 'ru', preferredLanguage: 'es', latestMessage: 'Hola' })).toBe('ru');
  });

  it('detects Russian and clear Spanish messages while keeping neutral Latin text unresolved', () => {
    expect(detectKiaMessageLocale('Здравствуйте, нужна помощь с Holded')).toBe('ru');
    expect(detectKiaMessageLocale('Necesito ayuda con Holded')).toBe('es');
    expect(detectKiaMessageLocale('Holded')).toBeNull();
  });

  it('uses persisted RU preference when the latest message does not identify a locale', () => {
    expect(resolveKiaLocale({ preferredLanguage: 'ru', latestMessage: 'Holded' })).toBe('ru');
    expect(resolveKiaLocale({ preferredLanguage: 'ru', latestMessage: '' })).toBe('ru');
  });

  it('lets an unmistakably Russian latest message override an ES preference', () => {
    expect(resolveKiaLocale({ preferredLanguage: 'es', latestMessage: 'Проверьте, пожалуйста' })).toBe('ru');
  });

  it('keeps EN inactive in the current KIA runtime until RU-007b', () => {
    expect(normalizeKiaPreferredLanguage('en')).toBe('es');
    expect(resolveKiaLocale({ preferredLanguage: 'en', latestMessage: 'Hello' })).toBe('es');
  });

  it('never interprets nationality-like values as a language preference', () => {
    expect(normalizeKiaPreferredLanguage('russian')).toBe('es');
    expect(normalizeKiaPreferredLanguage('ukrainian')).toBe('es');
  });
});
