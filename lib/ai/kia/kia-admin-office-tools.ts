import { ROLES } from '@/lib/auth/roles';
import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import type { KiaContext } from './kia-context-builder';
import type { KiaToolResult } from './kia-tool-definitions';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export type KiaAdminOfficeToolName =
  | 'get_admin_inbox_summary'
  | 'get_admin_agenda'
  | 'get_admin_pending_tasks'
  | 'get_admin_attention_queue';

export const KIA_ADMIN_OFFICE_TOOL_NAMES = new Set<KiaAdminOfficeToolName>([
  'get_admin_inbox_summary',
  'get_admin_agenda',
  'get_admin_pending_tasks',
  'get_admin_attention_queue',
]);

function ok(toolName: string, result: Record<string, unknown>): KiaToolResult {
  return { toolName, ok: true, result };
}

function fail(toolName: string, error: string): KiaToolResult {
  return { toolName, ok: false, error };
}

function canUseGlobalOfficeScope(context: KiaContext): boolean {
  return context.actor.role === ROLES.ADMIN || context.actor.role === ROLES.OWNER;
}

function hasScopedTarget(context: KiaContext): boolean {
  return Boolean(context.company?.id || context.contact.clientId);
}

async function scopedCaseIds(admin: AdminClient, context: KiaContext): Promise<string[] | null> {
  if (context.company?.id) {
    const { data, error } = await admin
      .from('cases')
      .select('id')
      .eq('company_id', context.company.id)
      .limit(200);
    if (error) throw error;
    return (data ?? []).map((row) => row.id as string);
  }
  if (context.contact.clientId) {
    const { data, error } = await admin
      .from('cases')
      .select('id')
      .eq('client_id', context.contact.clientId)
      .limit(200);
    if (error) throw error;
    return (data ?? []).map((row) => row.id as string);
  }
  return null;
}

function requireOfficeScope(toolName: string, context: KiaContext): KiaToolResult | null {
  if (!context.actor.isStaff) return fail(toolName, 'La herramienta Office solo está disponible para personal interno.');
  if (hasScopedTarget(context) || canUseGlobalOfficeScope(context)) return null;
  return fail(
    toolName,
    'Selecciona primero un cliente o empresa. La vista global Office está reservada a Admin/Owner.',
  );
}

async function loadInbox(
  admin: AdminClient,
  context: KiaContext,
  args: Record<string, unknown>,
) {
  const limit = Math.max(1, Math.min(30, Number(args.limit ?? args.limitPerSection ?? 12)));
  const unreadOnly = args.unreadOnly !== false;
  let query = admin
    .from('email_inbox_cache')
    .select('thread_id,provider,subject,from_name,from_email,snippet,date,unread,has_attachment,case_id')
    .order('date', { ascending: false })
    .limit(limit);

  if (unreadOnly) query = query.eq('unread', true);

  if (!canUseGlobalOfficeScope(context) || hasScopedTarget(context)) {
    const cases = await scopedCaseIds(admin, context);
    if (!cases || cases.length === 0) return [];
    query = query.in('case_id', cases);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    threadId: row.thread_id,
    provider: row.provider,
    subject: row.subject,
    fromName: row.from_name,
    fromEmail: row.from_email,
    snippet: typeof row.snippet === 'string' ? row.snippet.slice(0, 280) : null,
    date: row.date,
    unread: Boolean(row.unread),
    hasAttachment: Boolean(row.has_attachment),
    caseId: row.case_id,
  }));
}

