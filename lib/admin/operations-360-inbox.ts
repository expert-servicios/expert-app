import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export type Operations360Channel =
  | 'email'
  | 'telegram'
  | 'web'
  | 'kia'
  | 'meta'
  | 'google'
  | 'linkedin';

export type Operations360Status = 'needs_action' | 'kia_working' | 'resolved';
export type Operations360Identity = 'lead' | 'client' | 'unknown';
export type Operations360Priority = 'high' | 'normal' | 'low';

export type Operations360InboxItem = {
  id: string;
  source: 'email_inbox_cache' | 'kia_conversations' | 'leads';
  channel: Operations360Channel;
  direction: 'in' | 'out' | 'mixed';
  externalId: string | null;
  threadId: string | null;
  leadId: string | null;
  clientId: string | null;
  companyId: string | null;
  caseId: string | null;
  actor: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  subject: string;
  preview: string;
  status: Operations360Status;
  priority: Operations360Priority;
  kiaState: string | null;
  identity: Operations360Identity;
  lastActivityAt: string;
  sourceHref: string;
  taskCount: number;
  nextMeetingAt: string | null;
  metadata: Record<string, unknown>;
};

type LoadOptions = {
  q?: string | null;
  channel?: string | null;
  status?: string | null;
  limit?: number;
};

