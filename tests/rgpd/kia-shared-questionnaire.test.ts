import { describe,it,expect } from 'vitest';
import { RGPD_QUESTIONS,getRgpdQuestion,validateRgpdAnswers,evaluateRgpdAssessment } from '@/lib/rgpd/assessment-contract';
import { recommendAepdTools } from '@/lib/rgpd/aepd-tool-recommendation';
import { readFileSync } from 'node:fs';
describe('KIA and web use same closed RGPD test',()=>{
 it('has thirteen identical ES/RU questions and option identifiers',()=>{
   expect(RGPD_QUESTIONS).toHaveLength(13);
   for(let i=0;i<RGPD_QUESTIONS.length;i++){
     const es=getRgpdQuestion(i,'es'),ru=getRgpdQuestion(i,'ru');
     expect(es?.id).toBe(ru?.id);
     expect(es?.options.map(x=>x.value)).toEqual(ru?.options.map(x=>x.value));
   }
 });
 it('allows only ordered, closed answers',()=>{
   expect(validateRgpdAnswers({businessType:'startup'},1)).toBe(true);
   expect(validateRgpdAnswers({businessType:'unrecognized'},1)).toBe(false);
   expect(validateRgpdAnswers({special:true},1)).toBe(false);
   expect(validateRgpdAnswers({businessType:'startup',name:'PERSON'},2)).toBe(false);
 });
 it('does not declare health-data profiles low-risk',()=>{
   const answers={businessType:'startup' as const, special:true};
   expect(evaluateRgpdAssessment(answers).level).toBe('high');
   expect(recommendAepdTools(answers).primary).toBe('facilita-emprende');
   expect(recommendAepdTools(answers).complementary).toContain('gestiona-rgpd');
 });
 it('embeds the shared questions in both public forms and KIA widget',()=>{
   const es=readFileSync('components/tools/RgpdSelfAssessment.tsx','utf8');
   const ru=readFileSync('components/tools/RgpdAssessmentRu.tsx','utf8');
   const kia=readFileSync('components/tools/KiaRgpdGuidedPanel.tsx','utf8');
   const widget=readFileSync('components/site/KiaPublicWidget.tsx','utf8');
   expect(es).toContain('getRgpdQuestion');
   expect(ru).toContain('getRgpdQuestion');
   expect(kia).toContain('getRgpdQuestion');
   expect(widget).toContain('KiaRgpdGuidedPanel');
 });
});
