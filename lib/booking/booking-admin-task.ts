import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { formatMadridDate, formatMadridTime } from '@/lib/booking/native-booking';
import { notifyAdmins } from '@/lib/integrations/push';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

type BookingTaskInput = {
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
  reopenCancelled?: boolean;
};

function taskMetadata(input: BookingTaskInput) {
  return {
    task_kind: 'booking_meeting',
    appointment_id: input.appointmentId,
    service_key: input.serviceKey,
    meeting_time: input.localTime,
    meeting_url: input.meetingUrl ?? null,
    booking_email: input.email,
  };
}

async function refreshExistingBookingTask(
  input: BookingTaskInput,
  existing: {
    id: string;
    status: string;
    client_id: string | null;
    company_id: string | null;
    case_id: string | null;
    lead_id: string | null;
    metadata: unknown;
  },
) {
  const metadata = existing.metadata && typeof existing.metadata === 'object' && !Array.isArray(existing.metadata)
    ? existing.metadata as Record<string, unknown>
    : {};

  const payload: Record<string, unknown> = {
    title: `Reunión: ${input.serviceLabel} — ${input.name}`,
    description: [
      `Cita confirmada para ${input.localDate} a las ${input.localTime}.`,
      `Cliente: ${input.name} (${input.email}).`,
      input.meetingUrl ? `Google Meet: ${input.meetingUrl}` : '',
    ].filter(Boolean).join('\n'),
    priority: input.serviceKey === 'onboarding' ? 'alta' : 'media',
    due_date: input.localDate,
    updated_at: new Date().toISOString(),
    metadata: {
      ...metadata,
      ...taskMetadata(input),
    },
  };

  // Refreshes may run with partial context. Never detach a task merely because
  // the current path cannot reconstruct an optional association.
  if (input.clientId) payload.client_id = input.clientId;
  if (input.companyId) payload.company_id = input.companyId;
  if (input.caseId) payload.case_id = input.caseId;
  if (input.leadId) payload.lead_id = input.leadId;

  // Reconciliation preserves terminal states. Explicit reconfirmation may
  // reopen a previously cancelled task, but never an admin-completed one.
  if (input.reopenCancelled && existing.status === 'cancelada') {
    payload.status = 'pendiente';
    payload.completed_at = null;
  }
  const { error } = await input.admin.from('internal_tasks').update(payload).eq('id', existing.id);
  if (error) throw error;
  return existing.id;
}

export async function ensureBookingAdminTask(input: BookingTaskInput) {
  const { admin } = input;
  const { data: existing, error: lookupError } = await admin
    .from('internal_tasks')
    .select('id,status,client_id,company_id,case_id,lead_id,metadata')
    .eq('booking_appointment_id', input.appointmentId)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing?.id) return refreshExistingBookingTask(input, existing);

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('internal_tasks')
    .insert({
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
      booking_appointment_id: input.appointmentId,
      completed_at: null,
      created_at: now,
      updated_at: now,
      metadata: taskMetadata(input),
    })
    .select('id')
    .single();

  if (!error && data?.id) {
    await notifyAdmins({
      title: 'KIA creó una tarea',
      body: `Reunión: ${input.serviceLabel} · ${input.name} · ${input.localDate} ${input.localTime}`.slice(0, 240),
      url: input.caseId ? `/admin/expedientes/${input.caseId}` : '/admin/tareas',
      tag: `booking-task-${data.id}`,
    }).catch(() => {});
    return data.id;
  }
  if (error?.code !== '23505') throw error ?? new Error('Could not create booking admin task');

  // A concurrent booking/reconciliation won the unique-key race. Reload and
  // refresh that single canonical task rather than creating a duplicate.
  const { data: raced, error: racedError } = await admin
    .from('internal_tasks')
    .select('id,status,client_id,company_id,case_id,lead_id,metadata')
    .eq('booking_appointment_id', input.appointmentId)
    .single();
  if (racedError || !raced) throw racedError ?? new Error('Could not reload booking admin task');
  return refreshExistingBookingTask(input, raced);
}

export async function cancelBookingAdminTask(
  admin: AdminClient,
  appointmentId: string,
  reason: string,
) {
  const { data: tasks, error: lookupError } = await admin
    .from('internal_tasks')
    .select('id,metadata,status')
    .eq('booking_appointment_id', appointmentId);

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

type ReconcileAppointment = {
  id: string;
  name: string;
  email: string;
  service: string | null;
  appointment_type: string | null;
  appointment_date: string | null;
  confirmed_date: string | null;
  confirmed_time: string | null;
  meeting_url: string | null;
  status: string | null;
  client_id: string | null;
  company_id: string | null;
};

type ReconcileTask = {
  id: string;
  status: string;
  booking_appointment_id: string | null;
  metadata: unknown;
};

async function loadAppointmentsForReconciliation(admin: AdminClient, from: string, to: string) {
  const rows: ReconcileAppointment[] = [];
  const pageSize = 500;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await admin
      .from('appointments')
      .select('id,name,email,service,appointment_type,appointment_date,confirmed_date,confirmed_time,meeting_url,status,client_id,company_id')
      .gte('appointment_date', from)
      .lte('appointment_date', to)
      .order('appointment_date', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  return rows;
}

async function loadBookingTasksForReconciliation(admin: AdminClient) {
  const rows: ReconcileTask[] = [];
  const pageSize = 500;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await admin
      .from('internal_tasks')
      .select('id,status,booking_appointment_id,metadata')
      .eq('source', 'system')
      .not('booking_appointment_id', 'is', null)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  return rows;
}

export async function reconcileBookingAdminTasks(admin: AdminClient) {
  const now = new Date();
  const from = new Date(now.getTime() - 30 * 24 * 60 * 60_000).toISOString();
  const to = new Date(now.getTime() + 120 * 24 * 60 * 60_000).toISOString();

  const appointments = await loadAppointmentsForReconciliation(admin, from, to);
  const tasks = await loadBookingTasksForReconciliation(admin);

  const taskAppointmentIds = tasks
    .map((task) => typeof task.booking_appointment_id === 'string' ? task.booking_appointment_id : null)
    .filter((id): id is string => Boolean(id));

  let ensured = 0;
  let cancelled = 0;

  for (const appointment of appointments) {
    if (appointment.status === 'confirmed' || appointment.status === 'confirmada') {
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

  return { ensured, cancelled, scanned: appointments.length };
}
