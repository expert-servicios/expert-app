import { describe, expect, it } from 'vitest';
import {
  KIA_EMAIL_SIGNATURE_COPY,
  resolveKiaEmailSignatureLocale,
} from '@/lib/email/kia-signature';

describe('KIA localized email signature templates', () => {
  it('uses Spanish by default', () => {
    expect(resolveKiaEmailSignatureLocale({})).toBe('es');
    expect(KIA_EMAIL_SIGNATURE_COPY.es.introAuthored).toContain('asistente IA de EXPERT');
  });

  it('uses Russian when preferred_language is ru', () => {
    expect(resolveKiaEmailSignatureLocale({ preferred_language: 'ru' })).toBe('ru');
    expect(KIA_EMAIL_SIGNATURE_COPY.ru.introAuthored).toContain('ИИ-помощница EXPERT');
  });
});
