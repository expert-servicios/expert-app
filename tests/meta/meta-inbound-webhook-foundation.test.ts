import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  isMetaWebhookSignatureValid,
  parseMetaWebhookPayload,
  verifyMetaWebhookChallenge,
} from '@/lib/integrations/meta/webhook';

const route = readFileSync('app/api/webhooks/meta/route.ts', 'utf8');

describe('Meta inbound webhook foundation', () => {
  it('verifies GET challenge only with the dedicated verify token', () => {
    process.env.META_WEBHOOK_VERIFY_TOKEN = 'verify-me';
    const ok = new URL('https://expertconsulting.es/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=12345');
    const bad = new URL('https://expertconsulting.es/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=12345');
    expect(verifyMetaWebhookChallenge(ok)).toBe('12345');
    expect(verifyMetaWebhookChallenge(bad)).toBeNull();
  });

  it('validates X-Hub-Signature-256 against the Meta app secret', () => {
    process.env.META_MARKETING_APP_SECRET = 'app-secret';
    const body = JSON.stringify({ object: 'page', entry: [] });
    const digest = createHmac('sha256', 'app-secret').update(body, 'utf8').digest('hex');
    expect(isMetaWebhookSignatureValid(body, `sha256=${digest}`)).toBe(true);
    expect(isMetaWebhookSignatureValid(body, 'sha256=' + '0'.repeat(64))).toBe(false);
  });

  it('parses Messenger messages without inferring client identity', () => {
    const events = parseMetaWebhookPayload({
      object: 'page',
      entry: [{
        id: 'page-1',
        messaging: [{
          sender: { id: 'psid-1' },
          recipient: { id: 'page-1' },
          timestamp: 123456789,
          message: { mid: 'm-1', text: 'Necesito ayuda con IVA' },
        }],
      }],
    });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ channel: 'facebook', senderId: 'psid-1', recipientId: 'page-1', eventId: 'm-1', text: 'Necesito ayuda con IVA' });
  });

  it('parses Instagram DMs and skips echo messages', () => {
    const events = parseMetaWebhookPayload({
      object: 'instagram',
      entry: [{
        id: 'ig-1',
        messaging: [
          { sender: { id: 'igsid-1' }, recipient: { id: 'ig-1' }, timestamp: 1, message: { mid: 'ig-m-1', text: 'Hola' } },
          { sender: { id: 'ig-1' }, recipient: { id: 'igsid-1' }, timestamp: 2, message: { mid: 'ig-m-2', text: 'Eco', is_echo: true } },
        ],
      }],
    });
    expect(events).toHaveLength(1);
    expect(events[0].channel).toBe('instagram');
    expect(events[0].eventId).toBe('ig-m-1');
  });

  it('parses Lead Ads leadgen identifiers and attribution metadata', () => {
    const events = parseMetaWebhookPayload({
      object: 'page',
      entry: [{
        id: 'page-1',
        changes: [{ field: 'leadgen', value: { leadgen_id: 'leadgen-123', page_id: 'page-1', form_id: 'form-1', ad_id: 'ad-1', adgroup_id: 'adset-1', created_time: 123 } }],
      }],
    });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ channel: 'leadgen', eventId: 'leadgen-123', leadgenId: 'leadgen-123' });
    expect(events[0].metadata).toMatchObject({ page_id: 'page-1', form_id: 'form-1', ad_id: 'ad-1', adgroup_id: 'adset-1' });
  });

  it('claims idempotency before lead writes and stores inbound ledger records', () => {
    expect(route).toContain("from('system_kv').insert");
    expect(route).toContain("error.code === '23505'");
    expect(route).toContain("from('integration_sync_events').insert");
    expect(route).toContain("provider: 'meta'");
    expect(route).toContain("direction: 'from_external'");
    expect(route.indexOf('claimMetaEvent(admin, event)')).toBeLessThan(route.indexOf('processLeadgenEvent(admin, event)'));
  });

  it('creates channel-scoped leads without auto-linking clients or cases', () => {
    expect(route).toContain('source: event.channel');
    expect(route).toContain('sourceKey: `${event.channel}:${event.senderId}`');
    expect(route).toContain("source: 'meta_lead_ads'");
    expect(route).not.toContain('client_id:');
    expect(route).not.toContain('case_id:');
  });

  it('does not send outbound Meta messages in the foundation cut', () => {
    expect(route).not.toContain('metaGraphRequest');
    expect(route).not.toContain('/messages');
    expect(route).not.toContain('runKiaDecision');
  });
});