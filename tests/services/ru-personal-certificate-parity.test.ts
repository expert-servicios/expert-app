import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getCatalogService } from '@/lib/utils/catalog';
import { getLocalizedServicePresentation } from '@/lib/services/service-localized-content';
import { getServiceBillingPolicy } from '@/lib/payments/service-billing-scope';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('RU personal digital certificate parity', () => {
  const service = getCatalogService('certificado-digital-persona-fisica');

  it('reuses the canonical ES catalog price and Stripe product', () => {
    expect(service).toBeDefined();
    expect(service?.price).toBe('90 € + IVA');
    expect(service?.stripePriceId).toBe('price_1TZYiBLeYwwgvux4EO07gS0W');
    expect(getServiceBillingPolicy('certificado-digital-persona-fisica')).toBe('profile_only');

    const ru = read('app/(localized)/ru/uslugi/cifrovoi-sertifikat-fizicheskogo-litsa/page.tsx');
    expect(ru).toContain("const canonical = getCatalogService(SERVICE_SLUG)");
    expect(ru).toContain('priceId: service.stripePriceId');
    expect(ru).toContain('displayPrice: service.price');
    expect(ru).toContain("locale: 'ru' as const");
    expect(ru).not.toContain("stripePriceId: '");
  });

  it('keeps ES/RU SEO alternates aligned', () => {
    const ru = read('app/(localized)/ru/uslugi/cifrovoi-sertifikat-fizicheskogo-litsa/page.tsx');
    expect(ru).toContain("'es-ES': ES_URL");
    expect(ru).toContain("'ru-RU': RU_URL");
    expect(ru).toContain("'x-default': ES_URL");

    const localized = getLocalizedServicePresentation('certificado-digital-persona-fisica', 'ru');
    expect(localized?.path).toBe('/ru/uslugi/cifrovoi-sertifikat-fizicheskogo-litsa');
    expect(localized?.indexable).toBe(true);

    const sitemap = read('app/sitemap.ts');
    expect(sitemap).toContain("getLocalizedServicePresentations('ru')");
  });

  it('keeps the same commercial scope in Russian copy', () => {
    const ru = read('app/(localized)/ru/uslugi/cifrovoi-sertifikat-fizicheskogo-litsa/page.tsx');
    expect(ru).toContain('Удалённая идентификация и валидация личности EXPERT');
    expect(ru).toContain('Установка и настройка сертификата на вашем компьютере.');
    expect(ru).toContain('Техническая поддержка по вопросам сертификата в течение 30 дней.');
    expect(ru).toContain('Продление сертификата после окончания срока действия — оформляется отдельно.');
    expect(ru).toContain('срок действия 5 лет');
    expect(ru).toContain('/docs/certificado-digital-persona-fisica-documentacion-instalacion');
    expect(ru).toContain('/docs/certificado-digital-persona-fisica-seguridad-copia-renovacion');
    expect(ru).toContain('максимум за 24 рабочих часа');
    expect(ru).toContain('/ru/uslugi/paket-cifrovyh-sertifikatov');
  });
});
