import { describe, expect, it } from 'vitest';
import {
  RU_NATIONALITY_MINOR_SERVICE_SLUG,
  calculateRussianNationalityAmounts,
  isRussianNationalityPayment,
  russianNationalityPaymentConfirmedAdmin,
  russianNationalityPaymentConfirmedClient,
} from '@/lib/email/service-payment-ru';

describe('Russian nationality service payment emails', () => {
  it('activates only for Russian payment events of the localized nationality service', () => {
    expect(isRussianNationalityPayment({
      eventType: 'service.payment.confirmed',
      checkoutLocale: 'ru',
      serviceSlug: RU_NATIONALITY_MINOR_SERVICE_SLUG,
    })).toBe(true);

    expect(isRussianNationalityPayment({
      eventType: 'service.payment.confirmed.admin',
      checkoutLocale: 'ru',
      serviceSlug: RU_NATIONALITY_MINOR_SERVICE_SLUG,
    })).toBe(true);

    expect(isRussianNationalityPayment({
      eventType: 'service.payment.confirmed',
      checkoutLocale: 'es',
      serviceSlug: RU_NATIONALITY_MINOR_SERVICE_SLUG,
    })).toBe(false);

    expect(isRussianNationalityPayment({
      eventType: 'service.payment.confirmed',
      checkoutLocale: 'ru',
      serviceSlug: 'otro-servicio',
    })).toBe(false);
  });

  it('keeps professional revenue, VAT and disbursement separated', () => {
    expect(calculateRussianNationalityAmounts({
      professionalNetCents: 25000,
      disbursementCents: 10405,
    })).toEqual({
      professionalNetCents: 25000,
      professionalVatCents: 5250,
      professionalGrossCents: 30250,
      disbursementCents: 10405,
      totalCents: 40655,
    });
  });

  it('renders a Russian client confirmation with the current payment flow', () => {
    const amounts = calculateRussianNationalityAmounts({
      professionalNetCents: 25000,
      disbursementCents: 10405,
    });
    const template = russianNationalityPaymentConfirmedClient(amounts);

    expect(template.subject).toContain('Оплата получена');
    expect(template.html).toContain('<html lang="ru">');
    expect(template.html).toContain('Modelo 790-026');
    expect(template.html).toContain('suplido');
    expect(template.html).toContain('302,50');
    expect(template.html).toContain('104,05');
    expect(template.html).toContain('406,55');
    expect(template.html).toContain('Мы открываем expediente');
    expect(template.html).not.toContain('se abonará aparte');
    expect(template.html).not.toContain('listo para el pago de la tasa');
  });

  it('renders an actionable administrator notification', () => {
    const amounts = calculateRussianNationalityAmounts({
      professionalNetCents: 25000,
      disbursementCents: 10405,
    });
    const template = russianNationalityPaymentConfirmedAdmin({
      customerName: 'Vyacheslav Test',
      customerEmail: 'pilot@example.com',
      checkoutSessionId: 'cs_test_123',
      caseId: 'case_test_123',
      orderId: 'order_test_123',
      amounts,
    });

    expect(template.subject).toContain('ACCIÓN: revisar expediente');
    expect(template.html).toContain('Vyacheslav Test');
    expect(template.html).toContain('pilot@example.com');
    expect(template.html).toContain('expediente ya creado automáticamente');
    expect(template.html).toContain('Solicitar la documentación pendiente');
    expect(template.html).toContain('No abonar la tasa 790-026 hasta validar viabilidad y documentación');
    expect(template.html).toContain('cs_test_123');
    expect(template.html).toContain('case_test_123');
    expect(template.html).toContain('order_test_123');
    expect(template.html).toContain('/admin/expedientes/case_test_123');
  });
});
