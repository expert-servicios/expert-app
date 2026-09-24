import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { isStaffRole } from '@/lib/auth/roles';

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

function taskMetadata(value: unknown): Record<string, unknown> {
  return (value && typeof value === 'object' && !Array.isArray(value))
    ? value as Record<string, unknown>
    : {};
}

function taskKey(metadata: Record<string, unknown>): string | null {
  return typeof metadata.task_key === 'string' ? metadata.task_key : null;
}

function dependencyKeys(metadata: Record<string, unknown>): string[] {
  return Array.isArray(metadata.depends_on)
    ? metadata.depends_on.filter((item): item is string => typeof item === 'string')
    : [];
}

function isSatisfiedTask(status: string, metadata: Record<string, unknown>): boolean {
  return status === 'completada'
    || (status === 'cancelada' && metadata.skipped_as_not_applicable === true);
}

async function requireStaff(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role,status').eq('id', user.id).single();
  if (profile?.status === 'inactive' || !isStaffRole(profile?.role)) return null;
  return { admin, actorId: user.id };
}

export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const clientId = searchParams.get('clientId');
  const caseId = searchParams.get('caseId');
  const assignedTo = searchParams.get('assignedTo');

  let query = auth.admin
    .from('internal_tasks')
    .select('id,title,description,status,priority,assigned_to,case_id,client_id,lead_id,due_date,source,metadata,created_at,updated_at,completed_at')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (status && status !== 'all') query = query.eq('status', status);
  if (clientId) query = query.eq('client_id', clientId);
  if (caseId) query = query.eq('case_id', caseId);
  if (assignedTo) query = query.eq('assigned_to', assignedTo);

  const { data: tasks, error } = await query;
  if (error) return NextResponse.json({ error: 'No se pudieron cargar las tareas' }, { status: 500 });

  const clientIds = [...new Set((tasks ?? []).map((task) => task.client_id).filter(Boolean))] as string[];
  const caseIds = [...new Set((tasks ?? []).map((task) => task.case_id).filter(Boolean))] as string[];
  const assigneeIds = [...new Set((tasks ?? []).map((task) => task.assigned_to).filter(Boolean))] as string[];
  const [profilesRes, casesRes, assigneesRes, caseTasksRes] = await Promise.all([
    clientIds.length
      ? auth.admin.from('profiles').select('id,full_name').in('id', clientIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null }> }),
    caseIds.length
      ? auth.admin.from('cases').select('id,service,state,status').in('id', caseIds)
      : Promise.resolve({ data: [] as Array<{ id: string; service: string; state: string; status: string }> }),
    assigneeIds.length
      ? auth.admin.from('profiles').select('id,full_name').in('id', assigneeIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null }> }),
    caseIds.length
      ? auth.admin.from('internal_tasks').select('case_id,title,status,metadata').in('case_id', caseIds)
      : Promise.resolve({ data: [] as Array<{ case_id: string | null; title: string; status: string; metadata: unknown }> }),
  ]);
  const profileMap = new Map((profilesRes.data ?? []).map((item) => [item.id, item]));
  const caseMap = new Map((casesRes.data ?? []).map((item) => [item.id, item]));
  const assigneeMap = new Map((assigneesRes.data ?? []).map((item) => [item.id, item]));

  const caseTaskMap = new Map<string, Array<{ title: string; status: string; metadata: Record<string, unknown> }>>();
  for (const task of caseTasksRes.data ?? []) {
    if (!task.case_id) continue;
    const list = caseTaskMap.get(task.case_id) ?? [];
    list.push({ title: task.title, status: task.status, metadata: taskMetadata(task.metadata) });
    caseTaskMap.set(task.case_id, list);
  }

  return NextResponse.json({
    tasks: (tasks ?? []).map((task) => {
      const metadata = taskMetadata(task.metadata);
      const dependsOn = dependencyKeys(metadata);
      const siblings = task.case_id ? caseTaskMap.get(task.case_id) ?? [] : [];
      const blockedBy = dependsOn.filter((dependencyKey) =>
        !siblings.some((candidate) =>
          taskKey(candidate.metadata) === dependencyKey
          && isSatisfiedTask(candidate.status, candidate.metadata)
        ),
      );
      const blockedByTitles = blockedBy.map((dependencyKey) =>
        siblings.find((candidate) => taskKey(candidate.metadata) === dependencyKey)?.title ?? dependencyKey,
      );

      return {
        ...task,
        blocked_by: blockedBy,
        blocked_by_titles: blockedByTitles,
        client: task.client_id ? profileMap.get(task.client_id) ?? null : null,
        case: task.case_id ? caseMap.get(task.case_id) ?? null : null,
        assignee: task.assigned_to ? assigneeMap.get(task.assigned_to) ?? null : null,
      };
    }),
  });
}

