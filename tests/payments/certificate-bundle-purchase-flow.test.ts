import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getCatalogService } from '@/lib/utils/catalog';
import { getServiceCheckoutByPriceId } from '@/lib/integrations/service-checkout';
import { getServiceBillingPolicy, resolveServiceBillingScope } from '@/lib/payments/service-billing-scope';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('certificate bundle purchase flow', () => {
  const service = getCatalogService('pack-certificados-digitales');

  it('reuses the existing live Stripe price and canonical 200 EUR offer', () => {
    expect(service).toBeDefined();
    expect(service?.price).toBe('200 € + IVA');
    expect(service?.stripePriceId).toBe('price_1S2X6ZLeYwwgvux4sPrfxFD7');

    const checkout = getServiceCheckoutByPriceId('price_1S2X6ZLeYwwgvux4sPrfxFD7');
    expect(checkout?.slug).toBe('pack-certificados-digitales');
    expect(checkout?.unitAmount).toBe(20000);
  });

  it('requires a linked company while keeping the logged-in profile as the person holder', () => {
    expect(getServiceBillingPolicy('pack-certificados-digitales')).toBe('company_only');
    expect(resolveServiceBillingScope({
      serviceSlugs: ['pack-certificados-digitales'],
      clientType: 'particular',
    })).toEqual({ scope: 'company_required', companyId: null });

    expect(resolveServiceBillingScope({
      serviceSlugs: ['pack-certificados-digitales'],
      explicitCompanyId: '33333333-3333-3333-3333-333333333333',
      clientType: 'particular',
    })).toEqual({
      scope: 'company',
      companyId: '33333333-3333-3333-3333-333333333333',
    });
  });

  it('states online-only delivery and the qualified 24-business-hour SLA', () => {
    const copy = JSON.stringify(service);
    expect(copy).toContain('100 % online');
    expect(copy).toContain('sin presencia física');
    expect(copy).toContain('24 horas laborables');
    expect(copy).toContain('documentación');
    expect(copy).toContain('validada');
  });

  it('creates one operational case with two certificate tasks after payment', () => {
    const webhook = read('app/api/stripe/webhook/route.ts');
    expect(webhook).toContain("input.serviceSlug === 'pack-certificados-digitales'");
    expect(webhook).toContain("'Emitir certificado digital persona física'");
    expect(webhook).toContain("'Emitir certificado digital de entidad'");
    expect(webhook).toContain("sla_business_hours: 24");
    expect(webhook).toContain("order_id: input.orderId");
    expect(webhook).toContain(".update({ case_id: caseId })");
  });

  it('publishes ES/RU SEO routes for the bundle', () => {
    const es = read('app/(public)/servicios/[categoria]/[servicio]/page.tsx');
    const ru = read('app/(localized)/ru/uslugi/paket-cifrovyh-sertifikatov/page.tsx');
    const sitemap = read('app/sitemap.ts');

    expect(es).toContain("'pack-certificados-digitales': '/ru/uslugi/paket-cifrovyh-sertifikatov'");
    expect(ru).toContain("'es-ES': ES_URL");
    expect(ru).toContain("'ru-RU': RU_URL");
    expect(ru).toContain("'x-default': ES_URL");
    expect(sitemap).toContain('/ru/uslugi/paket-cifrovyh-sertifikatov');
    expect(sitemap).toContain('/servicios/certificado-digital/pack-certificados-digitales');
  });
});
