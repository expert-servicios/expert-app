import { describe,expect,it } from 'vitest';
import { readFileSync } from 'node:fs';
import { RGPD_PAIRED_PATHS, resolveRgpdPairedPath } from '@/lib/i18n/rgpd-routes';
import { getCatalogService } from '@/lib/utils/catalog';
import { getArticlesForService } from '@/lib/utils/blog';
import { getDocsForService } from '@/lib/utils/docs';

describe('RGPD public journey content consistency ES/RU',()=>{
 const serviceSlug='formacion-rgpd-aepd';
 it('keeps fixed-price training scope and 8 FAQs',()=>{
   const service=getCatalogService(serviceSlug);
   expect(service).toBeDefined();
   expect(service?.price).toContain('180 € + IVA');
   expect(service?.duration).toContain('2 horas');
   expect(service?.faqs?.length).toBeGreaterThanOrEqual(8);
   expect(service?.description.toLowerCase()).toContain('no es una auditoría');
 });
 it('cross-links 7 RGPD blog posts and 7 knowledge articles from service',()=>{
   const articles=getArticlesForService(serviceSlug);
   const docs=getDocsForService(serviceSlug);
   expect(articles).toHaveLength(7);
   expect(docs).toHaveLength(7);
   expect(new Set(articles.map(a=>a.slug)).size).toBe(articles.length);
   expect(new Set(docs.map(a=>a.slug)).size).toBe(docs.length);
 });
 it('maintains exact 6 reciprocal ES/RU links',()=>{
   expect(RGPD_PAIRED_PATHS).toHaveLength(6);
   for(const [es,ru] of RGPD_PAIRED_PATHS){
     expect(resolveRgpdPairedPath(es,'ru')).toBe(ru);
     expect(resolveRgpdPairedPath(ru,'es')).toBe(es);
   }
 });
 it('makes the public RGPD hub and KIA cite training consistently',()=>{
   const hub=readFileSync('app/(public)/herramientas/rgpd/page.tsx','utf8');
   const kia=readFileSync('lib/ai/kia/prompts/kia-rgpd-knowledge.ts','utf8');
   expect(hub).toContain('formacion-rgpd-aepd');
   expect(hub).toContain('180 € + IVA');
   expect(kia).toContain('180 € + IVA');
 });
 it('keeps lead capture disabled until explicit server and UI release flags',()=>{
   const api=readFileSync('app/api/rgpd/report/route.ts','utf8');
   const es=readFileSync('components/tools/RgpdSelfAssessment.tsx','utf8');
   const ru=readFileSync('components/tools/RgpdAssessmentRu.tsx','utf8');
   expect(api).toContain("process.env.RGPD_REPORT_ENABLED !== 'true'");
   expect(es).toContain("process.env.NEXT_PUBLIC_RGPD_REPORT_ENABLED === 'true'");
   expect(ru).toContain("process.env.NEXT_PUBLIC_RGPD_REPORT_ENABLED === 'true'");
 });
});