const createSchema = z.object({
  title: z.string().min(3).max(180),
  description: z.string().max(2000).optional().nullable(),
  priority: z.enum(['baja', 'media', 'alta', 'critica']).default('media'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  caseId: z.string().uuid().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });

  const { data, error } = await auth.admin.from('internal_tasks').insert({
    title: parsed.data.title.trim(),
    description: parsed.data.description?.trim() || null,
    status: 'pendiente',
    priority: parsed.data.priority,
    due_date: parsed.data.dueDate ?? null,
    client_id: parsed.data.clientId ?? null,
    case_id: parsed.data.caseId ?? null,
    assigned_to: parsed.data.assignedTo ?? auth.actorId,
    source: 'manual',
  }).select('id').single();
  if (error || !data) return NextResponse.json({ error: 'No se pudo crear la tarea' }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pendiente', 'en_progreso', 'completada', 'cancelada']).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  skipReason: z.string().trim().min(8).max(500).optional(),
});

export async function PATCH(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  if (parsed.data.status === undefined && parsed.data.assignedTo === undefined) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
  }

  let loadedTask: { id: string; case_id: string | null; source: string; metadata: unknown } | null = null;
  if (parsed.data.status !== undefined) {
    const { data: task, error: taskLookupError } = await auth.admin
      .from('internal_tasks')
      .select('id,case_id,source,metadata')
      .eq('id', parsed.data.id)
      .maybeSingle();

    if (taskLookupError || !task) {
      return NextResponse.json({ error: 'No se pudo cargar la tarea' }, { status: 404 });
    }
    loadedTask = task;

    const metadata = taskMetadata(task.metadata);
    if (parsed.data.status === 'cancelada' && metadata.task_kind === 'service_blueprint_step') {
      if (metadata.skip_allowed !== true) {
        return NextResponse.json({
          error: 'Este paso del workflow no puede marcarse como no aplicable',
          code: 'WORKFLOW_SKIP_NOT_ALLOWED',
        }, { status: 409 });
      }
      if (!parsed.data.skipReason) {
        return NextResponse.json({
          error: 'Indica por qué este paso no aplica antes de omitirlo',
          code: 'WORKFLOW_SKIP_REASON_REQUIRED',
        }, { status: 400 });
      }
    }

    const dependsOn = dependencyKeys(metadata);

    if ((parsed.data.status === 'en_progreso' || parsed.data.status === 'completada' || parsed.data.status === 'cancelada')
      && dependsOn.length && task.case_id) {
      const { data: siblingTasks, error: siblingsError } = await auth.admin
        .from('internal_tasks')
        .select('status,metadata')
        .eq('case_id', task.case_id);

      if (siblingsError) {
        return NextResponse.json({ error: 'No se pudieron validar las dependencias de la tarea' }, { status: 500 });
      }

      const blockedBy = dependsOn.filter((dependencyKey) =>
        !(siblingTasks ?? []).some((candidate) => {
          const candidateMetadata = taskMetadata(candidate.metadata);
          return taskKey(candidateMetadata) === dependencyKey
            && isSatisfiedTask(candidate.status, candidateMetadata);
        }),
      );

      if (blockedBy.length) {
        return NextResponse.json({
          error: 'La tarea está bloqueada por pasos anteriores pendientes',
          blockedBy,
        }, { status: 409 });
      }
    }
  }

  const now = new Date().toISOString();
  const updatePayload: Record<string, unknown> = { updated_at: now };
  if (parsed.data.status !== undefined) {
    updatePayload.status = parsed.data.status;
    updatePayload.completed_at = parsed.data.status === 'completada' ? now : null;
    if (parsed.data.status === 'cancelada' && loadedTask && taskMetadata(loadedTask.metadata).skip_allowed === true) {
      updatePayload.metadata = {
        ...taskMetadata(loadedTask.metadata),
        skipped_as_not_applicable: true,
        skipped_at: now,
        skipped_by: auth.actorId,
        skipped_reason: parsed.data.skipReason,
      };
    } else if (loadedTask && taskMetadata(loadedTask.metadata).skipped_as_not_applicable === true) {
      updatePayload.metadata = {
        ...taskMetadata(loadedTask.metadata),
        skipped_as_not_applicable: false,
        skipped_at: null,
        skipped_by: null,
        skipped_reason: null,
      };
    }
  }
  if (parsed.data.assignedTo !== undefined) {
    updatePayload.assigned_to = parsed.data.assignedTo;
  }

  const { error } = await auth.admin.from('internal_tasks').update(updatePayload).eq('id', parsed.data.id);
  if (error) return NextResponse.json({ error: 'No se pudo actualizar la tarea' }, { status: 500 });

  let postCompletionWarning: string | null = null;
  const resolvedForDependencies = parsed.data.status === 'completada'
    || (parsed.data.status === 'cancelada' && loadedTask !== null && taskMetadata(loadedTask.metadata).skip_allowed === true);

  if (resolvedForDependencies) {
    const { data: completedTask } = await auth.admin
      .from('internal_tasks')
      .select('case_id')
      .eq('id', parsed.data.id)
      .maybeSingle();

    if (completedTask?.case_id) {
      const { data: siblings, error: siblingLoadError } = await auth.admin
        .from('internal_tasks')
        .select('id,status,due_date,metadata')
        .eq('case_id', completedTask.case_id)
        .in('status', ['pendiente', 'en_progreso']);

      if (siblingLoadError) {
        postCompletionWarning = 'La tarea se completó, pero no se pudieron recalcular los pasos siguientes';
      }

      const allCaseTasks = postCompletionWarning ? { data: null, error: null } : await auth.admin
        .from('internal_tasks')
        .select('status,metadata')
        .eq('case_id', completedTask.case_id);

      if (allCaseTasks.error) {
        postCompletionWarning = 'La tarea se completó, pero no se pudieron validar los pasos siguientes';
      }

      for (const sibling of postCompletionWarning ? [] : (siblings ?? [])) {
        if (sibling.due_date) continue;
        const metadata = taskMetadata(sibling.metadata);
        const dependsOn = dependencyKeys(metadata);
        if (!dependsOn.length) continue;

        const dependenciesComplete = dependsOn.every((dependencyKey) =>
          (allCaseTasks.data ?? []).some((candidate) => {
            const candidateMetadata = taskMetadata(candidate.metadata);
            return taskKey(candidateMetadata) === dependencyKey
              && isSatisfiedTask(candidate.status, candidateMetadata);
          }),
        );
        if (!dependenciesComplete) continue;

        const dueBusinessDays = typeof metadata?.due_business_days === 'number'
          ? metadata.due_business_days
          : null;
        if (dueBusinessDays === null) continue;

        const { error: unlockError } = await auth.admin
          .from('internal_tasks')
          .update({
            due_date: addBusinessDays(new Date(), dueBusinessDays),
            updated_at: now,
          })
          .eq('id', sibling.id)
          .is('due_date', null);

        if (unlockError) {
          postCompletionWarning = 'La tarea se completó, pero no se pudo activar el plazo de uno de los pasos siguientes';
          break;
        }
      }
    }
  }

  if (resolvedForDependencies) {
    const { data: completedTask } = await auth.admin
      .from('internal_tasks')
      .select('case_id')
      .eq('id', parsed.data.id)
      .maybeSingle();

    if (completedTask?.case_id) {
      const { data: allTasksForNextAction, error: nextActionTasksError } = await auth.admin
        .from('internal_tasks')
        .select('title,status,metadata')
        .eq('case_id', completedTask.case_id);

      if (nextActionTasksError) {
        postCompletionWarning = postCompletionWarning ?? 'La tarea se completó, pero no se pudo actualizar el siguiente paso del expediente';
      } else {
        const completedKeys = new Set(
          (allTasksForNextAction ?? [])
            .map((candidate) => {
              const candidateMetadata = taskMetadata(candidate.metadata);
              return isSatisfiedTask(candidate.status, candidateMetadata) ? taskKey(candidateMetadata) : null;
            })
            .filter((value): value is string => Boolean(value)),
        );

        const actionable = (allTasksForNextAction ?? [])
          .filter((candidate) => candidate.status === 'pendiente' || candidate.status === 'en_progreso')
          .map((candidate) => {
            const metadata = taskMetadata(candidate.metadata);
            const dependsOn = dependencyKeys(metadata);
            const blocked = dependsOn.some((dependencyKey) => !completedKeys.has(dependencyKey));
            const sequenceIndex = typeof metadata?.sequence_index === 'number'
              ? metadata.sequence_index
              : Number.MAX_SAFE_INTEGER;
            return { title: candidate.title, blocked, sequenceIndex };
          })
          .filter((candidate) => !candidate.blocked)
          .sort((a, b) => a.sequenceIndex - b.sequenceIndex);

        const nextAction = actionable[0]?.title ?? null;
        const { error: caseUpdateError } = await auth.admin
          .from('cases')
          .update({
            next_action: nextAction,
            updated_at: now,
          })
          .eq('id', completedTask.case_id);

        if (caseUpdateError) {
          postCompletionWarning = postCompletionWarning ?? 'La tarea se completó, pero no se pudo actualizar el siguiente paso del expediente';
        }
      }
    }
  }

  return NextResponse.json({ ok: true, warning: postCompletionWarning });
}
