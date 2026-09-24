import { describe, expect, it } from 'vitest';
import { buildKiaSystemPrompt, shouldIncludeJusticia } from '@/lib/ai/kia/kia-system-prompt';

describe('nationality surname guidance context', () => {
  it.each([
    '/servicios/extranjeria-nacionalidad/nacionalidad-espanola-menor-nacido-en-espana',
    '/ru/uslugi/grazhdanstvo-ispanii-rebenok-rozhdennyy-v-ispanii',
    '¿Se puede duplicar el apellido?',
    'Нужна ли девичья фамилия матери?',
  ])('loads the registry guidance for %s', (context) => {
    const prompt = buildKiaSystemPrompt({ locale: 'es', channel: 'dashboard', taskType: 'chat_reply', currentTask: context });
    expect(prompt).toContain('<nacionalidad_apellidos_documentacion>');
  });

  it('does not add registry guidance to an unrelated task', () => {
    const prompt = buildKiaSystemPrompt({ locale: 'es', channel: 'dashboard', taskType: 'chat_reply', currentTask: 'consultar horario' });
    expect(prompt).not.toContain('<nacionalidad_apellidos_documentacion>');
  });

  it.each(['¿Se puede duplicar el apellido?', 'Нужна ли девичья фамилия матери?'])('selects guidance for a standalone production message: %s', (message) => {
    const includeJusticia = shouldIncludeJusticia({ message });
    expect(includeJusticia).toBe(true);
    expect(buildKiaSystemPrompt({ locale: 'es', channel: 'dashboard', taskType: 'chat_reply', includeJusticia }))
      .toContain('<nacionalidad_apellidos_documentacion>');
  });

  it('preserves legacy service selection without matching unrelated messages', () => {
    expect(shouldIncludeJusticia({ serviceSlug: 'constitucion-sl-circe', message: 'Hola' })).toBe(true);
    expect(shouldIncludeJusticia({ message: 'consultar horario' })).toBe(false);
  });
});
