import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export interface KiaClientLedgerContext {
  subjectId: string;
  lifecycleStage: string;
  summaryText: string;
  asOf: string;
  recentEvents: Array<{
    eventType: string;
    occurredAt: string;
    title: string | null;
    summary: string | null;
    channel: string | null;
    direction: string | null;
    caseId: string | null;
    companyId: string | null;
    importance: number;
    sourceRef: string | null;
  }>;
}

type IdentityInput = {
  clientId?: string | null;
  leadId?: string | null;
  email?: string | null;
  phone?: string | null;
  companyId?: string | null;
  caseId?: string | null;
};

function normalizeEmail(value: string | null | undefined): string | null {
  const email = value?.trim().toLowerCase() ?? '';
  return email.includes('@') ? email : null;
}

function normalizePhone(value: string | null | undefined): string | null {
  const raw = value?.trim() ?? '';
  if (!raw) return null;
  const plus = raw.startsWith('+') ? '+' : '';
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 7 ? `${plus}${digits}` : null;
}

type RegistrySubjectRow = {
  id: string;
  lifecycle_stage: string;
  lead_id: string | null;
  client_id: string | null;
  company_id: string | null;
  email_normalized: string | null;
  phone_normalized: string | null;
};

export async function resolveClientRegistrySubject(
  admin: AdminClient,
  input: IdentityInput,
): Promise<{ id: string; lifecycleStage: string } | null> {
  const clientId = input.clientId ?? null;
  const leadId = input.leadId ?? null;
  const companyId = input.companyId ?? null;
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);

  if (!clientId && !leadId && !companyId && !email && !phone) return null;

  if (companyId) {
    const { data: existingCompanySubject, error: companySubjectError } = await admin
      .from('client_registry_subjects')
      .select('id,lifecycle_stage')
      .eq('company_id', companyId)
      .is('merged_into_subject_id', null)
      .maybeSingle();
    if (companySubjectError) throw companySubjectError;
    if (existingCompanySubject) {
      return { id: existingCompanySubject.id, lifecycleStage: existingCompanySubject.lifecycle_stage };
    }
    const { data: createdCompanySubject, error: createCompanySubjectError } = await admin
      .from('client_registry_subjects')
      .insert({ company_id: companyId, lifecycle_stage: 'client' })
      .select('id,lifecycle_stage')
      .single();
    if (createCompanySubjectError) {
      if (createCompanySubjectError.code === '23505') throw new Error('client_registry_identity_conflict');
      throw createCompanySubjectError;
    }
    return { id: createdCompanySubject.id, lifecycleStage: createdCompanySubject.lifecycle_stage };
  }

  const exact: RegistrySubjectRow[] = [];
  if (clientId) {
    const { data, error } = await admin.from('client_registry_subjects')
      .select('id,lifecycle_stage,lead_id,client_id,company_id,email_normalized,phone_normalized')
      .eq('client_id', clientId)
      .is('merged_into_subject_id', null)
      .maybeSingle();
    if (error) throw error;
    if (data) exact.push(data as RegistrySubjectRow);
  }
  if (leadId) {
    const { data, error } = await admin.from('client_registry_subjects')
      .select('id,lifecycle_stage,lead_id,client_id,company_id,email_normalized,phone_normalized')
      .eq('lead_id', leadId)
      .is('merged_into_subject_id', null)
      .maybeSingle();
    if (error) throw error;
    if (data) exact.push(data as RegistrySubjectRow);
  }

  const exactIds = [...new Set(exact.map((row) => row.id))];
  if (exactIds.length > 1) throw new Error('client_registry_identity_conflict');

  let subject: RegistrySubjectRow | null = exact[0] ?? null;

  // Contact data is not an identity merge key for bound leads/clients.
  // It is used only to reuse an unbound prospect subject.
  if (!subject && !clientId && !leadId) {
    const candidateIds = new Set<string>();
    const candidates: RegistrySubjectRow[] = [];

    for (const [column, value] of [['email_normalized', email], ['phone_normalized', phone]] as const) {
      if (!value) continue;
      const { data, error } = await admin.from('client_registry_subjects')
        .select('id,lifecycle_stage,lead_id,client_id,company_id,email_normalized,phone_normalized')
        .eq(column, value)
        .is('lead_id', null)
        .is('client_id', null)
        .is('merged_into_subject_id', null)
        .limit(2);
      if (error) throw error;
      for (const row of (data ?? []) as RegistrySubjectRow[]) {
        candidateIds.add(row.id);
        candidates.push(row);
      }
    }

    if (candidateIds.size > 1) throw new Error('client_registry_identity_conflict');
    if (candidateIds.size === 1) {
      subject = candidates.find((row) => candidateIds.has(row.id)) ?? null;
    }
  }

  const lifecycleStage = clientId ? 'client' : leadId ? 'lead' : 'prospect';
  if (!subject) {
    const { data, error } = await admin.from('client_registry_subjects').insert({
      lead_id: leadId,
      client_id: clientId,
      company_id: null,
      email_normalized: email,
      phone_normalized: phone,
      lifecycle_stage: lifecycleStage,
    }).select('id,lifecycle_stage').single();
    if (error) throw error;
    return { id: data.id, lifecycleStage: data.lifecycle_stage };
  }

  if (clientId && subject.client_id && subject.client_id !== clientId) {
    throw new Error('client_registry_identity_conflict');
  }
  if (leadId && subject.lead_id && subject.lead_id !== leadId) {
    throw new Error('client_registry_identity_conflict');
  }

  const patch: Record<string, unknown> = {};
  if (leadId && !subject.lead_id) patch.lead_id = leadId;
  if (clientId && !subject.client_id) patch.client_id = clientId;
  if (email !== null && email !== subject.email_normalized) patch.email_normalized = email;
  if (phone !== null && phone !== subject.phone_normalized) patch.phone_normalized = phone;
  if (clientId && subject.lifecycle_stage !== 'client') patch.lifecycle_stage = 'client';
  if (!clientId && leadId && subject.lifecycle_stage !== 'lead') patch.lifecycle_stage = 'lead';

  if (Object.keys(patch).length > 0) {
    patch.updated_at = new Date().toISOString();
    const { error } = await admin.from('client_registry_subjects').update(patch).eq('id', subject.id);
    if (error) {
      if (error.code === '23505') throw new Error('client_registry_identity_conflict');
      throw error;
    }
  }

  return {
    id: subject.id,
    lifecycleStage: clientId ? 'client' : leadId ? 'lead' : subject.lifecycle_stage,
  };
}

