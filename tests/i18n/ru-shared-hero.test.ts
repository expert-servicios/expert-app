import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
describe('ES/RU shared homepage hero', () => {
  it('uses the same component for Spanish and Russian home', () => {
    const es = readFileSync('app/(public)/page.tsx','utf8');
    const ru = readFileSync('components/i18n/RuPublicPage.tsx','utf8');
    const hero = readFileSync('components/site/Hero.tsx','utf8');
    expect(es).toContain('<Hero />');
    expect(ru).toContain('<Hero locale="ru" />');
    expect(hero).toContain("locale = 'es'");
    expect(hero).toContain("heroBackgroundImage");
    expect(hero).toContain("/ru/konsultatsiya");
    expect(hero).toContain("/ru/plany");
  });
});