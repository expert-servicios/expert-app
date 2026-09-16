import { NextRequest, NextResponse } from 'next/server';
import {
  isConfiguredTelegramAdminChat,
  isTelegramWebhookAuthorized,
  parseTelegramInboundMessage,
  sendTelegramMessage,
} from '@/lib/integrations/telegram';

const SECRET_HEADER = 'x-telegram-bot-api-secret-token';

export async function POST(request: NextRequest) {
  if (!isTelegramWebhookAuthorized(request.headers.get(SECRET_HEADER))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const inbound = parseTelegramInboundMessage(payload);
  if (!inbound) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // M7.2 foundation: Telegram is inbound-capable, but KIA execution remains
  // fail-closed until Telegram identity is explicitly linked to an EXPERT actor.
  if (!isConfiguredTelegramAdminChat(inbound.chatId)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const command = inbound.text.split(/\s+/, 1)[0]?.toLowerCase();
  if (command === '/start' || command === '/help') {
    await sendTelegramMessage({
      chatId: inbound.chatId,
      text: [
        '<b>KIA · EXPERT</b>',
        'Canal Telegram conectado en modo seguro.',
        '/status — comprobar conexión',
        'Las acciones KIA seguirán bloqueadas hasta vincular esta identidad Telegram con un usuario EXPERT.',
      ].join('\n'),
    });
  } else if (command === '/status') {
    await sendTelegramMessage({
      chatId: inbound.chatId,
      text: '✅ Telegram inbound operativo. KIA tools: bloqueadas hasta vinculación de identidad EXPERT.',
    });
  } else {
    await sendTelegramMessage({
      chatId: inbound.chatId,
      text: 'Mensaje recibido. La ejecución de KIA desde Telegram aún está bloqueada hasta vincular tu identidad EXPERT.',
    });
  }

  return NextResponse.json({ ok: true });
}
