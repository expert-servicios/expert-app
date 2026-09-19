import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const modal = readFileSync(
  resolve(process.cwd(), 'components/admin/NuevaCotizacionModal.tsx'),
  'utf8',
);

describe('quote template compatibility', () => {
  it('forces legacy templates into manual quote mode', () => {
    expect(modal).toContain("setQuoteMode('manual')");
    expect(modal).toContain('setQuoteItems([])');
    expect(modal).toContain("quoteMode === 'manual'");
  });

  it('does not claim that admin-created quote emails contain a direct payment link', () => {
    expect(modal).toContain('revisar el presupuesto en el área privada');
    expect(modal).not.toContain('Se envía email con enlace de pago al cliente');
  });
});
