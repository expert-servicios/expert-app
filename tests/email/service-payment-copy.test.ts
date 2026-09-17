import { describe, expect, it } from 'vitest';
import { normalizeServicePaymentConfirmationHtml } from '@/lib/email/send';

const legacyHtml = `
  <p>La tasa administrativa del Ministerio de Justicia no está incluida en este importe y se abonará aparte.</p>
  <li>Te avisaremos cuando el expediente esté listo para el pago de la tasa administrativa.</li>
`;

describe('normalizeServicePaymentConfirmationHtml', () => {
  it('removes obsolete fee wording from service payment confirmations', () => {
    const html = normalizeServicePaymentConfirmationHtml('service.payment.confirmed', legacyHtml);

    expect(html).not.toContain('no está incluida en este importe y se abonará aparte');
    expect(html).not.toContain('pago de la tasa administrativa');
    expect(html).toContain('Si el servicio incluye una tasa oficial como suplido');
    expect(html).toContain('Te indicaremos los siguientes pasos');
  });

  it('does not modify unrelated email event types', () => {
    expect(normalizeServicePaymentConfirmationHtml('payment.confirmed', legacyHtml)).toBe(legacyHtml);
  });

  it('leaves already-correct service emails unchanged', () => {
    const html = '<p>Pago recibido correctamente.</p>';
    expect(normalizeServicePaymentConfirmationHtml('service.payment.confirmed', html)).toBe(html);
  });
});
