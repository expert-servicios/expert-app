import { ROLES } from '@/lib/auth/roles';
import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import type { KiaContext } from './kia-context-builder';
import type { KiaToolResult } from './kia-tool-definitions';
import { redactJson } from './kia-redaction';

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
  return { toolName, ok: true, result: redactJson(result) };
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

    const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(clientId);
    if (authUserError) throw authUserError;
    const authEmail = authUser.user?.email?.trim().toLowerCase();
    if (authEmail) values.add(authEmail);
  }

  if (context.company?.id) {
    const { data: company, error: companyError } = await admin
      .from('companies')
      .select('email')
      .eq('id', context.company.id)
      .maybeSingle();
    if (companyError) throw companyError;
    if (typeof company?.email === 'string' && company.email.trim()) {
      values.add(company.email.trim().toLowerCase());
    }

    const profileIds: string[] = [];
    const membershipPageSize = 500;
    for (let offset = 0; ; offset += membershipPageSize) {
      const { data: memberships, error: membershipError } = await admin
        .from('profile_companies')
        .select('profile_id')
        .eq('company_id', context.company.id)
        .order('profile_id', { ascending: true })
        .range(offset, offset + membershipPageSize - 1);
      if (membershipError) throw membershipError;
      const rows = memberships ?? [];
      profileIds.push(...rows.map((row) => String(row.profile_id)).filter(Boolean));
      if (rows.length < membershipPageSize) break;
    }

    for (let offset = 0; offset < profileIds.length; offset += 100) {
      const batch = profileIds.slice(offset, offset + 100);
      const { data: profiles, error: profileError } = await admin
        .from('profiles')
        .select('email')
        .in('id', batch);
      if (profileError) throw profileError;
      for (const row of profiles ?? []) {
        if (typeof row.email === 'string' && row.email.trim()) values.add(row.email.trim().toLowerCase());
      }
    }
  }

  return [...values];
}

