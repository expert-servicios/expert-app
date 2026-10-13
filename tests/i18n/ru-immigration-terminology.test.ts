import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
describe('immigration ES terms explained on RU Ukraine long-term pages',()=>{
 const source=readFileSync('components/content/UkraineLongTermPage.tsx','utf8');
 it('preserves official names while describing meaning in Russian',()=>{
  for(const t of ['вид на жительство в Испании (residencia de larga duración nacional)','временной защиты (protección temporal)','(residencia legal y continuada)','(resolución de concesión)','административного дела (expediente)','(requerimientos)','(tasas)'])expect(source).toContain(t);
 });
 it('keeps source and ES/RU page pairs',()=>{
  expect(source).toContain('Instrucciones SEM 2/2026');
  expect(source).toContain('/blog/proteccion-temporal-ucrania-larga-duracion-2026');
  expect(source).toContain('/ru/blog/ukraina-proteccion-temporal-larga-duracion-2026');
 });
});