type RegistryEventInput = {
  subjectId: string;
  eventType: string;
  occurredAt: string;
  sourceKey: string;
  title?: string | null;
  summary?: string | null;
  sourceTable?: string | null;
  sourceId?: string | null;
  sourceRef?: string | null;
  channel?: string | null;
  direction?: 'in' | 'out' | 'internal' | null;
  leadId?: string | null;
  clientId?: string | null;
  companyId?: string | null;
  caseId?: string | null;
  importance?: number;
  metadata?: Record<string, unknown>;
};

function serializeRegistryEvent(input: RegistryEventInput) {
  return {
    subject_id: input.subjectId,
    event_type: input.eventType,
    occurred_at: input.occurredAt,
    source_key: input.sourceKey,
    title: input.title ?? null,
    summary: input.summary?.slice(0, 1200) ?? null,
    source_table: input.sourceTable ?? null,
    source_id: input.sourceId ?? null,
    source_ref: input.sourceRef ?? null,
    channel: input.channel ?? null,
    direction: input.direction ?? null,
    lead_id: input.leadId ?? null,
    client_id: input.clientId ?? null,
    company_id: input.companyId ?? null,
    case_id: input.caseId ?? null,
    importance: Math.max(0, Math.min(5, input.importance ?? 1)),
    metadata: input.metadata ?? {},
  };
}

