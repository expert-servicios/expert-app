import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { setEmailThreadControl } from '@/lib/admin/operations-360-email-control';
import { loadOperations360Inbox } from '@/lib/admin/operations-360-inbox';

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
    const itemId = typeof body.itemId === 'string' ? body.itemId.trim().slice(0, 300) : '';
    const mode = body.mode === 'manual' ? 'manual' : body.mode === 'kia' ? 'kia' : null;
    if (!itemId || !mode) return NextResponse.json({ error: 'itemId y mode son obligatorios' }, { status: 400 });

    const inbox = await loadOperations360Inbox(ctx.admin, { q: itemId, limit: 20 });
    const item = inbox.items.find((candidate) => candidate.id === itemId);
    if (!item || item.source !== 'email_inbox_cache' || !item.threadId) {
      return NextResponse.json({ error: 'Hilo email no encontrado' }, { status: 404 });
    }

    const result = await setEmailThreadControl({
      admin: ctx.admin,
      threadId: item.threadId,
      mode,
      actorId: ctx.user.id,
      subject: item.subject,
      leadId: item.leadId,
      clientId: item.clientId,
      companyId: item.companyId,
      caseId: item.caseId,
    });

    const { error: auditError } = await ctx.admin.from('audit_logs').insert({
      actor_id: ctx.user.id,
      action: mode === 'manual'
        ? 'operations360.email_taken_over'
        : 'operations360.email_returned_to_kia',
      entity: 'email_thread',
      entity_id: item.threadId,
      metadata: {
        inbox_item_id: item.id,
        mode,
        task_id: result.taskId,
        provider: item.metadata.provider ?? 'gmail',
      },
    });
    if (auditError) throw auditError;

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[admin/inbox/email-control] failed', error);
    return NextResponse.json({ error: 'No se pudo cambiar el control del hilo de email' }, { status: 500 });
  }
}
