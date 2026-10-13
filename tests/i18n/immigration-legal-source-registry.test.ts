import { describe,expect,it } from 'vitest';
import {readFileSync} from 'node:fs';
import {IMMIGRATION_REVIEWED_GUIDES,IMMIGRATION_REVIEWED_SOURCES,toImmigrationGuideBody} from '@/lib/content/immigration-reviewed-2026';
import {reviewedImmigrationEsDocs} from '@/lib/content/immigration-reviewed-docs';
describe('reviewed immigration ES/RU legal release',()=>{
 it('has identical section IDs for Spanish and Russian content',()=>{
  expect(IMMIGRATION_REVIEWED_GUIDES).toHaveLength(2);
  for(const guide of IMMIGRATION_REVIEWED_GUIDES){
   expect(guide.sections.length).toBeGreaterThanOrEqual(5);
   for(const section of guide.sections){expect(section.es.length).toBeGreaterThan(10);expect(section.ru.length).toBeGreaterThan(10);expect(section.pEs.length).toBeGreaterThan(60);expect(section.pRu.length).toBeGreaterThan(60);}
   expect(toImmigrationGuideBody(guide.id,'es')).toContain('Fuentes oficiales');
   expect(toImmigrationGuideBody(guide.id,'ru')).toContain('Официальные источники');
  }
  expect(reviewedImmigrationEsDocs.map(x=>x.slug)).toEqual(IMMIGRATION_REVIEWED_GUIDES.map(x=>x.esSlug));
 });
 it('replaces old Spanish descriptions without duplicate canonical entries',()=>{
  const docs=readFileSync('lib/utils/docs.ts','utf8');
  expect(docs).toContain('...reviewedImmigrationEsDocs');
  expect(docs).not.toContain("slug: 'permiso-residencia-inicial-vias-y-documentos'");
  expect(docs).not.toContain("slug: 'renovacion-residencia-temporal-y-larga-duracion'");
 });
 it('maintains dated source registry and revision history',()=>{
  const registry=JSON.parse(readFileSync('docs/i18n/immigration-official-source-registry-2026-10-13.json','utf8'));
  expect(registry.sources.length).toBeGreaterThanOrEqual(7);
  expect(registry.changeEvents.some((event:{publishedOn:string})=>event.publishedOn==='2026-09-22')).toBe(true);
  for(const x of registry.reviewedDocs){expect(x.reviewedOn).toBe('2026-10-13');expect(x.localePair).toMatch(/^\/ru\/docs\//);expect(x.originSourceIds.length).toBeGreaterThan(0);}
  expect(IMMIGRATION_REVIEWED_SOURCES.length).toBeGreaterThanOrEqual(9);
 });
 it('keeps reciprocal SEO and Russian language tags',()=>{
  const es=readFileSync('app/(public)/docs/[slug]/page.tsx','utf8');
  expect(es).toContain('IMMIGRATION_REVIEWED_GUIDES');
  for(const guide of IMMIGRATION_REVIEWED_GUIDES){
   const path='app/(localized)/ru/docs/'+guide.ruSlug+'/page.tsx';
   const page=readFileSync(path,'utf8');
   expect(page).toContain("shouldIndexLocale('ru')");
   expect(page).toContain("'es-ES'");
   expect(page).toContain("'ru-RU'");
  }
 });
});