async function loadInbox(
  admin: AdminClient,
  context: KiaContext,
  args: Record<string, unknown>,
): Promise<PageResult<Record<string, unknown>>> {
  const limit = Math.max(1, Math.min(30, Number(args.limit ?? args.limitPerSection ?? 12)));
  const unreadOnly = args.unreadOnly !== false;
  const selectColumns = 'thread_id,provider,subject,from_name,from_email,snippet,date,unread,has_attachment,case_id';

  const mapRows = (rows: Array<Record<string, unknown>>) => rows.map((row) => ({
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

  if (!hasScopedTarget(context)) {
    let query = admin
      .from('email_inbox_cache')
      .select(selectColumns, { count: 'exact' })
      .order('date', { ascending: false })
      .limit(limit);
    if (unreadOnly) query = query.eq('unread', true);
    const { data, error, count } = await query;
    if (error) throw error;
    const items = mapRows((data ?? []) as Array<Record<string, unknown>>);
    const total = count ?? items.length;
    return { items, total, truncated: total > items.length };
  }

  const collected = new Map<string, Record<string, unknown>>();
  let total = 0;

  let caseQuery = admin
    .from('email_inbox_cache')
    .select(`${selectColumns},case:cases!email_inbox_cache_case_id_fkey!inner(id,client_id,company_id)`, { count: 'exact' })
    .order('date', { ascending: false })
    .limit(limit);
  if (unreadOnly) caseQuery = caseQuery.eq('unread', true);
  if (context.company?.id) caseQuery = caseQuery.eq('case.company_id', context.company.id);
  else caseQuery = caseQuery.eq('case.client_id', targetClientId(context)!);

  const caseResult = await caseQuery;
  if (caseResult.error) throw caseResult.error;
  for (const row of mapRows((caseResult.data ?? []) as Array<Record<string, unknown>>)) {
    collected.set(String(row.threadId), row);
  }
  total += caseResult.count ?? (caseResult.data ?? []).length;

  const emails = await scopedEmails(admin, context);
  for (let offset = 0; offset < emails.length; offset += 20) {
    const batch = emails.slice(offset, offset + 20);
    let emailQuery = admin
      .from('email_inbox_cache')
      .select(selectColumns, { count: 'exact' })
      .is('case_id', null)
      .or(batch.map((email) => `from_email.ilike.${email}`).join(','))
      .order('date', { ascending: false })
      .limit(limit);
    if (unreadOnly) emailQuery = emailQuery.eq('unread', true);
    const emailResult = await emailQuery;
    if (emailResult.error) throw emailResult.error;
    for (const row of mapRows((emailResult.data ?? []) as Array<Record<string, unknown>>)) {
      collected.set(String(row.threadId), row);
    }
    total += emailResult.count ?? (emailResult.data ?? []).length;
  }

  const items = [...collected.values()]
    .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))
    .slice(0, limit);
  return { items, total, truncated: total > items.length };
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
  const selectColumns = 'id,name,email,appointment_type,appointment_date,appointment_end,status,service,meeting_url,booking_provider,client_id,company_id';

  const base = () => admin
    .from('appointments')
    .select(selectColumns, { count: 'exact' })
    .gte('appointment_date', start.toISOString())
    .lte('appointment_date', end.toISOString())
    .not('status', 'in', '("cancelled","canceled","cancelada","rescheduled","reprogramada")')
    .order('appointment_date', { ascending: true })
    .limit(limit);

  if (!hasScopedTarget(context)) {
    const result = await base();
    if (result.error) throw result.error;
    const items = (result.data ?? []) as Array<Record<string, unknown>>;
    const total = result.count ?? items.length;
    return { items, total, truncated: total > items.length };
  }

  const collected = new Map<string, Record<string, unknown>>();
  let total = 0;

  let direct = base();
  if (context.company?.id) direct = direct.eq('company_id', context.company.id);
  else direct = direct.eq('client_id', targetClientId(context)!);
  const directResult = await direct;
  if (directResult.error) throw directResult.error;
  for (const row of (directResult.data ?? []) as Array<Record<string, unknown>>) {
    collected.set(String(row.id), row);
  }
  total += directResult.count ?? (directResult.data ?? []).length;

  const emails = await scopedEmails(admin, context);
  for (let offset = 0; offset < emails.length; offset += 20) {
    const batch = emails.slice(offset, offset + 20);
    const legacy = await base()
      .is('client_id', null)
      .is('company_id', null)
      .or(batch.map((email) => `email.ilike.${email}`).join(','));
    if (legacy.error) throw legacy.error;
    for (const row of (legacy.data ?? []) as Array<Record<string, unknown>>) {
      collected.set(String(row.id), row);
    }
    total += legacy.count ?? (legacy.data ?? []).length;
  }

  const items = [...collected.values()]
    .sort((a, b) => String(a.appointment_date ?? '').localeCompare(String(b.appointment_date ?? '')))
    .slice(0, limit);
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
  const selectColumns = 'id,title,description,status,priority,assigned_to,case_id,client_id,company_id,due_date,source,created_at,updated_at';

  const base = () => admin
    .from('internal_tasks')
    .select(selectColumns, { count: 'exact' })
    .not('status', 'in', '("completada","cancelada","completed","done","cancelled","canceled")')
    .or(`due_date.is.null,due_date.lte.${horizon}`)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  const decorate = (rows: Array<Record<string, unknown>>) => rows.map((row) => ({
    ...row,
    overdue: Boolean(row.due_date && String(row.due_date) < todayKey),
  }));

  if (!hasScopedTarget(context)) {
    const result = await base();
    if (result.error) throw result.error;
    const items = decorate((result.data ?? []) as Array<Record<string, unknown>>);
    const total = result.count ?? items.length;
    return { items, total, truncated: total > items.length };
  }

  const collected = new Map<string, Record<string, unknown> & { overdue: boolean }>();
  let total = 0;

  let direct = base();
  if (context.company?.id) direct = direct.eq('company_id', context.company.id);
  else direct = direct.eq('client_id', targetClientId(context)!);
  const directResult = await direct;
  if (directResult.error) throw directResult.error;
  for (const row of decorate((directResult.data ?? []) as Array<Record<string, unknown>>)) {
    collected.set(String(row.id), row);
  }
  total += directResult.count ?? (directResult.data ?? []).length;

  let viaCase = admin
    .from('internal_tasks')
    .select(`${selectColumns},case:cases!internal_tasks_case_id_fkey!inner(id,client_id,company_id)`, { count: 'exact' })
    .not('status', 'in', '("completada","cancelada","completed","done","cancelled","canceled")')
    .or(`due_date.is.null,due_date.lte.${horizon}`)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (context.company?.id) {
    viaCase = viaCase.is('company_id', null).eq('case.company_id', context.company.id);
  } else {
    viaCase = viaCase.is('client_id', null).eq('case.client_id', targetClientId(context)!);
  }
  const caseResult = await viaCase;
  if (caseResult.error) throw caseResult.error;
  for (const row of decorate((caseResult.data ?? []) as Array<Record<string, unknown>>)) {
    collected.set(String(row.id), row);
  }
  total += caseResult.count ?? (caseResult.data ?? []).length;

  const items = [...collected.values()]
    .sort((a, b) => {
      const ad = String(a.due_date ?? '9999-12-31');
      const bd = String(b.due_date ?? '9999-12-31');
      return ad.localeCompare(bd) || String(b.created_at ?? '').localeCompare(String(a.created_at ?? ''));
    })
    .slice(0, limit);
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
