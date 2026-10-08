import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';

function safeText(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminClient(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId')?.trim() ?? '';
    if (!conversationId) return NextResponse.json({ error: 'conversationId requerido' }, { status: 400 });

    const { data: conversation, error: conversationError } = await admin
      .from('kia_conversations')
      .select('id,channel,metadata,status,profile_id,company_id,case_id,updated_at')
      .eq('id', conversationId)
      .maybeSingle();
    if (conversationError) throw conversationError;
    if (!conversation) return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });

    const [{ data: messages, error: messagesError }, { data: audits, error: auditsError }] = await Promise.all([
      admin
        .from('kia_conversation_messages')
        .select('id,role,body,intent,metadata,created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(200),
      admin
        .from('audit_logs')
        .select('id,actor_id,action,metadata,created_at')
        .eq('entity', 'kia_conversations')
        .eq('entity_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100),
    ]);
    if (messagesError) throw messagesError;
    if (auditsError) throw auditsError;

    const actorIds = [...new Set((audits ?? []).map((row) => row.actor_id).filter(Boolean))];
    const actorMap = new Map<string, string | null>();
    if (actorIds.length) {
      const { data: actors, error: actorsError } = await admin
        .from('profiles')
        .select('id,full_name')
        .in('id', actorIds);
      if (actorsError) throw actorsError;
      for (const actor of actors ?? []) actorMap.set(actor.id, actor.full_name ?? null);
    }

    const timeline = [
      ...(messages ?? []).map((row) => ({
        id: `message:${row.id}`,
        kind: 'message',
        role: row.role,
        text: safeText(row.body),
        intent: row.intent ?? null,
        createdAt: row.created_at,
        metadata: row.metadata ?? {},
      })),
      ...(audits ?? []).map((row) => ({
        id: `audit:${row.id}`,
        kind: 'audit',
        role: 'system',
        text: row.action,
        intent: null,
        createdAt: row.created_at,
        metadata: {
          ...(row.metadata ?? {}),
          actor_id: row.actor_id,
          actor_name: row.actor_id ? actorMap.get(row.actor_id) ?? null : null,
        },
      })),
    ].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        channel: conversation.channel,
        status: conversation.status,
        profileId: conversation.profile_id,
        companyId: conversation.company_id,
        caseId: conversation.case_id,
        mode: conversation.metadata?.operations360_mode === 'manual' ? 'manual' : 'kia',
        ownerId: conversation.metadata?.operations360_owner_id ?? null,
      },
      timeline,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[admin/inbox/timeline] failed', error);
    return NextResponse.json({ error: 'No se pudo cargar la conversación' }, { status: 500 });
  }
}
