import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Russian IRPF variable-price flow', () => {
  const page = source('app/(localized)/ru/uslugi/deklaratsiya-o-dohodah-irpf/page.tsx');
  const calculator = source('components/services/ServicePriceCalculator.tsx');

  it('renders the real IRPF calculator before requesting the service', () => {
    expect(page).toContain('id="calculadora-irpf"');
    expect(page).toContain('<ServicePriceCalculator kind="irpf" origin="service:irpf" locale="ru" />');
    expect(page).toContain('href="#calculadora-irpf"');
  });

  it('localizes the variable-price controls and carries the calculated summary', () => {
    expect(calculator).toContain("locale?: 'es' | 'ru'");
    expect(calculator).toContain("locale === 'ru'");
    expect(calculator).toContain('Индивидуальная · 120 € + НДС');
    expect(calculator).toContain('Совместная · 150 € + НДС');
    expect(calculator).toContain('Аренда или доходы от капитала');
    expect(calculator).toContain('Запросить по этой цене');
    expect(calculator).toContain('resumen=');
  });
});
