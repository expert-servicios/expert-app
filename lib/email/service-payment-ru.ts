import { BRAND } from './templates';

export const RU_NATIONALITY_MINOR_SERVICE_SLUG = 'nacionalidad-espanola-menor-nacido-en-espana';
export const RU_NATIONALITY_MINOR_SERVICE_NAME = 'Испанское гражданство для ребёнка, родившегося в Испании';

export type RussianServicePaymentEventType =
  | 'service.payment.confirmed'
  | 'service.payment.confirmed.admin';

export type RussianServicePaymentAmounts = {
  professionalNetCents: number;
  professionalVatCents: number;
  professionalGrossCents: number;
  disbursementCents: number;
  totalCents: number;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatEur(cents: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function shell(title: string, body: string): string {
  const safeTitle = escapeHtml(title);
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle}</title></head>
<body style="margin:0;padding:0;background:#f8f4eb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f4eb;padding:40px 20px;">
<tr><td>
<table width="600" cellpadding="0" cellspacing="0" align="center" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d8cbb5;max-width:100%;">
  <tr><td style="background:#07111d;padding:32px 40px;text-align:center;">
    <p style="margin:0;font-size:26px;font-weight:bold;color:#d7a33a;letter-spacing:5px;font-family:Georgia,serif;">EXPERT</p>
    <p style="margin:6px 0 0;font-size:11px;color:#8899aa;letter-spacing:2px;text-transform:uppercase;">Профессиональное сопровождение в Испании</p>
  </td></tr>
  <tr><td style="padding:40px;">${body}</td></tr>
  <tr><td style="background:#f8f4eb;padding:24px 40px;border-top:1px solid #d8cbb5;text-align:center;">
    <p style="margin:0;font-size:12px;color:#29384a;">EXPERT ESTUDIOS PROFESIONALES, SLU · Mutxamel (Alicante)</p>
    <p style="margin:6px 0 0;font-size:12px;"><a href="mailto:info@expertconsulting.es" style="color:#c88b25;text-decoration:none;">info@expertconsulting.es</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 20px;font-size:24px;color:#07111d;font-family:Georgia,serif;">${escapeHtml(text)}</h1>`;
}

function para(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#29384a;line-height:1.65;">${text}</p>`;
}

function detail(label: string, value: string): string {
  return `<tr><td style="padding:10px 14px;font-size:13px;font-weight:bold;color:#07111d;background:#f8f4eb;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:10px 14px;font-size:14px;color:#29384a;vertical-align:top;">${value}</td></tr>`;
}

function details(...rows: string[]): string {
  return `<table width="100%" cellpadding="0" cellspacing="4" style="margin:20px 0;border-collapse:separate;">${rows.join('')}</table>`;
}

function button(label: string, url: string): string {
  return `<p style="text-align:center;margin:28px 0 0;"><a href="${escapeHtml(url)}" style="display:inline-block;background:#c88b25;color:#061321;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;padding:14px 28px;border-radius:50px;text-decoration:none;">${escapeHtml(label)}</a></p>`;
}

export function isRussianNationalityPayment(params: {
  eventType: string;
  checkoutLocale?: string | null;
  serviceSlug?: string | null;
}): params is {
  eventType: RussianServicePaymentEventType;
  checkoutLocale: string;
  serviceSlug: string;
} {
  return (
    (params.eventType === 'service.payment.confirmed' || params.eventType === 'service.payment.confirmed.admin')
    && params.checkoutLocale === 'ru'
    && params.serviceSlug === RU_NATIONALITY_MINOR_SERVICE_SLUG
  );
}

export function calculateRussianNationalityAmounts(input: {
  professionalNetCents?: number | null;
  disbursementCents?: number | null;
}): RussianServicePaymentAmounts {
  const professionalNetCents = input.professionalNetCents ?? 25000;
  const disbursementCents = input.disbursementCents ?? 10405;
  const professionalVatCents = Math.round(professionalNetCents * 0.21);
  const professionalGrossCents = professionalNetCents + professionalVatCents;
  return {
    professionalNetCents,
    professionalVatCents,
    professionalGrossCents,
    disbursementCents,
    totalCents: professionalGrossCents + disbursementCents,
  };
}

export function russianNationalityPaymentConfirmedClient(amounts: RussianServicePaymentAmounts) {
  const serviceUrl = `${BRAND.appUrl}/ru/uslugi/grazhdanstvo-ispanii-rebenok-rozhdennyy-v-ispanii`;
  return {
    subject: 'Оплата получена — начинаем оформление гражданства | EXPERT',
    html: shell('Оплата получена', `
      ${heading('Оплата получена — начинаем оформление')}
      ${para('Здравствуйте!')}
      ${para(`Мы получили оплату услуги <strong>${escapeHtml(RU_NATIONALITY_MINOR_SERVICE_NAME)}</strong>. Ваше дело переходит в этап открытия и проверки документов.`)}
      ${details(
        detail('Профессиональные услуги', `${formatEur(amounts.professionalGrossCents)} (${formatEur(amounts.professionalNetCents)} + IVA 21 %)`),
        detail('Государственная пошлина', `${formatEur(amounts.disbursementCents)} · Modelo 790-026 · suplido`),
        detail('Итого оплачено', `<strong>${formatEur(amounts.totalCents)}</strong>`),
      )}
      ${para('Государственная пошлина 790-026 оплачивается EXPERT от имени и за счёт заявителя. Она учитывается отдельно от наших профессиональных услуг и не входит в налоговую базу гонорара.')}
      ${para('<strong>Что происходит дальше:</strong>')}
      <ol style="margin:0 0 18px;padding-left:22px;color:#29384a;font-size:15px;line-height:1.7;">
        <li>Мы открываем expediente в системе EXPERT.</li>
        <li>Проверяем данные ребёнка и законных представителей.</li>
        <li>Направляем список недостающих документов и способ безопасной передачи файлов.</li>
        <li>После проверки срока легальной резиденции и полного комплекта документов готовим заявление.</li>
        <li>Пошлина оплачивается и заявление подаётся после проверки готовности expediente.</li>
      </ol>
      ${para('Если какого-либо документа пока нет, не переживайте: сначала мы проверим имеющиеся документы и укажем, что именно необходимо дополнить.')}
      ${button('Вернуться к описанию услуги', serviceUrl)}
      ${para('Вопросы можно также отправить в WhatsApp: <a href="https://wa.me/34669045528" style="color:#c88b25;">+34 669 045 528</a>.')}
    `),
  };
}

export function russianNationalityPaymentConfirmedAdmin(input: {
  customerName?: string | null;
  customerEmail?: string | null;
  checkoutSessionId: string;
  orderId?: string | null;
  amounts: RussianServicePaymentAmounts;
}) {
  const safeName = escapeHtml(input.customerName?.trim() || 'Cliente ruso');
  const safeEmail = escapeHtml(input.customerEmail?.trim() || '—');
  const safeSession = escapeHtml(input.checkoutSessionId);
  const safeOrder = escapeHtml(input.orderId?.trim() || '—');
  return {
    subject: `ACCIÓN: abrir expediente de nacionalidad — ${input.customerName?.trim() || 'cliente ruso'}`,
    html: shell('Nuevo pago ruso — abrir expediente', `
      ${heading('Nuevo pago ruso — iniciar tramitación')}
      ${para('<strong>ACCIÓN REQUERIDA:</strong> abrir el expediente y comenzar la revisión documental del servicio de nacionalidad para menor nacido en España.')}
      ${details(
        detail('Cliente', safeName),
        detail('Email', safeEmail === '—' ? '—' : `<a href="mailto:${safeEmail}" style="color:#c88b25;">${safeEmail}</a>`),
        detail('Idioma', 'Ruso (ru)'),
        detail('Servicio', escapeHtml(RU_NATIONALITY_MINOR_SERVICE_NAME)),
        detail('Total cobrado', `<strong>${formatEur(input.amounts.totalCents)}</strong>`),
        detail('Honorarios con IVA', formatEur(input.amounts.professionalGrossCents)),
        detail('Suplido 790-026', formatEur(input.amounts.disbursementCents)),
        detail('Stripe Checkout', safeSession),
        detail('Order ID', safeOrder),
      )}
      <div style="margin:22px 0;padding:18px;background:#fff8e8;border:1px solid #e1c06c;color:#29384a;font-size:14px;line-height:1.65;">
        <strong>Checklist inicial</strong>
        <ol style="margin:10px 0 0;padding-left:20px;">
          <li>Localizar o crear la ficha del cliente y abrir expediente.</li>
          <li>Identificar al menor solicitante y a ambos progenitores/representantes.</li>
          <li>Solicitar la documentación pendiente.</li>
          <li>Comprobar el año de residencia legal, continuada e inmediatamente anterior.</li>
          <li>No abonar la tasa 790-026 hasta validar viabilidad y documentación; el importe ya está cobrado como suplido.</li>
          <li>Guardar justificante de la tasa y de la futura presentación dentro del expediente.</li>
        </ol>
      </div>
      ${button('Abrir panel de administración', `${BRAND.appUrl}/admin`)}
    `),
  };
}
