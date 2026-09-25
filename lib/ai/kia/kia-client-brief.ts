import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export interface KiaOriginEmailContext {
  ref: string | null;
  eventType: string | null;
  subject: string | null;
  excerpt: string | null;
}

export interface KiaClientCommunication {
  channel: 'email' | 'whatsapp' | 'kia';
  direction: 'in' | 'out';
  subject: string | null;
  text: string;
  createdAt: string;
  caseId: string | null;
  ref: string;
}

export interface KiaClientIdentityGraph {
  clientId: string;
  profileTenantId: string | null;
  activeCompanyId: string | null;
  currentScope: {
    caseId: string | null;
    companyId: string | null;
    tenantId: string | null;
  };
  memberships: Array<{
    companyId: string;
    tenantId: string | null;
    role: string | null;
  }>;
  cases: Array<{
    caseId: string;
    companyId: string | null;
    tenantId: string | null;
  }>;
  integrations: Array<{
    integrationId: string;
    provider: string;
    mode: string | null;
    companyId: string | null;
    tenantId: string | null;
    status: string;
  }>;
}

export interface KiaClientBrief {
  firstName: string | null;
  identity: KiaClientIdentityGraph;
  companies: Array<{ id: string; name: string | null; tenantId: string | null }>;
  integrations: Array<{
    id: string;
    provider: string;
    mode: string | null;
    status: string;
    companyId: string | null;
    tenantId: string | null;
    lastSuccessAt: string | null;
    hasError: boolean;
  }>;
  pendingTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string | null;
    dueDate: string | null;
    caseId: string | null;
    companyId: string | null;
  }>;
  nextBestActions: Array<{
    id: string;
    title: string;
    description: string | null;
    priority: string | null;
    dueAt: string | null;
    caseId: string | null;
  }>;
  recentCommunications: KiaClientCommunication[];
  originEmail: KiaOriginEmailContext | null;
}

