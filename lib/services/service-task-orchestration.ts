import type { SupabaseClient } from '@supabase/supabase-js';
import { getServiceOperationalBlueprint, type ServiceTaskTemplate } from '@/lib/services/service-operational-blueprints';
import { hasCalendarSA, upsertCalendarEventSA, deleteCalendarEventSA } from '@/lib/integrations/google-calendar';

type SupabaseAdmin = SupabaseClient;

function addBusinessDays(from: Date, businessDays: number): string {
  const date = new Date(from);
  let remaining = Math.max(0, businessDays);
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return date.toISOString().slice(0, 10);
}

function dueDate(task: ServiceTaskTemplate, from = new Date()): string | null {
  return typeof task.dueBusinessDays === 'number' ? addBusinessDays(from, task.dueBusinessDays) : null;
}

function taskSummary(serviceName: string, task: ServiceTaskTemplate) {
  return `EXPERT · ${serviceName} · ${task.title}`;
}

async function syncTaskCalendar(input: {
  taskId: string;
  serviceName: string;
  task: ServiceTaskTemplate;
  dueDate: string | null;
  existingEventId?: string | null;
}) {
  if (!input.task.syncCalendar || !input.dueDate || !hasCalendarSA()) return input.existingEventId ?? null;
  return upsertCalendarEventSA({
    summary: taskSummary(input.serviceName, input.task),
    description: [
      input.task.description,
      `Fase: ${input.task.phase}`,
      `Tarea EXPERT: ${input.taskId}`,
    ].join('\n'),
    date: input.dueDate,
    reminderDaysBefore: [1, 0],
  }, input.existingEventId ?? undefined);
}

export function initialTasksForBlueprint(serviceSlug: string): ServiceTaskTemplate[] {
  const blueprint = getServiceOperationalBlueprint(serviceSlug);
  if (!blueprint) return [];
  return blueprint.tasks.filter((task) => !task.dependsOn?.length);
}

export async function ensureUnlockedServiceTasks(
  admin: SupabaseAdmin,
  input: {
    caseId: string;
    clientId: string | null;
    companyId: string | null;
    serviceSlug: string;
  },
) {
  const blueprint = getServiceOperationalBlueprint(input.serviceSlug);
  if (!blueprint) return [];

  const { data: existingRows, error: existingError } = await admin
    .from('internal_tasks')
    .select('id,title,status,due_date,metadata')
    .eq('case_id', input.caseId)
    .eq('source', 'system');

  if (existingError) throw new Error(`Could not load service tasks for ${input.caseId}: ${existingError.message}`);

  const existing = existingRows ?? [];
  const completedKeys = new Set(
    existing
      .filter((row) => row.status === 'completada')
      .map((row) => String((row.metadata as Record<string, unknown> | null)?.task_key ?? ''))
      .filter(Boolean),
  );
  const existingKeys = new Set(
    existing
      .map((row) => String((row.metadata as Record<string, unknown> | null)?.task_key ?? ''))
      .filter(Boolean),
  );

  const created: string[] = [];

  for (const task of blueprint.tasks) {
    if (existingKeys.has(task.key)) continue;
    const deps = task.dependsOn ?? [];
    if (deps.length && !deps.every((key) => completedKeys.has(key))) continue;

    const calculatedDue = dueDate(task);
    const { data: row, error } = await admin
      .from('internal_tasks')
      .insert({
        title: task.title,
        description: task.description,
        status: 'pendiente',
        priority: task.priority,
        case_id: input.caseId,
        client_id: input.clientId,
        company_id: input.companyId,
        due_date: calculatedDue,
        source: 'system',
        metadata: {
          task_kind: 'service_blueprint_step',
          service_slug: input.serviceSlug,
          blueprint_slug: blueprint.slug,
          task_key: task.key,
          phase: task.phase,
          depends_on: deps,
          sync_calendar: Boolean(task.syncCalendar),
          human_approval_required: Boolean(task.humanApprovalRequired),
          client_action_required: Boolean(task.clientActionRequired),
          client_action_kind: task.clientActionKind ?? null,
          client_reminder_business_days: task.clientReminderBusinessDays ?? [],
          internal_escalation_business_day: task.internalEscalationBusinessDay ?? null,
          client_action_started_at: null,
          client_reminders_sent_days: [],
          blueprint_version: '4',
        },
      })
      .select('id,metadata')
      .single();

    if (error || !row) throw new Error(`Could not create unlocked task ${task.key}: ${error?.message ?? 'missing row'}`);

    const eventId = await syncTaskCalendar({
      taskId: row.id,
      serviceName: blueprint.canonicalName,
      task,
      dueDate: calculatedDue,
    });

    if (eventId) {
      await admin
        .from('internal_tasks')
        .update({
          metadata: {
            ...((row.metadata ?? {}) as Record<string, unknown>),
            google_event_id: eventId,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
    }

    created.push(row.id);
  }

  return created;
}

export async function completeServiceTaskAndUnlockNext(
  admin: SupabaseAdmin,
  input: {
    taskId: string;
    actorId?: string | null;
  },
) {
  const { data: task, error } = await admin
    .from('internal_tasks')
    .select('id,status,case_id,client_id,company_id,metadata')
    .eq('id', input.taskId)
    .single();

  if (error || !task) throw new Error('Service task not found');

  const metadata = (task.metadata ?? {}) as Record<string, unknown>;
  const eventId = typeof metadata.google_event_id === 'string' ? metadata.google_event_id : null;
  if (eventId) await deleteCalendarEventSA(eventId);

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from('internal_tasks')
    .update({
      status: 'completada',
      completed_at: now,
      updated_at: now,
      metadata: {
        ...metadata,
        completed_by: input.actorId ?? null,
        google_event_id: null,
      },
    })
    .eq('id', input.taskId);

  if (updateError) throw new Error(`Could not complete service task: ${updateError.message}`);

  const serviceSlug = typeof metadata.service_slug === 'string' ? metadata.service_slug : null;
  if (task.case_id && serviceSlug) {
    await ensureUnlockedServiceTasks(admin, {
      caseId: task.case_id,
      clientId: task.client_id,
      companyId: task.company_id,
      serviceSlug,
    });
  }
}
