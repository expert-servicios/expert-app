import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

const indexableRuServicePages = [
  'app/(localized)/ru/uslugi/cifrovoi-sertifikat-fizicheskogo-litsa/page.tsx',
  'app/(localized)/ru/uslugi/cifrovoi-sertifikat-organizatsii/page.tsx',
  'app/(localized)/ru/uslugi/paket-cifrovyh-sertifikatov/page.tsx',
  'app/(localized)/ru/uslugi/arraigo-social/page.tsx',
];

describe('RU localized service indexing', () => {
  it('uses per-service manifest plus public locale gate for robots', () => {
    for (const path of indexableRuServicePages) {
      const page = read(path);
      expect(page).toContain('getLocalizedServicePresentation');
      expect(page).toContain("isLocalePubliclyEnabled('ru')");
      expect(page).toContain('index: INDEXABLE');
      expect(page).toContain('follow: INDEXABLE');
      expect(page).not.toContain("shouldIndexLocale('ru')");
    }
  });

  it('keeps indexable localized services in sitemap independently from the global RU route gate', () => {
    const sitemap = read('app/sitemap.ts');
    const returnBlock = sitemap.slice(sitemap.indexOf('return ['));
    const globalRouteGate = sitemap.slice(
      sitemap.indexOf('const russianRoutes'),
      sitemap.indexOf('return ['),
    );

    expect(returnBlock).toContain('...russianServiceRoutes');
    expect(returnBlock).toContain('...russianRoutes');
    expect(globalRouteGate).not.toContain('...russianServiceRoutes');
    expect(sitemap).toContain(".filter((localized) => localized.indexable === true)");
  });

  it('keeps the RU certificate launch fully online and Creative Quality explicit', () => {
    const personal = read(indexableRuServicePages[0]);
    const entity = read(indexableRuServicePages[1]);
    const bundle = read(indexableRuServicePages[2]);

    for (const page of [personal, entity, bundle]) {
      expect(page).toContain('Creative Quality');
      expect(page).not.toContain('очно или по видеосвязи');
    }

    expect(personal).toContain("title: 'Цифровой сертификат Camerfirma для физического лица | EXPERT'");
    expect(entity).toContain("title: 'Цифровой сертификат Camerfirma для компании | EXPERT'");
    expect(bundle).toContain("title: 'Пакет Camerfirma: физлицо + компания | 200 € + IVA'");
  });
});
