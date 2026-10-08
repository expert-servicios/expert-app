import { createHmac, timingSafeEqual } from 'node:crypto';
import { getMetaMarketingConfig } from './config';

export type MetaInboundEvent = {
  eventId: string;
  channel: 'facebook' | 'instagram' | 'leadgen';
  object: 'page' | 'instagram';
  senderId: string | null;
  recipientId: string | null;
  timestamp: number | null;
  messageId: string | null;
  text: string | null;
  attachmentsCount: number;
  leadgenId: string | null;
  metadata: Record<string, unknown>;
};

function safeString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function safeNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function safeRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function getMetaWebhookVerifyToken(): string | null {
  return process.env.META_WEBHOOK_VERIFY_TOKEN?.trim() || null;
}

export function verifyMetaWebhookChallenge(url: URL): string | null {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const expected = getMetaWebhookVerifyToken();

  if (!expected || mode !== 'subscribe' || !token || !challenge) return null;

  const actualBytes = Buffer.from(token);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length) return null;
  return timingSafeEqual(actualBytes, expectedBytes) ? challenge : null;
}

export function isMetaWebhookSignatureValid(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = getMetaMarketingConfig().appSecret;
  if (!appSecret || !signatureHeader?.startsWith('sha256=')) return false;

  const provided = signatureHeader.slice('sha256='.length).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(provided)) return false;

  const expected = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');
  const providedBytes = Buffer.from(provided, 'hex');
  const expectedBytes = Buffer.from(expected, 'hex');
  return providedBytes.length === expectedBytes.length
    && timingSafeEqual(providedBytes, expectedBytes);
}

export function parseMetaWebhookPayload(payload: unknown): MetaInboundEvent[] {
  const root = safeRecord(payload);
  const object = root.object === 'instagram' ? 'instagram' : root.object === 'page' ? 'page' : null;
  if (!object || !Array.isArray(root.entry)) return [];

  const events: MetaInboundEvent[] = [];

  for (const rawEntry of root.entry) {
    const entry = safeRecord(rawEntry);
    const entryId = safeString(entry.id);

    if (Array.isArray(entry.messaging)) {
      for (const rawMessaging of entry.messaging) {
        const messaging = safeRecord(rawMessaging);
        const sender = safeRecord(messaging.sender);
        const recipient = safeRecord(messaging.recipient);
        const message = safeRecord(messaging.message);
        const postback = safeRecord(messaging.postback);
        if (message.is_echo === true) continue;

        const senderId = safeString(sender.id);
        const recipientId = safeString(recipient.id) ?? entryId;
        const messageId = safeString(message.mid);
        const timestamp = safeNumber(messaging.timestamp);
        const text = safeString(message.text) ?? safeString(postback.title);
        const attachments = Array.isArray(message.attachments) ? message.attachments : [];
        const channel = object === 'instagram' ? 'instagram' : 'facebook';

        const fallbackId = [
          channel,
          entryId ?? 'entry',
          senderId ?? 'sender',
          timestamp ?? 'time',
          text?.slice(0, 120) ?? 'event',
        ].join(':');

        events.push({
          eventId: messageId ?? fallbackId,
          channel,
          object,
          senderId,
          recipientId,
          timestamp,
          messageId,
          text,
          attachmentsCount: attachments.length,
          leadgenId: null,
          metadata: {
            referral: safeRecord(messaging.referral),
            postback_payload: safeString(postback.payload),
          },
        });
      }
    }

    if (Array.isArray(entry.changes)) {
      for (const rawChange of entry.changes) {
        const change = safeRecord(rawChange);
        if (change.field !== 'leadgen') continue;
        const value = safeRecord(change.value);
        const leadgenId = safeString(value.leadgen_id);
        if (!leadgenId) continue;

        events.push({
          eventId: leadgenId,
          channel: 'leadgen',
          object: 'page',
          senderId: null,
          recipientId: safeString(value.page_id) ?? entryId,
          timestamp: safeNumber(value.created_time),
          messageId: null,
          text: null,
          attachmentsCount: 0,
          leadgenId,
          metadata: {
            page_id: safeString(value.page_id) ?? entryId,
            form_id: safeString(value.form_id),
            ad_id: safeString(value.ad_id),
            adgroup_id: safeString(value.adgroup_id),
          },
        });
      }
    }
  }

  return events;
}
