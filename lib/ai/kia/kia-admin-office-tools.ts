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

type PageResult<T> = {
  items: T[];
  total: number;
  truncated: boolean;
};

function ok(toolName: string, result: Record<string, unknown>): KiaToolResult {
  return { toolName, ok: true, result };
}

function fail(toolName: string, error: string): KiaToolResult {
  return { toolName, ok: false, error };
}

function canUseOffice(context: KiaContext): boolean {
  return context.actor?.role === ROLES.ADMIN || context.actor?.role === ROLES.OWNER;
}

function targetClientId(context: KiaContext): string | null {
  return context.target?.clientId ?? null;
}

function hasScopedTarget(context: KiaContext): boolean {
  return Boolean(context.company?.id || targetClientId(context));
}

function officeScope(context: KiaContext): 'company' | 'client' | 'admin_global' {
  if (context.company?.id) return 'company';
  if (targetClientId(context)) return 'client';
  return 'admin_global';
}

function requireOfficeScope(toolName: string, context: KiaContext): KiaToolResult | null {
  if (!context.actor?.isStaff || !canUseOffice(context)) {
    return fail(toolName, 'La capa Office interna está reservada a roles Admin/Owner.');
  }
  return null;
}

function quoteFilterValue(value: string): string {
  return `"${value.replace(/[\\"]/g, '')}"`;
}

function madridDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

async function scopedCaseIds(admin: AdminClient, context: KiaContext): Promise<string[]> {
  if (context.company?.id) {
    const { data, error } = await admin
      .from('cases')
      .select('id')
      .eq('company_id', context.company.id)
      .limit(300);
    if (error) throw error;
    return (data ?? []).map((row) => String(row.id));
  }

  const clientId = targetClientId(context);
  if (clientId) {
    const { data, error } = await admin
      .from('cases')
      .select('id')
      .eq('client_id', clientId)
      .limit(300);
    if (error) throw error;
    return (data ?? []).map((row) => String(row.id));
  }

  return [];
}

async function scopedEmails(admin: AdminClient, context: KiaContext): Promise<string[]> {
  const values = new Set<string>();

  const clientId = targetClientId(context);
  if (clientId) {
    const { data, error } = await admin
      .from('profiles')
      .select('email')
      .eq('id', clientId)
      .maybeSingle();
    if (error) throw error;
    if (typeof data?.email === 'string' && data.email.trim()) values.add(data.email.trim().toLowerCase());
  }

  if (context.company?.id) {
    const { data: memberships, error: membershipError } = await admin
      .from('profile_companies')
      .select('profile_id')
      .eq('company_id', context.company.id)
      .limit(300);
    if (membershipError) throw membershipError;
    const profileIds = (memberships ?? []).map((row) => String(row.profile_id)).filter(Boolean);
    if (profileIds.length > 0) {
      const { data: profiles, error: profileError } = await admin
        .from('profiles')
        .select('email')
        .in('id', profileIds);
      if (profileError) throw profileError;
      for (const row of profiles ?? []) {
        if (typeof row.email === 'string' && row.email.trim()) values.add(row.email.trim().toLowerCase());
      }
    }
  }

  return [...values];
}

async function buildInboxScopeFilter(admin: AdminClient, context: KiaContext): Promise<string | null> {
  if (!hasScopedTarget(context)) return null;

  const [caseIds, emails] = await Promise.all([
    scopedCaseIds(admin, context),
    scopedEmails(admin, context),
  ]);

  const clauses: string[] = [];
  if (caseIds.length > 0) clauses.push(`case_id.in.(${caseIds.join(',')})`);
  if (emails.length > 0) clauses.push(`from_email.in.(${emails.map(quoteFilterValue).join(',')})`);
  return clauses.length > 0 ? clauses.join(',') : '__no_match__';
}

