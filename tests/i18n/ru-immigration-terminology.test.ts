import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
describe('immigration ES terms explained on RU Ukraine long-term pages',()=>{
 const source=readFileSync('components/content/UkraineLongTermPage.tsx','utf8');
 it('preserves official names while describing meaning in Russian',()=>{
  for(const t of ['вид на жительство в Испании (residencia de larga duración nacional)','временной защиты (protección temporal)','(residencia legal y continuada)','(resolución de concesión)','административного дела (expediente)','(requerimientos)','(tasas)'])expect(source).toContain(t);
 });
 it('sets reciprocal metadata and matching article language links',()=>{
  const pairs=[
   ['app/(public)/blog/proteccion-temporal-ucrania-larga-duracion-2026/page.tsx','app/(localized)/ru/blog/ukraina-proteccion-temporal-larga-duracion-2026/page.tsx'],
   ['app/(public)/blog/guia-ex11-larga-duracion-nacional/page.tsx','app/(localized)/ru/blog/instruktsiya-ex11-larga-duracion/page.tsx'],
   ['app/(public)/servicios/extranjeria-nacionalidad/residencia-larga-duracion-nacional-ucrania/page.tsx','app/(localized)/ru/uslugi/residencia-larga-duracion-nacional-ucrania/page.tsx'],
  ];
  for(const pair of pairs)for(const p of pair){
   const content=readFileSync(p,'utf8');
   expect(content).toContain("'es-ES'");
   expect(content).toContain("'ru-RU'");
   expect(content).toContain('canonical:');
  }
  expect(source).toContain("paths[isRu ? 'es' : 'ru'][kind]");
 });
 it('keeps source and ES/RU page pairs',()=>{
  expect(source).toContain('Instrucciones SEM 2/2026');
  expect(source).toContain('/blog/proteccion-temporal-ucrania-larga-duracion-2026');
  expect(source).toContain('/ru/blog/ukraina-proteccion-temporal-larga-duracion-2026');
 });
});