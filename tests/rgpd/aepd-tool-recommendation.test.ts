import { describe,expect,it } from 'vitest';
import { recommendAepdTools } from '../../lib/rgpd/aepd-tool-recommendation';

describe('AEPD tool suggestions: indicative, privacy-first',()=>{
 it('recommends basic tool for ordinary low signal profile',()=>{
   expect(recommendAepdTools({businessType:'ordinary',employees:false,website:false,special:false,profiling:false}).primary).toBe('facilita-rgpd');
 });
 it('routes a digital startup to Facilita Emprende',()=>{
   const r=recommendAepdTools({businessType:'startup',profiling:false});
   expect(r.primary).toBe('facilita-emprende');
 });
 it('adds risk organization alongside startup when profiling appears',()=>{
   const r=recommendAepdTools({businessType:'startup',profiling:true});
   expect(r.primary).toBe('facilita-emprende');
   expect(r.complementary).toContain('gestiona-rgpd');
   expect(r.needsProfessionalReview).toBe(true);
 });
 it('routes diverse treatments to Gestiona RGPD',()=>{
   expect(recommendAepdTools({businessType:'multiple'}).primary).toBe('gestiona-rgpd');
 });
 it('fails to professional review if type unknown or high risk is uncertain',()=>{
   const r=recommendAepdTools({businessType:'ordinary',special:'unknown'});
   expect(r.primary).toBe('gestiona-rgpd');
   expect(r.needsProfessionalReview).toBe(true);
 });
 it('warns immediately for unresolved breach and does not indicate compliance',()=>{
   const r=recommendAepdTools({businessType:'ordinary',breach:true});
   expect(r.needsProfessionalReview).toBe(true);
   expect(r.cautions.join(' ')).toMatch(/brecha/i);
   expect(JSON.stringify(r)).not.toMatch(/certified|compliant/i);
 });
});
