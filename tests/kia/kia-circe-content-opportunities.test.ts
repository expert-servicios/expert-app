import {describe,it,expect} from 'vitest';
import {proposeCirceContentOpportunities} from '../../lib/ai/kia/circe-content-opportunities';
describe('KIA CIRCE opportunity candidates: privacy and QA',()=>{
 it('suggests a fee guide from a redacted question',()=>{
  const result=proposeCirceContentOpportunities('¿Por qué me han cobrado más en la notaría?');
  expect(result.some(x=>x.topic==='notary_fees')).toBe(true);
  expect(result.every(x=>x.reviewRequired&&x.publicationStatus==='proposal_only')).toBe(true);
 });
 it('detects delay and CSV questions as different educational needs',()=>{
  const result=proposeCirceContentOpportunities('¿Cuánto tardan las horas hábiles y dónde verifico el CSV?');
  expect(result.map(x=>x.topic)).toContain('circe_deadlines');
  expect(result.map(x=>x.topic)).toContain('electronic_copy');
 });
 it('never copies private text into the suggested content',()=>{
  const pii='99999999Z persona@example.test';const result=proposeCirceContentOpportunities('Reclamar factura de notaría '+pii);
  expect(JSON.stringify(result)).not.toContain(pii);
  expect(JSON.stringify(result)).not.toContain('persona@example.test');
 });
 it('does not guess when signal is absent',()=>expect(proposeCirceContentOpportunities('hola')).toEqual([]));
 it('ignores oversized inputs',()=>expect(proposeCirceContentOpportunities('notaría '.repeat(1000))).toEqual([]));
});