import { describe, expect, it } from 'vitest';
import { detectKiaLocaleFromLastMessage } from '@/lib/ai/kia/kia-language';

describe('KIA latest-message language', () => {
  it('switches to Russian whenever the latest message contains Cyrillic', () => {
    expect(detectKiaLocaleFromLastMessage('Спасибо! А что дальше?', 'es')).toBe('ru');
  });

  it('switches back to Spanish on the next Spanish question', () => {
    expect(detectKiaLocaleFromLastMessage('Gracias. ¿Qué tengo que firmar ahora?', 'ru')).toBe('es');
  });

  it('uses profile language only as fallback for neutral/empty text', () => {
    expect(detectKiaLocaleFromLastMessage('OK', 'ru')).toBe('ru');
    expect(detectKiaLocaleFromLastMessage('', 'es')).toBe('es');
  });
});
