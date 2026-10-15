import { describe, expect, it } from 'vitest';
import { getArticle } from '@/lib/utils/blog';
import { getDoc } from '@/lib/utils/docs';
import { buildAutomaticKiaKnowledgeResult, searchKiaKnowledgeResources } from '@/lib/ai/kia/kia-knowledge-discovery';

// Privacy-safe reproduction of the October 2026 customer need: never use real customer identifiers.
const question = 'He formateado mi ordenador y necesito reinstalar un certificado digital que usaba para mis gestiones. No sé si era Camerfirma o un certificado del trabajo. ¿Qué hago?';
describe('KIA digital-certificate recovery real-case regression', () => {
 it('retrieves a recovery article and issuer instructions from the live KIA knowledge index', () => {
   expect(getArticle('he-perdido-certificado-digital-formateado-ordenador')).toBeDefined();
   for (const issuer of ['fnmt','camerfirma','accv']) {
     const doc=getDoc('certificado-digital-nuevo-'+issuer);
     expect(doc?.body).toContain('https://');
     expect(doc?.relatedServiceSlugs).toContain('certificado-digital-persona-fisica');
   }
   const result=searchKiaKnowledgeResources({query:question,serviceSlug:'certificado-digital-persona-fisica',limit:10});
   expect(result.length).toBeGreaterThan(0);
   expect(result.some(row=>row.slug==='he-perdido-certificado-digital-formateado-ordenador')).toBe(true);
 });
 it('auto-surfaces resources without automatically initiating purchase', () => {
  const auto=buildAutomaticKiaKnowledgeResult({message:question,intent:'service_selection',serviceSlug:'certificado-digital-persona-fisica',existingToolResults:[]});
  expect(auto?.toolName).toBe('search_knowledge_resources');
  expect((auto?.result?.resources as unknown[])?.length).toBeGreaterThan(0);
 });
 it('makes recovery, employer-issued credential and optional sales explicit', () => {
  const article=getArticle('he-perdido-certificado-digital-formateado-ordenador')!;
  expect(article.body).toContain('no pidas un certificado nuevo');
  expect(article.body).toContain('empleado público');
  expect(article.body).toContain('opcional');
  expect(article.body).toContain('.p12');
  expect(article.body).toContain('.pfx');
 });
});