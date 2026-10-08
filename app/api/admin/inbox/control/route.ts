import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { setKiaConversationControl } from '@/lib/ai/kia/kia-conversation-store';

async function requireAdminContext(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.status === 'inactive' || !['admin', 'owner'].includes(profile.role)) return null;
  return { admin, user };
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAdminContext(request);
    if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId.trim() : '';
    const mode = body.mode === 'manual' ? 'manual' : body.mode === 'kia' ? 'kia' : null;
    if (!conversationId || !mode) {
      return NextResponse.json({ error: 'conversationId y mode son obligatorios' }, { status: 400 });
    }

    const result = await setKiaConversationControl({
      admin: ctx.admin,
      conversationId,
      mode,
      actorId: ctx.user.id,
    });

    const { error: auditError } = await ctx.admin.from('audit_logs').insert({
      actor_id: ctx.user.id,
      action: mode === 'manual' ? 'operations360.conversation_taken_over' : 'operations360.conversation_returned_to_kia',
      entity: 'kia_conversations',
      entity_id: conversationId,
      metadata: {
        mode,
        source: 'admin_inbox',
      },
    });
    if (auditError) throw auditError;

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[admin/inbox/control] failed', error);
    return NextResponse.json({ error: 'No se pudo cambiar el control de la conversación' }, { status: 500 });
  }
}
