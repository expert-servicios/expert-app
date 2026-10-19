import { describe, expect, it } from 'vitest';
import { isCirceKiaTopic, KIA_PAE_KNOWLEDGE_PROMPT } from '@/lib/ai/kia/prompts/kia-pae-knowledge';
import { isRgpdKiaTopic } from '@/lib/ai/kia/prompts/kia-rgpd-knowledge';
import { readFileSync } from 'node:fs';

describe('KIA public CIRCE and privacy knowledge', () => {
  it('detects user questions and page-based CIRCE context without unrelated matches', () => {
    expect(isCirceKiaTopic('¿Me conviene ser autónomo o SL?')).toBe(true);
    expect(isCirceKiaTopic('Cómo constituir una sociedad limitada')).toBe(true);
    expect(isCirceKiaTopic('Hola', '/herramientas/crear-sociedad-limitada')).toBe(true);
    expect(isCirceKiaTopic('Hola', '/')).toBe(false);
    expect(isRgpdKiaTopic('¿Qué política de privacidad necesita mi aplicación?')).toBe(true);
  });
  it('teaches voluntary paths and duplicate-filing prevention', () => {
    expect(KIA_PAE_KNOWLEDGE_PROMPT).toContain('No recomendar duplicar modelo 036');
    expect(KIA_PAE_KNOWLEDGE_PROMPT).toContain('UNICO enlace interno de EXPERT');
    expect(KIA_PAE_KNOWLEDGE_PROMPT).toContain('formacion guiada voluntaria');
    expect(KIA_PAE_KNOWLEDGE_PROMPT).toContain('https://expertconsulting.es/planes');
  });
  it('wires topic knowledge into the public chat alongside RGPD', () => {
    const route = readFileSync('app/api/ai/kia/public/route.ts', 'utf8');
    expect(route).toContain('isCirceKiaTopic');
    expect(route).toContain('KIA_PAE_KNOWLEDGE_PROMPT');
    expect(route).toContain('KIA_RGPD_KNOWLEDGE_PROMPT');
  });
});