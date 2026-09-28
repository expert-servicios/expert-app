import { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export async function ensureBookingAdminTask(input: {
  admin: AdminClient;
  appointmentId: string;
  serviceKey: string;
  serviceLabel: string;
  name: string;
  email: string;
  localDate: string;
  localTime: string;
  meetingUrl?: string | null;
  clientId?: string | null;
  companyId?: string | null;
  caseId?: string | null;
}) {
  const { admin } = input;
  const { data: existing, error: lookupError } = await admin
    .from('internal_tasks')
    .select('id,status')
    .eq('source', 'system')
    .contains('metadata', { appointment_id: input.appointmentId })
    .maybeSingle();

  if (lookupError) throw lookupError;

  const payload = {
    title: `Reunión: ${input.serviceLabel} — ${input.name}`,
    description: [
      `Cita confirmada para ${input.localDate} a las ${input.localTime}.`,
      `Cliente: ${input.name} (${input.email}).`,
      input.meetingUrl ? `Google Meet: ${input.meetingUrl}` : '',
    ].filter(Boolean).join('\n'),
    status: 'pendiente',
    priority: input.serviceKey === 'onboarding' ? 'alta' : 'media',
    client_id: input.clientId ?? null,
    company_id: input.companyId ?? null,
    case_id: input.caseId ?? null,
    due_date: input.localDate,
    source: 'system',
    completed_at: null,
    updated_at: new Date().toISOString(),
    metadata: {
      task_kind: 'booking_meeting',
      appointment_id: input.appointmentId,
      service_key: input.serviceKey,
      meeting_time: input.localTime,
      meeting_url: input.meetingUrl ?? null,
      booking_email: input.email,
    },
  } as const;

  if (existing?.id) {
    const { error } = await admin
      .from('internal_tasks')
      .update(payload)
      .eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await admin
    .from('internal_tasks')
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) throw error ?? new Error('Could not create booking admin task');
  return data.id;
}

export async function cancelBookingAdminTask(
  admin: AdminClient,
  appointmentId: string,
  reason: string,
) {
  const { data: tasks, error: lookupError } = await admin
    .from('internal_tasks')
    .select('id,metadata,status')
    .eq('source', 'system')
    .contains('metadata', { appointment_id: appointmentId });

  if (lookupError) throw lookupError;
  if (!tasks?.length) return 0;

  const now = new Date().toISOString();
  for (const task of tasks) {
    if (task.status === 'completada' || task.status === 'cancelada') continue;
    const metadata = task.metadata && typeof task.metadata === 'object' && !Array.isArray(task.metadata)
      ? task.metadata as Record<string, unknown>
      : {};
    const { error } = await admin
      .from('internal_tasks')
      .update({
        status: 'cancelada',
        completed_at: null,
        updated_at: now,
        metadata: {
          ...metadata,
          cancelled_reason: reason,
          cancelled_at: now,
        },
      })
      .eq('id', task.id);
    if (error) throw error;
  }

  return tasks.length;
}
