import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NATIONALITY_MINOR_SERVICE } from '@/lib/services/nationality-minor';

const read = (path: string) => readFileSync(path, 'utf8');

describe('nationality minor service content and pricing', () => {
  it('keeps the canonical economic breakdown consistent', () => {
    expect(NATIONALITY_MINOR_SERVICE.professionalNetCents).toBe(25000);
    expect(NATIONALITY_MINOR_SERVICE.professionalGrossCents).toBe(30250);
    expect(NATIONALITY_MINOR_SERVICE.officialFeeCents).toBe(10405);
    expect(NATIONALITY_MINOR_SERVICE.totalCents).toBe(40655);
    expect(
      NATIONALITY_MINOR_SERVICE.professionalGrossCents +
      NATIONALITY_MINOR_SERVICE.officialFeeCents,
    ).toBe(NATIONALITY_MINOR_SERVICE.totalCents);
  });

  it('has no obsolete fee wording in the canonical catalog entry', () => {
    const source = read('lib/utils/catalog.ts');
    const start = source.indexOf("slug: 'nacionalidad-espanola-menor-nacido-en-espana'");
    const end = source.indexOf("\n  {\n    slug:", start + 10);
    const block = source.slice(start, end);

    expect(block).not.toContain('104,05 € no incluida');
    expect(block).not.toContain('se abonará aparte');
    expect(block).not.toContain('Instrucciones para el pago de la tasa');
    expect(block).toContain('104,05 € como suplido');
    expect(block).toContain('total a pagar: 406,55 €');
  });

  it('does not rewrite SSR copy through the cart button', () => {
    const source = read('components/services/AddToCartButton.tsx');
    expect(source).not.toContain('rewriteVisibleClientCopy');
    expect(source).not.toContain('CLIENT_COPY_REPLACEMENTS');
    expect(source).toContain('NATIONALITY_MINOR_SERVICE.disbursementKey');
  });

  it('uses the minor own legal residence and age-specific representation in viability', () => {
    const source = read('lib/data/viability-checks.ts');
    const start = source.indexOf('const nacionalidad_menor: ViabilityCheck');
    const end = source.indexOf('// ── Permiso Inicial de Residencia', start);
    const block = source.slice(start, end);

    expect(block).toContain('residencia_menor_12m');
    expect(block).toContain('legal, continuada e inmediatamente anterior');
    expect(block).toContain("value: 'menos_14'");
    expect(block).toContain("value: '14_17'");
    expect(block).toContain('La residencia relevante es la del menor solicitante');
    expect(block).toContain('exentos de CCSE');
    expect(block).toContain('exentos de DELE A2');
  });

  it('explains age, educational evidence and exam exemptions in ES and RU pages', () => {
    const es = read('app/(public)/servicios/extranjeria-nacionalidad/nacionalidad-espanola-menor-nacido-en-espana/page.tsx');
    const ru = read('app/(localized)/ru/uslugi/grazhdanstvo-ispanii-rebenok-rozhdennyy-v-ispanii/page.tsx');

    expect(es).toContain('Entre 14 y 17 años');
    expect(es).toContain('exentos de la prueba CCSE');
    expect(es).toContain('exentos del DELE A2');
    expect(es).toContain('Certificado del centro escolar o educativo');

    expect(ru).toContain('В возрасте 14–17 лет');
    expect(ru).toContain('освобождены от CCSE');
    expect(ru).toContain('от DELE A2');
    expect(ru).toContain('Справка из школы или учебного центра');
  });

  it('keeps the knowledge guide aligned with the mandatory disbursement', () => {
    const source = read('lib/utils/docs.ts');
    expect(source).not.toContain('Esta tasa se abona aparte de los honorarios profesionales');
    expect(source).toContain('suplido obligatorio');
    expect(source).toContain('Entre 14 y 17 años');
  });
});
