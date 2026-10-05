import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA consultation data minimization', () => {
  const core = source('lib/ai/kia/prompts/kia-core-policy.ts');
  const router = source('lib/ai/kia/kia-sub-agent-router.ts');

  it('does not request documents by default during informational consultations', () => {
    expect(core).toContain('MINIMIZACION DE DATOS');
    expect(core).toContain('no pidas documentos personales');
    expect(core).toContain('documentación mínima necesaria');
  });

  it('applies stricter minimization to immigration advice', () => {
    expect(router).toContain('No pidas TIE, pasaporte, padrón, vida laboral, contrato, nóminas');
    expect(router).toContain('consulta informativa');
    expect(router).toContain('documentos mínimos necesarios');
  });
});