async function appendEvents(admin: AdminClient, inputs: RegistryEventInput[]) {
  const chunkSize = 200;
  for (let offset = 0; offset < inputs.length; offset += chunkSize) {
    const chunk = inputs.slice(offset, offset + chunkSize).map(serializeRegistryEvent);
    if (!chunk.length) continue;
    const { error } = await admin.from('client_registry_events').upsert(chunk, {
      onConflict: 'source_key',
      ignoreDuplicates: true,
    });
    if (error) throw error;
  }
}

async function appendEvent(admin: AdminClient, input: RegistryEventInput) {
  await appendEvents(admin, [input]);
}

export async function recordClientRegistryEvent(
  admin: AdminClient,
  identity: IdentityInput,
  event: Omit<Parameters<typeof appendEvent>[1], 'subjectId' | 'leadId' | 'clientId'>,
) {
  const subject = await resolveClientRegistrySubject(admin, identity);
  if (!subject) return null;
  await appendEvent(admin, {
    ...event,
    subjectId: subject.id,
    leadId: identity.leadId ?? null,
    clientId: identity.clientId ?? null,
    companyId: event.companyId ?? identity.companyId ?? null,
  });
  return subject.id;
}

export async function loadClientRegistryContext(
  admin: AdminClient,
  input: IdentityInput,
): Promise<KiaClientLedgerContext | null> {
  const subject = await resolveClientRegistrySubject(admin, input);
  if (!subject) return null;

  const snapshotPromise = admin.from('client_registry_snapshots')
    .select('as_of')
    .eq('subject_id', subject.id)
    .maybeSingle();

  let eventsQuery = admin.from('client_registry_events')
    .select('event_type,occurred_at,title,summary,channel,direction,case_id,company_id,importance,source_ref')
    .eq('subject_id', subject.id);

  if (input.companyId) {
    eventsQuery = eventsQuery.or(`company_id.is.null,company_id.eq.${input.companyId}`);
  } else {
    eventsQuery = eventsQuery.is('company_id', null);
  }
  if (input.caseId) {
    eventsQuery = eventsQuery.or(`case_id.is.null,case_id.eq.${input.caseId}`);
  }

  const [snapshotResult, eventsResult] = await Promise.all([
    snapshotPromise,
    eventsQuery.order('occurred_at', { ascending: false }).limit(40),
  ]);
  if (snapshotResult.error) throw snapshotResult.error;
  if (eventsResult.error) throw eventsResult.error;

  const rows = eventsResult.data ?? [];
  const important = rows.filter((row) => Number(row.importance ?? 0) >= 2).slice(0, 10);
  const summaryText = important
    .map((row) => `${row.occurred_at.slice(0, 10)} · ${row.title ?? row.event_type}${row.summary ? ` · ${row.summary}` : ''}`)
    .join('\n')
    .slice(0, 7000);

  return {
    subjectId: subject.id,
    lifecycleStage: subject.lifecycleStage,
    summaryText,
    asOf: snapshotResult.data?.as_of ?? new Date(0).toISOString(),
    recentEvents: rows.slice(0, 24).map((row) => ({
      eventType: row.event_type,
      occurredAt: row.occurred_at,
      title: row.title,
      summary: row.summary,
      channel: row.channel,
      direction: row.direction,
      caseId: row.case_id,
      companyId: row.company_id,
      importance: Number(row.importance ?? 0),
      sourceRef: row.source_ref,
    })),
  };
}

