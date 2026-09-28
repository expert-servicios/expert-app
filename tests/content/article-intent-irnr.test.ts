import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('article intent CTA and IRNR funnel', () => {
  const cta = source('components/content/ArticleIntentCTA.tsx');
  const calculator = source('components/services/IrnrPriceCalculator.tsx');
  const docsPage = source('app/(public)/docs/[slug]/page.tsx');
  const blogPage = source('app/(public)/blog/[slug]/page.tsx');
  const consultation = source('app/api/consultas-gratuitas/route.ts');
  const casePage = source('app/(protected)/dashboard/expedientes/[id]/page.tsx');
  const blueprint = source('lib/services/service-operational-blueprints.ts');
  const catalog = source('lib/utils/catalog.ts');

  it('offers the three article intents plus KIA chat and Telegram', () => {
    expect(cta).toContain('Tengo una consulta');
    expect(cta).toContain('Quiero este servicio');
    expect(cta).toContain('Reunión informativa · 15 min');
    expect(cta).toContain('/dashboard?kia=open');
    expect(cta).toContain('https://t.me/kia_expert_bot');
    expect(cta).not.toContain('wa.me');
  });

  it('renders the universal CTA after docs and blog content', () => {
    expect(docsPage).toContain('<ArticleIntentCTA');
    expect(docsPage).toContain('sourceKind="docs"');
    expect(blogPage).toContain('<ArticleIntentCTA');
    expect(blogPage).toContain('sourceKind="blog"');
  });

  it('calculates IRNR quote units using 80 + 30 per additional property-holder unit', () => {
    expect(calculator).toContain('80 + Math.max(0, units - 1) * 30');
    expect(calculator).toContain('property.holders');
    expect(calculator).toContain('Unidades declarativas estimadas');
    expect(catalog).toContain('80 € + IVA la primera unidad declarativa');
    expect(catalog).toContain('30 € + IVA cada unidad adicional');
  });

  it('routes rented property estimates to review instead of treating them as standard imputed income', () => {
    expect(calculator).toContain('hasRental');
    expect(calculator).toContain('Los periodos de alquiler requieren revisar el alcance');
  });

  it('stores free questions as attributed leads for demand analysis', () => {
    expect(consultation).toContain("category: 'Consulta gratuita'");
    expect(consultation).toContain("intent: 'free_question'");
    expect(consultation).toContain('origin: parsed.data.origin');
    expect(consultation).toContain('notifyAdmins');
  });

  it('creates a specialized IRNR case blueprint and post-contract questionnaire', () => {
    expect(blueprint).toContain("slug: 'no-residentes'");
    expect(blueprint).toContain("key: 'acquisition_date'");
    expect(blueprint).toContain("key: 'ibi'");
    expect(casePage).toContain('<IrnrCaseQuestionnaire');
    expect(casePage).toContain("note.item_key === 'irnr-intake'");
  });
});
