import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const es = source('components/services/PrivacyAndCompanyServices.tsx');
const ru = source('lib/i18n/ru-nationality-resources.ts');
const esBlog = source('lib/content/proteccion-datos-blog.ts');
const esDocs = source('lib/content/proteccion-datos-docs.ts');
describe('RGPD bilingual content launch guard', () => {
  it('offers separately priced existing SL services and quote-only RGPD', () => {
    expect(es).toContain('490,00 € + IVA');
    expect(es).toContain('180,00 € + IVA');
    expect(es).toContain('servicio=proteccion-datos-rgpd');
    expect(es).toContain('Un presupuesto por alcance');
    expect(es).not.toContain('750,00 €');
  });
  it('links official sources and keeps free tool distinct from consultancy', () => {
    for (const url of ['eur-lex.europa.eu/eli/reg/2016/679', 'BOE-A-2018-16673','BOE-A-2002-13758']) expect(es).toContain(url);
    expect(es).toContain('/herramientas/rgpd');
    expect(es).toContain('no certifica el cumplimiento');
  });
  it('provides Russian paired materials and two original ES resources', () => {
    const ruSlugs = ['rgpd-dlya-malogo-biznesa','cookies-formy-rgpd','postavshchiki-cloud-ii-rgpd','privatnost-platformy-professionalov','proverka-rgpd-dlya-biznesa','reestr-obrabotok-rat','privatnost-formy-cookies','politika-konfidentsialnosti-platformy'];
    for (const slug of ruSlugs) expect(ru).toContain(slug);
    expect(esBlog).toContain('privacidad-plataformas-profesionales-responsables');
    expect(esDocs).toContain('politica-privacidad-plataformas-checklist');
  });
});
