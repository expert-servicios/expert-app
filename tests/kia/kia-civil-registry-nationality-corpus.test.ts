import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA civil registry and nationality corpus', () => {
  const prompt = source('lib/ai/kia/prompts/kia-civil-registry-nationality-knowledge.ts');
  const system = source('lib/ai/kia/kia-system-prompt.ts');


  it('covers nationality routes and post-acquisition acts', () => {
    for (const marker of [
      'NACIONALIDAD DE ORIGEN',
      'NACIONALIDAD POR OPCIÓN',
      'NACIONALIDAD POR RESIDENCIA',
      'CARTA DE NATURALEZA',
      'RECUPERACIÓN',
      'PÉRDIDA Y CONSERVACIÓN',
      'TRÁMITES TRAS LA ADQUISICIÓN',
    ]) {
      expect(prompt).toContain(marker);
    }
  });

  it('covers core civil registry matters', () => {
    for (const marker of [
      'NACIMIENTO',
      'MATRIMONIO',
      'DEFUNCIÓN',
      'APELLIDOS Y NOMBRE',
      'CERTIFICADOS',
      'Registro Civil Central',
    ]) {
      expect(prompt).toContain(marker);
    }
  });

  it('prevents common legal conflations', () => {
    expect(prompt).toContain('Nacionalidad española y Registro Civil están relacionados, pero no son lo mismo');
    expect(prompt).toContain('No confundir residencia legal para nacionalidad');
    expect(prompt).toContain('No enviar siempre al Registro Civil Central');
  });

  it('loads the corpus contextually', () => {
    expect(system).toContain('KIA_CIVIL_REGISTRY_NATIONALITY_KNOWLEDGE_PROMPT');
    expect(system).toContain('includeCivilRegistryNationality');
    expect(system).toContain('CIVIL_REGISTRY_NATIONALITY_CONTEXT_RE');
  });

  it('applies consultation-first minimization', () => {
    expect(prompt).toContain('no pidas certificados/documentos "por si acaso"');
    expect(prompt).toContain('documentación mínima necesaria');
  });
});
