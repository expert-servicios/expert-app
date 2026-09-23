import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8').replace(/\r\n/g, '\n');
}

describe('certificate launch regressions', () => {
  it('keeps KIA aligned with the live certificate offer', () => {
    const flow = read('lib/ai/kia/prompts/kia-identification-flow.ts');
    const examples = read('lib/ai/kia/prompts/kia-examples.ts');
    const catalog = read('lib/ai/kia/prompts/kia-services-catalog.ts');

    expect(flow).toContain('persona fisica 5 anos; entidad 2 anos');
    expect(flow).toContain('Pack persona fisica + entidad mercantil: 200 EUR + IVA');
    expect(flow).toContain('maximo 24 horas laborables');
    expect(flow).not.toContain('emision: inmediata (presencial o videoconferencia)');
    expect(flow).not.toContain('Vigencia 2-3 anos');
    expect(examples).not.toContain('emision en 24-48 h');
    expect(catalog).toContain('pack-certificados-digitales');
  });

  it('keeps operational checklists aligned with online SLA and validity', () => {
    const checklists = read('lib/utils/service-checklists.ts');

    const personal = checklists.slice(
      checklists.indexOf("serviceId: 'certificado-digital-persona-fisica'"),
      checklists.indexOf("serviceId: 'certificado-digital-entidad'"),
    );
    const entity = checklists.slice(
      checklists.indexOf("serviceId: 'certificado-digital-entidad'"),
      checklists.indexOf("serviceId: 'certificado-digital-sin-animo-lucro'"),
    );

    expect(personal).toContain('5 años');
    expect(personal).toContain('24 horas laborables');
    expect(personal).not.toContain('2–3 años');
    expect(personal).not.toContain('presencial o por videoconferencia');
    expect(entity).toContain('2 años');
    expect(entity).toContain('24 horas laborables');
    expect(entity).not.toContain('24–48 horas');
  });

  it('shows certificate next steps even when post-payment profile data remains incomplete', () => {
    const page = read('app/(public)/gracias/pago/page.tsx');
    const tail = page.slice(page.indexOf('return (\n    <main className="mx-auto max-w-3xl px-6 py-16">'));

    expect(tail).toContain('PostPurchaseProfileStep');
    expect(tail).toContain('showCertificateSuccess && service && <CertificateSuccessSection service={service} />');
  });

  it('persists acquisition context into service checkout', () => {
    const checkout = read('app/api/services/checkout/route.ts');

    expect(checkout).toContain("readRequestAttribution(request)");
    expect(checkout).toContain('utm_campaign');
    expect(checkout).toContain('acquisition: acquisition ?? null');
  });
});
