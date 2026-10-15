import { describe, expect, it } from 'vitest';
import { formatRuEsTerm, RU_ES_LEGAL_TERMS } from '@/lib/i18n/ru-es-legal-glossary';
import { RGPD_RU_GLOSSARY } from '@/lib/rgpd/ru-legal-glossary';
import { RU_REMAINING_SERVICES } from '@/components/services/RemainingRussianService';
import { readFileSync } from 'node:fs';
describe('RU-ES legal glossary policy', () => {
 it('distinguishes salary, payslip and social insurance contributions', () => {
  expect(formatRuEsTerm('nómina')).toContain('(nómina)');
  expect(formatRuEsTerm('salario')).toContain('(salario)');
  expect(formatRuEsTerm('cotizaciones')).toContain('(cotizaciones a la Seguridad Social)');
  expect(formatRuEsTerm('Seguridad Social')).toContain('(Seguridad Social)');
  expect(formatRuEsTerm('NIE')).not.toEqual(formatRuEsTerm('TIE'));
  expect(new Set(RU_ES_LEGAL_TERMS.map(x=>x.key)).size).toBe(RU_ES_LEGAL_TERMS.length);
 });
 it('uses one master glossary for RGPD legal terminology', () => {
  expect(RU_ES_LEGAL_TERMS.length).toBeGreaterThanOrEqual(50);
  expect(RGPD_RU_GLOSSARY.length).toBe(21);
  for (const term of RGPD_RU_GLOSSARY) {
    const master = RU_ES_LEGAL_TERMS.find(entry => entry.es === term.es);
    expect(master).toBeDefined();
    expect(term.ru).toBe(master?.ru);
    expect(term.es.trim().length).toBeGreaterThan(2);
  }
  expect(formatRuEsTerm('responsable del tratamiento')).toContain('(responsable del tratamiento)');
  expect(formatRuEsTerm('EIPD')).toContain('evaluación de impacto');
 });
 it('retains Spanish parentheticals on eight translated service cards', () => {
  const src=readFileSync('components/services/RemainingRussianService.tsx','utf8');
  expect(Object.keys(RU_REMAINING_SERVICES)).toHaveLength(8);
  expect(src).toContain('Registro Mercantil');
  expect(src).toContain('contrato de arras');
  expect(src).toContain('RETA');
  expect(src).toContain('Registro de la Propiedad');
 });
 it('clarifies official decision rather than leaving an unexplained Spanish word', () => {
  const src=readFileSync('components/site/SharedServiceProcess.tsx','utf8');
  expect(src).toContain('официальное решение (resolución)');
 });
});