export async function reconcileClientRegistry(
  admin: AdminClient,
  input: IdentityInput,
): Promise<KiaClientLedgerContext | null> {
  const subject = await resolveClientRegistrySubject(admin, input);
  if (!subject) return null;

  const pendingEvents: RegistryEventInput[] = [];
  const clientId = input.clientId ?? null;
  const leadId = input.leadId ?? null;
  const email = normalizeEmail(input.email);

  const jobs: Array<Promise<unknown>> = [];

  if (leadId) {
    jobs.push((async () => {
      const { data, error } = await admin.from('leads')
        .select('id,name,email,service,state,source,created_at,updated_at,lifecycle_stage')
        .eq('id', leadId).maybeSingle();
      if (error) throw error;
      if (!data) return;
      pendingEvents.push({
        subjectId: subject.id,
        eventType: 'lead.created',
        occurredAt: data.created_at,
        sourceKey: `lead:${data.id}:created`,
        title: data.name ? `Lead: ${data.name}` : 'Lead creado',
        summary: [data.service, data.source].filter(Boolean).join(' · '),
        sourceTable: 'leads',
        sourceId: data.id,
        leadId,
        importance: 2,
        metadata: { state: data.state, lifecycle_stage: data.lifecycle_stage },
      });
    })());
  }

  if (leadId) {
    jobs.push((async () => {
      const { data, error } = await admin.from('quotes')
        .select('id,title,status,amount_eur,created_at,company_id,client_id')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      for (const row of data ?? []) {
        pendingEvents.push({
          subjectId: subject.id,
          eventType: 'quote.created',
          occurredAt: row.created_at,
          sourceKey: `quote:${row.id}:created`,
          title: row.title ?? 'Presupuesto',
          summary: row.status,
          sourceTable: 'quotes',
          sourceId: row.id,
          leadId,
          clientId: row.client_id ?? clientId,
          companyId: row.company_id,
          importance: 2,
          metadata: { amount_eur: row.amount_eur, status: row.status },
        });
      }
    })());
  }

  if (clientId) {
    jobs.push((async () => {
      const { data, error } = await admin.from('cases')
        .select('id,service,service_id,status,state,company_id,opened_at,closed_at,updated_at,next_action')
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      for (const row of data ?? []) {
        if (row.opened_at) {
          pendingEvents.push({
            subjectId: subject.id,
            eventType: 'case.opened',
            occurredAt: row.opened_at,
            sourceKey: `case:${row.id}:opened`,
            title: row.service ?? row.service_id ?? 'Expediente',
            summary: [row.status, row.next_action].filter(Boolean).join(' · '),
            sourceTable: 'cases',
            sourceId: row.id,
            clientId,
            companyId: row.company_id,
            caseId: row.id,
            importance: 3,
            metadata: { status: row.status, state: row.state },
          });
        }
        if (row.updated_at && row.updated_at !== row.opened_at) {
          pendingEvents.push({
            subjectId: subject.id,
            eventType: row.closed_at ? 'case.closed' : 'case.status_changed',
            occurredAt: row.closed_at ?? row.updated_at,
            sourceKey: `case:${row.id}:${row.closed_at ? 'closed' : 'status'}:${row.closed_at ?? row.updated_at}`,
            title: row.service ?? row.service_id ?? 'Expediente',
            summary: [row.status, row.next_action].filter(Boolean).join(' · '),
            sourceTable: 'cases',
            sourceId: row.id,
            clientId,
            companyId: row.company_id,
            caseId: row.id,
            importance: row.closed_at ? 2 : 3,
            metadata: { status: row.status, state: row.state },
          });
        }
      }
    })());

    jobs.push((async () => {
      const { data, error } = await admin.from('documents')
        .select('id,original_name,title,state,case_id,company_id,created_at,replaced_by')
        .eq('client_id', clientId)
        .is('replaced_by', null)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      for (const row of data ?? []) {
        pendingEvents.push({
          subjectId: subject.id,
          eventType: 'document.received',
          occurredAt: row.created_at,
          sourceKey: `document:${row.id}:received`,
          title: row.original_name ?? row.title ?? 'Documento recibido',
          summary: row.state ?? null,
          sourceTable: 'documents',
          sourceId: row.id,
          clientId,
          companyId: row.company_id,
          caseId: row.case_id,
          importance: 2,
          metadata: { state: row.state },
        });
      }
    })());

    jobs.push((async () => {
      const { data, error } = await admin.from('appointments')
        .select('id,appointment_type,appointment_date,status,meeting_url,company_id,created_at')
        .eq('client_id', clientId)
        .order('appointment_date', { ascending: false })
        .limit(100);
      if (error) throw error;
      for (const row of data ?? []) {
        pendingEvents.push({
          subjectId: subject.id,
          eventType: 'appointment.booked',
          occurredAt: row.created_at,
          sourceKey: `appointment:${row.id}:booked`,
          title: row.appointment_type ?? 'Reunión',
          summary: row.status,
          sourceTable: 'appointments',
          sourceId: row.id,
          sourceRef: row.meeting_url,
          channel: 'meeting',
          clientId,
          companyId: row.company_id,
          importance: 2,
          metadata: { appointment_date: row.appointment_date },
        });
      }
    })());

    jobs.push((async () => {
      const { data, error } = await admin.from('quotes')
        .select('id,title,status,amount_eur,created_at,company_id,lead_id')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      for (const row of data ?? []) {
        pendingEvents.push({
          subjectId: subject.id,
          eventType: 'quote.created',
          occurredAt: row.created_at,
          sourceKey: `quote:${row.id}:created`,
          title: row.title ?? 'Presupuesto',
          summary: row.status,
          sourceTable: 'quotes',
          sourceId: row.id,
          clientId,
          companyId: row.company_id,
          importance: 2,
          metadata: { amount_eur: row.amount_eur, status: row.status },
        });
      }
    })());

    jobs.push((async () => {
      const { data, error } = await admin.from('orders')
        .select('id,status,amount_eur,pack_name,created_at,company_id,case_id')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      for (const row of data ?? []) {
        pendingEvents.push({
          subjectId: subject.id,
          eventType: 'order.created',
          occurredAt: row.created_at,
          sourceKey: `order:${row.id}:created`,
          title: row.pack_name ?? 'Pedido',
          summary: row.status,
          sourceTable: 'orders',
          sourceId: row.id,
          clientId,
          companyId: row.company_id,
          caseId: row.case_id,
          importance: 3,
          metadata: { amount_eur: row.amount_eur, status: row.status },
        });
      }
    })());
  }


  if (clientId) {
    jobs.push((async () => {
      const { data, error } = await admin.from('internal_tasks')
        .select('id,title,status,priority,due_date,case_id,company_id,created_at,completed_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(150);
      if (error) throw error;
      for (const row of data ?? []) {
        pendingEvents.push({
          subjectId: subject.id,
          eventType: row.completed_at ? 'task.completed' : 'task.created',
          occurredAt: row.completed_at ?? row.created_at,
          sourceKey: `task:${row.id}:${row.completed_at ? 'completed' : 'created'}`,
          title: row.title,
          summary: row.status,
          sourceTable: 'internal_tasks',
          sourceId: row.id,
          clientId,
          companyId: row.company_id,
          caseId: row.case_id,
          importance: row.priority === 'alta' || row.priority === 'urgent' ? 3 : 1,
          metadata: { due_date: row.due_date, status: row.status },
        });
      }
    })());

    jobs.push((async () => {
      const { data, error } = await admin.from('client_portal_invoices')
        .select('id,invoice_number,amount,currency,status,issue_date,created_at')
        .eq('user_id', clientId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      for (const row of data ?? []) {
        pendingEvents.push({
          subjectId: subject.id,
          eventType: 'invoice.issued',
          occurredAt: row.created_at,
          sourceKey: `client-invoice:${row.id}:issued`,
          title: row.invoice_number ? `Factura ${row.invoice_number}` : 'Factura',
          summary: row.status,
          sourceTable: 'client_portal_invoices',
          sourceId: row.id,
          clientId,
          importance: 2,
          metadata: { amount: row.amount, currency: row.currency, issue_date: row.issue_date, status: row.status },
        });
      }
    })());

    jobs.push((async () => {
      const { data: conversations, error: conversationsError } = await admin.from('kia_conversations')
        .select('id,company_id,case_id,metadata')
        .eq('profile_id', clientId)
        .order('last_message_at', { ascending: false })
        .limit(120);
      if (conversationsError) throw conversationsError;

      const allowedConversations = (conversations ?? []).filter((conversation) => {
        const metadata = conversation.metadata && typeof conversation.metadata === 'object'
          ? conversation.metadata as Record<string, unknown>
          : {};
        return metadata.staff_preview !== true;
      });
      const scopeByConversation = new Map(allowedConversations.map((conversation) => [
        conversation.id,
        { companyId: conversation.company_id ?? null, caseId: conversation.case_id ?? null },
      ]));
      const conversationIds = [...scopeByConversation.keys()];
      if (!conversationIds.length) return;

      const { data, error } = await admin.from('kia_conversation_messages')
        .select('id,conversation_id,channel,role,body,created_at,metadata')
        .eq('profile_id', clientId)
        .in('conversation_id', conversationIds)
        .in('role', ['user','assistant'])
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;

      for (const row of data ?? []) {
        const metadata = row.metadata && typeof row.metadata === 'object'
          ? row.metadata as Record<string, unknown>
          : {};
        if (metadata.staff_preview === true) continue;
        const scope = scopeByConversation.get(row.conversation_id);
        if (!scope) continue;
        const inbound = row.role === 'user';
        const eventType = row.channel === 'telegram'
          ? (inbound ? 'telegram.inbound' : 'telegram.outbound')
          : (inbound ? 'chat.user' : 'chat.kia');
        pendingEvents.push({
          subjectId: subject.id,
          eventType,
          occurredAt: row.created_at,
          sourceKey: `kia-message:${row.id}`,
          title: row.channel === 'telegram' ? 'Telegram KIA' : 'Chat KIA',
          summary: String(row.body ?? '').slice(0, 600),
          sourceTable: 'kia_conversation_messages',
          sourceId: row.id,
          sourceRef: `kia-conversation:${row.conversation_id}`,
          channel: row.channel,
          direction: inbound ? 'in' : 'out',
          clientId,
          companyId: scope.companyId,
          caseId: scope.caseId ?? (typeof metadata.case_id === 'string' ? metadata.case_id : null),
          importance: 1,
        });
      }
    })());
  }

  if (email) {
    jobs.push((async () => {
      const { data, error } = await admin.from('email_inbox_cache')
        .select('thread_id,subject,snippet,date,case_id')
        .eq('from_email', email)
        .order('date', { ascending: false })
        .limit(100);
      if (error) throw error;
      for (const row of data ?? []) {
        pendingEvents.push({
          subjectId: subject.id,
          eventType: 'email.inbound',
          occurredAt: row.date,
          sourceKey: `email-in:${row.thread_id}:${row.date}`,
          title: row.subject,
          summary: row.snippet,
          sourceTable: 'email_inbox_cache',
          sourceId: row.thread_id,
          sourceRef: `gmail-thread:${row.thread_id}`,
          channel: 'email',
          direction: 'in',
          clientId,
          leadId,
          caseId: row.case_id,
          importance: 2,
        });
      }
    })());

    jobs.push((async () => {
      const { data, error } = await admin.from('email_events')
        .select('id,event_type,subject,status,created_at,metadata')
        .eq('recipient_email', email)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      for (const row of data ?? []) {
        const metadata = row.metadata && typeof row.metadata === 'object'
          ? row.metadata as Record<string, unknown>
          : {};
        pendingEvents.push({
          subjectId: subject.id,
          eventType: 'email.outbound',
          occurredAt: row.created_at,
          sourceKey: `email-out:${row.id}`,
          title: row.subject ?? row.event_type,
          summary: row.status,
          sourceTable: 'email_events',
          sourceId: String(row.id),
          sourceRef: typeof metadata.email_event_ref === 'string' ? metadata.email_event_ref : null,
          channel: 'email',
          direction: 'out',
          clientId,
          leadId,
          caseId: typeof metadata.case_id === 'string' ? metadata.case_id : null,
          importance: 1,
        });
      }
    })());
  }

  const settled = await Promise.allSettled(jobs);
  const rejected = settled.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
  if (rejected.length) {
    const first = rejected[0]?.reason;
    throw first instanceof Error ? first : new Error('client_registry_reconciliation_partial_failure');
  }
  await appendEvents(admin, pendingEvents);
  return refreshClientRegistrySnapshot(admin, subject.id, subject.lifecycleStage);
}

async function refreshClientRegistrySnapshot(
  admin: AdminClient,
  subjectId: string,
  lifecycleStage: string,
): Promise<KiaClientLedgerContext> {
  const { data: events, error } = await admin.from('client_registry_events')
    .select('event_type,occurred_at,title,summary,channel,direction,case_id,company_id,importance,source_ref')
    .eq('subject_id', subjectId)
    .order('occurred_at', { ascending: false })
    .limit(80);
  if (error) throw error;

  const rows = events ?? [];
  const recent = rows.slice(0, 24);
  const important = rows.filter((row) => Number(row.importance ?? 0) >= 2).slice(0, 10);
  const summaryText = important
    .map((row) => `${row.occurred_at.slice(0, 10)} · ${row.title ?? row.event_type}${row.summary ? ` · ${row.summary}` : ''}`)
    .join('\n')
    .slice(0, 7000);
  const now = new Date().toISOString();

  const latestCaseEvent = new Map<string, string>();
  const caseLifecycleEvents = new Set(['case.opened', 'case.status_changed', 'case.closed']);
  for (const row of rows) {
    if (row.case_id && caseLifecycleEvents.has(row.event_type) && !latestCaseEvent.has(row.case_id)) {
      latestCaseEvent.set(row.case_id, row.event_type);
    }
  }
  const activeCaseIds = [...latestCaseEvent.entries()]
    .filter(([, eventType]) => eventType !== 'case.closed')
    .map(([caseId]) => caseId);

  const snapshot = {
    recent_event_types: recent.map((row) => row.event_type),
    active_case_ids: activeCaseIds,
    company_ids: [...new Set(recent.map((row) => row.company_id).filter(Boolean))],
    last_contact_at: recent.find((row) => row.channel === 'email' || row.channel === 'meeting')?.occurred_at ?? null,
    important_events: important.map((row) => ({
      event_type: row.event_type,
      occurred_at: row.occurred_at,
      title: row.title,
      summary: row.summary,
      source_ref: row.source_ref,
    })),
  };

  const { data: current } = await admin.from('client_registry_snapshots')
    .select('version')
    .eq('subject_id', subjectId)
    .maybeSingle();

  const { error: snapshotError } = await admin.from('client_registry_snapshots').upsert({
    subject_id: subjectId,
    as_of: now,
    version: Number(current?.version ?? 0) + 1,
    lifecycle_stage: lifecycleStage,
    summary_text: summaryText,
    snapshot,
    source_event_count: rows.length,
    updated_at: now,
  }, { onConflict: 'subject_id' });
  if (snapshotError) throw snapshotError;

  return {
    subjectId,
    lifecycleStage,
    summaryText,
    asOf: now,
    recentEvents: recent.map((row) => ({
      eventType: row.event_type,
      occurredAt: row.occurred_at,
      title: row.title,
      summary: row.summary,
      channel: row.channel,
      direction: row.direction,
      caseId: row.case_id,
      companyId: row.company_id,
      importance: Number(row.importance ?? 0),
      sourceRef: row.source_ref,
    })),
  };
}

export function formatClientRegistryForPrompt(ledger: KiaClientLedgerContext | null | undefined): string {
  if (!ledger) return '';
  return [
    '<client_registry>',
    `Estado registral: ${ledger.lifecycleStage}. Actualizado: ${ledger.asOf}.`,
    'Cronología resumida verificable (usa tools canónicas para datos vivos exactos):',
    ledger.summaryText || 'Sin eventos relevantes registrados todavía.',
    '</client_registry>',
  ].join('\n');
}
