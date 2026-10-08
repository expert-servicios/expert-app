import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getAdminOwnerEmail } from '@/lib/admin/admin-owner';
import { upsertAdminAgendaEventSA } from '@/lib/integrations/google-calendar';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

function madridDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function nextDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function taskLink(task: {
  id: string;
  case_id: string | null;
  client_id: string | null;
  lead_id: string | null;
}) {
  if (task.case_id) return `https://expertconsulting.es/admin/expedientes/${task.case_id}`;
  if (task.client_id) return `https://expertconsulting.es/admin/clientes/${task.client_id}`;
  if (task.lead_id) return `https://expertconsulting.es/admin/leads?leadId=${encodeURIComponent(task.lead_id)}`;
  return `https://expertconsulting.es/admin/tareas?taskId=${encodeURIComponent(task.id)}`;
}

export async function refreshAdminDailyAgenda(admin: AdminClient, now = new Date()) {
  const date = madridDate(now);
  const [tasksRes, meetingsRes] = await Promise.all([
    admin
      .from('internal_tasks')
      .select('id,title,priority,due_date,client_id,lead_id,case_id,company_id,status,metadata')
      .in('status', ['pendiente', 'en_progreso'])
      .not('due_date', 'is', null)
      .lte('due_date', date)
      .order('due_date', { ascending: true })
      .order('priority', { ascending: false })
      .limit(100),
    admin
      .from('appointments')
      .select('id,name,email,service,confirmed_date,confirmed_time,meeting_url,status,client_id,company_id')
      .in('status', ['confirmed', 'confirmada'])
      .eq('confirmed_date', date)
      .order('confirmed_time', { ascending: true })
      .limit(100),
  ]);

  if (tasksRes.error) throw tasksRes.error;
  if (meetingsRes.error) throw meetingsRes.error;

  const tasks = (tasksRes.data ?? []).filter((task) => {
    const metadata = task.metadata && typeof task.metadata === 'object' && !Array.isArray(task.metadata)
      ? task.metadata as Record<string, unknown>
      : {};
    return metadata.task_kind !== 'booking_meeting';
  });
  const meetings = meetingsRes.data ?? [];
  const clientIds = [...new Set(tasks.map((task) => task.client_id).filter(Boolean))] as string[];
  const clientNames = new Map<string, string>();
  if (clientIds.length) {
    const { data, error } = await admin.from('profiles').select('id,full_name').in('id', clientIds);
    if (error) throw error;
    for (const row of data ?? []) clientNames.set(row.id, row.full_name ?? row.id.slice(0, 8));
  }

  const taskLines = tasks.slice(0, 30).flatMap((task) => [
    `• [${task.priority ?? 'media'}] ${task.title ?? 'Tarea pendiente'} — ${task.client_id ? (clientNames.get(task.client_id) ?? 'Cliente') : 'sin cliente'}`,
    `  ${taskLink(task)}`,
  ]);
  const meetingLines = meetings.slice(0, 20).flatMap((meeting) => [
    `• ${meeting.confirmed_time ?? '—'} · ${meeting.service ?? 'Reunión'} · ${meeting.name ?? meeting.email ?? 'Contacto'}`,
    `  ${meeting.meeting_url ?? 'https://expertconsulting.es/admin/citas'}`,
  ]);

  const todayLabel = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);
  const summary = `KIA · Agenda EXPERT · ${tasks.length} tareas · ${meetings.length} reuniones`;
  const description = [
    `Agenda operativa EXPERT · ${todayLabel}`,
    '',
    `Tareas de hoy o vencidas: ${tasks.length}`,
    ...(taskLines.length ? taskLines : ['• Sin tareas vencidas o con vencimiento hoy.']),
    '',
    `Reuniones de hoy: ${meetings.length}`,
    ...(meetingLines.length ? meetingLines : ['• Sin reuniones confirmadas hoy.']),
    '',
    'Panel de tareas: https://expertconsulting.es/admin/tareas',
    'KIA recalcula esta agenda tras cambios operativos; el detalle canónico permanece en EXPERT.',
  ].join('\n');

  const agendaKey = `admin_agenda_event:${date}`;
  const { data: markerRow, error: markerError } = await admin
    .from('system_kv')
    .select('value')
    .eq('key', agendaKey)
    .maybeSingle();
  if (markerError) throw markerError;

  const marker = markerRow?.value && typeof markerRow.value === 'object' && !Array.isArray(markerRow.value)
    ? markerRow.value as Record<string, unknown>
    : {};
  const existingEventId = marker.status === 'ready' && typeof marker.event_id === 'string'
    ? marker.event_id
    : null;

  const persistReady = async (eventId: string) => {
    const refreshedAt = new Date().toISOString();
    const { error } = await admin.from('system_kv').upsert({
      key: agendaKey,
      value: {
        status: 'ready',
        event_id: eventId,
        date,
        tasks: tasks.length,
        meetings: meetings.length,
        refreshed_at: refreshedAt,
      },
      updated_at: refreshedAt,
    }, { onConflict: 'key' });
    if (error) throw error;
  };

  if (existingEventId) {
    const eventId = await upsertAdminAgendaEventSA({
      eventId: existingEventId,
      summary,
      description,
      startDate: date,
      endDate: nextDate(date),
      attendeeEmail: getAdminOwnerEmail(),
    });
    await persistReady(eventId);
    return { eventId, date, tasks: tasks.length, meetings: meetings.length, refreshed: true };
  }

  if (marker.status === 'creating') {
    return { eventId: null, date, tasks: tasks.length, meetings: meetings.length, refreshed: false, busy: true };
  }

  const reservationId = crypto.randomUUID();
  const { error: reserveError } = await admin.from('system_kv').insert({
    key: agendaKey,
    value: {
      status: 'creating',
      reservation_id: reservationId,
      date,
      created_at: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  });

  if (reserveError?.code === '23505') {
    return refreshAdminDailyAgenda(admin, now);
  }
  if (reserveError) throw reserveError;

  try {
    const eventId = await upsertAdminAgendaEventSA({
      summary,
      description,
      startDate: date,
      endDate: nextDate(date),
      attendeeEmail: getAdminOwnerEmail(),
    });
    await persistReady(eventId);
    return { eventId, date, tasks: tasks.length, meetings: meetings.length, refreshed: false };
  } catch (error) {
    await admin
      .from('system_kv')
      .delete()
      .eq('key', agendaKey)
      .contains('value', { reservation_id: reservationId });
    throw error;
  }
}
