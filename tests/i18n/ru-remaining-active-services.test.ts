import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { getCatalogService } from '@/lib/utils/catalog';
import { getRuServicePath } from '@/lib/services/service-localized-content';
import { RU_REMAINING_SERVICES } from '@/components/services/RemainingRussianService';
describe('RU services without duplicating catalog', () => {
 it('maps all eight approved one-off services to existing route pages', () => {
  expect(Object.keys(RU_REMAINING_SERVICES)).toHaveLength(8);
  for (const [slug, data] of Object.entries(RU_REMAINING_SERVICES)) {
   expect(getCatalogService(slug)).toBeDefined();
   expect(getRuServicePath(slug)).toBe(data.path);
   const path='app/(localized)/ru'+data.path.slice('/ru'.length)+'/page.tsx';
   expect(readFileSync(path,'utf8')).toContain('RemainingRussianService');
  }
 });
 it('keeps discontinued monthly packages out of new Russian pages', () => {
  expect(Object.keys(RU_REMAINING_SERVICES)).not.toContain('contabilidad-mensual');
  expect(Object.keys(RU_REMAINING_SERVICES)).not.toContain('impuestos-trimestrales');
 });
});