import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Arraigo Social 2026 content ecosystem', () => {
  const catalog = read('lib/utils/catalog.ts');
  const docs = read('lib/utils/docs.ts');
  const blog = read('lib/utils/blog.ts');
  const viability = read('lib/data/viability-checks.ts');
  const kiaExamples = read('lib/ai/kia/prompts/kia-examples.ts');
  const kiaLeadFlow = read('lib/ai/kia/prompts/kia-lead-flow.ts');
  const kiaCatalog = read('lib/ai/kia/prompts/kia-services-catalog.ts');

  it('keeps the commercial landing and knowledge base on the two-year rule', () => {
    expect(catalog).toContain("shortDescription: 'Residencia temporal por circunstancias excepcionales");
    expect(catalog).toContain('al menos 2 años');
    expect(docs).toContain("slug: 'arraigo-social-requisitos-y-proceso'");
    expect(docs).toContain('Arraigo social 2026');
    expect(docs).toContain('2 años de permanencia continuada');
    expect(docs).toContain("slug: 'arraigo-social-acreditar-dos-anos'");
  });

  it('keeps blog content aligned with the current social vs sociolaboral distinction', () => {
    expect(blog).toContain('Arraigo social en 2026');
    expect(blog).toContain("slug: 'arraigo-social-vs-sociolaboral-2026'");
    expect(blog).toContain('No exige contrato de trabajo como requisito específico');
    expect(blog).toContain('Modelo 790 código 052, epígrafe 2.3.1');
  });

  it('keeps viability and Kia prompts free of the legacy three-year rule for social arraigo', () => {
    expect(viability).toContain('Permanencia continuada en España de al menos 2 años');
    expect(viability).toContain('El contrato de trabajo NO es requisito específico del arraigo social');
    expect(kiaExamples).toContain('2 anos de permanencia continuada');
    expect(kiaLeadFlow).toContain('social (2+ anos, sujeto a requisitos)');
    expect(kiaCatalog).toContain('Arraigo social (2 anos de permanencia + via familiar/integracion)');
  });

  it('uses EX-10 consistently for the social arraigo service', () => {
    expect(catalog).toContain('Cumplimentación del formulario EX-10');
    expect(docs).toContain('formulario oficial **EX-10**');
    expect(blog).toContain('Formulario EX-10');
  });
});
