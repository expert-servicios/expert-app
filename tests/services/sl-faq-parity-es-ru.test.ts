import {describe,it,expect} from 'vitest';
import {getApprovedSlFaqs,getApprovedSlServiceFaqPairs} from '@/lib/services/sl-faq-bilingual';
import {getCatalogService} from '@/lib/utils/catalog';
describe('Service FAQ ES/RU approved translation contract',()=>{
 for(const [slug,n] of [['constitucion-sl',6],['constitucion-sl-circe',2]] as const){
 it(slug+' has matched visible Spanish/Russian FAQs',()=>{
  const pairs=getApprovedSlServiceFaqPairs(slug);
  expect(pairs).toHaveLength(n);
  expect(getApprovedSlFaqs(slug,'es')).toEqual(getCatalogService(slug)?.faqs);
  expect(getApprovedSlFaqs(slug,'ru')).toHaveLength(n);
  for(const p of pairs){expect(p.id).toBeTruthy();expect(p.es.q).toBeTruthy();expect(p.es.a).toBeTruthy();expect(p.ru.q).toMatch(/[А-Яа-яЁё]/);expect(p.ru.a).toMatch(/[А-Яа-яЁё]/);}
 });
 }
 it('differentiates CIRCE guided service from full delivery',()=>{
  expect(getApprovedSlFaqs('constitucion-sl-circe','ru')[0].a).toContain('180 € + IVA');
  expect(getApprovedSlFaqs('constitucion-sl-circe','ru')[0].a).toContain('499 € + IVA');
 });
});