type DbResult<T> = { data: T[] | null; error: { message: string } | null };

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function lower(value: unknown) {
  return normalize(value).toLowerCase();
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asBool(value: unknown) {
  return value === true || value === 'true' || value === 1;
}

function asChannel(value: unknown, fallback: Operations360Channel = 'web'): Operations360Channel {
  const raw = lower(value);
  if (raw === 'email' || raw === 'gmail' || raw === 'outlook' || raw === 'ms365') return 'email';
  if (raw === 'telegram') return 'telegram';
  if (raw === 'dashboard' || raw === 'kia' || raw === 'chat' || raw === 'webchat') return 'kia';
  if (raw.includes('facebook') || raw.includes('instagram') || raw === 'meta' || raw === 'waba') return 'meta';
  if (raw.includes('google')) return 'google';
  if (raw.includes('linkedin')) return 'linkedin';
  if (raw === 'website' || raw === 'web' || raw.startsWith('form')) return 'web';
  return fallback;
}

function hasHumanEscalation(metadata: Record<string, unknown>) {
  return [
    metadata.requires_human,
    metadata.needs_review,
    metadata.escalated_to_admin,
    metadata.manual_review,
    metadata.handoff_required,
  ].some(asBool);
}

function taskMatches(
  task: {
    client_id: string | null;
    company_id: string | null;
    case_id: string | null;
    lead_id: string | null;
  },
  item: Pick<Operations360InboxItem, 'leadId' | 'clientId' | 'companyId' | 'caseId'>,
) {
  if (item.caseId && task.case_id === item.caseId) return true;
  if (item.leadId && task.lead_id === item.leadId) return true;
  if (item.clientId && task.client_id === item.clientId) return true;
  return Boolean(item.companyId && task.company_id === item.companyId);
}

function meetingMatches(
  meeting: {
    client_id: string | null;
    company_id: string | null;
    email: string | null;
  },
  item: Pick<Operations360InboxItem, 'clientId' | 'companyId' | 'actor'>,
) {
  if (item.clientId && meeting.client_id === item.clientId) return true;
  if (item.companyId && meeting.company_id === item.companyId) return true;
  const actorEmail = lower(item.actor.email);
  return Boolean(actorEmail && lower(meeting.email) === actorEmail);
}

function meetingTimestamp(meeting: {
  confirmed_date: string | null;
  confirmed_time: string | null;
  appointment_date: string | null;
}) {
  if (meeting.confirmed_date) {
    return `${meeting.confirmed_date}T${meeting.confirmed_time || '12:00:00'}`;
  }
  return meeting.appointment_date;
}

function safeText(value: unknown, fallback = '') {
  const text = normalize(value);
  return text || fallback;
}

function limited(value: string, max = 360) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function searchHaystack(item: Operations360InboxItem) {
  return [
    item.subject,
    item.preview,
    item.actor.name,
    item.actor.email,
    item.actor.phone,
    item.leadId,
    item.clientId,
    item.companyId,
    item.caseId,
    item.threadId,
    item.channel,
    item.identity,
    typeof item.metadata.company_name === 'string' ? item.metadata.company_name : null,
    typeof item.metadata.company_tax_id === 'string' ? item.metadata.company_tax_id : null,
  ].filter(Boolean).join(' ').toLowerCase();
}

export async function loadOperations360Inbox(admin: AdminClient, options: LoadOptions = {}) {
  const hardLimit = Math.max(20, Math.min(Number(options.limit) || 120, 200));
  const warnings: string[] = [];

  const [emailsRes, conversationsRes, messagesRes, leadsRes, tasksRes, meetingsRes] = await Promise.all([
    admin
      .from('email_inbox_cache')
      .select('thread_id,provider,subject,from_name,from_email,snippet,date,unread,has_attachment,case_id')
      .order('date', { ascending: false })
      .limit(200),
    admin
      .from('kia_conversations')
      .select('id,tenant_id,profile_id,channel,company_id,case_id,service_slug,topic,status,origin_type,origin_ref,metadata,last_message_at,created_at,updated_at')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(200),
    admin
      .from('kia_conversation_messages')
      .select('id,conversation_id,profile_id,channel,role,body,intent,metadata,created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    admin
      .from('leads')
      .select('id,name,email,phone,category,service,message,state,source,source_key,metadata,created_at,updated_at,lifecycle_stage')
      .order('updated_at', { ascending: false })
      .limit(250),
    admin
      .from('internal_tasks')
      .select('id,status,client_id,company_id,case_id,lead_id,due_date,priority,created_at')
      .in('status', ['pendiente', 'en_progreso'])
      .order('created_at', { ascending: false })
      .limit(300),
    admin
      .from('appointments')
      .select('id,name,email,service,appointment_type,appointment_date,confirmed_date,confirmed_time,status,client_id,company_id')
      .order('appointment_date', { ascending: false })
      .limit(250),
  ]) as [
    DbResult<any>,
    DbResult<any>,
    DbResult<any>,
    DbResult<any>,
    DbResult<any>,
    DbResult<any>,
  ];

  for (const [name, result] of [
    ['email_inbox_cache', emailsRes],
    ['kia_conversations', conversationsRes],
    ['kia_conversation_messages', messagesRes],
    ['leads', leadsRes],
    ['internal_tasks', tasksRes],
    ['appointments', meetingsRes],
  ] as const) {
    if (result.error) warnings.push(`${name}: ${result.error.message}`);
  }

  const emailRows = emailsRes.data ?? [];
  const conversationRows = conversationsRes.data ?? [];
  const messageRows = messagesRes.data ?? [];
  const leadRows = leadsRes.data ?? [];
  const taskRows = tasksRes.data ?? [];
  const meetingRows = meetingsRes.data ?? [];

  const caseIds = [...new Set([
    ...emailRows.map((row) => row.case_id),
    ...conversationRows.map((row) => row.case_id),
    ...taskRows.map((row) => row.case_id),
  ].filter(Boolean))];

  const profileIds = [...new Set([
    ...conversationRows.map((row) => row.profile_id),
    ...taskRows.map((row) => row.client_id),
    ...meetingRows.map((row) => row.client_id),
  ].filter(Boolean))];

  const companyIds = [...new Set([
    ...conversationRows.map((row) => row.company_id),
    ...taskRows.map((row) => row.company_id),
    ...meetingRows.map((row) => row.company_id),
  ].filter(Boolean))];

  const emailCandidates = [...new Set([
    ...emailRows.map((row) => lower(row.from_email)),
    ...leadRows.map((row) => lower(row.email)),
  ].filter(Boolean))];

  const [casesRes, profilesByIdRes, profilesByEmailRes, companiesRes] = await Promise.all([
    caseIds.length
      ? admin.from('cases').select('id,client_id,company_id,service').in('id', caseIds)
      : Promise.resolve({ data: [], error: null }),
    profileIds.length
      ? admin.from('profiles').select('id,full_name,email,phone').in('id', profileIds)
      : Promise.resolve({ data: [], error: null }),
    emailCandidates.length
      ? admin.from('profiles').select('id,full_name,email,phone').in('email', emailCandidates)
      : Promise.resolve({ data: [], error: null }),
    companyIds.length
      ? admin.from('companies').select('id,razon_social,nombre_comercial,cif_nif').in('id', companyIds)
      : Promise.resolve({ data: [], error: null }),
  ]) as [DbResult<any>, DbResult<any>, DbResult<any>, DbResult<any>];

  for (const [name, result] of [
    ['cases_lookup', casesRes],
    ['profiles_lookup', profilesByIdRes],
    ['profiles_email_lookup', profilesByEmailRes],
    ['companies_lookup', companiesRes],
  ] as const) {
    if (result.error) warnings.push(`${name}: ${result.error.message}`);
  }

  const caseById = new Map((casesRes.data ?? []).map((row) => [row.id, row]));
  const profiles = [...(profilesByIdRes.data ?? []), ...(profilesByEmailRes.data ?? [])];
  const profileById = new Map(profiles.map((row) => [row.id, row]));
  const profileByEmail = new Map(
    profiles.filter((row) => row.email).map((row) => [lower(row.email), row]),
  );
  const leadByEmail = new Map(
    leadRows.filter((row) => row.email).map((row) => [lower(row.email), row]),
  );
  const companyById = new Map((companiesRes.data ?? []).map((row) => [row.id, row]));

  const latestMessageByConversation = new Map<string, any>();
  for (const message of messageRows) {
    if (!latestMessageByConversation.has(message.conversation_id)) {
      latestMessageByConversation.set(message.conversation_id, message);
    }
  }

  const items: Operations360InboxItem[] = [];

  for (const row of emailRows) {
    if (!row.thread_id || !row.date) continue;
    const caseRow = row.case_id ? caseById.get(row.case_id) : null;
    const matchedProfile = profileByEmail.get(lower(row.from_email)) ?? null;
    const matchedLead = leadByEmail.get(lower(row.from_email)) ?? null;
    const clientId = matchedProfile?.id ?? caseRow?.client_id ?? null;
    const companyId = caseRow?.company_id ?? null;
    const provider = safeText(row.provider, 'gmail');
    const status: Operations360Status = row.unread ? 'needs_action' : 'resolved';

    items.push({
      id: `email:${provider}:${row.thread_id}`,
      source: 'email_inbox_cache',
      channel: 'email',
      direction: 'in',
      externalId: row.thread_id,
      threadId: row.thread_id,
      leadId: matchedLead?.id ?? null,
      clientId,
      companyId,
      caseId: row.case_id ?? null,
      actor: {
        name: row.from_name ?? matchedProfile?.full_name ?? matchedLead?.name ?? null,
        email: row.from_email ?? matchedProfile?.email ?? matchedLead?.email ?? null,
        phone: matchedProfile?.phone ?? matchedLead?.phone ?? null,
      },
      subject: safeText(row.subject, 'Correo recibido'),
      preview: limited(safeText(row.snippet, 'Sin vista previa')),
      status,
      priority: row.unread ? 'high' : 'normal',
      kiaState: null,
      identity: clientId ? 'client' : matchedLead ? 'lead' : 'unknown',
      lastActivityAt: row.date,
      sourceHref: `/admin/correo/hilo?provider=${encodeURIComponent(provider)}&conversationId=${encodeURIComponent(row.thread_id)}${clientId ? `&clientId=${encodeURIComponent(clientId)}` : ''}`,
      taskCount: 0,
      nextMeetingAt: null,
      metadata: {
        provider,
        unread: Boolean(row.unread),
        has_attachment: Boolean(row.has_attachment),
        company_name: companyId
          ? (companyById.get(companyId)?.razon_social ?? companyById.get(companyId)?.nombre_comercial ?? null)
          : null,
        company_tax_id: companyId ? (companyById.get(companyId)?.cif_nif ?? null) : null,
      },
    });
  }

  for (const row of conversationRows) {
    if (!row.id) continue;
    const latest = latestMessageByConversation.get(row.id);
    const metadata = objectValue(row.metadata);
    const latestMetadata = objectValue(latest?.metadata);
    const profile = profileById.get(row.profile_id) ?? null;
    const caseRow = row.case_id ? caseById.get(row.case_id) : null;
    const clientId = row.profile_id ?? caseRow?.client_id ?? null;
    const companyId = row.company_id ?? caseRow?.company_id ?? null;
    const escalated = hasHumanEscalation({ ...metadata, ...latestMetadata });
    const status: Operations360Status =
      row.status !== 'active'
        ? 'resolved'
        : escalated
          ? 'needs_action'
          : 'kia_working';
    const channel = asChannel(row.channel, 'kia');
    const lastActivityAt = latest?.created_at ?? row.last_message_at ?? row.updated_at ?? row.created_at;
    if (!lastActivityAt) continue;

    items.push({
      id: `kia:${row.id}`,
      source: 'kia_conversations',
      channel,
      direction: 'mixed',
      externalId: latest?.id ?? row.origin_ref ?? null,
      threadId: row.id,
      leadId: null,
      clientId,
      companyId,
      caseId: row.case_id ?? null,
      actor: {
        name: profile?.full_name ?? null,
        email: profile?.email ?? null,
        phone: profile?.phone ?? null,
      },
      subject: safeText(row.topic, safeText(row.service_slug, channel === 'telegram' ? 'Telegram KIA' : 'Conversación KIA')),
      preview: limited(safeText(latest?.body, 'Conversación activa')),
      status,
      priority: escalated ? 'high' : 'normal',
      kiaState: latest?.role === 'assistant' ? 'responded' : latest?.role === 'user' ? 'processing' : row.status,
      identity: clientId ? 'client' : 'unknown',
      lastActivityAt,
      sourceHref: '/admin/kia',
      taskCount: 0,
      nextMeetingAt: null,
      metadata: {
        origin_type: row.origin_type,
        origin_ref: row.origin_ref,
        latest_role: latest?.role ?? null,
        intent: latest?.intent ?? null,
        company_name: companyId
          ? (companyById.get(companyId)?.razon_social ?? companyById.get(companyId)?.nombre_comercial ?? null)
          : null,
        company_tax_id: companyId ? (companyById.get(companyId)?.cif_nif ?? null) : null,
      },
    });
  }

  for (const row of leadRows) {
    if (!row.id) continue;
    const metadata = objectValue(row.metadata);
    const acquisition = objectValue(metadata.last_acquisition);
    const channel = asChannel(acquisition.channel ?? row.source, 'web');

    // Correo tiene un hilo canónico propio. Evitar duplicar la misma entrada como lead + hilo.
    if (channel === 'email') continue;

    const matchedProfile = row.email ? profileByEmail.get(lower(row.email)) ?? null : null;
    const state = lower(row.state);
    const lifecycle = lower(row.lifecycle_stage);
    const needsAction = state === 'new' || state === 'needs_review' || lifecycle === 'lead' || lifecycle === 'prospect';
    const lastActivityAt = normalize(acquisition.at) || row.updated_at || row.created_at;
    if (!lastActivityAt) continue;

    items.push({
      id: `lead:${row.id}`,
      source: 'leads',
      channel,
      direction: 'in',
      externalId: row.source_key ?? null,
      threadId: null,
      leadId: row.id,
      clientId: matchedProfile?.id ?? null,
      companyId: null,
      caseId: null,
      actor: {
        name: row.name ?? matchedProfile?.full_name ?? null,
        email: row.email ?? matchedProfile?.email ?? null,
        phone: row.phone ?? matchedProfile?.phone ?? null,
      },
      subject: safeText(row.service, safeText(row.category, 'Nueva consulta')),
      preview: limited(safeText(row.message, 'Lead sin mensaje')),
      status: needsAction ? 'needs_action' : 'resolved',
      priority: needsAction ? 'high' : 'normal',
      kiaState: null,
      identity: matchedProfile ? 'client' : 'lead',
      lastActivityAt,
      sourceHref: `/admin/leads?focus=${encodeURIComponent(row.id)}`,
      taskCount: 0,
      nextMeetingAt: null,
      metadata: {
        source: row.source,
        source_key: row.source_key,
        category: row.category,
        lifecycle_stage: row.lifecycle_stage,
        origin: acquisition.origin ?? null,
      },
    });
  }

  const now = Date.now();
  for (const item of items) {
    item.taskCount = taskRows.filter((task) => taskMatches(task, item)).length;

    const meetings = meetingRows
      .filter((meeting) => !['cancelled', 'canceled'].includes(lower(meeting.status)))
      .filter((meeting) => meetingMatches(meeting, item))
      .map((meeting) => meetingTimestamp(meeting))
      .filter((value): value is string => Boolean(value))
      .filter((value) => {
        const parsed = Date.parse(value);
        return Number.isFinite(parsed) && parsed >= now;
      })
      .sort((a, b) => Date.parse(a) - Date.parse(b));

    item.nextMeetingAt = meetings[0] ?? null;
  }

  const q = lower(options.q);
  const channelFilter = lower(options.channel);
  const statusFilter = lower(options.status);

  const filtered = items.filter((item) => {
    if (channelFilter && channelFilter !== 'all' && item.channel !== channelFilter) return false;
    if (statusFilter && statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (q && !searchHaystack(item).includes(q)) return false;
    return true;
  });

  const priorityRank: Record<Operations360Priority, number> = { high: 0, normal: 1, low: 2 };
  filtered.sort((a, b) => {
    const priority = priorityRank[a.priority] - priorityRank[b.priority];
    if (priority !== 0) return priority;
    return Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt);
  });

  const summary = {
    total: items.length,
    needs_action: items.filter((item) => item.status === 'needs_action').length,
    kia_working: items.filter((item) => item.status === 'kia_working').length,
    resolved: items.filter((item) => item.status === 'resolved').length,
    byChannel: items.reduce<Record<string, number>>((acc, item) => {
      acc[item.channel] = (acc[item.channel] ?? 0) + 1;
      return acc;
    }, {}),
  };

  return {
    generatedAt: new Date().toISOString(),
    summary,
    items: filtered.slice(0, hardLimit),
    warnings,
    contract: {
      mode: 'read_model',
      sources: ['email_inbox_cache', 'kia_conversations', 'kia_conversation_messages', 'leads'],
      enrichments: ['profiles', 'cases', 'companies', 'internal_tasks', 'appointments'],
      persistentEnvelope: 'kia_conversations',
    },
  };
}
