import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getCatalogService } from '@/lib/utils/catalog';
import { getServiceBillingPolicy } from '@/lib/payments/service-billing-scope';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('RU entity digital certificate parity', () => {
  const service = getCatalogService('certificado-digital-entidad');

  it('reuses the canonical ES catalog price and Stripe product', () => {
    expect(service).toBeDefined();
    expect(service?.price).toBe('150 € + IVA');
    expect(service?.stripePriceId).toBe('price_1TZYiDLeYwwgvux4ovAjIxrz');
    expect(getServiceBillingPolicy('certificado-digital-entidad')).toBe('company_only');

    const ru = read('app/(localized)/ru/uslugi/cifrovoi-sertifikat-organizatsii/page.tsx');
    expect(ru).toContain("const service = (() => {");
    expect(ru).toContain('priceId: service.stripePriceId');
    expect(ru).toContain('displayPrice: service.price');
    expect(ru).toContain("locale: 'ru' as const");
    expect(ru).toContain('price: OFFER_PRICE');
    expect(ru).not.toContain("stripePriceId: '");
    expect(ru).not.toContain("price: '150'");
  });

  it('explains that checkout is entity-scoped', () => {
    const ru = read('app/(localized)/ru/uslugi/cifrovoi-sertifikat-organizatsii/page.tsx');
    expect(ru).toContain('выбрать существующую организацию');
    expect(ru).toContain('Заказ и счёт будут связаны именно с этой организацией');
    expect(ru).toContain('а не с личным профилем пользователя');
  });

  it('keeps ES/RU SEO alternates aligned', () => {
    const ru = read('app/(localized)/ru/uslugi/cifrovoi-sertifikat-organizatsii/page.tsx');
    expect(ru).toContain("'es-ES': ES_URL");
    expect(ru).toContain("'ru-RU': RU_URL");
    expect(ru).toContain("'x-default': ES_URL");

    const sitemap = read('app/sitemap.ts');
    expect(sitemap).toContain('/ru/uslugi/cifrovoi-sertifikat-organizatsii');
    expect(sitemap).toContain('/servicios/certificado-digital/certificado-digital-entidad');
  });

  it('keeps the documented entity scope in Russian copy', () => {
    const ru = read('app/(localized)/ru/uslugi/cifrovoi-sertifikat-organizatsii/page.tsx');
    expect(ru).toContain('Онлайн-проверка документов организации, полномочий и личности представителя EXPERT');
    expect(ru).toContain('Учредительные документы или актуальная nota mercantil');
    expect(ru).toContain('Нотариальная доверенность');
    expect(ru).toContain('Продление сертификата после окончания срока действия — оформляется отдельно.');
    expect(ru).toContain('срок действия 2 года');
    expect(ru).toContain('/docs/certificado-digital-entidad-documentos-representante');
    expect(ru).toContain('/docs/certificado-digital-entidad-tipos-usos-seguridad');
    expect(ru).toContain('максимум за 24 рабочих часа');
    expect(ru).toContain('/ru/uslugi/paket-cifrovyh-sertifikatov');
  });
});
