import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const catalog = readFileSync(
  resolve(process.cwd(), 'lib/utils/catalog.ts'),
  'utf8',
);
const servicePage = readFileSync(
  resolve(process.cwd(), 'app/(public)/servicios/[categoria]/[servicio]/page.tsx'),
  'utf8',
);
const quoteForm = readFileSync(
  resolve(process.cwd(), 'components/site/SolicitudPresupuestoForm.tsx'),
  'utf8',
);

describe('service delivery options — CIRCE', () => {
  it('separates full service and guided training commercially', () => {
    expect(catalog).toContain("mode: 'full_service'");
    expect(catalog).toContain("price: '499 € + IVA'");
    expect(catalog).toContain("mode: 'guided'");
    expect(catalog).toContain("price: '180 € + IVA'");
  });

  it('does not expose a synthetic Stripe price for CIRCE', () => {
    expect(catalog).not.toContain("stripePriceId: 'price_circe_sl_constitucion'");
  });

  it('renders explicit delivery options instead of the generic choice block', () => {
    expect(servicePage).toContain('service.deliveryOptions');
    expect(servicePage).toContain('Modalidades disponibles');
    expect(servicePage).toContain('Solicitar servicio completo');
    expect(servicePage).toContain('Solicitar formación guiada');
  });

  it('preserves selected delivery mode in public quote request context', () => {
    expect(quoteForm).toContain("searchParams.get('modalidad')");
    expect(quoteForm).toContain('Modalidad solicitada: servicio completo.');
    expect(quoteForm).toContain('Modalidad solicitada: formación guiada.');
  });
});
