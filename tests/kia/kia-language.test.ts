import { describe, expect, it } from 'vitest';
import { resolveKiaLocale } from '@/lib/ai/kia/kia-locale';

describe('KIA latest-message language', () => {
  it('switches to Russian whenever the latest message contains Cyrillic', () => {
    expect(resolveKiaLocale({ latestMessage: 'Спасибо! А что дальше?', preferredLanguage: 'es' })).toBe('ru');
  });

  it('switches back to Spanish on the next Spanish question', () => {
    expect(resolveKiaLocale({ latestMessage: 'Gracias. ¿Qué tengo que firmar ahora?', preferredLanguage: 'ru' })).toBe('es');
  });

  it('uses profile language only when the latest text is neutral', () => {
    expect(resolveKiaLocale({ latestMessage: 'OK', preferredLanguage: 'ru' })).toBe('ru');
    expect(resolveKiaLocale({ latestMessage: '', preferredLanguage: 'es' })).toBe('es');
  });
});
