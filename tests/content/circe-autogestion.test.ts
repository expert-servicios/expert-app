import { describe, expect, it } from 'vitest';
import { circeFaqs, circeKnowledgeDocs, circeResources, circeSteps } from '@/lib/content/circe-autogestion';

describe('Centro gratuito CIRCE: contenido y alcance', () => {
  it('incluye manual oficial, fuentes primarias y ruta gratuita', () => {
    expect(circeResources.some(item => item.url.includes('Gu%C3%ADa_cumplimentaci%C3%B3n_DUE_SRL.pdf'))).toBe(true);
    expect(circeResources.some(item => item.url.includes('paeelectronico.es'))).toBe(true);
    expect(circeKnowledgeDocs[0].body).toContain('/herramientas/crear-sociedad-limitada');
  });
  it('describe los siete pasos y los trámites integrados sin duplicar altas', () => {
    expect(circeSteps).toHaveLength(7);
    expect(circeFaqs.length).toBeGreaterThanOrEqual(10);
    expect(circeFaqs.some(f => f.answer.includes('No hay que duplicarlos'))).toBe(true);
    expect(circeSteps.some(step => step.actions.some(action => action.includes('NIF provisional')))).toBe(true);
  });
  it('distingue firma de DUE con certificado frente a Cl@ve', () => {
    expect(circeFaqs.some(f => f.question.includes('Cl@ve') && f.answer.includes('certificado electrónico'))).toBe(true);
  });
});