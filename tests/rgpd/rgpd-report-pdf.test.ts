import { describe,it,expect } from 'vitest';
import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
import { execFileSync } from 'node:child_process';
import { RgpdReportPdf, type RgpdReportData } from '../../components/tools/RgpdReportPdf';

function documentFor(locale:'es'|'ru'){
  const data:RgpdReportData={
    name:locale==='ru'?'Мария Тест':'María Prueba',locale,date:'15/10/2026',
    primary:'facilita-emprende',toolTitle:'Facilita EMPRENDE',toolUrl:'https://www.aepd.es/guias-y-herramientas/herramientas/facilita-emprende',
    topics:[{title:locale==='ru'?'Контроль доступа':'Control de accesos',why:locale==='ru'?'Важно защищать данные':'Es necesario proteger los datos',action:locale==='ru'?'Проверьте права доступа':'Revisa los permisos',guideUrl:'https://expertconsulting.es/herramientas/rgpd'}],
    extraReview:false
  };
  return createElement(RgpdReportPdf,{data}) as unknown as Parameters<typeof pdf>[0];
}
describe('RGPD PDF rendering (without lead creation)',()=>{
 it('builds a valid downloadable Spanish PDF',async()=>{
   const buffer=Buffer.from(await (await pdf(documentFor('es')).toBlob()).arrayBuffer());
   expect(buffer.subarray(0,4).toString()).toBe('%PDF');
   expect(buffer.length).toBeGreaterThan(500);
   // Poppler checks the actual PDF text layer, not just the %PDF signature.
   const text = execFileSync('pdftotext',['-','-'],{input:buffer,timeout:12000}).toString('utf8');
   expect(text).toContain('María Prueba');
   expect(text).toContain('Guía inicial de protección de datos');
   expect(buffer.toString('latin1')).toContain('/URI');
 },30000);
 it('builds a Cyrillic document using Noto Sans, no lead created',async()=>{
   const buffer=Buffer.from(await (await pdf(documentFor('ru')).toBlob()).arrayBuffer());
   expect(buffer.subarray(0,4).toString()).toBe('%PDF');
   expect(buffer.length).toBeGreaterThan(500);
   const text = execFileSync('pdftotext',['-','-'],{input:buffer,timeout:15000}).toString('utf8');
   expect(text).toContain('Мария Тест');
   expect(text).toContain('Первоначальная памятка по RGPD');
   expect(text).toContain('Контроль доступа');
   const fonts = execFileSync('pdffonts',['-'],{input:buffer,timeout:12000}).toString('utf8');
   expect(fonts).toMatch(/NotoSans/i);
   expect(buffer.toString('latin1')).toContain('/URI');
 },60000);
});
