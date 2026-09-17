import { describe, expect, it } from 'vitest';
import { resolveServiceCheckoutLocale } from '@/lib/payments/service-checkout-locale';

describe('resolveServiceCheckoutLocale', () => {
  it('keeps Russian for the localized nationality service', () => {
    expect(resolveServiceCheckoutLocale(
      ['nacionalidad-espanola-menor-nacido-en-espana'],
      'ru',
    )).toBe('ru');
  });

  it('falls back to Spanish when a non-localized service requests Russian', () => {
    expect(resolveServiceCheckoutLocale(['irpf'], 'ru')).toBe('es');
  });

  it('falls back to Spanish for mixed carts', () => {
    expect(resolveServiceCheckoutLocale([
      'nacionalidad-espanola-menor-nacido-en-espana',
      'irpf',
    ], 'ru')).toBe('es');
  });

  it('keeps Spanish when requested explicitly', () => {
    expect(resolveServiceCheckoutLocale(
      ['nacionalidad-espanola-menor-nacido-en-espana'],
      'es',
    )).toBe('es');
  });
});
