import { describe,it,expect } from 'vitest';
import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
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
 },30000);
 it('builds a Cyrillic document using Noto Sans, no lead created',async()=>{
   const buffer=Buffer.from(await (await pdf(documentFor('ru')).toBlob()).arrayBuffer());
   expect(buffer.subarray(0,4).toString()).toBe('%PDF');
   expect(buffer.length).toBeGreaterThan(500);
 },60000);
});