async function loadInbox(
  admin: AdminClient,
  context: KiaContext,
  args: Record<string, unknown>,
): Promise<PageResult<Record<string, unknown>>> {
  const limit = Math.max(1, Math.min(30, Number(args.limit ?? args.limitPerSection ?? 12)));
  const unreadOnly = args.unreadOnly !== false;
  const scopeFilter = await buildInboxScopeFilter(admin, context);
  if (scopeFilter === '__no_match__') return { items: [], total: 0, truncated: false };

  let query = admin
    .from('email_inbox_cache')
    .select('thread_id,provider,subject,from_name,from_email,snippet,date,unread,has_attachment,case_id', { count: 'exact' })
    .order('date', { ascending: false })
    .limit(limit);

  if (unreadOnly) query = query.eq('unread', true);
  if (scopeFilter) query = query.or(scopeFilter);

  const { data, error, count } = await query;
  if (error) throw error;
  const items = (data ?? []).map((row) => ({
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

  const total = count ?? items.length;
  return { items, total, truncated: total > items.length };
}

async function buildAppointmentScopeFilter(admin: AdminClient, context: KiaContext): Promise<string | null> {
  if (!hasScopedTarget(context)) return null;

  const emails = await scopedEmails(admin, context);
  const clauses: string[] = [];
  if (context.company?.id) clauses.push(`company_id.eq.${context.company.id}`);
  const clientId = targetClientId(context);
  if (clientId) clauses.push(`client_id.eq.${clientId}`);
  if (emails.length > 0) clauses.push(`email.in.(${emails.map(quoteFilterValue).join(',')})`);
  return clauses.length > 0 ? clauses.join(',') : '__no_match__';
}

async function loadAgenda(
  admin: AdminClient,
  context: KiaContext,
  args: Record<string, unknown>,
): Promise<PageResult<Record<string, unknown>>> {
  const days = Math.max(1, Math.min(14, Number(args.days ?? 7)));
  const limit = Math.max(1, Math.min(30, Number(args.limit ?? args.limitPerSection ?? 15)));
  const start = new Date();
  const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  const scopeFilter = await buildAppointmentScopeFilter(admin, context);
  if (scopeFilter === '__no_match__') return { items: [], total: 0, truncated: false };

  let query = admin
    .from('appointments')
    .select('id,name,email,appointment_type,appointment_date,appointment_end,status,service,meeting_url,booking_provider,client_id,company_id', { count: 'exact' })
    .gte('appointment_date', start.toISOString())
    .lte('appointment_date', end.toISOString())
    .not('status', 'in', '("cancelled","canceled","cancelada","rescheduled","reprogramada")')
    .order('appointment_date', { ascending: true })
    .limit(limit);

  if (scopeFilter) query = query.or(scopeFilter);

  const { data, error, count } = await query;
  if (error) throw error;
  const items = (data ?? []) as Array<Record<string, unknown>>;
  const total = count ?? items.length;
  return { items, total, truncated: total > items.length };
}

async function loadTasks(
  admin: AdminClient,
  context: KiaContext,
  args: Record<string, unknown>,
): Promise<PageResult<Record<string, unknown> & { overdue: boolean }>> {
  const days = Math.max(0, Math.min(60, Number(args.days ?? 14)));
  const limit = Math.max(1, Math.min(30, Number(args.limit ?? args.limitPerSection ?? 15)));
  const todayKey = madridDateKey();
  const horizon = addDaysToDateKey(todayKey, days);

  let query = admin
    .from('internal_tasks')
    .select('id,title,description,status,priority,assigned_to,case_id,client_id,company_id,due_date,source,created_at,updated_at', { count: 'exact' })
    .not('status', 'in', '("completada","cancelada","completed","done","cancelled","canceled")')
    .or(`due_date.is.null,due_date.lte.${horizon}`)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (context.company?.id) query = query.eq('company_id', context.company.id);
  else {
    const clientId = targetClientId(context);
    if (clientId) query = query.eq('client_id', clientId);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  const items = (data ?? []).map((row) => ({
    ...row,
    overdue: Boolean(row.due_date && row.due_date < todayKey),
  }));
  const total = count ?? items.length;
  return { items, total, truncated: total > items.length };
}

function criticalTaskCount(tasks: Array<Record<string, unknown>>): number {
  return tasks.filter((task) => ['critica', 'urgent'].includes(String(task.priority ?? '').toLowerCase())).length;
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
      const result = await loadInbox(admin, context, args);
      return ok(toolName, {
        scope: officeScope(context),
        count: result.total,
        shown: result.items.length,
        truncated: result.truncated,
        unreadCount: args.unreadOnly === false
          ? result.items.filter((thread) => thread.unread).length
          : result.total,
        unreadCountPartial: args.unreadOnly === false && result.truncated,
        threads: result.items,
      });
    }

    if (toolName === 'get_admin_agenda') {
      const result = await loadAgenda(admin, context, args);
      return ok(toolName, {
        scope: officeScope(context),
        count: result.total,
        shown: result.items.length,
        truncated: result.truncated,
        appointments: result.items,
      });
    }

    if (toolName === 'get_admin_pending_tasks') {
      const result = await loadTasks(admin, context, args);
      return ok(toolName, {
        scope: officeScope(context),
        count: result.total,
        shown: result.items.length,
        truncated: result.truncated,
        overdueShown: result.items.filter((task) => task.overdue).length,
        criticalShown: criticalTaskCount(result.items),
        tasks: result.items,
      });
    }

    const sectionLimit = Math.max(1, Math.min(10, Number(args.limitPerSection ?? 5)));
    const [email, agenda, tasks] = await Promise.all([
      loadInbox(admin, context, { unreadOnly: true, limit: sectionLimit }),
      loadAgenda(admin, context, { days: 7, limit: sectionLimit }),
      loadTasks(admin, context, { days: 14, limit: sectionLimit }),
    ]);

    return ok(toolName, {
      scope: officeScope(context),
      summary: {
        unreadEmail: email.total,
        upcomingAppointments: agenda.total,
        pendingTasks: tasks.total,
        overdueTasksShown: tasks.items.filter((task) => task.overdue).length,
        criticalTasksShown: criticalTaskCount(tasks.items),
      },
      truncated: {
        email: email.truncated,
        agenda: agenda.truncated,
        tasks: tasks.truncated,
      },
      email: email.items,
      agenda: agenda.items,
      tasks: tasks.items,
      readOnly: true,
    });
  } catch (error) {
    return fail(toolName, error instanceof Error ? error.message : 'No se pudo cargar la cola Office.');
  }
}
