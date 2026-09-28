import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA pre-quote commercial rules', () => {
  const plans = source('lib/data/kia-knowledge/monthly-plans.ts');
  const prompt = source('lib/ai/kia/prompts/kia-services-catalog.ts');
  const questionnaire = source('lib/data/kia-knowledge/pre-quote-questionnaire.ts');
  const supervision = source('app/(public)/planes/supervision/page.tsx');

  it('supports the linked-autonomo 49 EUR variant', () => {
    expect(plans).toContain('autónomo vinculado/económicamente dependiente');
    expect(plans).toContain('49 €/mes + IVA');
    expect(plans).toContain('obligaciones fiscales básicas');
    expect(supervision).toContain('normalmente no supera unas 10 facturas al mes');
  });

  it('requires plans, questionnaire and 15-minute meeting links in quote replies', () => {
    expect(prompt).toContain('/planes');
    expect(prompt).toContain('/presupuesto/aclaraciones');
    expect(prompt).toContain('/cita?tipo=consulta-inicial');
  });

  it('defines a reusable pre-quote questionnaire without repeating known facts', () => {
    expect(questionnaire).toContain('Volumen real');
    expect(questionnaire).toContain('Obligaciones fiscales');
    expect(questionnaire).toContain('Holded y sistema actual');
    expect(questionnaire).toContain('Cambio de asesoría / migración');
    expect(questionnaire).toContain('No repetir preguntas cuya respuesta ya conste');
  });
});
