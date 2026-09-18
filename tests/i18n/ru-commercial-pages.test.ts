import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { EXPERT_IDENTITY } from '@/config/identity';
import { RU_COMMERCIAL_DATA } from '@/lib/i18n/ru-commercial-data';
import { RU_PUBLIC_CONTENT } from '@/lib/i18n/ru-public-content';
import { MONTHLY_PLANS_KNOWLEDGE } from '@/lib/data/kia-knowledge/monthly-plans';
import { holdedPackStarterKnowledge } from '@/lib/data/kia-knowledge/holded-pack-starter';
import { holdedMigracionSinInventarioKnowledge } from '@/lib/data/kia-knowledge/holded-migracion-sin-inventario';
import { holdedMigracionConInventarioKnowledge } from '@/lib/data/kia-knowledge/holded-migracion-con-inventario';

const root = process.cwd();
const commercialSource = fs.readFileSync(path.join(root, 'lib/i18n/ru-commercial-data.ts'), 'utf8');
const pageSource = fs.readFileSync(path.join(root, 'components/i18n/RuPublicPage.tsx'), 'utf8');
const footerSource = fs.readFileSync(path.join(root, 'components/i18n/RuSiteFooter.tsx'), 'utf8');

describe('RU commercial pages', () => {
  it('reuses canonical Holded and monthly-plan prices', () => {
    const holded = RU_COMMERCIAL_DATA.holded?.offers ?? [];
    expect(holded.map((item) => item.price)).toEqual([
      holdedPackStarterKnowledge.price,
      holdedMigracionSinInventarioKnowledge.price,
      holdedMigracionConInventarioKnowledge.price,
    ]);

    const plans = RU_COMMERCIAL_DATA.plans?.offers ?? [];
    expect(plans.map((item) => item.price)).toEqual([
      MONTHLY_PLANS_KNOWLEDGE.supervision.price,
      MONTHLY_PLANS_KNOWLEDGE.avanzado.price,
      MONTHLY_PLANS_KNOWLEDGE.colaborativo.price,
      MONTHLY_PLANS_KNOWLEDGE.personalizado.price,
    ]);

    expect(commercialSource).not.toContain("price: '499 € + IVA'");
    expect(commercialSource).not.toContain("price: '899 € + IVA'");
    expect(commercialSource).not.toContain("price: '1.199 € + IVA'");
    expect(commercialSource).not.toContain("price: '49 €/mes + IVA'");
  });

  it('describes SIF and VERI*FACTU without presenting VERI*FACTU as the only mandatory mode', () => {
    const page = RU_COMMERCIAL_DATA.verifactu;
    expect(RU_PUBLIC_CONTENT.verifactu.eyebrow).toContain('SIF');
    expect(RU_PUBLIC_CONTENT.verifactu.description).toContain('VERI*FACTU — одна из предусмотренных моделей');
    expect(page?.sections?.[0]?.text).toContain('VERI*FACTU — одна из предусмотренных законом моделей');
    expect(page?.sections?.[0]?.items).toContain('Для налогоплательщиков Impuesto sobre Sociedades системы должны быть адаптированы до 1 января 2027 года.');
    expect(page?.sections?.[0]?.items).toContain('Для остальных затронутых компаний и autónomos, использующих SIF, — до 1 июля 2027 года.');
  });

  it('keeps Academy positioning private and non-regulated', () => {
    expect(RU_PUBLIC_CONTENT.academy.description).toContain('Частное нерегулируемое обучение');
    expect(RU_COMMERCIAL_DATA.academy?.notice?.text).toContain('частное обучение');
    expect(RU_COMMERCIAL_DATA.academy?.notice?.text).toContain('не представляем программу как официальный государственный диплом');
  });

  it('keeps Holded untranslated and uses the canonical public EXPERT identity', () => {
    expect(commercialSource).not.toContain('Холдед');
    expect(EXPERT_IDENTITY.credentials.holdedSolutionPartner).toBe('Holded Solution Partner');
    expect(EXPERT_IDENTITY.credentials.aeatSocialCollaborator).toBe('Colaborador social de la Agencia Tributaria');
    expect(EXPERT_IDENTITY.publicEmail).toBe('info@expertconsulting.es');
    expect(pageSource).toContain('EXPERT_IDENTITY.credentials.holdedSolutionPartner');
    expect(pageSource).toContain('EXPERT_IDENTITY.credentials.aeatSocialCollaborator');
    expect(footerSource).toContain('EXPERT_IDENTITY.publicEmail');
    expect(footerSource).toContain('EXPERT_IDENTITY.phoneDisplay');
  });
});
