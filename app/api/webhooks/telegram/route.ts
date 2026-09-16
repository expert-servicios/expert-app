import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { resolveVerifiedTelegramIdentity } from '@/lib/ai/kia/kia-channel-identity';
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

  // M7.2b remains limited to the configured admin chat while identity binding
  // is introduced. A Telegram chat/user id is never treated as EXPERT identity
  // without an active, verified persisted binding.
  if (!isConfiguredTelegramAdminChat(inbound.chatId)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const identity = await resolveVerifiedTelegramIdentity({
    admin: getSupabaseAdmin(),
    externalUserId: inbound.userId,
    externalChatId: inbound.chatId,
  }).catch(() => null);

  const command = inbound.text.split(/\s+/, 1)[0]?.toLowerCase();
  if (command === '/start' || command === '/help') {
    await sendTelegramMessage({
      chatId: inbound.chatId,
      text: [
        '<b>KIA · EXPERT</b>',
        'Canal Telegram conectado en modo seguro.',
        '/status — comprobar conexión e identidad',
        identity
          ? 'Identidad EXPERT verificada. Las acciones KIA siguen bloqueadas hasta activar el routing del siguiente subbloque.'
          : 'Identidad EXPERT aún no vinculada o no verificada.',
      ].join('\n'),
    });
  } else if (command === '/status') {
    await sendTelegramMessage({
      chatId: inbound.chatId,
      text: identity
        ? '✅ Telegram operativo e identidad EXPERT verificada. KIA execution: bloqueada hasta activar routing.'
        : '⚠️ Telegram operativo, pero esta identidad no está vinculada y verificada en EXPERT. KIA execution: bloqueada.',
    });
  } else {
    await sendTelegramMessage({
      chatId: inbound.chatId,
      text: identity
        ? 'Identidad EXPERT verificada. Mensaje recibido; la ejecución KIA desde Telegram se activará en el siguiente subbloque.'
        : 'Mensaje recibido. KIA permanece bloqueada porque esta identidad Telegram no está vinculada y verificada en EXPERT.',
    });
  }

  return NextResponse.json({ ok: true, identityLinked: Boolean(identity) });
}
