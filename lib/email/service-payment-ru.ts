import { NATIONALITY_MINOR_SERVICE } from '@/lib/services/nationality-minor';

export const RU_NATIONALITY_MINOR_SERVICE_SLUG = NATIONALITY_MINOR_SERVICE.slug;
export const RU_NATIONALITY_MINOR_SERVICE_NAME = 'Испанское гражданство для ребёнка, родившегося в Испании';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://expertconsulting.es').replace(/\/$/, '');

export type RussianServicePaymentEventType =
  | 'service.payment.confirmed'
  | 'service.payment.confirmed.admin';

export type NationalityServicePaymentAmounts = {
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

function formatEur(cents: number, locale: 'es-ES' | 'ru-RU' = 'ru-RU'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function shell(title: string, body: string, lang: 'es' | 'ru' = 'ru'): string {
  const safeTitle = escapeHtml(title);
  const tagline = lang === 'ru' ? 'Профессиональное сопровождение в Испании' : 'Asesoría profesional en España';
  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle}</title></head>
<body style="margin:0;padding:0;background:#f8f4eb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f4eb;padding:40px 20px;">
<tr><td>
<table width="600" cellpadding="0" cellspacing="0" align="center" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d8cbb5;max-width:100%;">
  <tr><td style="background:#07111d;padding:32px 40px;text-align:center;">
    <p style="margin:0;font-size:26px;font-weight:bold;color:#d7a33a;letter-spacing:5px;font-family:Georgia,serif;">EXPERT</p>
    <p style="margin:6px 0 0;font-size:11px;color:#8899aa;letter-spacing:2px;text-transform:uppercase;">${tagline}</p>
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
  stripeTotalCents?: number | null;
}): NationalityServicePaymentAmounts {
  const professionalNetCents = input.professionalNetCents ?? NATIONALITY_MINOR_SERVICE.professionalNetCents;
  const disbursementCents = input.disbursementCents ?? NATIONALITY_MINOR_SERVICE.officialFeeCents;
  const nominalVatCents = Math.round(professionalNetCents * NATIONALITY_MINOR_SERVICE.vatRate);
  const nominalGrossCents = professionalNetCents + nominalVatCents;
  const totalCents = input.stripeTotalCents ?? (nominalGrossCents + disbursementCents);
  const professionalGrossCents = Math.max(professionalNetCents, totalCents - disbursementCents);
  const professionalVatCents = Math.max(0, professionalGrossCents - professionalNetCents);
  return {
    professionalNetCents,
    professionalVatCents,
    professionalGrossCents,
    disbursementCents,
    totalCents,
  };
}

export function isNationalityPayment(params: {
  eventType: string;
  serviceSlug?: string | null;
}) {
  return (
    (params.eventType === 'service.payment.confirmed' || params.eventType === 'service.payment.confirmed.admin')
    && params.serviceSlug === NATIONALITY_MINOR_SERVICE.slug
  );
}

