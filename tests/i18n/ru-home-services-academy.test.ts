import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
describe('shared ES/RU services and Academy homepage blocks', () => {
 const es = readFileSync('app/(public)/page.tsx','utf8');
 const ru = readFileSync('components/i18n/RuPublicPage.tsx','utf8');
 const shared = readFileSync('components/site/SharedHomeServicesAcademy.tsx','utf8');
 it('uses the same service and Academy components for both languages', () => {
  for (const name of ['SharedHomeServices','SharedHomeFeaturedServices','SharedHomeAcademy']) {
    expect(es).toContain('<'+name+' />');
    expect(ru).toContain('<'+name+' locale="ru" />');
  }
 });
 it('shares program prices without RU-specific Stripe identifiers', () => {
  expect(shared).toContain('academyPrograms.map');
  expect(shared).toContain('{program.price}');
  expect(shared).not.toContain('stripePriceId:');
 });
 it('does not synthesize nonexistent translated destinations', () => {
  expect(shared).toContain('localizePublicShellHref(locale, href)');
  expect(shared).toContain('localizePublicShellHref(locale, "/academy")');
 });
});
