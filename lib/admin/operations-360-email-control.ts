import { createHash } from 'node:crypto';
import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export function emailManualLockKey(threadId: string) {
  return `operations360-email-manual:${createHash('sha256').update(threadId).digest('hex').slice(0, 40)}`;
}

export async function getEmailManualLock(admin: AdminClient, threadId: string) {
  const sourceKey = emailManualLockKey(threadId);
  const { data, error } = await admin
    .from('internal_tasks')
    .select('id,status,assigned_to,due_date,metadata')
    .eq('source_key', sourceKey)
    .in('status', ['pendiente', 'en_progreso'])
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function setEmailThreadControl(input: {
  admin: AdminClient;
  threadId: string;
  mode: 'manual' | 'kia';
  actorId: string;
  subject?: string | null;
  leadId?: string | null;
  clientId?: string | null;
  companyId?: string | null;
  caseId?: string | null;
}) {
  const sourceKey = emailManualLockKey(input.threadId);
  const now = new Date().toISOString();

  if (input.mode === 'kia') {
    const { data, error } = await input.admin
      .from('internal_tasks')
      .update({
        status: 'completada',
        completed_at: now,
        updated_at: now,
      })
      .eq('source_key', sourceKey)
      .in('status', ['pendiente', 'en_progreso'])
      .select('id')
      .maybeSingle();
    if (error) throw error;
    return { mode: 'kia' as const, taskId: data?.id ?? null };
  }

  const { data, error } = await input.admin
    .from('internal_tasks')
    .upsert({
      source_key: sourceKey,
      title: `Control manual email · ${input.subject || 'hilo'}`.slice(0, 220),
      description: 'Operations 360: el hilo queda bajo control humano. KIA puede leer/auditar, pero no debe responder automáticamente hasta liberar el lock.',
      status: 'pendiente',
      priority: 'alta',
      assigned_to: input.actorId,
      due_date: now.slice(0, 10),
      lead_id: input.leadId ?? null,
      client_id: input.clientId ?? null,
      company_id: input.companyId ?? null,
      case_id: input.caseId ?? null,
      source: 'kia',
      updated_at: now,
      metadata: {
        task_kind: 'email_manual_lock',
        gmail_thread_id: input.threadId,
        operations360_mode: 'manual',
        controlled_by: input.actorId,
        controlled_at: now,
      },
    }, { onConflict: 'source_key' })
    .select('id')
    .single();
  if (error) throw error;
  return { mode: 'manual' as const, taskId: data.id };
}