function decodeHtml(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function compact(value: string | null | undefined, max = 1200): string {
  return decodeHtml(value ?? '').slice(0, max);
}

export function emailContextExcerpt(html: string, max = 3500): string {
  const signatureStart = html.search(/<table[^>]*data-kia-signature=/i);
  const beforeSignature = signatureStart >= 0 ? html.slice(0, signatureStart) : html;
  return compact(beforeSignature, max);
}

export async function loadKiaClientCommunications(input: {
  admin: AdminClient;
  clientId: string;
  email?: string | null;
  query?: string | null;
  channel?: 'all' | 'email' | 'whatsapp' | 'kia';
  limit?: number;
  caseId?: string | null;
  originSubject?: string | null;
}): Promise<KiaClientCommunication[]> {
  const channel = input.channel ?? 'all';
  const fetchLimit = Math.min(Math.max((input.limit ?? 20) * 3, 30), 100);
  const email = input.email?.trim() ?? '';

  const [outbound, inbound, whatsapp, kia] = await Promise.all([
    channel === 'all' || channel === 'email'
      ? email
        ? input.admin.from('email_events')
            .select('id,event_type,subject,html,created_at,metadata')
            .ilike('recipient_email', email)
            .order('created_at', { ascending: false })
            .limit(fetchLimit)
        : Promise.resolve({ data: [], error: null })
      : Promise.resolve({ data: [], error: null }),
    channel === 'all' || channel === 'email'
      ? email
        ? input.admin.from('email_inbox_cache')
            .select('thread_id,subject,snippet,date,case_id')
            .ilike('from_email', email)
            .order('date', { ascending: false })
            .limit(fetchLimit)
        : Promise.resolve({ data: [], error: null })
      : Promise.resolve({ data: [], error: null }),
    channel === 'all' || channel === 'whatsapp'
      ? input.admin.from('whatsapp_conversations')
          .select('id,direction,body,created_at,case_id')
          .eq('client_id', input.clientId)
          .order('created_at', { ascending: false })
          .limit(fetchLimit)
      : Promise.resolve({ data: [], error: null }),
    channel === 'all' || channel === 'kia'
      ? input.admin.from('kia_conversation_messages')
          .select('id,role,body,created_at,metadata')
          .eq('profile_id', input.clientId)
          .in('role', ['user','assistant'])
          .order('created_at', { ascending: false })
          .limit(fetchLimit)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const rows: KiaClientCommunication[] = [];

  for (const row of outbound.data ?? []) {
    const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata as Record<string, unknown> : {};
    rows.push({
      channel: 'email',
      direction: 'out',
      subject: row.subject ?? row.event_type ?? null,
      text: compact(row.html, 700),
      createdAt: row.created_at,
      caseId: typeof metadata.case_id === 'string' ? metadata.case_id : null,
      ref: typeof metadata.email_event_ref === 'string' ? metadata.email_event_ref : `email-out:${row.id}`,
    });
  }
  for (const row of inbound.data ?? []) {
    rows.push({
      channel: 'email',
      direction: 'in',
      subject: row.subject ?? null,
      text: compact(row.snippet, 700),
      createdAt: row.date,
      caseId: row.case_id ?? null,
      ref: `email-in:${row.thread_id}`,
    });
  }
  for (const row of whatsapp.data ?? []) {
    rows.push({
      channel: 'whatsapp',
      direction: row.direction === 'inbound' ? 'in' : 'out',
      subject: null,
      text: compact(row.body, 700),
      createdAt: row.created_at,
      caseId: row.case_id ?? null,
      ref: `whatsapp:${row.id}`,
    });
  }
  for (const row of kia.data ?? []) {
    const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata as Record<string, unknown> : {};
    if (row.role === 'assistant' && ['prepared', 'failed'].includes(String(metadata.delivery_state ?? ''))) continue;
    rows.push({
      channel: 'kia',
      direction: row.role === 'user' ? 'in' : 'out',
      subject: null,
      text: compact(row.body, 700),
      createdAt: row.created_at,
      caseId: typeof metadata.case_id === 'string' ? metadata.case_id : null,
      ref: `kia:${row.id}`,
    });
  }

  const normalizedQuery = input.query?.trim().toLocaleLowerCase() ?? '';
  const normalizedOrigin = input.originSubject?.trim().toLocaleLowerCase() ?? '';
  const score = (item: KiaClientCommunication): number => {
    let value = 0;
    if (input.caseId && item.caseId === input.caseId) value += 10;
    if (normalizedOrigin && (item.subject ?? '').toLocaleLowerCase() === normalizedOrigin) value += 8;
    if (item.channel === 'email') value += 2;
    if (item.direction === 'in') value += 1;
    return value;
  };

  return rows
    .filter((item) => !normalizedQuery || `${item.subject ?? ''} ${item.text}`.toLocaleLowerCase().includes(normalizedQuery))
    .sort((a, b) => score(b) - score(a) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, Math.min(Math.max(input.limit ?? 12, 1), 50));
}

export async function loadKiaClientBrief(input: {
  admin: AdminClient;
  clientId: string | null;
  caseId?: string | null;
  companyId?: string | null;
  originEmail?: KiaOriginEmailContext | null;
}): Promise<KiaClientBrief | null> {
  if (!input.clientId) return null;

  const { data: profile } = await input.admin
    .from('profiles')
    .select('full_name,email,active_company_id,tenant_id')
    .eq('id', input.clientId)
    .maybeSingle();
  if (!profile) return null;

  const { data: memberships } = await input.admin
    .from('profile_companies')
    .select('company_id,role')
    .eq('profile_id', input.clientId);
  const companyIds = (memberships ?? []).map((row) => row.company_id).filter(Boolean);
  const allowedCompanyIds = new Set(companyIds);

  const [companiesRes, integrationsRes, casesRes, tasksRes, nbaRes, communications] = await Promise.all([
    companyIds.length
      ? input.admin.from('companies')
          .select('id,razon_social,nombre_comercial,tenant_id')
          .in('id', companyIds)
          .limit(20)
      : Promise.resolve({ data: [], error: null }),
    companyIds.length
      ? input.admin.from('client_integrations')
          .select('id,provider,mode,status,company_id,last_success_at,last_error,updated_at')
          .or(`client_id.eq.${input.clientId},company_id.in.(${companyIds.join(',')})`)
          .neq('status', 'revoked')
          .order('updated_at', { ascending: false })
          .limit(30)
      : input.admin.from('client_integrations')
          .select('id,provider,mode,status,company_id,last_success_at,last_error,updated_at')
          .eq('client_id', input.clientId)
          .neq('status', 'revoked')
          .order('updated_at', { ascending: false })
          .limit(30),
    input.admin.from('cases')
      .select('id,company_id,tenant_id,closed_at')
      .eq('client_id', input.clientId)
      .order('updated_at', { ascending: false })
      .limit(30),
    input.admin.from('internal_tasks')
      .select('id,title,status,priority,due_date,case_id,company_id')
      .eq('client_id', input.clientId)
      .in('status', ['pendiente','en_progreso'])
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(15),
    input.admin.from('next_best_actions')
      .select('id,title,description,priority,due_at,case_id')
      .eq('client_id', input.clientId)
      .eq('status', 'open')
      .order('due_at', { ascending: true, nullsFirst: false })
      .limit(10),
    loadKiaClientCommunications({
      admin: input.admin,
      clientId: input.clientId,
      email: profile.email,
      limit: 12,
      caseId: input.caseId ?? null,
      originSubject: input.originEmail?.subject ?? null,
    }).catch(() => []),
  ]);

  const companyTenantById = new Map<string, string | null>();
  const companies = (companiesRes.data ?? []).map((row) => {
    companyTenantById.set(row.id, row.tenant_id ?? null);
    return {
      id: row.id,
      name: row.nombre_comercial ?? row.razon_social ?? null,
      tenantId: row.tenant_id ?? null,
    };
  });

  const integrations = (integrationsRes.data ?? [])
    .filter((row) => !row.company_id || allowedCompanyIds.has(row.company_id))
    .map((row) => ({
      id: row.id,
      provider: row.provider,
      mode: row.mode ?? null,
      status: row.status,
      companyId: row.company_id ?? null,
      tenantId: row.company_id ? (companyTenantById.get(row.company_id) ?? null) : null,
      lastSuccessAt: row.last_success_at ?? null,
      hasError: Boolean(row.last_error),
    }));

  const caseLinks = (casesRes.data ?? [])
    .filter((row) => !row.company_id || allowedCompanyIds.has(row.company_id))
    .map((row) => ({
      caseId: row.id,
      companyId: row.company_id ?? null,
      tenantId: row.tenant_id ?? (row.company_id ? (companyTenantById.get(row.company_id) ?? null) : null),
    }));

  const currentCase = input.caseId ? caseLinks.find((item) => item.caseId === input.caseId) ?? null : null;
  const requestedCompanyId = input.companyId && allowedCompanyIds.has(input.companyId) ? input.companyId : null;
  const currentCompanyId = requestedCompanyId ?? currentCase?.companyId ?? null;
  let currentTenantId = currentCase?.tenantId ?? null;
  if (!currentTenantId && currentCompanyId) {
    currentTenantId = companyTenantById.get(currentCompanyId) ?? null;
  }
  if (!currentTenantId) {
    currentTenantId = profile.tenant_id ?? null;
  }

  const membershipRoleByCompany = new Map((memberships ?? []).map((row) => [row.company_id, row.role ?? null]));
  const identity: KiaClientIdentityGraph = {
    clientId: input.clientId,
    profileTenantId: profile.tenant_id ?? null,
    activeCompanyId: profile.active_company_id ?? null,
    currentScope: {
      caseId: input.caseId ?? null,
      companyId: currentCompanyId,
      tenantId: currentTenantId,
    },
    memberships: companies.map((company) => ({
      companyId: company.id,
      tenantId: company.tenantId,
      role: membershipRoleByCompany.get(company.id) ?? null,
    })),
    cases: caseLinks,
    integrations: integrations.map((integration) => ({
      integrationId: integration.id,
      provider: integration.provider,
      mode: integration.mode,
      companyId: integration.companyId,
      tenantId: integration.tenantId,
      status: integration.status,
    })),
  };

  const prioritize = <T extends { caseId?: string | null; companyId?: string | null }>(items: T[]) =>
    items.sort((a, b) => {
      const score = (item: T) =>
        (input.caseId && item.caseId === input.caseId ? 4 : 0) +
        (input.companyId && item.companyId === input.companyId ? 2 : 0);
      return score(b) - score(a);
    });

  const pendingTasks = prioritize((tasksRes.data ?? [])
    .filter((row) => !row.company_id || allowedCompanyIds.has(row.company_id))
    .map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      priority: row.priority ?? null,
      dueDate: row.due_date ?? null,
      caseId: row.case_id ?? null,
      companyId: row.company_id ?? null,
    }))).slice(0, 12);

  const nextBestActions = (nbaRes.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    priority: row.priority ?? null,
    dueAt: row.due_at ?? null,
    caseId: row.case_id ?? null,
  }));

  return {
    firstName: (profile.full_name ?? '').trim().split(/\s+/)[0] || null,
    identity,
    companies,
    integrations,
    pendingTasks,
    nextBestActions,
    recentCommunications: communications,
    originEmail: input.originEmail ?? null,
  };
}
