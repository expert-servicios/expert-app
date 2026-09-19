import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getCatalogService } from '@/lib/utils/catalog';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('ES certificate service alignment', () => {
  it('keeps checkout scope explicit in the canonical ES catalog', () => {
    const personal = getCatalogService('certificado-digital-persona-fisica');
    const entity = getCatalogService('certificado-digital-entidad');

    expect(personal?.checkoutLegal).toContain('perfil de la persona titular');
    expect(entity?.checkoutLegal).toContain('vincularse a la organización');
  });

  it('publishes reciprocal ES/RU hreflang mappings', () => {
    const page = read('app/(public)/servicios/[categoria]/[servicio]/page.tsx');

    expect(page).toContain("'certificado-digital-persona-fisica': '/ru/uslugi/cifrovoi-sertifikat-fizicheskogo-litsa'");
    expect(page).toContain("'certificado-digital-entidad': '/ru/uslugi/cifrovoi-sertifikat-organizatsii'");
    expect(page).toContain("'es-ES': canonicalUrl");
    expect(page).toContain("'ru-RU': `https://expertconsulting.es${ruPath}`");
    expect(page).toContain("'x-default': canonicalUrl");
  });
});
