import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { getCatalogService } from '@/lib/utils/catalog';
import { getRuServicePath } from '@/lib/services/service-localized-content';
const cases = [
  ['modelo-151','modelo-151-regimen-beckham'],
  ['impuesto-patrimonio','impuesto-patrimonio-modelo-714'],
  ['impuesto-sociedades','impuesto-sociedades-modelo-200'],
] as const;
describe('Three priority Russian tax services', () => {
 it('have routes mapped to canonical catalog services', () => {
   for (const [slug, route] of cases) {
     expect(getCatalogService(slug)).toBeDefined();
     expect(getRuServicePath(slug)).toBe('/ru/uslugi/'+route);
     const page=readFileSync('app/(localized)/ru/uslugi/'+route+'/page.tsx','utf8');
     expect(page).toContain("robots: { index: false, follow: true }");
     expect(page).toContain('PriorityRussianService');
   }
 });
 it('never duplicates prices or Stripe IDs', () => {
   const component=readFileSync('components/services/PriorityRussianService.tsx','utf8');
   expect(component).toContain('getCatalogService(slug)');
   expect(component).toContain('service.price');
   expect(component).not.toContain('stripePriceId:');
 });
});
