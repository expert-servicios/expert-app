import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('DGM internal accounting rebuild context', () => {
  const contextBuilder = source('lib/ai/kia/kia-context-builder.ts');
  const playbook = source('docs/clients/dgm-accounting-rebuild.md');
  const learningLoop = source('docs/kia-operator-learning-loop.md');

  it('loads company internal notes into KIA context', () => {
    expect(contextBuilder).toContain('internalNotes: string | null');
    expect(contextBuilder).toContain("select('id, razon_social, nombre_comercial, cif_nif, notes')");
    expect(contextBuilder).toContain('internalNotes: typeof company.notes');
  });

  it('keeps DGM internal until accounting is validated', () => {
    expect(playbook).toContain('Fase interna EXPERT');
    expect(playbook).toContain('no crear usuario');
    expect(playbook).toContain('no enviar correos al titular');
    expect(playbook).toContain('advisor_managed');
    expect(playbook).toContain('auditoría read-only');
  });

  it('separates company-specific facts from global KIA learning', () => {
    expect(playbook).toContain('no se convierten en lecciones globales');
    expect(learningLoop).toContain('What remains company-scoped');
    expect(learningLoop).toContain('What is promoted globally');
  });
});
