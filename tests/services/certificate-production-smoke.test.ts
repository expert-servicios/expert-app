import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

const ruPages = [
  'app/(localized)/ru/uslugi/cifrovoi-sertifikat-fizicheskogo-litsa/page.tsx',
  'app/(localized)/ru/uslugi/cifrovoi-sertifikat-organizatsii/page.tsx',
  'app/(localized)/ru/uslugi/paket-cifrovyh-sertifikatov/page.tsx',
];

describe('certificate production smoke regressions', () => {
  it('publishes only the audited RU certificate pages for indexing', () => {
    for (const path of ruPages) {
      const page = read(path);
      expect(page).toContain('index: true');
      expect(page).toContain('follow: true');
      expect(page).not.toContain("shouldIndexLocale('ru')");
      expect(page).toContain('twitter: {');
    }
  });

  it('keeps audited RU certificate routes in sitemap even while global RU indexing remains gated', () => {
    const sitemap = read('app/sitemap.ts');
    const explicit = sitemap.slice(
      sitemap.indexOf('const certificateRussianRoutes'),
      sitemap.indexOf("const russianRoutes"),
    );

    expect(explicit).toContain('/ru/uslugi/cifrovoi-sertifikat-fizicheskogo-litsa');
    expect(explicit).toContain('/ru/uslugi/cifrovoi-sertifikat-organizatsii');
    expect(explicit).toContain('/ru/uslugi/paket-cifrovyh-sertifikatov');
    expect(sitemap).toContain('...certificateRussianRoutes');
    expect(sitemap).toContain("shouldIndexLocale('ru')");
  });

  it('keeps the RU personal certificate fully online', () => {
    const page = read(ruPages[0]);
    expect(page).toContain('Creative Quality');
    expect(page).not.toContain('очно или по видеосвязи');
  });
});
