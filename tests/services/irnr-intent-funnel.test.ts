import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('IRNR organic-intent funnel', () => {
  const calculator = source('components/services/IrnrPriceCalculator.tsx');
  const cta = source('components/content/ArticleIntentCTA.tsx');
  const docs = source('app/(public)/docs/[slug]/page.tsx');
  const blog = source('app/(public)/blog/[slug]/page.tsx');
  const consultation = source('app/api/consultation/route.ts');
  const casePage = source('app/(protected)/dashboard/expedientes/[id]/page.tsx');
  const questionnaire = source('components/cases/IrnrCaseQuestionnaire.tsx');
  const blueprints = source('lib/services/service-operational-blueprints.ts');
  const catalog = source('lib/utils/catalog.ts');

  it('calculates IRNR price by declarative units', () => {
    expect(calculator).toContain('80 + Math.max(0, declarativeUnits - 1) * 30');
    expect(calculator).toContain('Una unidad es un inmueble por cada titular no residente');
    expect(calculator).toContain('Solicitar este servicio');
    expect(calculator).toContain('/cita?tipo=consulta-inicial');
  });

  it('offers three intent paths after docs and blog content', () => {
    expect(cta).toContain('Tengo una consulta');
    expect(cta).toContain('Quiero este servicio');
    expect(cta).toContain('Reunión informativa · 15 min');
    expect(cta).toContain('/consulta-gratuita?origen=');
    expect(cta).toContain('https://t.me/kia_expert_bot');
    expect(cta).toContain('buildTelegramContentPayload(sourceKind, sourceSlug)');
    expect(docs).toContain('<ArticleIntentCTA');
    expect(blog).toContain('<ArticleIntentCTA');
    expect(docs).not.toContain('wa.me/34669045528');
    expect(blog).not.toContain('wa.me/34669045528');
  });

  it('captures free consultations as attributed leads with push', () => {
    expect(consultation).toContain("category: 'Consulta gratuita'");
    expect(consultation).toContain("intent: 'free_question'");
    expect(consultation).toContain("title: 'Nueva consulta gratuita'");
    expect(consultation).toContain('buildLeadAttributionFields');
  });

  it('creates an operational IRNR case blueprint after contracting', () => {
    expect(blueprints).toContain("slug: 'no-residentes'");
    expect(blueprints).toContain("key: 'acquisition_date'");
    expect(blueprints).toContain("key: 'ownership'");
    expect(blueprints).toContain("title: 'Presentación Modelo 210'");
    expect(blueprints).toContain('humanApprovalRequired: true');
  });

  it('collects structured IRNR data inside the client case', () => {
    expect(casePage).toContain('<IrnrCaseQuestionnaire');
    expect(casePage).toContain("note.item_key === 'irnr-intake'");
    expect(questionnaire).toContain("itemKey: 'irnr-intake'");
    expect(questionnaire).toContain('Fecha de adquisición');
    expect(questionnaire).toContain('Titulares no residentes');
    expect(questionnaire).toContain('Periodos de alquiler e ingresos');
    expect(questionnaire).toContain('El inmueble se vendió durante este ejercicio');
  });

  it('documents the unit pricing on the service', () => {
    expect(catalog).toContain('80 € + IVA la primera unidad declarativa');
    expect(catalog).toContain('30 € + IVA cada unidad adicional');
  });
});
