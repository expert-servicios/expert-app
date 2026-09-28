import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { formatMadridDate, formatMadridTime } from '@/lib/booking/native-booking';

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
  leadId?: string | null;
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
    lead_id: input.leadId ?? null,
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


export async function reconcileBookingAdminTasks(admin: AdminClient) {
  const now = new Date();
  const from = new Date(now.getTime() - 30 * 24 * 60 * 60_000).toISOString();
  const to = new Date(now.getTime() + 120 * 24 * 60 * 60_000).toISOString();

  const { data: appointments, error: appointmentError } = await admin
    .from('appointments')
    .select('id,name,email,service,appointment_type,appointment_date,confirmed_date,confirmed_time,meeting_url,status,client_id,company_id')
    .gte('appointment_date', from)
    .lte('appointment_date', to)
    .order('appointment_date', { ascending: true })
    .limit(500);
  if (appointmentError) throw appointmentError;

  const appointmentMap = new Map((appointments ?? []).map((appointment) => [appointment.id, appointment]));
  const { data: tasks, error: taskError } = await admin
    .from('internal_tasks')
    .select('id,status,metadata')
    .eq('source', 'system')
    .contains('metadata', { task_kind: 'booking_meeting' })
    .limit(1000);
  if (taskError) throw taskError;

  const taskByAppointment = new Map<string, { id: string; status: string }>();
  for (const task of tasks ?? []) {
    const metadata = task.metadata && typeof task.metadata === 'object' && !Array.isArray(task.metadata)
      ? task.metadata as Record<string, unknown>
      : {};
    const appointmentId = typeof metadata.appointment_id === 'string' ? metadata.appointment_id : null;
    if (appointmentId) taskByAppointment.set(appointmentId, { id: task.id, status: task.status });
  }

  let ensured = 0;
  let cancelled = 0;

  for (const appointment of appointments ?? []) {
    if (appointment.status === 'confirmed') {
      const appointmentStart = appointment.appointment_date
        ? new Date(appointment.appointment_date)
        : null;
      const localDate = appointment.confirmed_date
        ?? (appointmentStart ? formatMadridDate(appointmentStart) : null);
      const localTime = appointment.confirmed_time
        ?? (appointmentStart ? formatMadridTime(appointmentStart) : null);
      if (!localDate || !localTime) continue;

      await ensureBookingAdminTask({
        admin,
        appointmentId: appointment.id,
        serviceKey: appointment.appointment_type ?? 'reunion',
        serviceLabel: appointment.service ?? 'Reunión',
        name: appointment.name,
        email: appointment.email,
        localDate,
        localTime,
        meetingUrl: appointment.meeting_url,
        clientId: appointment.client_id,
        companyId: appointment.company_id,
      });
      ensured++;
    } else if (appointment.status === 'cancelled' || appointment.status === 'rescheduled') {
      cancelled += await cancelBookingAdminTask(
        admin,
        appointment.id,
        `Reconciliación: cita ${appointment.status}.`,
      );
    }
  }

  const taskAppointmentIds = [...taskByAppointment.keys()];
  const existingTaskAppointmentIds = new Set<string>();
  for (let offset = 0; offset < taskAppointmentIds.length; offset += 100) {
    const batch = taskAppointmentIds.slice(offset, offset + 100);
    if (!batch.length) continue;
    const { data: existingRows, error: existingError } = await admin
      .from('appointments')
      .select('id')
      .in('id', batch);
    if (existingError) throw existingError;
    for (const row of existingRows ?? []) existingTaskAppointmentIds.add(row.id);
  }

  for (const appointmentId of taskAppointmentIds) {
    if (existingTaskAppointmentIds.has(appointmentId)) continue;
    cancelled += await cancelBookingAdminTask(
      admin,
      appointmentId,
      'Reconciliación: la cita ya no existe en EXPERT.',
    );
  }

  return { ensured, cancelled, scanned: appointments?.length ?? 0 };
}
