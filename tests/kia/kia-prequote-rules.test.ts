import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA pre-quote commercial rules', () => {
  const plans = source('lib/data/kia-knowledge/monthly-plans.ts');
  const prompt = source('lib/ai/kia/prompts/kia-services-catalog.ts');
  const questionnaire = source('lib/data/kia-knowledge/prequote-questionnaire.ts');
  const supervision = source('app/(public)/planes/supervision/page.tsx');

  it('keeps one canonical Supervision plan with periodic basic tax filing', () => {
    expect(plans).toContain('49 €/mes + IVA');
    expect(plans).toContain('presentación de impuestos periódicos básicos');
    expect(plans).not.toContain('modalidad vinculada');
    expect(supervision).toContain('Preparación y presentación de impuestos periódicos básicos');
    expect(supervision).not.toContain('operativa vinculada simple');
  });

  it('requires plans, questionnaire and 15-minute meeting links in quote replies', () => {
    expect(prompt).toContain('/planes');
    expect(prompt).toContain('/presupuesto/aclaraciones');
    expect(prompt).toContain('/cita?tipo=consulta-inicial');
  });

  it('defines a reusable pre-quote questionnaire without repeating known facts', () => {
    expect(questionnaire).toContain("title: 'Volumen'");
    expect(questionnaire).toContain("title: 'Fiscalidad y complejidad'");
    expect(questionnaire).toContain("title: 'Software y Holded'");
    expect(questionnaire).toContain("title: 'Inicio y transición'");
    expect(questionnaire).toContain('No repetir preguntas que ya estén contestadas');
  });
});
