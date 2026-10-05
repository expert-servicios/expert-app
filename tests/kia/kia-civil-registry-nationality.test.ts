import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA civil registry and nationality corpus', () => {
  const corpus = source('lib/ai/kia/prompts/kia-civil-registry-nationality.ts');
  const system = source('lib/ai/kia/kia-system-prompt.ts');

  it('covers the core civil registry and nationality distinctions', () => {
    for (const marker of [
      'Ley 20/2011',
      'RD 1004/2015',
      'nacionalidad española de origen',
      'nacionalidad por opción',
      'nacionalidad por residencia',
      'recuperación de nacionalidad',
      'jura o promesa',
      'nombre y apellidos',
      'certificados registrales habituales',
    ]) {
      expect(corpus).toContain(marker);
    }
  });

  it('does not conflate nationality, registry and immigration rules', () => {
    expect(corpus).toContain('No confundir con Extranjería');
    expect(corpus).toContain('no extrapolar automáticamente reglas favorables de cómputo de Extranjería');
    expect(corpus).toContain('No asumir que "nacionalidad" significa siempre nacionalidad por residencia');
  });

  it('loads the corpus when Justicia context is active', () => {
    expect(system).toContain('KIA_CIVIL_REGISTRY_NATIONALITY_PROMPT');
    expect(system).toContain('withJusticia ? KIA_CIVIL_REGISTRY_NATIONALITY_PROMPT');
  });
});
