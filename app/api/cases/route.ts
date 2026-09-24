import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { caseStatusToVisualState, resolveEffectiveCaseStatus } from '@/lib/cases/case-status';

function taskMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
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

function taskSatisfied(status: string, metadata: Record<string, unknown>): boolean {
  return status === 'completada'
    || (status === 'cancelada' && metadata.skipped_as_not_applicable === true);
}

function caseLocale(caseRow: { checklist_json?: unknown; service?: string | null }): 'es' | 'ru' {
  const checklist = taskMetadata(caseRow.checklist_json);
  if (checklist.checkout_locale === 'ru') return 'ru';
  if (checklist.checkout_locale === 'es') return 'es';
  return /[А-Яа-яЁё]/.test(caseRow.service ?? '') ? 'ru' : 'es';
}


export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: cases, error: fetchError } = await supabase
      .from('cases')
      .select('id,category,service,state,status,opened_at,closed_at,quote_id,docs_checklist,checklist_json')
      .order('opened_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching cases:', fetchError);
      return NextResponse.json({ error: 'Error al obtener expedientes' }, { status: 500 });
    }

    const caseList = cases ?? [];

    // Attach unread message counts
    if (caseList.length > 0) {
      const adminSupabase = getSupabaseAdmin();
      const { data: profile } = await adminSupabase
        .from('profiles').select('role').eq('id', user.id).single();
      const isAdmin = profile?.role === 'admin';
      const unreadColumn = isAdmin ? 'read_by_admin' : 'read_by_client';

      const caseIds = caseList.map((c) => c.id);
      const [{ data: unreadRows }, { data: workflowTasks }] = await Promise.all([
        adminSupabase
          .from('messages')
          .select('case_id')
          .in('case_id', caseIds)
          .eq(unreadColumn, false),
        adminSupabase
          .from('internal_tasks')
          .select('case_id,status,metadata')
          .in('case_id', caseIds),
      ]);

      const unreadMap: Record<string, number> = {};
      for (const row of unreadRows ?? []) {
        unreadMap[row.case_id] = (unreadMap[row.case_id] ?? 0) + 1;
      }

      const taskMap = new Map<string, Array<{ status: string; metadata: Record<string, unknown> }>>();
      for (const row of workflowTasks ?? []) {
        if (!row.case_id) continue;
        const list = taskMap.get(row.case_id) ?? [];
        list.push({ status: row.status, metadata: taskMetadata(row.metadata) });
        taskMap.set(row.case_id, list);
      }

      return NextResponse.json({
        cases: caseList.map((caseRow) => {
          const effectiveStatus = resolveEffectiveCaseStatus(caseRow.status, caseRow.state);
          const locale = caseLocale(caseRow);
          const tasks = taskMap.get(caseRow.id) ?? [];
          const satisfiedKeys = new Set(
            tasks
              .filter((task) => taskSatisfied(task.status, task.metadata))
              .map((task) => taskKey(task.metadata))
              .filter((value): value is string => Boolean(value)),
          );
          const clientActionTask = tasks
            .filter((task) => task.status === 'pendiente' || task.status === 'en_progreso')
            .map((task) => ({
              task,
              blocked: dependencyKeys(task.metadata).some((key) => !satisfiedKeys.has(key)),
              sequence: typeof task.metadata.sequence_index === 'number' ? task.metadata.sequence_index : Number.MAX_SAFE_INTEGER,
            }))
            .filter(({ task, blocked }) => !blocked && task.metadata.client_action_required === true)
            .sort((a, b) => a.sequence - b.sequence)[0]?.task ?? null;

          const clientActionMap = clientActionTask?.metadata.client_action;
          const clientAction = clientActionMap && typeof clientActionMap === 'object' && !Array.isArray(clientActionMap)
            ? (clientActionMap as Record<string, unknown>)[locale]
            : null;

          const { checklist_json: _privateChecklist, ...safeCase } = caseRow;
          return {
            ...safeCase,
            effective_status: effectiveStatus,
            legacy_state: caseRow.state,
            state: caseStatusToVisualState(effectiveStatus),
            locale,
            client_action: typeof clientAction === 'string' ? clientAction : null,
            unread_count: unreadMap[caseRow.id] ?? 0,
          };
        })
      });
    }

    return NextResponse.json({
      cases: caseList.map((caseRow) => {
        const effectiveStatus = resolveEffectiveCaseStatus(caseRow.status, caseRow.state);
        const { checklist_json: _privateChecklist, ...safeCase } = caseRow;
        return {
          ...safeCase,
          effective_status: effectiveStatus,
          legacy_state: caseRow.state,
          state: caseStatusToVisualState(effectiveStatus),
          locale: caseLocale(caseRow),
          client_action: null,
        };
      })
    });
  } catch (error) {
    console.error('Cases GET error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
