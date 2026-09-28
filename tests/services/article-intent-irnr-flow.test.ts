import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('article intent CTA and IRNR funnel', () => {
  const cta = source('components/content/ArticleIntentCTA.tsx');
  const calc = source('components/services/IrnrPriceCalculator.tsx');
  const docsPage = source('app/(public)/docs/[slug]/page.tsx');
  const blogPage = source('app/(public)/blog/[slug]/page.tsx');
  const consultation = source('components/site/FreeConsultationForm.tsx');
  const consultationApi = source('app/api/consultas-gratuitas/route.ts');
  const blueprint = source('lib/services/service-operational-blueprints.ts');
  const casePage = source('app/(protected)/dashboard/expedientes/[id]/page.tsx');
  const questionnaire = source('components/cases/IrnrCaseQuestionnaire.tsx');

  it('offers three clear intents below articles', () => {
    expect(cta).toContain('Tengo una consulta');
    expect(cta).toContain('Quiero este servicio');
    expect(cta).toContain('Reunión informativa · 15 min');
    expect(cta).toContain('/consulta-gratuita');
    expect(cta).toContain('/cita?tipo=consulta-inicial');
    expect(cta).toContain('https://t.me/kia_expert_bot');
  });

  it('removes WhatsApp from article CTAs', () => {
    expect(docsPage).not.toContain('wa.me');
    expect(blogPage).not.toContain('wa.me');
  });

  it('calculates IRNR pricing by property-holder unit', () => {
    expect(calc).toContain('80 + Math.max(0, units - 1) * 30');
    expect(calc).toContain('Titulares no residentes');
    expect(calc).toContain('Está alquilado');
    expect(calc).toContain('Unidades declarativas estimadas');
  });

  it('captures free questions as demand leads', () => {
    expect(consultation).toContain("fetch('/api/consultas-gratuitas'");
    expect(consultationApi).toContain("category: 'Consulta gratuita'");
    expect(consultationApi).toContain("intent: 'free_question'");
    expect(consultationApi).toContain("title: 'Nueva consulta gratuita'");
  });

  it('creates a post-contract IRNR workflow', () => {
    expect(blueprint).toContain("slug: 'no-residentes'");
    expect(blueprint).toContain("key: 'acquisition_date'");
    expect(blueprint).toContain("key: 'ownership'");
    expect(blueprint).toContain("key: 'ibi'");
    expect(blueprint).toContain("title: 'Presentar Modelo 210'");
  });

  it('shows a property questionnaire inside the IRNR case', () => {
    expect(casePage).toContain('IrnrCaseQuestionnaire');
    expect(casePage).toContain("service_id?.split(',').includes('no-residentes')");
    expect(questionnaire).toContain("itemKey:'irnr-intake'");
    expect(questionnaire).toContain('Fecha de adquisición');
    expect(questionnaire).toContain('Porcentaje de titularidad');
  });
});
