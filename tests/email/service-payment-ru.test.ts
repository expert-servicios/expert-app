import { describe, expect, it } from 'vitest';
import {
  RU_NATIONALITY_MINOR_SERVICE_SLUG,
  calculateRussianNationalityAmounts,
  isNationalityPayment,
  isRussianNationalityPayment,
  russianNationalityPaymentConfirmedAdmin,
  russianNationalityPaymentConfirmedClient,
  spanishNationalityPaymentConfirmedAdmin,
  spanishNationalityPaymentConfirmedClient,
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

  it('activates the nationality specialization in Spanish and Russian', () => {
    expect(isNationalityPayment({
      eventType: 'service.payment.confirmed',
      serviceSlug: RU_NATIONALITY_MINOR_SERVICE_SLUG,
    })).toBe(true);
    expect(isNationalityPayment({
      eventType: 'service.payment.confirmed.admin',
      serviceSlug: RU_NATIONALITY_MINOR_SERVICE_SLUG,
    })).toBe(true);
    expect(isNationalityPayment({
      eventType: 'service.payment.confirmed',
      serviceSlug: 'otro-servicio',
    })).toBe(false);
  });

  it('renders the Spanish nationality confirmation without asking for the fee again', () => {
    const amounts = calculateRussianNationalityAmounts({});
    const client = spanishNationalityPaymentConfirmedClient(amounts);
    const admin = spanishNationalityPaymentConfirmedAdmin({
      customerName: 'Cliente Test',
      customerEmail: 'cliente@example.com',
      checkoutSessionId: 'cs_test_es',
      caseId: 'case_es',
      orderId: 'order_es',
      amounts,
    });

    expect(client.html).toContain('<html lang="es">');
    expect(client.html).toContain('302,50');
    expect(client.html).toContain('104,05');
    expect(client.html).toContain('406,55');
    expect(client.html).toContain('ya está cobrada como suplido');
    expect(client.html).not.toContain('se abonará aparte');
    expect(client.html).not.toContain('te avisaremos para el pago de la tasa');
    expect(client.html).toContain('/docs/apellidos-menor-nacionalidad-registro-civil');
    expect(client.html).toContain('Instrucción oficial de 23 de mayo de 2007');
    expect(client.html).toContain('la duplicación de un único apellido no se trata como una elección');

    expect(admin.html).toContain('Español (es)');
    expect(admin.html).toContain('No debe volver a cobrarse');
    expect(admin.html).toContain('/admin/expedientes/case_es');
    expect(admin.html).toContain('Gate operativo antes de preparar el modelo');
    expect(admin.html).toContain('apellido materno «desconocido»');
    expect(admin.html).toContain('/docs/apellidos-menor-nacionalidad-registro-civil');
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

  it('uses the total actually charged by Stripe when tax differs from the nominal rate', () => {
    expect(calculateRussianNationalityAmounts({
      professionalNetCents: 25000,
      disbursementCents: 10405,
      stripeTotalCents: 35405,
    })).toEqual({
      professionalNetCents: 25000,
      professionalVatCents: 0,
      professionalGrossCents: 25000,
      disbursementCents: 10405,
      totalCents: 35405,
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
    expect(template.html).toContain('удвоение одной фамилии не используется как способ отказаться');
    expect(template.html).toContain('/ru/docs/familii-rebenka-pri-poluchenii-grazhdanstva-ispanii');
    expect(template.html).toContain('/ru/blog/odna-familiya-u-rebenka-grazhdanstvo-ispanii');
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
    expect(template.html).toContain('la ficha y el expediente creados automáticamente');
    expect(template.html).toContain('revisar primero los documentos ya disponibles');
    expect(template.html).toContain('apellido personal de la madre');
    expect(template.html).toContain('certificado de finalización DocuSign');
    expect(template.html).toContain('No abonar nuevamente la tasa');
    expect(template.html).toContain('/ru/docs/familii-rebenka-pri-poluchenii-grazhdanstva-ispanii');
    expect(template.html).toContain('cs_test_123');
    expect(template.html).toContain('case_test_123');
    expect(template.html).toContain('order_test_123');
    expect(template.html).toContain('/admin/expedientes/case_test_123');
  });
});
