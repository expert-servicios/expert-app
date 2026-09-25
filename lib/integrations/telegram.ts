function getBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || undefined;
}

function getAdminChatId(): string | undefined {
  return process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() || undefined;
}

function getWebhookSecret(): string | undefined {
  return process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || undefined;
}

export interface TelegramOutbound {
  chatId: string;
  text: string;
  quickReplies?: string[];
}

export interface TelegramInboundMessage {
  updateId: number;
  messageId: number;
  chatId: string;
  userId: string | null;
  username: string | null;
  text: string;
}

export function isTelegramWebhookAuthorized(secretHeader: string | null): boolean {
  const expected = getWebhookSecret();
  if (!expected || !secretHeader) return false;
  return secretHeader === expected;
}

export function parseTelegramInboundMessage(payload: unknown): TelegramInboundMessage | null {
  if (!payload || typeof payload !== 'object') return null;
  const update = payload as {
    update_id?: unknown;
    message?: {
      message_id?: unknown;
      text?: unknown;
      chat?: { id?: unknown };
      from?: { id?: unknown; username?: unknown };
    };
  };
  const message = update.message;
  if (
    typeof update.update_id !== 'number' ||
    !message ||
    typeof message.message_id !== 'number' ||
    typeof message.text !== 'string' ||
    (typeof message.chat?.id !== 'number' && typeof message.chat?.id !== 'string')
  ) {
    return null;
  }

  const trimmed = message.text.trim();
  if (!trimmed) return null;

  return {
    updateId: update.update_id,
    messageId: message.message_id,
    chatId: String(message.chat?.id),
    userId: typeof message.from?.id === 'number' || typeof message.from?.id === 'string'
      ? String(message.from.id)
      : null,
    username: typeof message.from?.username === 'string' ? message.from.username : null,
    text: trimmed,
  };
}

export function isConfiguredTelegramAdminChat(chatId: string): boolean {
  const adminChatId = getAdminChatId();
  return Boolean(adminChatId && adminChatId === chatId);
}

export function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Sends a Telegram message. Best-effort: resolves silently if not configured or on failure. */
export async function sendTelegramMessage({ chatId, text }: TelegramOutbound): Promise<void> {
  const token = getBotToken();
  if (!token || !chatId) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      console.error('[telegram] sendMessage failed:', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error('[telegram] sendMessage error:', err);
  }
}

/** For audited conversations: require provider acceptance and never retry an ambiguous send blindly. */
export async function sendTelegramMessageConfirmed({ chatId, text, quickReplies }: TelegramOutbound): Promise<number> {
  const token = getBotToken();
  if (!token || !chatId) throw new Error('telegram_not_configured');
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...(quickReplies?.length ? {
        reply_markup: {
          keyboard: quickReplies.slice(0, 3).map((label) => [{ text: label }]),
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      } : {}),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await res.json();
  if (!res.ok || body.ok !== true || !Number.isSafeInteger(body.result?.message_id)) throw new Error('telegram_send_unconfirmed');
  return body.result.message_id;
}

/** Sends a Telegram message to the configured admin chat. No-op if TELEGRAM_ADMIN_CHAT_ID is unset. */
export async function notifyAdminsTelegram(text: string): Promise<void> {
  const chatId = getAdminChatId();
  if (!chatId) return;
  await sendTelegramMessage({ chatId, text });
}


export async function sendTelegramPhotoConfirmed(input: {
  chatId: string;
  photoUrl: string;
  caption?: string;
}): Promise<number> {
  const token = getBotToken();
  if (!token || !input.chatId) throw new Error('telegram_not_configured');
  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: input.chatId,
      photo: input.photoUrl,
      caption: input.caption?.slice(0, 900),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await res.json();
  if (!res.ok || body.ok !== true || !Number.isSafeInteger(body.result?.message_id)) throw new Error('telegram_photo_send_unconfirmed');
  return body.result.message_id;
}
