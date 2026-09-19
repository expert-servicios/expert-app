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
    expect(ru).not.toContain("stripePriceId: '");
  });

  it('explains that checkout is entity-scoped', () => {
    const ru = read('app/(localized)/ru/uslugi/cifrovoi-sertifikat-organizatsii/page.tsx');
    expect(ru).toContain('billing company_only');
    expect(ru).toContain('выбрать существующую организацию');
    expect(ru).toContain('на личный профиль пользователя');
  });

  it('keeps ES/RU SEO alternates aligned', () => {
    const ru = read('app/(localized)/ru/uslugi/cifrovoi-sertifikat-organizatsii/page.tsx');
    expect(ru).toContain("'es-ES': ES_URL");
    expect(ru).toContain("'ru-RU': RU_URL");
    expect(ru).toContain("'x-default': ES_URL");
  });
});
