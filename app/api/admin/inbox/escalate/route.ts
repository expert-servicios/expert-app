import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { createServerSupabaseClient } from '@/lib/integrations/supabase';
import { loadOperations360Inbox } from '@/lib/admin/operations-360-inbox';
import { notifyAdmins } from '@/lib/integrations/push';

function sourceKey(itemId: string) {
  return `operations360-review:${createHash('sha256').update(itemId).digest('hex').slice(0, 40)}`;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminClient(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    const supabase = createServerSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const itemId = typeof body.itemId === 'string' ? body.itemId.trim().slice(0, 300) : '';
    if (!itemId) return NextResponse.json({ error: 'Entrada no válida' }, { status: 400 });

    const inbox = await loadOperations360Inbox(admin, { q: itemId, limit: 20 });
    const item = inbox.items.find((candidate) => candidate.id === itemId);
    if (!item) return NextResponse.json({ error: 'Entrada no encontrada' }, { status: 404 });

    const key = sourceKey(item.id);
    const now = new Date().toISOString();
    const { data: task, error } = await admin
      .from('internal_tasks')
      .upsert({
        source_key: key,
        title: `Operations 360 · ${item.subject}`.slice(0, 240),
        description: [
          `Canal: ${item.channel}.`,
          `Contacto: ${item.actor.name ?? item.actor.email ?? item.actor.phone ?? 'sin identificar'}.`,
          item.preview,
        ].filter(Boolean).join('\n').slice(0, 1800),
        status: 'pendiente',
        priority: 'alta',
        assigned_to: user.id,
        due_date: new Date().toISOString().slice(0, 10),
        source: 'kia',
        lead_id: item.leadId,
        client_id: item.clientId,
        company_id: item.companyId,
        case_id: item.caseId,
        updated_at: now,
        metadata: {
          task_kind: 'operations360_manual_review',
          inbox_item_id: item.id,
          channel: item.channel,
          thread_id: item.threadId,
          external_id: item.externalId,
          source_href: item.sourceHref,
          escalated_from: 'admin_inbox',
        },
      }, { onConflict: 'source_key' })
      .select('id')
      .single();

    if (error || !task?.id) throw error ?? new Error('operations360_review_task_not_created');

    const { error: auditError } = await admin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'operations360.escalated_to_admin',
      entity: 'internal_tasks',
      entity_id: task.id,
      metadata: {
        inbox_item_id: item.id,
        channel: item.channel,
        source_key: key,
      },
    });
    if (auditError) throw auditError;

    await notifyAdmins({
      title: 'Operations 360 requiere intervención',
      body: `${item.subject} · ${item.actor.name ?? item.actor.email ?? item.channel}`.slice(0, 220),
      url: item.caseId
        ? `/admin/expedientes/${item.caseId}`
        : item.clientId
          ? `/admin/clientes/${item.clientId}/operaciones`
          : '/admin/inbox',
      tag: `operations360-review-${task.id}`,
    }).catch(() => {});

    return NextResponse.json({ ok: true, taskId: task.id, sourceKey: key });
  } catch (error) {
    console.error('[admin/inbox/escalate] failed', error);
    return NextResponse.json({ error: 'No se pudo crear la tarea de revisión' }, { status: 500 });
  }
}