export function spanishNationalityPaymentConfirmedClient(amounts: NationalityServicePaymentAmounts) {
  const serviceUrl = `${APP_URL}/servicios/extranjeria-nacionalidad/${NATIONALITY_MINOR_SERVICE.slug}`;
  const surnameGuideUrl = `${APP_URL}/docs/apellidos-menor-nacionalidad-registro-civil`;
  const officialSurnameRuleUrl = 'https://www.boe.es/buscar/act.php?id=BOE-A-2007-12948';
  return {
    subject: 'Pago recibido — comenzamos el expediente de nacionalidad | EXPERT',
    html: shell('Pago recibido', `
      ${heading('Pago recibido — comenzamos el expediente')}
      ${para('Hola,')}
      ${para('Hemos recibido correctamente el pago del servicio <strong>Nacionalidad española para menor nacido en España</strong>. El expediente pasa ahora a apertura y revisión documental.')}
      ${details(
        detail('Honorarios profesionales', `${formatEur(amounts.professionalGrossCents, 'es-ES')} (base ${formatEur(amounts.professionalNetCents, 'es-ES')} + IVA ${formatEur(amounts.professionalVatCents, 'es-ES')})`),
        detail('Tasa oficial', `${formatEur(amounts.disbursementCents, 'es-ES')} · Modelo 790-026 · suplido`),
        detail('Total pagado', `<strong>${formatEur(amounts.totalCents, 'es-ES')}</strong>`),
      )}
      ${para('La tasa 790-026 ya está cobrada como suplido. EXPERT la abonará en nombre y por cuenta del solicitante cuando el expediente haya sido revisado y esté listo para presentar. No forma parte de nuestros honorarios ni de su base imponible.')}
      ${para('<strong>Siguientes pasos:</strong>')}
      <ol style="margin:0 0 18px;padding-left:22px;color:#29384a;font-size:15px;line-height:1.7;">
        <li>Abrimos el expediente en EXPERT y revisamos primero la documentación ya disponible.</li>
        <li>Comprobamos la residencia legal propia del menor y quién debe firmar o representar.</li>
        <li>Antes de preparar el formulario, revisamos los apellidos para la futura inscripción española: filiación, apellido personal de la madre y posibles cambios por matrimonio. Si la línea materna está determinada, la duplicación de un único apellido no se trata como una elección para evitar documentación.</li>
        <li>Confirmamos con los progenitores el orden de los apellidos y preparamos el modelo oficial solo cuando los datos estén cerrados.</li>
        <li>Obtenemos las firmas, hacemos la validación final, comprobamos que la tasa no se haya pagado ya y solo después presentamos con autorización profesional.</li>
      </ol>
      ${para(`Más información sobre apellidos y Registro Civil: <a href="${surnameGuideUrl}" style="color:#c88b25;">guía EXPERT</a> · <a href="${officialSurnameRuleUrl}" style="color:#c88b25;">Instrucción oficial de 23 de mayo de 2007</a>.`)}
      ${button('Ver descripción del servicio', serviceUrl)}
    `, 'es'),
  };
}

export function spanishNationalityPaymentConfirmedAdmin(input: {
  customerName?: string | null;
  customerEmail?: string | null;
  checkoutSessionId: string;
  orderId?: string | null;
  caseId?: string | null;
  amounts: NationalityServicePaymentAmounts;
}) {
  const safeName = escapeHtml(input.customerName?.trim() || 'Cliente');
  const safeEmail = escapeHtml(input.customerEmail?.trim() || '—');
  const safeSession = escapeHtml(input.checkoutSessionId);
  const safeOrder = escapeHtml(input.orderId?.trim() || '—');
  const safeCase = escapeHtml(input.caseId?.trim() || '—');
  const caseUrl = input.caseId?.trim()
    ? APP_URL + '/admin/expedientes/' + encodeURIComponent(input.caseId.trim())
    : APP_URL + '/admin';
  const surnameGuideUrl = APP_URL + '/docs/apellidos-menor-nacionalidad-registro-civil';
  const officialSurnameRuleUrl = 'https://www.boe.es/buscar/act.php?id=BOE-A-2007-12948';
  return {
    subject: `ACCIÓN: revisar expediente de nacionalidad — ${input.customerName?.trim() || 'cliente'}`,
    html: shell('Nuevo pago — revisar expediente', `
      ${heading('Nuevo pago — expediente de nacionalidad')}
      ${para('<strong>ACCIÓN REQUERIDA:</strong> revisar la ficha y el expediente creados automáticamente e iniciar la revisión documental.')}
      ${details(
        detail('Cliente', safeName),
        detail('Email', safeEmail === '—' ? '—' : `<a href="mailto:${safeEmail}" style="color:#c88b25;">${safeEmail}</a>`),
        detail('Idioma', 'Español (es)'),
        detail('Servicio', 'Nacionalidad española para menor nacido en España'),
        detail('Total cobrado', `<strong>${formatEur(input.amounts.totalCents, 'es-ES')}</strong>`),
        detail('Honorarios con IVA', formatEur(input.amounts.professionalGrossCents, 'es-ES')),
        detail('Suplido 790-026', formatEur(input.amounts.disbursementCents, 'es-ES')),
        detail('Stripe Checkout', safeSession),
        detail('Order ID', safeOrder),
        detail('Case ID', safeCase),
      )}
      ${para('La tasa ya está cobrada como suplido. No debe volver a cobrarse al cliente ni incluirse como ingreso profesional.')}
      <div style="margin:22px 0;padding:18px;background:#fff8e8;border:1px solid #e1c06c;color:#29384a;font-size:14px;line-height:1.65;">
        <strong>Gate operativo antes de preparar el modelo</strong>
        <ol style="margin:10px 0 0;padding-left:20px;">
          <li>Revisar documentación existente, residencia legal propia del menor y representación/patria potestad.</li>
          <li>Si EXPERT presenta, formalizar el mandato y conservar el documento firmado y su certificado de finalización cuando se use DocuSign.</li>
          <li>Resolver apellidos registrales: filiación, apellido personal de la madre, cambios por matrimonio y orden; comprobar hermanos si procede.</li>
          <li>No marcar apellido materno «desconocido» ni duplicar un apellido para evitar documentación cuando ese dato sea conocido o acreditable.</li>
          <li>Preparar el modelo, obtener firmas, validar el expediente y comprobar si la tasa ya está pagada antes de cualquier nuevo pago.</li>
          <li>Presentar únicamente con autorización profesional expresa y archivar justificante y copia final presentada.</li>
        </ol>
      </div>
      ${para(`Referencia interna: <a href="${surnameGuideUrl}" style="color:#c88b25;">guía de apellidos</a> · <a href="${officialSurnameRuleUrl}" style="color:#c88b25;">BOE — Instrucción 23/05/2007</a>.`)}
      ${button(input.caseId?.trim() ? 'Abrir expediente en Admin' : 'Abrir panel de administración', caseUrl)}
    `, 'es'),
  };
}

