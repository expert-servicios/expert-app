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
    expect(block).not.toContain("title: 'Pago de tasa administrativa'");
    expect(block).not.toContain("'Tasa administrativa del Ministerio de Justicia: 104,05 €'");
    expect(block).toContain('104,05 € como suplido');
    expect(block).toContain('total a pagar: 406,55 €');
  });

  it('does not rewrite SSR copy through the cart button', () => {
    const source = read('components/services/AddToCartButton.tsx');
    expect(source).not.toContain('rewriteVisibleClientCopy');
    expect(source).not.toContain('CLIENT_COPY_REPLACEMENTS');
    expect(source).toContain('NATIONALITY_MINOR_SERVICE.disbursementKey');
    expect(source).toContain('displayPrice: NACIONALIDAD_MENOR_DISPLAY_PRICE');
  });

  it('keeps the noindex Russian nationality page out of the sitemap', () => {
    const sitemap = read('app/sitemap.ts');
    expect(sitemap).toContain(".filter((routeKey) => routeKey !== 'nationalityMinor')");
  });

  it('passes Stripe charged totals into nationality payment emails', () => {
    const webhook = read('app/api/stripe/webhook/route.ts');
    const sender = read('lib/email/send.ts');
    expect(webhook).toContain('stripe_total_cents: session.amount_total ?? null');
    expect(sender).toContain("stripeTotalCents: centsMetadata(input.metadata ?? {}, 'stripe_total_cents')");
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

  it('treats registry surnames as an explicit pre-application gate', () => {
    const viability = read('lib/data/viability-checks.ts');
    const blueprint = read('lib/services/service-operational-blueprints.ts');

    expect(viability).toContain("id: 'apellidos_actuales'");
    expect(viability).toContain("value: 'uno'");
    expect(viability).toContain('No pedir el certificado de nacimiento de la madre por defecto');
    expect(viability).toContain('no se han cerrado los apellidos registrales');

    expect(blueprint).toContain("key: 'registry_surnames'");
    expect(blueprint).toContain("key: 'confirm_registry_surnames'");
    expect(blueprint).toContain("phase: 'registry_data'");
    expect(blueprint).toContain("key: 'maternal_birth_surname_evidence'");
    expect(blueprint).toContain('No solicitar por defecto. Solo cuando la familia elija esta opción.');
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

  it('links surname guidance from the service and confirmation email template', () => {
    const page = read('app/(public)/servicios/extranjeria-nacionalidad/nacionalidad-espanola-menor-nacido-en-espana/page.tsx');
    const templates = read('lib/email/templates.ts');
    const blog = read('lib/utils/blog.ts');
    const docs = read('lib/utils/docs.ts');

    expect(page).toContain('/docs/apellidos-menor-nacionalidad-registro-civil');
    expect(page).toContain('/blog/apellidos-menor-nacionalidad-espanola-registro-civil');
    expect(page).toContain('Esta segunda opción es voluntaria');
    expect(templates).toContain('nationalityMinorDataConfirmationRu');
    expect(templates).toContain('/ru/docs/familii-rebenka-pri-poluchenii-grazhdanstva-ispanii');
    expect(templates).toContain('/ru/blog/odna-familiya-u-rebenka-grazhdanstvo-ispanii');
    expect(blog).toContain("slug: 'apellidos-menor-nacionalidad-espanola-registro-civil'");
    expect(docs).toContain("slug: 'apellidos-menor-nacionalidad-registro-civil'");
  });

  it('keeps the knowledge guide aligned with the mandatory disbursement', () => {
    const source = read('lib/utils/docs.ts');
    expect(source).not.toContain('Esta tasa se abona aparte de los honorarios profesionales');
    expect(source).toContain('suplido obligatorio');
    expect(source).toContain('Entre 14 y 17 años');
  });
});
