import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';
import { getAuthorizedBookingEmails } from '@/lib/admin/onboarding-booking-identity';
import { verifyCronRequest } from '@/lib/security/cron';
import {
  applyOperationalGmailLabel,
  getOperationalGmailThread,
  sendOperationalGmailReply,
} from '@/lib/integrations/operational-gmail';
import { runKiaOrchestratedDecision } from '@/lib/ai/kia/kia-orchestrator';
import { appendKiaSignature } from '@/lib/email/kia-signature';
import { maybeAppendKiaContextualCta } from '@/lib/email/kia-contextual-cta';
import type { GmailMessage } from '@/lib/integrations/gmail';
import { notifyAdmins } from '@/lib/integrations/push';
import { getKiaProviderOrder, isKiaGatewayConfigured } from '@/lib/ai/kia/kia-provider-router';
import { classifyInboundEnvelope, humanPriority } from '@/lib/email/kia-inbox-classifier';
import { notifyKiaAdminEscalation } from '@/lib/admin/kia-admin-escalation';
import { resolveKiaOperationalCategory, type KiaOperationalCategory } from '@/lib/ai/kia/kia-operational-routing';
import { getEmailManualLock } from '@/lib/admin/operations-360-email-control';

export const maxDuration = 60;

const EXPERT_MAILBOX = 'info@expertconsulting.es';
const KNOWN_CONTACT_TOOLS = [
  'get_client_profile',
  'get_case_status',
  'get_case_tasks',
  'get_case_documents',
  'get_case_timeline',
  'get_client_communications',
  'get_service_operational_blueprint',
  'get_holded_connection_status',
  'get_company_status_snapshot',
  'get_accounting_snapshot',
  'get_holded_invoices',
  'get_holded_contacts',
  'get_holded_bank_balance',
  'get_accounts_receivable',
  'get_accounts_payable',
  'get_overdue_invoices',
  'get_unreconciled_transactions',
  'get_holded_employees',
  'get_holded_employee_contract',
  'get_holded_payslips',
  'get_holded_salary_records',
  'run_labor_payroll_diagnostics',
  'search_knowledge_resources',
  'get_official_sources',
  'find_relevant_services',
  'get_service_registry_item',
  'get_booking_availability',
  'create_booking_meeting',
] as const;

const PUBLIC_PROSPECT_TOOLS = [
  'search_knowledge_resources',
  'get_official_sources',
  'find_relevant_services',
  'get_service_registry_item',
  'get_booking_availability',
  'create_booking_meeting',
] as const;

function stateKey(threadId: string) {
  return `kia_email_agent:${createHash('sha256').update(threadId).digest('hex').slice(0, 32)}`;
}

function messageText(body: string, bodyType: 'html' | 'text') {
  if (bodyType === 'text') return body.trim().slice(0, 12000);
  return body
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000);
}

