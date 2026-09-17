function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function eur(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function serviceDisbursementPaymentConfirmed(params: {
  name: string;
  service: string;
  stripeTotalCents: number;
  professionalGrossCents: number;
  professionalNetCents: number;
  professionalVatCents: number;
  disbursementTotalCents: number;
}) {
  const safeName = escapeHtml(params.name);
  const safeService = escapeHtml(params.service);

  return {
    subject: 'Pago recibido — honorarios y suplido registrados por separado',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0D1B2A;line-height:1.6">
        <h2 style="margin-bottom:12px">Pago confirmado</h2>
        <p>Hola <strong>${safeName}</strong>,</p>
        <p>Hemos recibido correctamente el pago de <strong>${safeService}</strong>. La tasa oficial incluida se ha registrado como <strong>suplido</strong>, separada de los honorarios profesionales.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">Honorarios profesionales (base)</td><td style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb"><strong>${eur(params.professionalNetCents)}</strong></td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">IVA honorarios</td><td style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb"><strong>${eur(params.professionalVatCents)}</strong></td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">Honorarios con IVA</td><td style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb"><strong>${eur(params.professionalGrossCents)}</strong></td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">Suplido — tasa oficial</td><td style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb"><strong>${eur(params.disbursementTotalCents)}</strong></td></tr>
          <tr><td style="padding:10px 8px">Total abonado en Stripe</td><td style="padding:10px 8px;text-align:right"><strong>${eur(params.stripeTotalCents)}</strong></td></tr>
        </table>
        <p>El suplido se destina al pago de la tasa en nombre y por cuenta del cliente y no forma parte de la base de los honorarios profesionales.</p>
        <p>Revisaremos la documentación del expediente y te indicaremos los siguientes pasos.</p>
        <p><a href="https://wa.me/34669045528" style="display:inline-block;background:#D4A017;color:#0D1B2A;text-decoration:none;font-weight:700;padding:10px 16px;border-radius:8px">Escribir por WhatsApp</a></p>
      </div>
    `,
  };
}
