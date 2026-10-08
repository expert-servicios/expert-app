import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { appendKiaConversationMessage, getKiaConversationControlMode } from '@/lib/ai/kia/kia-conversation-store';
import { escapeTelegramHtml, sendTelegramMessageConfirmed } from '@/lib/integrations/telegram';

async function requireAdminContext(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || profile.status === 'inactive' || !['admin','owner'].includes(profile.role)) return null;
  return { admin, user };
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAdminContext(request);
    if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId.trim() : '';
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 4000) : '';
    if (!conversationId || !text) {
      return NextResponse.json({ error: 'conversationId y text son obligatorios' }, { status: 400 });
    }

    const { data: conversation, error } = await ctx.admin
      .from('kia_conversations')
      .select('id,channel,metadata,status')
      .eq('id', conversationId)
      .maybeSingle();
    if (error) throw error;
    if (!conversation || conversation.status !== 'active') {
      return NextResponse.json({ error: 'Conversación no disponible' }, { status: 404 });
    }
    if (conversation.channel !== 'telegram') {
      return NextResponse.json({ error: 'Este canal no admite respuesta manual desde este endpoint' }, { status: 400 });
    }
    if (getKiaConversationControlMode(conversation.metadata) !== 'manual') {
      return NextResponse.json({ error: 'Toma primero el control manual de la conversación' }, { status: 409 });
    }

    const chatId = typeof conversation.metadata?.telegram_chat_id === 'string'
      ? conversation.metadata.telegram_chat_id
      : '';
    if (!chatId) return NextResponse.json({ error: 'No se encontró el chat Telegram asociado' }, { status: 409 });

    const telegramMessageId = await sendTelegramMessageConfirmed({
      chatId,
      text: escapeTelegramHtml(text),
    });

    const stored = await appendKiaConversationMessage({
      admin: ctx.admin,
      conversationId,
      role: 'professional',
      body: text,
      metadata: {
        telegram_chat_id: chatId,
        telegram_message_id: telegramMessageId,
        delivery_state: 'sent',
        operations360_manual_reply: true,
        actor_id: ctx.user.id,
      },
    });

    const { error: auditError } = await ctx.admin.from('audit_logs').insert({
      actor_id: ctx.user.id,
      action: 'operations360.telegram_manual_reply_sent',
      entity: 'kia_conversations',
      entity_id: conversationId,
      metadata: {
        message_id: stored.id,
        telegram_message_id: telegramMessageId,
        source: 'admin_inbox',
      },
    });
    if (auditError) throw auditError;

    return NextResponse.json({ ok: true, messageId: stored.id, telegramMessageId });
  } catch (error) {
    console.error('[admin/inbox/reply] failed', error);
    return NextResponse.json({ error: 'No se pudo enviar la respuesta manual' }, { status: 500 });
  }
}