export function russianNationalityPaymentConfirmedClient(amounts: NationalityServicePaymentAmounts) {
  const serviceUrl = `${APP_URL}/ru/uslugi/grazhdanstvo-ispanii-rebenok-rozhdennyy-v-ispanii`;
  const surnameGuideUrl = `${APP_URL}/ru/docs/familii-rebenka-pri-poluchenii-grazhdanstva-ispanii`;
  const surnameBlogUrl = `${APP_URL}/ru/blog/odna-familiya-u-rebenka-grazhdanstvo-ispanii`;
  const officialSurnameRuleUrl = 'https://www.boe.es/buscar/act.php?id=BOE-A-2007-12948';
  return {
    subject: 'Оплата получена — начинаем оформление гражданства | EXPERT',
    html: shell('Оплата получена', `
      ${heading('Оплата получена — начинаем оформление')}
      ${para('Здравствуйте!')}
      ${para(`Мы получили оплату услуги <strong>${escapeHtml(RU_NATIONALITY_MINOR_SERVICE_NAME)}</strong>. Ваше дело переходит в этап открытия и проверки документов.`)}
      ${details(
        detail('Профессиональные услуги', `${formatEur(amounts.professionalGrossCents)} (база ${formatEur(amounts.professionalNetCents)} + IVA ${formatEur(amounts.professionalVatCents)})`),
        detail('Государственная пошлина', `${formatEur(amounts.disbursementCents)} · Modelo 790-026 · suplido`),
        detail('Итого оплачено', `<strong>${formatEur(amounts.totalCents)}</strong>`),
      )}
      ${para('Государственная пошлина 790-026 оплачивается EXPERT от имени и за счёт заявителя. Она учитывается отдельно от наших профессиональных услуг и не входит в налоговую базу гонорара.')}
      ${para('<strong>Что происходит дальше:</strong>')}
      <ol style="margin:0 0 18px;padding-left:22px;color:#29384a;font-size:15px;line-height:1.7;">
        <li>Мы открываем expediente и сначала проверяем уже имеющиеся документы.</li>
        <li>Проверяем собственную легальную резиденцию ребёнка и полномочия/подписи законных представителей.</li>
        <li>До подготовки заявления отдельно проверяем будущие фамилии для испанского Registro Civil: происхождение, личную фамилию матери и возможную смену фамилии при браке. Если материнская линия установлена, удвоение одной фамилии не используется как способ отказаться от подтверждающих документов.</li>
        <li>Согласовываем с родителями порядок фамилий и только после этого готовим официальный бланк для подписи.</li>
        <li>После подписей проводим финальную проверку, проверяем, не оплачена ли уже пошлина, и подаём заявление только после профессионального подтверждения готовности.</li>
      </ol>
      ${para('Если какого-либо документа пока нет, сначала мы проверим имеющиеся документы и укажем, что именно необходимо дополнить.')}
      ${para(`Подробнее о фамилиях: <a href="${surnameGuideUrl}" style="color:#c88b25;">инструкция EXPERT</a> · <a href="${surnameBlogUrl}" style="color:#c88b25;">статья с примерами</a> · <a href="${officialSurnameRuleUrl}" style="color:#c88b25;">официальная Инструкция 23.05.2007</a>.`)}
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
  caseId?: string | null;
  amounts: NationalityServicePaymentAmounts;
}) {
  const safeName = escapeHtml(input.customerName?.trim() || 'Cliente ruso');
  const safeEmail = escapeHtml(input.customerEmail?.trim() || '—');
  const safeSession = escapeHtml(input.checkoutSessionId);
  const safeOrder = escapeHtml(input.orderId?.trim() || '—');
  const safeCase = escapeHtml(input.caseId?.trim() || '—');
  const caseUrl = input.caseId?.trim()
    ? APP_URL + '/admin/expedientes/' + encodeURIComponent(input.caseId.trim())
    : APP_URL + '/admin';
  const surnameGuideUrl = APP_URL + '/ru/docs/familii-rebenka-pri-poluchenii-grazhdanstva-ispanii';
  const officialSurnameRuleUrl = 'https://www.boe.es/buscar/act.php?id=BOE-A-2007-12948';
  return {
    subject: `ACCIÓN: revisar expediente de nacionalidad — ${input.customerName?.trim() || 'cliente ruso'}`,
    html: shell('Nuevo pago ruso — revisar expediente', `
      ${heading('Nuevo pago ruso — expediente creado')}
      ${para('<strong>ACCIÓN REQUERIDA:</strong> revisar la ficha y el expediente creados automáticamente y comenzar la revisión documental del servicio de nacionalidad para menor nacido en España.')}
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
        detail('Case ID', safeCase),
      )}
      <div style="margin:22px 0;padding:18px;background:#fff8e8;border:1px solid #e1c06c;color:#29384a;font-size:14px;line-height:1.65;">
        <strong>Checklist inicial</strong>
        <ol style="margin:10px 0 0;padding-left:20px;">
          <li>Abrir la ficha y revisar primero los documentos ya disponibles; no pedir duplicados.</li>
          <li>Verificar residencia legal propia del menor, patria potestad, representación y mandato de EXPERT cuando proceda.</li>
          <li>Resolver antes del modelo los apellidos registrales: filiación, apellido personal de la madre, cambio por matrimonio, orden y posibles hermanos con orden previo.</li>
          <li>No marcar «apellido materno desconocido» ni duplicar un apellido para evitar documentación cuando el dato sea conocido o acreditable.</li>
          <li>Preparar el modelo solo tras cerrar esos gates; obtener firmas válidas y archivar certificado de finalización DocuSign si se utilizó.</li>
          <li>Completar validación pre-presentación. No abonar nuevamente la tasa si ya existe justificante/NRC; el importe fue cobrado como suplido.</li>
          <li>Presentar solo con autorización profesional expresa y archivar justificante, número de registro y copia final presentada.</li>
        </ol>
      </div>
      ${para(`Referencias: <a href="${surnameGuideUrl}" style="color:#c88b25;">guía RU de apellidos</a> · <a href="${officialSurnameRuleUrl}" style="color:#c88b25;">BOE — Instrucción 23/05/2007</a>.`)}
      ${button(input.caseId?.trim() ? 'Abrir expediente en Admin' : 'Abrir panel de administración', caseUrl)}
    `),
  };
}
