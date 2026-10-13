import { describe,expect,it } from 'vitest';
import { laborEsBlogArticles,laborRuArticles } from '@/lib/content/labor-bilingual-2026';
import { readFileSync } from 'node:fs';
describe('bilingual labor editorial release gate',()=>{
 it('keeps two matching ES/RU articles and official sources',()=>{
  expect(laborEsBlogArticles).toHaveLength(2);
  expect(laborRuArticles).toHaveLength(2);
  for(const ru of laborRuArticles){expect(laborEsBlogArticles.some(es=>es.slug===ru.esSlug)).toBe(true);expect(ru.sections.length).toBeGreaterThanOrEqual(4);expect(ru.sections.some(s=>s.body.includes('(')&&s.body.includes(')'))).toBe(true);}
 });
 it('includes correct Spanish labor terms and excludes invented Holded capabilities',()=>{
  const x=JSON.stringify(laborRuArticles);
  for(const term of ['nómina','Seguridad Social','cotizaciones','Contrat@','Certific@2','base de cotización'])expect(x).toContain(term);
  expect(x).toContain('Sistema RED');
  expect(x).not.toContain('Holded автоматически отправляет');
 });
 it('shows ES articles in canonical blog and has distinct Russian routes',()=>{
  const blog=readFileSync('lib/utils/blog.ts','utf8');
  expect(blog).toContain('...laborEsBlogArticles');
  for(const ru of laborRuArticles)expect(readFileSync('app/(localized)/ru/blog/'+ru.slug+'/page.tsx','utf8')).toContain('RuLaborArticleSections');
 });
});