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

  return lead.leadId;
}

async function processLeadgenEvent(
  admin: ReturnType<typeof getSupabaseAdmin>,
  event: MetaInboundEvent,
) {
  const lead = await ensureInboundLead({
    admin,
    name: `Meta Lead Ads ${event.leadgenId}`,
    source: 'meta_lead_ads',
    sourceKey: `meta-leadgen:${event.leadgenId}`,
    category: 'Meta Lead Ads',
    service: 'consulta-general',
    message: 'Lead recibido desde Meta Lead Ads. Datos completos pendientes de recuperación segura mediante lead id.',
    channel: 'meta',
    origin: 'meta:leadgen',
    metadata: {
      meta_leadgen_id: event.leadgenId,
      meta_page_id: event.metadata.page_id ?? null,
      meta_form_id: event.metadata.form_id ?? null,
      meta_ad_id: event.metadata.ad_id ?? null,
      meta_adgroup_id: event.metadata.adgroup_id ?? null,
      meta_lead_data_status: 'pending_retrieval',
    },
  });

  await notifyAdmins({
    title: 'Nuevo lead desde Meta Lead Ads',
    body: 'Lead recibido. Pendiente recuperar datos completos de Meta.',
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
