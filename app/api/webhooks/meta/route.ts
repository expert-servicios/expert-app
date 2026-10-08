import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { ensureInboundLead } from '@/lib/leads/ensure-inbound-lead';
import {
  isMetaWebhookSignatureValid,
  parseMetaWebhookPayload,
  verifyMetaWebhookChallenge,
  type MetaInboundEvent,
} from '@/lib/integrations/meta/webhook';
import { notifyAdmins } from '@/lib/integrations/push';
import { retrieveMetaLead, normalizeMetaLeadFields } from '@/lib/integrations/meta/client';
import { runKiaOrchestratedDecision } from '@/lib/ai/kia/kia-orchestrator';
import { checkKiaLeadDailyCostCap, checkKiaMessageRateLimit } from '@/lib/ai/kia/kia-rate-limit';
import { resolveKiaOperationalCategory } from '@/lib/ai/kia/kia-operational-routing';
import { materializeKiaOperationalTask } from '@/lib/admin/kia-operational-task';
import {
  appendKiaConversationMessage,
  getKiaConversationControlMode,
  getOrCreateKiaLeadConversation,
} from '@/lib/ai/kia/kia-conversation-store';

function claimKey(event: MetaInboundEvent) {
  return `meta_inbound:${event.channel}:${event.eventId}`;
}

