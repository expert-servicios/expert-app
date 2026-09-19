import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getPublicServicePath } from '@/lib/i18n/service-routes';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('certificate lead purchase journey', () => {
  it('keeps Russian certificate buyers inside the Russian service/cart flow', () => {
    expect(getPublicServicePath(
      { slug: 'certificado-digital-persona-fisica', category: 'certificado-digital' },
      'ru',
    )).toBe('/ru/uslugi/cifrovoi-sertifikat-fizicheskogo-litsa');

    expect(getPublicServicePath(
      { slug: 'certificado-digital-entidad', category: 'certificado-digital' },
      'ru',
    )).toBe('/ru/uslugi/cifrovoi-sertifikat-organizatsii');

    expect(getPublicServicePath(
      { slug: 'pack-certificados-digitales', category: 'certificado-digital' },
      'ru',
    )).toBe('/ru/uslugi/paket-cifrovyh-sertifikatov');

    const sidebar = read('components/cart/CartSidebar.tsx');
    expect(sidebar).toContain("loginNextPath = locale === 'ru' ? '/carrito?lang=ru' : '/carrito'");
    expect(sidebar).toContain('getPublicServicePath(item, item.locale ?? locale)');
  });

  it('returns a buyer to the cart after creating a required company', () => {
    const gate = read('components/cart/CompanyCheckoutGate.tsx');
    const newCompany = read('app/(protected)/dashboard/empresa/nueva/page.tsx');

    expect(gate).toContain('/dashboard/empresa/nueva?next=');
    expect(newCompany).toContain("const requestedNext = searchParams.get('next')");
    expect(newCompany).toContain("router.push(safeNext ?? '/dashboard/empresa?created=1')");
  });

  it('blocks company checkout until required fiscal data exists and offers a repair path', () => {
    const gate = read('components/cart/CompanyCheckoutGate.tsx');
    const edit = read('app/(protected)/dashboard/empresa/CompanyEditForm.tsx');

    expect(gate).toContain('missingCompanyBillingFields(selectedCompany)');
    expect(gate).toContain('Completar datos fiscales');
    expect(gate).toContain('disabled={!selected || loading || missingBilling.length > 0}');

    expect(edit).toContain('<Input required value={form.cif_nif}');
    expect(edit).toContain('<Input required value={form.direccion}');
    expect(edit).toContain('<Input required value={form.ciudad}');
    expect(edit).toContain('<Input required maxLength={5} value={form.codigo_postal}');
    expect(edit).toContain('router.push(returnPath)');
  });

  it('shows certificate-specific post-payment instructions in ES and RU', () => {
    const esSuccess = read('app/(public)/gracias/pago/page.tsx');
    const ruSuccess = read('app/(localized)/ru/spasibo/oplata/page.tsx');

    expect(esSuccess).toContain("'pack-certificados-digitales'");
    expect(esSuccess).toContain('Máximo 24 h laborables');
    expect(esSuccess).toContain('dos tareas operativas separadas');

    expect(ruSuccess).toContain("'pack-certificados-digitales'");
    expect(ruSuccess).toContain('Максимум 24 рабочих часа');
    expect(ruSuccess).toContain('два отдельных операционных результата');
  });

  it('removes the training/self-service CTA from certificate purchase pages and promotes the bundle', () => {
    const servicePage = read('app/(public)/servicios/[categoria]/[servicio]/page.tsx');

    expect(servicePage).toContain("const isCertificateCategory = categoria === 'certificado-digital'");
    expect(servicePage).toContain('!isCertificateCategory &&');
    expect(servicePage).toContain('Oferta conjunta');
    expect(servicePage).toContain('/servicios/certificado-digital/pack-certificados-digitales');
  });
});
