import { describe, it, expect } from 'vitest';
import { isRgpdKiaTopic, KIA_RGPD_KNOWLEDGE_PROMPT } from '../../lib/ai/kia/prompts/kia-rgpd-knowledge';

describe('KIA RGPD public guidance', () => {
  it('detects RGPD in context, without affecting unrelated pages', () => {
    expect(isRgpdKiaTopic('¿Cuál es mi obligación RGPD?')).toBe(true);
    expect(isRgpdKiaTopic('Hola', '/herramientas/rgpd')).toBe(true);
    expect(isRgpdKiaTopic('Hola', '/')).toBe(false);
  });
  it('offers verified AEPD resources, price and no compliance claim', () => {
    expect(KIA_RGPD_KNOWLEDGE_PROMPT).toContain('https://gestiona2.aepd.es/');
    expect(KIA_RGPD_KNOWLEDGE_PROMPT).toContain('facilita-emprende');
    expect(KIA_RGPD_KNOWLEDGE_PROMPT).toContain('180 € + IVA');
    expect(KIA_RGPD_KNOWLEDGE_PROMPT).toContain('NO suponen el cumplimiento automático');
    expect(KIA_RGPD_KNOWLEDGE_PROMPT).toContain('UNA pregunta');
    expect(KIA_RGPD_KNOWLEDGE_PROMPT).toContain('No lo sé');
  });
});