async function claimMetaEvent(admin: ReturnType<typeof getSupabaseAdmin>, event: MetaInboundEvent) {
  const key = claimKey(event);
  const { error } = await admin.from('system_kv').insert({
    key,
    value: {
      status: 'processing',
      channel: event.channel,
      event_id: event.eventId,
      received_at: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  });

  if (!error) return { claimed: true, key };
  if (error.code === '23505') return { claimed: false, key };
  throw error;
}

async function recordMetaLedger(
  admin: ReturnType<typeof getSupabaseAdmin>,
  event: MetaInboundEvent,
  status: 'success' | 'failed' | 'skipped',
  localId?: string | null,
  errorMessage?: string | null,
) {
  const { error } = await admin.from('integration_sync_events').insert({
    provider: 'meta',
    direction: 'from_external',
    operation: `meta.${event.channel}.inbound`,
    local_entity: event.channel === 'leadgen' ? 'lead' : 'lead',
    local_id: localId ?? null,
    external_entity: event.channel,
    external_id: event.eventId,
    status,
    request_payload: null,
    response_payload: null,
    error: errorMessage ?? null,
    metadata: {
      channel: event.channel,
      object: event.object,
      sender_id: event.senderId,
      recipient_id: event.recipientId,
      message_id: event.messageId,
      leadgen_id: event.leadgenId,
      attachments_count: event.attachmentsCount,
      event_timestamp: event.timestamp,
      ...event.metadata,
    },
  });
  if (error) console.error('[Meta webhook] ledger write failed:', error.message);
}

async function finalizeClaim(
  admin: ReturnType<typeof getSupabaseAdmin>,
  key: string,
  event: MetaInboundEvent,
  status: 'success' | 'failed' | 'skipped',
  localId?: string | null,
) {
  const { error } = await admin
    .from('system_kv')
    .update({
      value: {
        status,
        channel: event.channel,
        event_id: event.eventId,
        local_id: localId ?? null,
        processed_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('key', key);
  if (error) console.error('[Meta webhook] claim finalize failed:', error.message);
}

async function persistMetaKiaAssessment(
  admin: ReturnType<typeof getSupabaseAdmin>,
  leadId: string,
  assessment: Record<string, unknown>,
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: current, error: currentError } = await admin
      .from('leads')
      .select('metadata,updated_at')
      .eq('id', leadId)
      .single();
    if (currentError) throw currentError;

    const metadata = current.metadata && typeof current.metadata === 'object' && !Array.isArray(current.metadata)
      ? current.metadata as Record<string, unknown>
      : {};
    const nextUpdatedAt = new Date().toISOString();

    let update = admin
      .from('leads')
      .update({
        metadata: { ...metadata, ...assessment },
        updated_at: nextUpdatedAt,
      })
      .eq('id', leadId);

    update = current.updated_at
      ? update.eq('updated_at', current.updated_at)
      : update.is('updated_at', null);

    const { data: updated, error } = await update.select('id').maybeSingle();
    if (error) throw error;
    if (updated?.id) return;
  }
  throw new Error('meta_kia_assessment_concurrency_retry_exhausted');
}

async function processMessagingEvent(
  admin: ReturnType<typeof getSupabaseAdmin>,
  event: MetaInboundEvent,
) {
  if (!event.senderId) return null;

  const label = event.channel === 'instagram' ? 'Instagram' : 'Facebook Messenger';
  const message = event.text?.trim()
    || (event.attachmentsCount > 0 ? `[${event.attachmentsCount} adjunto(s) recibidos]` : '[Mensaje recibido sin texto]');

  const lead = await ensureInboundLead({
    admin,
    name: `${label} ${event.senderId}`,
    source: event.channel,
    sourceKey: `${event.channel}:${event.senderId}`,
    category: `Consulta ${label}`,
    service: 'consulta-general',
    message: message.slice(0, 4000),
    channel: event.channel,
    origin: `meta:${event.channel}`,
    metadata: {
      meta_sender_id: event.senderId,
      meta_recipient_id: event.recipientId,
      meta_message_id: event.messageId,
      meta_event_id: event.eventId,
      meta_attachments_count: event.attachmentsCount,
      ...event.metadata,
    },
  });

  if (lead.created) {
    await notifyAdmins({
      title: `Nuevo lead desde ${label}`,
      body: `Nuevo contacto recibido por ${label}`,
      url: `/admin/leads?focus=${lead.leadId}`,
      tag: `meta-lead-${lead.leadId}`,
    }).catch(() => {});
  }

  const conversationId = await getOrCreateKiaLeadConversation({
    admin,
    leadId: lead.leadId,
    channel: 'meta',
    originRef: `${event.channel}:${event.senderId}`,
    topic: `${label} · ${event.senderId}`,
    metadata: {
      meta_channel: event.channel,
      meta_sender_id: event.senderId,
      meta_recipient_id: event.recipientId,
      lead_id: lead.leadId,
    },
  });

  const { data: conversation, error: conversationError } = await admin
    .from('kia_conversations')
    .select('metadata,status')
    .eq('id', conversationId)
    .eq('lead_id', lead.leadId)
    .maybeSingle();
  if (conversationError) throw conversationError;
  if (!conversation || conversation.status !== 'active') throw new Error('meta_conversation_not_active');

  await appendKiaConversationMessage({
    admin,
    conversationId,
    role: 'user',
    body: message,
    metadata: {
      meta_channel: event.channel,
      meta_event_id: event.eventId,
      meta_message_id: event.messageId,
      meta_sender_id: event.senderId,
      attachments_count: event.attachmentsCount,
      delivery_state: 'received',
    },
  });

  if (getKiaConversationControlMode(conversation.metadata) === 'manual') {
    await persistMetaKiaAssessment(admin, lead.leadId, {
      meta_kia_status: 'manual_control',
      next_action: 'needs_review',
      operational_category: 'manual_review',
      kia_summary: 'Conversación Meta bajo control humano; KIA no responderá automáticamente.',
      kia_requires_manual_review: true,
      meta_conversation_id: conversationId,
    });
    return lead.leadId;
  }

  if (!event.text?.trim()) {
    await persistMetaKiaAssessment(admin, lead.leadId, {
      operational_category: 'manual_review',
      next_action: 'needs_review',
      kia_summary: 'Mensaje Meta sin texto; requiere revisión humana del contenido adjunto.',
      kia_draft_reply: null,
      kia_confidence: 0,
      kia_requires_manual_review: true,
      meta_kia_status: 'needs_review',
      meta_conversation_id: conversationId,
    });
    return lead.leadId;
  }

  if (!checkKiaMessageRateLimit(`meta-public:${event.channel}:${event.senderId}`)) {
    await persistMetaKiaAssessment(admin, lead.leadId, {
      meta_kia_status: 'rate_limited',
      next_action: 'needs_review',
      operational_category: 'manual_review',
      meta_conversation_id: conversationId,
    });
    return lead.leadId;
  }

  const costCap = await checkKiaLeadDailyCostCap(lead.leadId);
  if (!costCap.ok) {
    await persistMetaKiaAssessment(admin, lead.leadId, {
      meta_kia_status: 'daily_cost_cap_reached',
      next_action: 'needs_review',
      operational_category: 'manual_review',
      meta_conversation_id: conversationId,
    });
    return lead.leadId;
  }

  try {
    const locale = /[А-Яа-яЁё]/.test(event.text) ? 'ru' : 'es';
    const result = await runKiaOrchestratedDecision({
      input: {
        taskType: 'chat_reply',
        channel: 'meta',
        message: event.text.trim(),
        locale,
        contextInput: {
          channel: 'meta',
          leadId: lead.leadId,
          latestMessage: event.text.trim(),
          currentPage: event.channel === 'instagram' ? '/instagram' : '/facebook',
        },
        allowTools: false,
        includeOfficialSourceContext: true,
      },
      policyAuthorization: {
        channel: 'meta',
        requestedNames: [],
        maxRiskTier: 'R0',
        allowedEffects: ['read'],
        autonomousOnly: true,
      },
      policyToolNames: [],
    });

    const operationalCategory = resolveKiaOperationalCategory({
      skillId: result.executionTrace.skillId,
      subAgentId: result.executionTrace.preferredSubAgentId,
      detectedIntent: result.decision.intent,
      requiresManualReview: result.decision.requiresManualReview || result.decision.nextAction === 'needs_review',
    });

    await appendKiaConversationMessage({
      admin,
      conversationId,
      role: 'assistant',
      body: result.userMessage,
      intent: result.decision.intent,
      metadata: {
        delivery_state: 'prepared',
        not_sent: true,
        meta_channel: event.channel,
        meta_event_id: event.eventId,
        next_action: result.decision.nextAction,
        operational_category: operationalCategory,
        decision_log_id: result.decisionLogId ?? null,
        confidence: result.decision.confidence,
        requires_manual_review: result.decision.requiresManualReview,
      },
    });

    await persistMetaKiaAssessment(admin, lead.leadId, {
      operational_category: operationalCategory,
      next_action: result.decision.nextAction,
      kia_summary: result.decision.decisionSummary,
      kia_draft_reply: result.userMessage,
      kia_confidence: result.decision.confidence,
      kia_requires_manual_review: result.decision.requiresManualReview,
      kia_decision_log_id: result.decisionLogId ?? null,
      meta_kia_status: 'prepared_not_sent',
      meta_kia_channel: event.channel,
      meta_last_event_id: event.eventId,
      meta_conversation_id: conversationId,
    });

    await materializeKiaOperationalTask({
      admin,
      origin: 'meta',
      originId: `${event.channel}:${event.eventId}`,
      summary: result.decision.decisionSummary,
      description: event.text.trim(),
      nextAction: result.decision.nextAction,
      confidence: result.decision.confidence,
      requiresManualReview: result.decision.requiresManualReview,
      operationalCategory,
      leadId: lead.leadId,
      decisionLogId: result.decisionLogId ?? null,
      metadata: {
        meta_channel: event.channel,
        meta_event_id: event.eventId,
        meta_sender_id: event.senderId,
        meta_conversation_id: conversationId,
        reply_status: 'prepared_not_sent',
      },
    }).catch((error) => console.error('[Meta webhook] KIA operational task failed:', error));
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    console.error('[Meta webhook] KIA draft failed:', messageText);
    await appendKiaConversationMessage({
      admin,
      conversationId,
      role: 'system',
      body: 'KIA no pudo preparar una respuesta. Revisión humana requerida.',
      metadata: {
        delivery_state: 'failed',
        meta_event_id: event.eventId,
        failure_stage: 'kia_draft',
      },
    }).catch(() => {});
    await persistMetaKiaAssessment(admin, lead.leadId, {
      operational_category: 'manual_review',
      next_action: 'needs_review',
      kia_summary: 'KIA no pudo preparar una respuesta; revisar manualmente.',
      kia_draft_reply: null,
      kia_requires_manual_review: true,
      meta_kia_status: 'kia_error',
      meta_conversation_id: conversationId,
    });
  }

  return lead.leadId;
}

async function processLeadgenEvent(
  admin: ReturnType<typeof getSupabaseAdmin>,
  event: MetaInboundEvent,
) {
  let retrieved: Awaited<ReturnType<typeof retrieveMetaLead>> | null = null;
  let normalized: ReturnType<typeof normalizeMetaLeadFields> | null = null;
  let retrievalError: string | null = null;

  if (event.leadgenId) {
    try {
      retrieved = await retrieveMetaLead(event.leadgenId);
      normalized = normalizeMetaLeadFields(retrieved.field_data);
    } catch (error) {
      retrievalError = error instanceof Error ? error.message : String(error);
      console.error('[Meta leadgen] retrieval failed:', retrievalError);
    }
  }

  const name = normalized?.fullName
    || normalized?.companyName
    || `Meta Lead Ads ${event.leadgenId}`;

  const lead = await ensureInboundLead({
    admin,
    name,
    email: normalized?.email ?? null,
    phone: normalized?.phone ?? null,
    source: 'meta_lead_ads',
    sourceKey: `meta-leadgen:${event.leadgenId}`,
    category: 'Meta Lead Ads',
    service: 'consulta-general',
    message: retrieved
      ? 'Lead recibido desde Meta Lead Ads con datos recuperados de forma segura.'
      : 'Lead recibido desde Meta Lead Ads. Datos completos pendientes de recuperación segura mediante lead id.',
    channel: 'meta',
    origin: 'meta:leadgen',
    metadata: {
      meta_leadgen_id: event.leadgenId,
      meta_page_id: event.metadata.page_id ?? null,
      meta_form_id: retrieved?.form_id ?? event.metadata.form_id ?? null,
      meta_ad_id: retrieved?.ad_id ?? event.metadata.ad_id ?? null,
      meta_ad_name: retrieved?.ad_name ?? null,
      meta_adset_id: retrieved?.adset_id ?? event.metadata.adgroup_id ?? null,
      meta_adset_name: retrieved?.adset_name ?? null,
      meta_campaign_id: retrieved?.campaign_id ?? null,
      meta_campaign_name: retrieved?.campaign_name ?? null,
      meta_platform: retrieved?.platform ?? null,
      meta_is_organic: retrieved?.is_organic ?? null,
      meta_submitted_field_names: normalized?.fieldNames ?? [],
      meta_city: normalized?.city ?? null,
      meta_company_name: normalized?.companyName ?? null,
      meta_lead_data_status: retrieved ? 'retrieved' : 'pending_retrieval',
      meta_lead_retrieval_error: retrievalError,
    },
  });

  await notifyAdmins({
    title: 'Nuevo lead desde Meta Lead Ads',
    body: retrieved
      ? `${name} · datos de Lead Ads recuperados`
      : 'Lead recibido. Pendiente recuperar datos completos de Meta.',
    url: `/admin/leads?focus=${lead.leadId}`,
    tag: `meta-leadgen-${event.leadgenId}`,
  }).catch(() => {});

  return lead.leadId;
}

export async function GET(request: NextRequest) {
  const challenge = verifyMetaWebhookChallenge(new URL(request.url));
  if (!challenge) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  return new NextResponse(challenge, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!isMetaWebhookSignatureValid(rawBody, request.headers.get('x-hub-signature-256'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const events = parseMetaWebhookPayload(payload);
  if (!events.length) return NextResponse.json({ ok: true, accepted: 0 });

  const admin = getSupabaseAdmin();
  let accepted = 0;
  let duplicates = 0;
  let failed = 0;

  for (const event of events) {
    let claim: { claimed: boolean; key: string } | null = null;
    try {
      claim = await claimMetaEvent(admin, event);
      if (!claim.claimed) {
        duplicates += 1;
        continue;
      }

      const localId = event.channel === 'leadgen'
        ? await processLeadgenEvent(admin, event)
        : await processMessagingEvent(admin, event);

      await recordMetaLedger(admin, event, 'success', localId);
      await finalizeClaim(admin, claim.key, event, 'success', localId);
      accepted += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error('[Meta webhook] processing failed:', message);
      await recordMetaLedger(admin, event, 'failed', null, message);
      if (claim?.claimed) await finalizeClaim(admin, claim.key, event, 'failed');
    }
  }

  return NextResponse.json({ ok: true, accepted, duplicates, failed });
}
