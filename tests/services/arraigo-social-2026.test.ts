import { describe, expect, it } from 'vitest';
import { getCatalogService } from '@/lib/utils/catalog';

describe('Arraigo Social 2026 production rules', () => {
  const service = getCatalogService('arraigo-social');

  it('uses the current 2026 eligibility framework', () => {
    expect(service).toBeDefined();
    expect(service?.shortDescription).toContain('2 años');
    expect(service?.requirements).toContain('Acreditar al menos 2 años de permanencia continuada en España');
    expect(service?.requirements).toContain('No superar 90 días de ausencia durante ese periodo de 2 años');
    expect(service?.description).toContain('Real Decreto 1155/2024');
    expect(service?.description).not.toContain('RD 557/2011');
    expect(service?.description).not.toContain('3 años');
  });

  it('uses EX-10 and the current arraigo fee', () => {
    expect(service?.includes).toContain('Cumplimentación del formulario EX-10');
    expect(service?.officialFee).toContain('38,28 €');
    expect(service?.officialFee).toContain('790 código 052');
    expect(service?.includes.join(' ')).not.toContain('EX-01');
  });

  it('does not confuse social arraigo with sociolaboral', () => {
    const copy = [
      service?.shortDescription,
      service?.description,
      ...(service?.requirements ?? []),
      ...(service?.includes ?? []),
      ...(service?.faqs.map((item) => item.a) ?? []),
    ].join(' ');

    expect(copy).toContain('informe favorable');
    expect(copy).toContain('vínculos familiares');
    expect(copy).toContain('medios económicos');
    expect(copy).toContain('contrato de trabajo es propio del arraigo sociolaboral');
    expect(copy).not.toContain('oferta de empleo firmada');
  });

  it('states the work authorization and administrative resolution period', () => {
    expect(service?.duration).toContain('3 meses');
    expect(service?.keyPoints?.some((item) => item.title === 'Autorización de trabajo asociada')).toBe(true);
    expect(service?.faqs.some((item) => item.a.includes('por cuenta propia o ajena'))).toBe(true);
  });
});
