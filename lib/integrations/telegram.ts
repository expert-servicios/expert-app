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
  media?: {
    kind: 'voice' | 'audio' | 'document' | 'photo';
    fileId: string;
    fileName: string | null;
    mimeType: string | null;
    fileSize: number | null;
  } | null;
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
      caption?: unknown;
      chat?: { id?: unknown };
      from?: { id?: unknown; username?: unknown };
      voice?: { file_id?: unknown; mime_type?: unknown; file_size?: unknown };
      audio?: { file_id?: unknown; file_name?: unknown; mime_type?: unknown; file_size?: unknown };
      document?: { file_id?: unknown; file_name?: unknown; mime_type?: unknown; file_size?: unknown };
      photo?: Array<{ file_id?: unknown; file_size?: unknown }>;
    };
  };
  const message = update.message;
  if (
    typeof update.update_id !== 'number' ||
    !message ||
    typeof message.message_id !== 'number' ||
    (typeof message.chat?.id !== 'number' && typeof message.chat?.id !== 'string')
  ) {
    return null;
  }

  const text = typeof message.text === 'string'
    ? message.text.trim()
    : typeof message.caption === 'string'
      ? message.caption.trim()
      : '';

  let media: TelegramInboundMessage['media'] = null;
  if (typeof message.voice?.file_id === 'string') {
    media = {
      kind: 'voice',
      fileId: message.voice.file_id,
      fileName: 'telegram-voice.ogg',
      mimeType: typeof message.voice.mime_type === 'string' ? message.voice.mime_type : 'audio/ogg',
      fileSize: typeof message.voice.file_size === 'number' ? message.voice.file_size : null,
    };
  } else if (typeof message.audio?.file_id === 'string') {
    media = {
      kind: 'audio',
      fileId: message.audio.file_id,
      fileName: typeof message.audio.file_name === 'string' ? message.audio.file_name : 'telegram-audio',
      mimeType: typeof message.audio.mime_type === 'string' ? message.audio.mime_type : null,
      fileSize: typeof message.audio.file_size === 'number' ? message.audio.file_size : null,
    };
  } else if (typeof message.document?.file_id === 'string') {
    media = {
      kind: 'document',
      fileId: message.document.file_id,
      fileName: typeof message.document.file_name === 'string' ? message.document.file_name : 'telegram-document',
      mimeType: typeof message.document.mime_type === 'string' ? message.document.mime_type : null,
      fileSize: typeof message.document.file_size === 'number' ? message.document.file_size : null,
    };
  } else if (Array.isArray(message.photo) && message.photo.length) {
    const photo = message.photo[message.photo.length - 1];
    if (typeof photo?.file_id === 'string') {
      media = {
        kind: 'photo',
        fileId: photo.file_id,
        fileName: 'telegram-photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: typeof photo.file_size === 'number' ? photo.file_size : null,
      };
    }
  }

  if (!text && !media) return null;

  return {
    updateId: update.update_id,
    messageId: message.message_id,
    chatId: String(message.chat?.id),
    userId: typeof message.from?.id === 'number' || typeof message.from?.id === 'string'
      ? String(message.from.id)
      : null,
    username: typeof message.from?.username === 'string' ? message.from.username : null,
    text,
    media,
  };
}

export async function downloadTelegramMedia(media: NonNullable<TelegramInboundMessage['media']>): Promise<File> {
  const token = getBotToken();
  if (!token) throw new Error('telegram_not_configured');
  if (media.fileSize && media.fileSize > 20 * 1024 * 1024) throw new Error('telegram_file_too_large');

  const metaResponse = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(media.fileId)}`, {
    signal: AbortSignal.timeout(15_000),
  });
  const meta = await metaResponse.json().catch(() => null) as { ok?: boolean; result?: { file_path?: string } } | null;
  const filePath = meta?.ok === true && typeof meta.result?.file_path === 'string' ? meta.result.file_path : null;
  if (!metaResponse.ok || !filePath) throw new Error('telegram_file_lookup_failed');

  const response = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error('telegram_file_download_failed');
  const blob = await response.blob();
  if (blob.size > 20 * 1024 * 1024) throw new Error('telegram_file_too_large');

  return new File(
    [blob],
    media.fileName || `telegram-${media.kind}`,
    { type: media.mimeType || blob.type || 'application/octet-stream' },
  );
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
