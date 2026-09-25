import { describe, expect, it } from 'vitest';
import { buildKiaTelegramPresentation } from '@/lib/ai/kia/kia-telegram-presentation';

describe('KIA Telegram rich responses', () => {
  it('adds contextual links and converts relative URLs to public EXPERT URLs', () => {
    const result = buildKiaTelegramPresentation({
      reply: 'Te explico el siguiente paso.',
      quickReplies: ['Opción 1', 'Opción 2', 'Otro'],
      artifacts: [
        { type: 'link', title: 'Guía · Firma digital', url: '/docs/firma', cta: 'Abrir guía', tone: 'info' },
      ],
    });
    expect(result.text).toContain('https://expertconsulting.es/docs/firma');
    expect(result.quickReplies).toEqual(['Opción 1', 'Opción 2', 'Otro']);
  });

  it('keeps approved visual resources as photo deliveries', () => {
    const result = buildKiaTelegramPresentation({
      reply: 'Aquí tienes un ejemplo.',
      quickReplies: [],
      artifacts: [
        { type: 'image', title: 'Firma KIA', imageUrl: '/kia/visuals/email-signature-preview.svg', alt: 'Firma', caption: 'Ejemplo visual' },
      ],
    });
    expect(result.photos).toEqual([
      expect.objectContaining({ url: 'https://expertconsulting.es/kia/visuals/email-signature-preview.svg' }),
    ]);
  });

  it('limits quick replies to three', () => {
    const result = buildKiaTelegramPresentation({
      reply: 'Elige.',
      quickReplies: ['1', '2', '3', '4'],
      artifacts: [],
    });
    expect(result.quickReplies).toEqual(['1', '2', '3']);
  });
});