async function loadAgenda(
  admin: AdminClient,
  context: KiaContext,
  args: Record<string, unknown>,
) {
  const days = Math.max(1, Math.min(14, Number(args.days ?? 7)));
  const limit = Math.max(1, Math.min(30, Number(args.limit ?? args.limitPerSection ?? 15)));
  const start = new Date();
  const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);

  let query = admin
    .from('appointments')
    .select('id,name,email,appointment_type,appointment_date,appointment_end,status,service,meeting_url,booking_provider,client_id,company_id')
    .gte('appointment_date', start.toISOString())
    .lte('appointment_date', end.toISOString())
    .not('status', 'in', '("cancelled","canceled")')
    .order('appointment_date', { ascending: true })
    .limit(limit);

  if (context.company?.id) query = query.eq('company_id', context.company.id);
  else if (context.contact.clientId) query = query.eq('client_id', context.contact.clientId);
  else if (!canUseGlobalOfficeScope(context)) return [];

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function loadTasks(
  admin: AdminClient,
  context: KiaContext,
  args: Record<string, unknown>,
) {
  const days = Math.max(0, Math.min(60, Number(args.days ?? 14)));
  const limit = Math.max(1, Math.min(30, Number(args.limit ?? args.limitPerSection ?? 15)));
  const today = new Date();
  const horizon = new Date(today.getTime() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  let query = admin
    .from('internal_tasks')
    .select('id,title,description,status,priority,assigned_to,case_id,client_id,company_id,due_date,source,created_at,updated_at')
    .not('status', 'in', '("completed","done","cancelled","canceled")')
    .or(`due_date.is.null,due_date.lte.${horizon}`)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (context.company?.id) query = query.eq('company_id', context.company.id);
  else if (context.contact.clientId) query = query.eq('client_id', context.contact.clientId);
  else if (!canUseGlobalOfficeScope(context)) return [];

  const { data, error } = await query;
  if (error) throw error;

  const todayKey = today.toISOString().slice(0, 10);
  return (data ?? []).map((row) => ({
    ...row,
    overdue: Boolean(row.due_date && row.due_date < todayKey),
  }));
}

export async function executeKiaAdminOfficeTool(
  toolName: KiaAdminOfficeToolName,
  args: Record<string, unknown>,
  context: KiaContext,
  admin: AdminClient,
): Promise<KiaToolResult> {
  const scopeError = requireOfficeScope(toolName, context);
  if (scopeError) return scopeError;

  try {
    if (toolName === 'get_admin_inbox_summary') {
      const threads = await loadInbox(admin, context, args);
      return ok(toolName, {
        scope: context.company?.id ? 'company' : context.contact.clientId ? 'client' : 'admin_global',
        count: threads.length,
        unreadCount: threads.filter((thread) => thread.unread).length,
        threads,
      });
    }

    if (toolName === 'get_admin_agenda') {
      const appointments = await loadAgenda(admin, context, args);
      return ok(toolName, {
        scope: context.company?.id ? 'company' : context.contact.clientId ? 'client' : 'admin_global',
        count: appointments.length,
        appointments,
      });
    }

    if (toolName === 'get_admin_pending_tasks') {
      const tasks = await loadTasks(admin, context, args);
      return ok(toolName, {
        scope: context.company?.id ? 'company' : context.contact.clientId ? 'client' : 'admin_global',
        count: tasks.length,
        overdueCount: tasks.filter((task) => task.overdue).length,
        urgentCount: tasks.filter((task) => task.priority === 'urgent').length,
        tasks,
      });
    }

    const sectionLimit = Math.max(1, Math.min(10, Number(args.limitPerSection ?? 5)));
    const [threads, appointments, tasks] = await Promise.all([
      loadInbox(admin, context, { unreadOnly: true, limit: sectionLimit }),
      loadAgenda(admin, context, { days: 7, limit: sectionLimit }),
      loadTasks(admin, context, { days: 14, limit: sectionLimit }),
    ]);

    return ok(toolName, {
      scope: context.company?.id ? 'company' : context.contact.clientId ? 'client' : 'admin_global',
      summary: {
        unreadEmail: threads.length,
        upcomingAppointments: appointments.length,
        pendingTasks: tasks.length,
        overdueTasks: tasks.filter((task) => task.overdue).length,
        urgentTasks: tasks.filter((task) => task.priority === 'urgent').length,
      },
      email: threads,
      agenda: appointments,
      tasks,
      readOnly: true,
    });
  } catch (error) {
    return fail(toolName, error instanceof Error ? error.message : 'No se pudo cargar la cola Office.');
  }
}
