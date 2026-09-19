import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const catalog = readFileSync(
  resolve(process.cwd(), 'lib/utils/catalog.ts'),
  'utf8',
);

describe('foreign partner NIF quantity flow', () => {
  it('keeps the per-person tariff but disables synthetic direct checkout', () => {
    expect(catalog).toContain("slug: 'nif-socio-extranjero'");
    expect(catalog).toContain("price: '60 € + IVA / persona'");
    expect(catalog).not.toContain("stripePriceId: 'price_circe_nif_socio_extranjero'");
  });

  it('routes quantity handling to a structured quote instead of cart quantities', () => {
    expect(catalog).toContain('El presupuesto se calcula por persona según la cantidad necesaria.');
    expect(catalog).not.toContain('Puedes añadir varias unidades en el carrito, una por persona.');
  });
});