function latestReplyText(body: string, bodyType: 'html' | 'text') {
  if (bodyType === 'html') {
    const unquotedHtml = body
      .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, ' ')
      .replace(/<div[^>]*class=["'][^"']*gmail_quote[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, ' ');
    return messageText(unquotedHtml, 'html').slice(0, 4000);
  }

  const lines = body.split(/\r?\n/);
  const kept: string[] = [];
  for (const line of lines) {
    if (/^\s*>/.test(line)) continue;
    if (/^\s*(?:On .+ wrote:|El .+ escribi[oó]:|De:\s|From:\s|Enviado:\s|Sent:\s)/i.test(line)) break;
    if (/^\s*-{2,}\s*(?:Original Message|Mensaje original)\s*-{2,}/i.test(line)) break;
    kept.push(line);
  }
  return kept.join('\n').trim().slice(0, 4000);
}

function htmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function replyHtml(text: string) {
  return text
    .split(/\n{2,}/)
    .map((part) => `<p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#07111d;">${htmlEscape(part).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function normalizedEmail(email: string) {
  return email.trim().toLowerCase();
}

function hasLiveOutboundReplyAfterInbound(messages: GmailMessage[], inbound: GmailMessage): boolean {
  const inboundAt = Date.parse(inbound.date);
  if (!Number.isFinite(inboundAt)) return false;
  return messages.some((message) =>
    normalizedEmail(message.fromEmail) === EXPERT_MAILBOX
    && message.id !== inbound.id
    && Number.isFinite(Date.parse(message.date))
    && Date.parse(message.date) > inboundAt
  );
}

function replyFromForPurpose(purpose: ReturnType<typeof classifyInboundEnvelope>['recipientPurpose']): string {
  const aliasesEnabled = process.env.KIA_EMAIL_SEND_AS_ALIASES_ENABLED?.trim().toLowerCase() === 'true';
  if (!aliasesEnabled) return 'KIA · EXPERT <info@expertconsulting.es>';

  switch (purpose) {
    case 'kia': return 'KIA · EXPERT <kia@expertconsulting.es>';
    case 'documents': return 'KIA · Documentación <documentos@expertconsulting.es>';
    case 'appointments': return 'KIA · Citas <citas@expertconsulting.es>';
    case 'billing': return 'KIA · Facturación <facturacion@expertconsulting.es>';
    default: return 'KIA · EXPERT <info@expertconsulting.es>';
  }
}

function isLikelyHuman(message: GmailMessage) {
  const email = normalizedEmail(message.fromEmail);
  const local = email.split('@')[0] ?? '';
  if (!email || email === EXPERT_MAILBOX) return false;
  if (/@expertconsulting\.es$/i.test(email)) return false;
  if (/^(no-?reply|do-?not-?reply|notifications?|mailer-daemon|postmaster|bounce|alerts?)\b/i.test(local)) return false;
  if (message.autoSubmitted && message.autoSubmitted.toLowerCase() !== 'no') return false;
  if (message.precedence && /^(bulk|list|junk)$/i.test(message.precedence.trim())) return false;
  if (message.listUnsubscribe) return false;
  const labels = new Set(message.labelIds ?? []);
  if (labels.has('CATEGORY_PROMOTIONS') || labels.has('CATEGORY_SOCIAL') || labels.has('CATEGORY_FORUMS')) return false;
  return true;
}

function isSafeUnknownProspect(subject: string, text: string) {
  const signal = `${subject} ${text}`.toLowerCase();
  const explicitCommercialRequest =
    /\b(solicit(?:o|amos)|ped(?:imos|ir)|quer(?:emos|ría|ria)|necesit(?:o|amos)|busc(?:o|amos)|interesad[oa]s?|contratar|cambiar(?:nos)?\s+(?:de\s+)?(?:asesor[ií]a|gestor[ií]a)|presupuesto|precio|tarifa|propuesta|demo|reservar\s+(?:una\s+)?(?:cita|reuni[oó]n))\b/i.test(signal);
  const expertServiceIntent =
    /\b(asesor[ií]a|gestor[ií]a|gesti[oó]n\s+fiscal|contabilidad|impuestos|holded|aut[oó]nom[oa]s?|sociedad(?:es)?|\bsl\b|migraci[oó]n\s+(?:a\s+)?holded|cuentas\s+anuales|modelo(?:s)?\s+trimestral)/i.test(signal);
  return explicitCommercialRequest && expertServiceIntent;
}

function adminThreadUrl(threadId: string) {
  return `/admin/correo/hilo?provider=gmail&conversationId=${encodeURIComponent(threadId)}`;
}

type EscalationClaimState = 'claimed' | 'completed' | 'inflight';

function escalationClaimKey(eventRef: string) {
  return `kia_email_escalation:${createHash('sha256').update(eventRef).digest('hex').slice(0, 40)}`;
}

async function reserveEscalationClaim(
  admin: ReturnType<typeof getSupabaseAdmin>,
  eventRef: string,
): Promise<{ state: EscalationClaimState; key: string }> {
  const claimKey = escalationClaimKey(eventRef);
  const now = new Date();
  const { error } = await admin.from('system_kv').insert({
    key: claimKey,
    value: { state: 'reserved', event_ref: eventRef, reserved_at: now.toISOString() },
    updated_at: now.toISOString(),
  });
  if (!error) return { state: 'claimed', key: claimKey };
  if (error.code !== '23505') throw error;

  const { data: existing, error: lookupError } = await admin
    .from('system_kv')
    .select('value')
    .eq('key', claimKey)
    .maybeSingle();
  if (lookupError) throw lookupError;
  const value = existing?.value as Record<string, unknown> | null;
  if (value?.state === 'sent') return { state: 'completed', key: claimKey };

  const reservedAt = typeof value?.reserved_at === 'string' ? Date.parse(value.reserved_at) : Number.NaN;
  if (Number.isFinite(reservedAt) && now.getTime() - reservedAt < 15 * 60_000) {
    return { state: 'inflight', key: claimKey };
  }

  const { error: deleteError } = await admin.from('system_kv').delete().eq('key', claimKey);
  if (deleteError) throw deleteError;
  const { error: retryError } = await admin.from('system_kv').insert({
    key: claimKey,
    value: { state: 'reserved', event_ref: eventRef, reserved_at: now.toISOString(), retry: true },
    updated_at: now.toISOString(),
  });
  if (retryError) {
    if (retryError.code === '23505') return { state: 'inflight', key: claimKey };
    throw retryError;
  }
  return { state: 'claimed', key: claimKey };
}

async function completeEscalationClaim(
  admin: ReturnType<typeof getSupabaseAdmin>,
  claimKey: string,
  eventRef: string,
) {
  const { error } = await admin.from('system_kv').update({
    value: { state: 'sent', event_ref: eventRef, sent_at: new Date().toISOString() },
    updated_at: new Date().toISOString(),
  }).eq('key', claimKey);
  if (error) throw error;
}

async function releaseEscalationClaim(
  admin: ReturnType<typeof getSupabaseAdmin>,
  claimKey: string,
) {
  const { error } = await admin.from('system_kv').delete().eq('key', claimKey);
  if (error) console.error('[kia-email-agent] escalation claim release failed:', error.message);
}

function senderDisplayName(message: GmailMessage) {
  const raw = message.from.trim();
  const bracket = raw.match(/^(.+?)\s*<[^>]+>$/);
  const value = (bracket?.[1] ?? raw).replace(/^["']|["']$/g, '').trim();
  return value && value.toLowerCase() !== message.fromEmail.toLowerCase()
    ? value.slice(0, 120)
    : message.fromEmail.split('@')[0].slice(0, 120);
}

async function ensureEmailLead(
  admin: ReturnType<typeof getSupabaseAdmin>,
  message: GmailMessage,
  excerpt: string,
) {
  const email = normalizedEmail(message.fromEmail);
  const escapedEmail = [...email]
    .map((char) => (char === '%' || char === '_' || char === '\\' ? `\\\\${char}` : char))
    .join('');
  const { data: matches, error: lookupError } = await admin
    .from('leads')
    .select('id')
    .ilike('email', escapedEmail)
    .limit(2);
  if (lookupError) throw lookupError;
  if ((matches ?? []).length === 1) return matches![0].id;
  if ((matches ?? []).length > 1) return null;

  const sourceKey = `gmail-email:${createHash('sha256').update(email).digest('hex').slice(0, 40)}`;
  const { data: created, error } = await admin
    .from('leads')
    .insert({
      name: senderDisplayName(message),
      email,
      source: 'email',
      message: excerpt.slice(0, 4000),
      source_key: sourceKey,
      metadata: {
        origin: 'gmail_inbound',
        gmail_message_id: message.id,
        gmail_thread_id: message.conversationId,
        first_subject: message.subject,
      },
    })
    .select('id')
    .single();
  if (!error) return created?.id ?? null;
  if (error.code !== '23505') throw error;

  const { data: raced, error: racedError } = await admin
    .from('leads')
    .select('id')
    .eq('source', 'email')
    .eq('source_key', sourceKey)
    .maybeSingle();
  if (racedError) throw racedError;
  return raced?.id ?? null;
}

async function recordInboundEmailEvent(input: {
  admin: ReturnType<typeof getSupabaseAdmin>;
  message: GmailMessage;
  excerpt: string;
  clientId: string | null;
  leadId: string | null;
  caseId: string | null;
  companyId: string | null;
}) {
  const sourceKey = `gmail-inbound:${input.message.id}`;
  const { error } = await input.admin.from('email_events').insert({
    source_key: sourceKey,
    event_type: 'email.inbound',
    recipient_email: normalizedEmail(input.message.fromEmail),
    subject: input.message.subject || '(sin asunto)',
    html: replyHtml(input.excerpt),
    status: 'delivered',
    metadata: {
      source_key: sourceKey,
      direction: 'in',
      transport: 'gmail',
      gmail_message_id: input.message.id,
      thread_id: input.message.conversationId,
      message_date: input.message.date,
      sender_email: normalizedEmail(input.message.fromEmail),
      client_id: input.clientId,
      lead_id: input.leadId,
      case_id: input.caseId,
      company_id: input.companyId,
    },
  });
  if (!error) return true;
  if (error.code === '23505') return false;
  throw error;
}

async function createEmailRequestTask(input: {
  admin: ReturnType<typeof getSupabaseAdmin>;
  message: GmailMessage;
  excerpt: string;
  clientId: string | null;
  leadId: string | null;
  caseId: string | null;
  companyId: string | null;
  nextAction: string;
  actionSummary: string;
  operationalCategory: KiaOperationalCategory;
}) {
  if (input.nextAction !== 'create_task') return null;

  const actionText = input.actionSummary.trim() || input.message.subject?.trim() || 'Solicitud por correo';
  const normalizedAction = actionText
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .slice(0, 240)
    || (input.message.subject?.trim().normalize('NFKD').replace(/\p{M}+/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().slice(0, 240))
    || input.message.id;
  const scope = input.caseId ?? input.leadId ?? input.clientId ?? normalizedEmail(input.message.fromEmail);
  const actionFingerprint = createHash('sha256')
    .update(`${scope}|${input.nextAction}|${normalizedAction}`)
    .digest('hex')
    .slice(0, 40);
  const taskKey = `email-request:${input.message.id}`;

  const { data: existingAction, error: existingActionError } = await input.admin
    .from('internal_tasks')
    .select('id,title,metadata')
    .in('status', ['pendiente', 'en_progreso'])
    .eq('metadata->>action_fingerprint', actionFingerprint)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingActionError) throw existingActionError;
  if (existingAction?.id) {
    const previousMetadata = (existingAction.metadata ?? {}) as Record<string, unknown>;
    const { data: reused, error: updateError } = await input.admin
      .from('internal_tasks')
      .update({
        description: input.excerpt.slice(0, 1500),
        updated_at: new Date().toISOString(),
        metadata: {
          ...previousMetadata,
          last_gmail_message_id: input.message.id,
          last_gmail_thread_id: input.message.conversationId,
          last_email_seen_at: new Date().toISOString(),
          operational_category: input.operationalCategory,
        },
      })
      .eq('id', existingAction.id)
      .in('status', ['pendiente', 'en_progreso'])
      .select('id,title')
      .maybeSingle();
    if (updateError) throw updateError;
    if (reused?.id) return { id: reused.id, title: reused.title, created: false };
  }

  const { data, error } = await input.admin.from('internal_tasks').insert({
    source_key: taskKey,
    title: actionText.slice(0, 220),
    description: input.excerpt.slice(0, 1500),
    status: 'pendiente',
    priority: 'media',
    case_id: input.caseId,
    client_id: input.clientId,
    lead_id: input.leadId,
    company_id: input.companyId,
    source: 'kia',
    metadata: {
      task_kind: 'email_request',
      source_key: taskKey,
      gmail_message_id: input.message.id,
      gmail_thread_id: input.message.conversationId,
      sender_email: normalizedEmail(input.message.fromEmail),
      action_fingerprint: actionFingerprint,
      action_summary: actionText.slice(0, 500),
    },
  }).select('id,title').single();

  if (!error) return data ? { ...data, created: true } : null;
  if (error.code !== '23505') throw error;

  const { data: existingConflict, error: existingConflictError } = await input.admin
    .from('internal_tasks')
    .select('id,title,metadata')
    .in('status', ['pendiente', 'en_progreso'])
    .eq('metadata->>action_fingerprint', actionFingerprint)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingConflictError) throw existingConflictError;
  if (existingConflict?.id) {
    const previousMetadata = (existingConflict.metadata ?? {}) as Record<string, unknown>;
    const { data: reusedConflict, error: reuseConflictError } = await input.admin
      .from('internal_tasks')
      .update({
        description: input.excerpt.slice(0, 1500),
        updated_at: new Date().toISOString(),
        metadata: {
          ...previousMetadata,
          last_gmail_message_id: input.message.id,
          last_gmail_thread_id: input.message.conversationId,
          last_email_seen_at: new Date().toISOString(),
          operational_category: input.operationalCategory,
        },
      })
      .eq('id', existingConflict.id)
      .in('status', ['pendiente', 'en_progreso'])
      .select('id,title')
      .maybeSingle();
    if (reuseConflictError) throw reuseConflictError;
    if (reusedConflict?.id) return { ...reusedConflict, created: false };
  }

  const { data: existingMessage, error: existingMessageError } = await input.admin
    .from('internal_tasks')
    .select('id,title')
    .eq('source_key', taskKey)
    .maybeSingle();
  if (existingMessageError) throw existingMessageError;
  return existingMessage ? { ...existingMessage, created: false } : null;
}

async function writeAgentHeartbeat(
  admin: ReturnType<typeof getSupabaseAdmin>,
  value: Record<string, unknown>,
) {
  await admin.from('system_kv').upsert({
    key: 'kia_email_agent_health',
    value: { ...value, checked_at: new Date().toISOString() },
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });
}

async function healthGate(admin: ReturnType<typeof getSupabaseAdmin>) {
  const gatewayConfigured = isKiaGatewayConfigured();
  const directProviders = getKiaProviderOrder();
  if (!gatewayConfigured && directProviders.length === 0) {
    return {
      ok: false,
      reason: 'no_ai_provider',
      gatewayConfigured,
      directProviders: [],
    };
  }

  const { error: databaseError } = await admin.from('profiles').select('id').limit(1);
  if (databaseError) {
    return {
      ok: false,
      reason: 'supabase_unavailable',
      gatewayConfigured,
      directProviders: directProviders.map((provider) => provider.provider),
    };
  }

  return {
    ok: true,
    reason: 'communication_stack_ready',
    gatewayConfigured,
    directProviders: directProviders.map((provider) => provider.provider),
  };
}

async function resolveIdentity(
  admin: ReturnType<typeof getSupabaseAdmin>,
  email: string,
  existingCaseId: string | null,
  authUsers: Awaited<ReturnType<typeof listAllAuthUsers>>,
) {
  let caseId = existingCaseId;
  let clientId: string | null = null;
  let leadId: string | null = null;
  let companyId: string | null = null;
  let serviceSlug: string | null = null;
  let ambiguousCase = false;
  let linkedCaseSenderMismatch = false;

  if (caseId) {
    const { data: caseRow } = await admin
      .from('cases')
      .select('id,client_id,company_id,service_id')
      .eq('id', caseId)
      .maybeSingle();

    if (caseRow?.client_id) {
      const authEmail = authUsers.find((user) => user.id === caseRow.client_id)?.email ?? null;
      const authorized = await getAuthorizedBookingEmails(
        admin,
        caseRow.client_id,
        caseRow.company_id,
        authEmail,
      ).catch(() => [] as string[]);

      if (authorized.map(normalizedEmail).includes(email)) {
        clientId = caseRow.client_id;
        companyId = caseRow.company_id ?? null;
        serviceSlug = caseRow.service_id ?? null;
      } else {
        linkedCaseSenderMismatch = true;
        caseId = null;
      }
    } else {
      caseId = null;
    }
  }

  if (!clientId) {
    const matchingUsers = authUsers.filter((user) => normalizedEmail(user.email ?? '') === email);
    if (matchingUsers.length === 1) clientId = matchingUsers[0].id;
  }

  if (!clientId) {
    const { data: leads } = await admin
      .from('leads')
      .select('id')
      .eq('email', email)
      .limit(2);
    if ((leads ?? []).length === 1) leadId = leads![0].id;
  }

  if (clientId && !caseId) {
    const { data: openCases } = await admin
      .from('cases')
      .select('id,company_id,service_id')
      .eq('client_id', clientId)
      .neq('state', 'finalizado')
      .order('opened_at', { ascending: false })
      .limit(3);

    if ((openCases ?? []).length === 1) {
      caseId = openCases![0].id;
      companyId = openCases![0].company_id ?? null;
      serviceSlug = openCases![0].service_id ?? null;
    } else if ((openCases ?? []).length > 1) {
      ambiguousCase = true;
    }
  }

  return {
    clientId,
    leadId,
    caseId,
    companyId,
    serviceSlug,
    ambiguousCase,
    linkedCaseSenderMismatch,
  };
}

export async function GET(request: NextRequest) {
  const cronAuth = verifyCronRequest(request.headers, 'cron/kia-email-agent');
  if (!cronAuth.ok) {
    return NextResponse.json({ error: cronAuth.error }, { status: cronAuth.status });
  }

  const admin = getSupabaseAdmin();
  const [agentSetting, autoSendSetting, newLeadAutoSendSetting] = await Promise.all([
    admin.from('automation_settings').select('enabled,updated_at').eq('key', 'kia.email_agent').maybeSingle(),
    admin.from('automation_settings').select('enabled').eq('key', 'kia.email_auto_send').maybeSingle(),
    admin.from('automation_settings').select('enabled').eq('key', 'kia.email_new_lead_auto_send').maybeSingle(),
  ]);
  const settingsError = agentSetting.error ?? autoSendSetting.error ?? newLeadAutoSendSetting.error;
  if (settingsError) {
    console.error('[kia-email-agent] automation settings unavailable:', settingsError.message);
    await writeAgentHeartbeat(admin, {
      enabled: false,
      auto_send: false,
      new_lead_auto_send: false,
      status: 'degraded',
      reason: 'automation_settings_unavailable',
    }).catch(() => {});
    return NextResponse.json({ error: 'automation_settings_unavailable' }, { status: 503 });
  }

  const enabled = agentSetting.data?.enabled === true;
  const enabledSince = enabled ? agentSetting.data?.updated_at ?? null : null;
  const autoSend = autoSendSetting.data?.enabled === true;
  const newLeadAutoSend = newLeadAutoSendSetting.data?.enabled === true;
  if (!enabled) {
    await writeAgentHeartbeat(admin, {
      enabled: false,
      auto_send: false,
      new_lead_auto_send: false,
      status: 'disabled',
    }).catch(() => {});
    return NextResponse.json({ skipped: true, reason: 'kia.email_agent is disabled' });
  }
  const minConfidence = Number(process.env.KIA_EMAIL_MIN_CONFIDENCE ?? '0.88');
  const prospectMinConfidence = Math.max(minConfidence, Number(process.env.KIA_EMAIL_PROSPECT_MIN_CONFIDENCE ?? '0.92'));
  const health = await healthGate(admin);
  const authUsers = await listAllAuthUsers();

  const inbox: Array<{
    thread_id: string;
    case_id: string | null;
    subject: string | null;
    from_email: string | null;
    date: string;
    unread: boolean;
    snippet: string | null;
  }> = [];
  const pageSize = 200;
  for (let offset = 0; offset < 1000; offset += pageSize) {
    const { data: page, error: inboxError } = await admin
      .from('email_inbox_cache')
      .select('thread_id,case_id,subject,from_email,date,unread,snippet')
      .eq('provider', 'gmail')
      .eq('unread', true)
      .order('date', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (inboxError) {
      return NextResponse.json({ error: 'email_inbox_unavailable' }, { status: 503 });
    }
    inbox.push(...((page ?? []) as typeof inbox));
    if ((page ?? []).length < pageSize) break;
  }

  let evaluated = 0;
  let sent = 0;
  let skipped = 0;
  let liveInspections = 0;
  const maxLiveInspections = 30;
  const errors: Array<{ thread: string; code: string }> = [];

  for (const row of inbox) {
    if (!row.thread_id || !row.date) {
      skipped++;
      continue;
    }

    const key = stateKey(row.thread_id);
    const { data: watermark } = await admin
      .from('system_kv')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    const previous = watermark?.value as Record<string, unknown> | null;

    try {
      if (previous?.last_message_at === row.date) {
        skipped++;
        continue;
      }

      if (liveInspections >= maxLiveInspections) break;
      liveInspections++;
      const gmail = await getOperationalGmailThread(admin, row.thread_id);
      const latest = gmail.messages.at(-1);
      if (!latest || !latest.unread) {
        skipped++;
        continue;
      }
      if (!enabledSince || new Date(latest.date).getTime() < new Date(enabledSince).getTime()) {
        skipped++;
        continue;
      }
      const envelope = classifyInboundEnvelope(latest);
      await applyOperationalGmailLabel(admin, latest.id, envelope.gmailLabel).catch((labelError) => {
        console.error('[kia-email-agent] gmail label:', labelError);
      });

      if (envelope.kind !== 'human') {
        const envelopeOperationalCategory = resolveKiaOperationalCategory({
          envelopeKind: envelope.kind,
          recipientPurpose: envelope.recipientPurpose,
          requiresManualReview: envelope.requiresAttention,
        });
        if (envelope.requiresAttention) {
          const eventRef = `gmail:${latest.id}:operational-escalation`;
          const claim = await reserveEscalationClaim(admin, eventRef);
          if (claim.state === 'inflight') {
            skipped++;
            continue;
          }
          if (claim.state === 'claimed') {
            try {
              await notifyKiaAdminEscalation({
                title: latest.subject || 'Correo operativo importante',
                summary: `${senderDisplayName(latest)} · ${latest.subject || 'Sin asunto'}`,
                actionTaken: `clasificado como ${envelope.kind}, prioridad ${envelope.priority}, y etiquetado ${envelope.gmailLabel}`,
                interventionNeeded: 'revisar el aviso y decidir la actuación correspondiente',
                url: adminThreadUrl(row.thread_id),
                eventRef,
                priority: envelope.priority === 'critical' ? 'critical' : 'high',
              });
              await completeEscalationClaim(admin, claim.key, eventRef);
            } catch (notifyError) {
              await releaseEscalationClaim(admin, claim.key);
              console.error('[kia-email-agent] operational escalation:', notifyError);
              errors.push({ thread: row.thread_id, code: 'operational_escalation_failed' });
              continue;
            }
          }
        }

        await admin.from('system_kv').upsert({
          key,
          value: {
            last_message_id: latest.id,
            last_message_at: latest.date,
            evaluated_at: new Date().toISOString(),
            classification: envelope,
            operational_category: envelopeOperationalCategory,
            block_reason: 'non_human',
            sent: false,
          },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });
        skipped++;
        continue;
      }
      if (previous?.last_message_id === latest.id) {
        if (previous?.last_message_at !== latest.date) {
          await admin.from('system_kv').upsert({
            key,
            value: {
              ...previous,
              last_message_id: latest.id,
              last_message_at: latest.date,
              watermark_version: 2,
              evaluated_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          }, { onConflict: 'key' });
        }
        skipped++;
        continue;
      }

      const text = messageText(latest.body, latest.bodyType);
      const latestReply = latestReplyText(latest.body, latest.bodyType);
      if (!text || !latestReply) {
        skipped++;
        continue;
      }

      const senderEmail = normalizedEmail(latest.fromEmail);
      const replyRecipient = normalizedEmail(latest.replyTo || latest.fromEmail);
      const replyToMismatch = replyRecipient !== senderEmail;
      let identity = await resolveIdentity(admin, senderEmail, row.case_id ?? null, authUsers);
      const wasKnownContact = Boolean(identity.clientId || identity.leadId);
      const safeUnknownProspect = !wasKnownContact && !row.case_id
        && isSafeUnknownProspect(latest.subject, latestReply);
      if (!wasKnownContact && !row.case_id) {
        const leadId = await ensureEmailLead(admin, latest, latestReply).catch((leadError) => {
          console.error('[kia-email-agent] lead creation:', leadError);
          return null;
        });
        if (leadId) identity = { ...identity, leadId };
      }

      const firstInboundProcessing = await recordInboundEmailEvent({
        admin,
        message: latest,
        excerpt: latestReply,
        clientId: identity.clientId,
        leadId: identity.leadId,
        caseId: identity.caseId,
        companyId: identity.companyId,
      }).catch((auditError) => {
        console.error('[kia-email-agent] inbound audit:', auditError);
        return false;
      });

      const manualLock = await getEmailManualLock(admin, row.thread_id);
      if (manualLock) {
        await admin.from('system_kv').upsert({
          key,
          value: {
            ...previous,
            mode: 'manual',
            last_message_id: latest.id,
            last_message_at: latest.date,
            evaluated_at: new Date().toISOString(),
            client_id: identity.clientId,
            lead_id: identity.leadId,
            case_id: identity.caseId,
            company_id: identity.companyId,
            block_reason: 'manual_takeover',
            sent: false,
            manual_lock_task_id: manualLock.id,
          },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });

        if (firstInboundProcessing) {
          await notifyKiaAdminEscalation({
            title: latest.subject || 'Correo en control manual',
            summary: `${senderDisplayName(latest)} · nuevo mensaje en hilo tomado por Admin`,
            actionTaken: 'registró el correo y mantuvo bloqueada la respuesta automática de KIA',
            interventionNeeded: 'responder desde Correo 360 o devolver el hilo a KIA',
            url: adminThreadUrl(row.thread_id),
            eventRef: `gmail:${latest.id}:manual-takeover`,
            priority: 'high',
          }).catch((notifyError) => console.error('[kia-email-agent] manual takeover alert:', notifyError));
        }

        skipped++;
        continue;
      }

      if (firstInboundProcessing && !wasKnownContact && identity.leadId) {
        await notifyAdmins({
          title: 'Nuevo lead por email',
          body: `${senderDisplayName(latest)} · ${latest.subject || 'Sin asunto'}`.slice(0, 240),
          url: `/admin/leads?focus=${identity.leadId}`,
          tag: `kia-email-new-lead-${identity.leadId}`,
        }).catch(() => {});
      }

      const recent = gmail.messages.slice(-10).map((message) => ({
        role: normalizedEmail(message.fromEmail) === EXPERT_MAILBOX ? 'assistant' as const : 'user' as const,
        text: messageText(message.body, message.bodyType).slice(0, 4000),
        createdAt: message.date,
      }));

      const hasAttachments = latest.attachments.some((attachment) => !attachment.inline);
      const confidenceFloor = wasKnownContact ? minConfidence : prospectMinConfidence;
      const { data: companyOperationalControls, error: companyOperationalControlsError } = identity.companyId
        ? await admin.from('company_operational_controls')
            .select('external_communication_blocked')
            .eq('company_id', identity.companyId)
            .maybeSingle()
        : { data: null, error: null };
      if (companyOperationalControlsError) throw companyOperationalControlsError;
      const externalCommunicationBlocked = Boolean(companyOperationalControls?.external_communication_blocked);
      const externalActionPreEligible = autoSend
        && health.ok
        && (wasKnownContact || (safeUnknownProspect && newLeadAutoSend))
        && !identity.ambiguousCase
        && !identity.linkedCaseSenderMismatch
        && !replyToMismatch
        && !externalCommunicationBlocked
        && envelope.recipientPurpose !== 'noreply'
        && !hasAttachments;
      const baseAllowedTools = wasKnownContact ? KNOWN_CONTACT_TOOLS : PUBLIC_PROSPECT_TOOLS;
      const allowedTools = baseAllowedTools.filter(
        (toolName) => toolName !== 'create_booking_meeting' || externalActionPreEligible,
      );

      const result = await runKiaOrchestratedDecision({
        input: {
          taskType: 'chat_reply',
          channel: 'email',
          message: latestReply,
          locale: /[А-Яа-яЁё]/.test(text) ? 'ru' : 'es',
          contextInput: {
            channel: 'email',
            clientId: identity.clientId ?? undefined,
            leadId: identity.leadId ?? undefined,
            caseId: identity.caseId ?? undefined,
            companyId: identity.companyId ?? undefined,
            serviceSlug: identity.serviceSlug ?? undefined,
            email: latest.fromEmail,
            latestMessage: latestReply,
            syntheticRecentMessages: recent,
            originEmail: {
              ref: latest.id,
              eventType: 'email.inbound',
              subject: latest.subject,
              excerpt: latestReply.slice(0, 1500),
            },
          },
          allowTools: true,
          forceToolExecution: true,
          allowedToolNames: [...allowedTools],
          toolAuthorization: {
            maxRiskTier: 'R2',
            allowedEffects: ['read', 'external_action'],
            autonomousOnly: false,
          },
          externalActionMinConfidence: confidenceFloor,
        },
        policyAuthorization: {
          channel: 'email',
          requestedNames: [...allowedTools],
          maxRiskTier: 'R2',
          allowedEffects: ['read', 'external_action'],
          autonomousOnly: false,
        },
        policyToolNames: [...allowedTools],
      });
      const operationalCategory = resolveKiaOperationalCategory({
        skillId: result.executionTrace.skillId,
        subAgentId: result.executionTrace.preferredSubAgentId,
        detectedIntent: result.executionTrace.detectedIntent ?? result.decision.intent,
        serviceSlug: identity.serviceSlug,
        recipientPurpose: envelope.recipientPurpose,
        envelopeKind: envelope.kind,
        requiresManualReview: result.decision.requiresManualReview || result.decision.nextAction === 'needs_review',
      });

      const taskEligible = (identity.clientId || identity.leadId)
        && !result.executionTrace.lateClassificationFailClosed
        && !identity.ambiguousCase
        && !identity.linkedCaseSenderMismatch
        && !replyToMismatch
        && !result.usedFallback
        && !result.decision.requiresManualReview
        && result.decision.nextAction !== 'needs_review'
        && result.decision.confidence >= confidenceFloor;
      const createdTask = taskEligible
        ? await createEmailRequestTask({
            admin,
            message: latest,
            excerpt: latestReply,
            clientId: identity.clientId,
            leadId: identity.leadId,
            caseId: identity.caseId,
            companyId: identity.companyId,
            nextAction: result.decision.nextAction,
            actionSummary: result.decision.decisionSummary,
            operationalCategory,
          }).catch((taskError) => {
            console.error('[kia-email-agent] request task:', taskError);
            return null;
          })
        : null;
      if (createdTask?.created) {
        await notifyAdmins({
          title: 'KIA creó una tarea',
          body: `${createdTask.title} · ${senderDisplayName(latest)}`.slice(0, 240),
          url: identity.caseId ? `/admin/expedientes/${identity.caseId}` : '/admin/tareas',
          tag: `kia-email-task-${createdTask.id}`,
        }).catch(() => {});
      }

      const canAutoSend = autoSend
        && health.ok
        && !result.executionTrace.lateClassificationFailClosed
        && (wasKnownContact || (safeUnknownProspect && newLeadAutoSend))
        && !identity.ambiguousCase
        && !identity.linkedCaseSenderMismatch
        && !replyToMismatch
        && !externalCommunicationBlocked
        && envelope.recipientPurpose !== 'noreply'
        && !hasAttachments
        && !result.usedFallback
        && !result.decision.requiresManualReview
        && result.decision.nextAction !== 'needs_review'
        && result.decision.confidence >= confidenceFloor;

      let sentNow = false;
      let duplicateClaim = false;
      let blockReason: string | null = null;

      if (canAutoSend) {
        const livePreSendThread = await getOperationalGmailThread(admin, row.thread_id);
        const liveAlreadyAnswered = hasLiveOutboundReplyAfterInbound(livePreSendThread.messages, latest);
        if (liveAlreadyAnswered) {
          blockReason = 'live_thread_already_answered';
          await admin.from('system_kv').upsert({
            key: `kia_email_live_check:${createHash('sha256').update(`${row.thread_id}:${latest.id}`).digest('hex').slice(0, 40)}`,
            value: {
              check: 'live_gmail_pre_send_check',
              state: 'blocked',
              reason: blockReason,
              inbound_message_id: latest.id,
              checked_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          }, { onConflict: 'key' });
        } else {
        const baseHtml = replyHtml(result.userMessage);
        const metadata: Record<string, unknown> = {
          kia_author: true,
          preferred_language: /[А-Яа-яЁё]/.test(text) ? 'ru' : 'es',
          event_type: 'kia.email.auto_reply',
          email_subject: latest.subject,
          email_event_ref: `gmail:${latest.id}`,
          client_id: identity.clientId,
          lead_id: identity.leadId,
          case_id: identity.caseId,
          company_id: identity.companyId,
          service_slug: identity.serviceSlug,
          operational_category: operationalCategory,
          skill_id: result.executionTrace.skillId,
          sub_agent_id: result.executionTrace.preferredSubAgentId,
          detected_intent: result.executionTrace.detectedIntent,
        };
        const contextual = await maybeAppendKiaContextualCta({
          admin,
          recipients: [replyRecipient],
          html: baseHtml,
          metadata,
        });
        const html = appendKiaSignature(contextual.html, contextual.metadata ?? metadata);
        const replySubject = /^re:/i.test(latest.subject) ? latest.subject : `Re: ${latest.subject}`;
        const sendClaimKey = `kia_email_send:${createHash('sha256')
          .update(`${row.thread_id}:${latest.id}`)
          .digest('hex')
          .slice(0, 40)}`;
        const { error: claimError } = await admin.from('system_kv').insert({
          key: sendClaimKey,
          value: {
            state: 'reserved',
            thread_hash: key.split(':')[1],
            message_id: latest.id,
            reserved_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        });

        if (claimError) {
          if (claimError.code === '23505') {
            duplicateClaim = true;
            blockReason = 'already_claimed';
          } else {
            throw claimError;
          }
        } else {
          let authMode: 'service_account' | 'oauth';
          try {
            authMode = await sendOperationalGmailReply(admin, {
              threadId: row.thread_id,
              to: replyRecipient,
              subject: replySubject,
              body: html,
              bodyHtml: true,
              from: replyFromForPurpose(envelope.recipientPurpose),
            });
          } catch (sendError) {
            await admin.from('system_kv').update({
              value: {
                state: 'uncertain_failure',
                thread_hash: key.split(':')[1],
                message_id: latest.id,
                failed_at: new Date().toISOString(),
                error: sendError instanceof Error ? sendError.message.slice(0, 240) : 'unknown_send_error',
              },
              updated_at: new Date().toISOString(),
            }).eq('key', sendClaimKey);
            throw sendError;
          }

          const { error: eventError } = await admin.from('email_events').insert({
          event_type: 'kia.email.auto_reply',
          recipient_email: replyRecipient,
          subject: replySubject,
          html,
          status: 'sent',
          metadata: {
            ...(contextual.metadata ?? metadata),
            transport: 'gmail',
            auth_mode: authMode,
            decision_log_id: result.decisionLogId ?? null,
            inbound_message_id: latest.id,
            thread_id: row.thread_id,
            direction: 'out',
          },
          });
          if (eventError) {
            console.error('[kia-email-agent] email event audit:', eventError);
          }
          await admin.from('system_kv').update({
            value: {
              state: 'sent',
              thread_hash: key.split(':')[1],
              message_id: latest.id,
              sent_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          }).eq('key', sendClaimKey);
          sent++;
          sentNow = true;
        }
        }
      } else {
        if (result.executionTrace.lateClassificationFailClosed) blockReason = 'orchestration_requires_review';
        else if (!autoSend) blockReason = 'auto_send_disabled';
        else if (!health.ok) blockReason = health.reason;
        else if (!wasKnownContact && !safeUnknownProspect) blockReason = 'unknown_contact_not_safe_prospect';
        else if (!wasKnownContact && safeUnknownProspect && !newLeadAutoSend) blockReason = 'new_lead_approval_required';
        else if (identity.ambiguousCase) blockReason = 'ambiguous_case';
        else if (identity.linkedCaseSenderMismatch) blockReason = 'linked_case_sender_mismatch';
        else if (externalCommunicationBlocked) blockReason = 'company_external_communication_blocked';
        else if (replyToMismatch) blockReason = 'reply_to_requires_review';
        else if (envelope.recipientPurpose === 'noreply') blockReason = 'noreply_recipient';
        else if (hasAttachments) blockReason = 'attachment_requires_review';
        else if (result.usedFallback) blockReason = 'provider_fallback';
        else if (result.decision.requiresManualReview) blockReason = 'manual_review';
        else if (result.decision.nextAction === 'needs_review') blockReason = 'needs_review';
        else if (result.decision.confidence < confidenceFloor) blockReason = 'low_confidence';
        else blockReason = 'policy_block';
      }

      if (duplicateClaim) {
        skipped++;
        continue;
      }

      const priority = humanPriority({
        knownClient: Boolean(identity.clientId),
        knownLead: Boolean(identity.leadId),
        safeProspect: safeUnknownProspect,
        requiresManualReview: result.decision.requiresManualReview,
        nextAction: result.decision.nextAction,
        blockReason,
        createdTask: Boolean(createdTask),
        sent: sentNow,
      });
      const interventionRequired = result.decision.requiresManualReview
        || result.decision.nextAction === 'needs_review'
        || ['orchestration_requires_review', 'ambiguous_case', 'linked_case_sender_mismatch', 'reply_to_requires_review', 'attachment_requires_review', 'provider_fallback']
          .includes(blockReason ?? '');

      if (firstInboundProcessing && interventionRequired) {
        await notifyKiaAdminEscalation({
          title: latest.subject || 'Correo de cliente',
          summary: `${senderDisplayName(latest)} · ${identity.clientId ? 'cliente' : identity.leadId ? 'lead' : 'nuevo contacto'}`,
          actionTaken: createdTask
            ? `analizó el correo y creó la tarea “${createdTask.title}”`
            : 'analizó el correo, vinculó el contexto disponible y preparó una respuesta sin enviarla',
          interventionNeeded: blockReason
            ? `resolver bloqueo: ${blockReason}`
            : 'revisar y aprobar la actuación propuesta',
          url: adminThreadUrl(row.thread_id),
          eventRef: `gmail:${latest.id}:human-escalation`,
          priority: 'high',
        }).catch((notifyError) => console.error('[kia-email-agent] human escalation:', notifyError));
      } else if (firstInboundProcessing && priority === 'high' && !createdTask) {
        await notifyAdmins({
          title: sentNow ? 'KIA atendió una novedad importante' : 'KIA detectó una novedad importante',
          body: [
            senderDisplayName(latest),
            sentNow ? 'respondió automáticamente' : null,
            latest.subject || 'Sin asunto',
          ].filter(Boolean).join(' · ').slice(0, 240),
          url: adminThreadUrl(row.thread_id),
          tag: `kia-important-${createHash('sha256').update(latest.id).digest('hex').slice(0, 20)}`,
        }).catch(() => {});
      }

      await admin.from('system_kv').upsert({
        key,
        value: {
          mode: sentNow ? 'auto' : 'shadow',
          last_message_id: latest.id,
          last_message_at: latest.date,
          thread_hash: key.split(':')[1],
          from_hash: createHash('sha256').update(normalizedEmail(latest.fromEmail)).digest('hex').slice(0, 16),
          evaluated_at: new Date().toISOString(),
          client_id: identity.clientId,
          lead_id: identity.leadId,
          case_id: identity.caseId,
          company_id: identity.companyId,
          ambiguous_case: identity.ambiguousCase,
          has_attachments: hasAttachments,
          health_gate: health,
          confidence: result.decision.confidence,
          requires_manual_review: result.decision.requiresManualReview,
          next_action: result.decision.nextAction,
          proposed_reply: result.userMessage,
          decision_log_id: result.decisionLogId ?? null,
          block_reason: blockReason,
          sent: sentNow,
          inbox_classification: envelope,
          operational_category: operationalCategory,
          skill_id: result.executionTrace.skillId,
          sub_agent_id: result.executionTrace.preferredSubAgentId,
          detected_intent: result.executionTrace.detectedIntent,
          priority,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

      evaluated++;
    } catch (error) {
      const errorCode = error instanceof Error ? error.message.slice(0, 160) : 'unknown_error';
      errors.push({
        thread: createHash('sha256').update(row.thread_id).digest('hex').slice(0, 12),
        code: errorCode,
      });
    }
  }

  await writeAgentHeartbeat(admin, {
    enabled: true,
    enabled_since: enabledSince,
    auto_send: autoSend,
    new_lead_auto_send: newLeadAutoSend,
    status: errors.length === 0 ? 'ok' : 'degraded',
    health_gate: health,
    evaluated,
    sent,
    skipped,
    errors_count: errors.length,
  }).catch(() => {});

  return NextResponse.json({
    ok: errors.length === 0,
    mode: autoSend ? 'guarded_auto' : 'shadow',
    health,
    evaluated,
    sent,
    skipped,
    errors,
  });
}
