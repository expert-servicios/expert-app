import { absoluteAppUrl } from '@/lib/utils/app-url';

const VERIFIED_BOT_USERNAME = 'expert_devops_bot';

type ReviewNotification = {
  changeId: string;
  authority: string;
  title: string;
  sourceUrl: string;
  summary: string;
  severity: string;
  effectiveDate: string | null;
  proposalUrl: string | null;
};

type TelegramJson<T> = { ok?: boolean; result?: T };

async function telegramRequest<T>(
  token: string,
  method: string,
  payload?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(
    'https://api.telegram.org/bot' + token + '/' + method,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload ?? {}),
      signal: AbortSignal.timeout(12_000),
      cache: 'no-store',
    },
  );
  // Do not propagate Telegram response bodies: some provider errors can
  // inadvertently contain bot-related sensitive details.
  if (!response.ok) throw new Error('devops_telegram_http_error');
  const result = await response.json().catch(() => null) as TelegramJson<T> | null;
  if (!result?.ok || result.result === undefined) {
    throw new Error('devops_telegram_api_rejected');
  }
  return result.result;
}

function isSafeOfficialUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password
      && !url.hostname.endsWith('.invalid');
  } catch {
    return false;
  }
}

export function formatDevOpsLegalReviewMessage(input: ReviewNotification) {
  // Telegram HTML entities must be escaped; never embed content-controlled HTML.
  const esc = (value: string) => value.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return [
    '<b>EXPERT DevOps · Revisión jurídica humana</b>',
    'Estado: pendiente de revisión; NO aprobado',
    'Organismo: ' + esc(input.authority),
    'Fuente: ' + esc(input.title.slice(0, 220)),
    'Severidad: ' + esc(input.severity.toUpperCase()),
    'Vigencia detectada: ' + esc(input.effectiveDate ?? 'por verificar'),
    '',
    esc(input.summary.slice(0, 850)),
    '',
    'ID del cambio: <code>' + esc(input.changeId) + '</code>',
    'Revisar fuente oficial, publicación, vigencia e impacto antes de resolver.',
    'Telegram solo avisa. La resolución exige Admin autenticado y evidencia.',
  ].join('\n');
}

/**
 * Sends legal review alerts through @expert_devops_bot, never @kia_expert_bot.
 * This is notification-only: no callbacks, commands, approval, or merge writes.
 */
export async function notifyDevOpsRegulatoryHumanReview(
  input: ReviewNotification,
): Promise<'disabled' | 'sent'> {
  if (process.env.KIA_REGULATORY_DEVOPS_TELEGRAM_ENABLED !== 'true') return 'disabled';
  const token = process.env.KIA_PR_REVIEW_TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.KIA_PR_REVIEW_TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) throw new Error('devops_telegram_not_configured');
  if (!/^[1-9]\d{4,15}$/.test(chatId)) throw new Error('devops_telegram_private_chat_required');

  const bot = await telegramRequest<{ username?: string }>(token, 'getMe');
  if (bot.username?.toLowerCase() !== VERIFIED_BOT_USERNAME) {
    throw new Error('devops_telegram_wrong_bot_identity');
  }

  const chat = await telegramRequest<{ id: number | string; type: string }>(
    token, 'getChat', { chat_id: chatId },
  );
  if (chat.type !== 'private' || String(chat.id) !== chatId) {
    throw new Error('devops_telegram_private_chat_required');
  }

  const reviewUrl = absoluteAppUrl(
    '/admin/regulatory#change-' + encodeURIComponent(input.changeId),
  );
  if (!reviewUrl.startsWith('https://')) throw new Error('devops_telegram_review_url_invalid');

  const buttons: Array<Array<{ text: string; url: string }>> = [
    [{ text: 'Revisar en Admin EXPERT', url: reviewUrl }],
  ];
  if (input.proposalUrl && /^https:\/\/github\.com\/expert-servicios\/expert-app\/pull\/\d+$/.test(input.proposalUrl)) {
    buttons.push([{ text: 'Consultar PR de evidencia', url: input.proposalUrl }]);
  }
  if (isSafeOfficialUrl(input.sourceUrl)) {
    buttons.push([{ text: 'Fuente oficial', url: input.sourceUrl }]);
  }

  const sent = await telegramRequest<{ message_id?: number }>(
    token,
    'sendMessage',
    {
      chat_id: chatId,
      text: formatDevOpsLegalReviewMessage(input),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard: buttons },
    },
  );
  if (!Number.isSafeInteger(sent.message_id)) throw new Error('devops_telegram_send_unconfirmed');
  return 'sent';
}
