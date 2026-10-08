import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const webhook = source('app/api/webhooks/telegram/route.ts');
const conversationStore = source('lib/ai/kia/kia-conversation-store.ts');
const operationalTask = source('lib/admin/kia-operational-task.ts');
const inbox = source('lib/admin/operations-360-inbox.ts');
const control = source('app/api/admin/inbox/control/route.ts');
const reply = source('app/api/admin/inbox/reply/route.ts');
const timeline = source('app/api/admin/inbox/timeline/route.ts');
const telegram = source('lib/integrations/telegram.ts');
const attachments = source('lib/documents/telegram-document-ingestion.ts');

describe('Telegram -> KIA -> Operations 360 end-to-end contract', () => {
  it('ingests Telegram through secret validation and update-id idempotency', () => {
    expect(webhook).toContain('x-telegram-bot-api-secret-token');
    expect(webhook).toContain('isTelegramWebhookAuthorized');
    expect(webhook).toContain("from('kia_telegram_updates').insert");
    expect(webhook).toContain("error?.code === '23505'");
  });

  it('creates or updates the canonical lead before public KIA handling', () => {
    expect(webhook).toContain('ensureInboundLead({');
    expect(webhook).toContain("source: 'telegram'");
    expect(webhook).toContain('sourceKey: `telegram:${inbound.userId}`');
    expect(webhook.indexOf('ensureInboundLead({'))
      .toBeLessThan(webhook.indexOf('runKiaDecision({'));
  });

  it('uses verified identity and canonical conversation persistence for private Telegram', () => {
    expect(webhook).toContain('resolveVerifiedTelegramIdentity({');
    expect(webhook).toContain('loadTelegramCaseContext({');
    expect(webhook).toContain('persistKiaConversationTurn({');
    expect(conversationStore).toContain("eventType: input.channel === 'telegram' ? 'telegram.inbound'");
    expect(conversationStore).toContain("eventType: input.channel === 'telegram' ? 'telegram.outbound'");
  });

  it('materializes safe human work and keeps manual review separate', () => {
    expect(webhook).toContain('materializeKiaOperationalTask({');
    expect(operationalTask).toContain("input.nextAction !== 'create_task'");
    expect(operationalTask).toContain('input.requiresManualReview || input.confidence < 0.75');
    expect(webhook).toContain("task_kind: 'telegram_review'");
    expect(webhook).toContain("result.decision.nextAction === 'needs_review'");
  });

  it('surfaces Telegram conversations in Operations 360', () => {
    expect(inbox).toContain("channel: 'telegram'");
    expect(inbox).toContain("source: 'kia_conversations'");
    expect(inbox).toContain('taskCount');
    expect(inbox).toContain('nextMeetingAt');
    expect(inbox).toContain('controlMode');
  });

  it('supports audited human takeover and return-to-KIA', () => {
    expect(control).toContain('setKiaConversationControl');
    expect(control).toContain('operations360.control_changed');
    expect(conversationStore).toContain('operations360_mode: input.mode');
    expect(conversationStore).toContain('operations360_owner_id');
  });

  it('sends Admin replies through Telegram and persists delivery evidence', () => {
    expect(reply).toContain('sendTelegramMessageConfirmed');
    expect(reply).toContain('appendKiaConversationMessage');
    expect(reply).toContain("role: 'professional'");
    expect(reply).toContain("delivery_state: 'sent'");
    expect(reply).toContain('telegram_message_id');
    expect(telegram).toContain('sendTelegramMessageConfirmed');
  });

  it('exposes messages and Admin actions in one timeline', () => {
    expect(timeline).toContain("from('kia_conversation_messages')");
    expect(timeline).toContain("from('audit_logs')");
    expect(timeline).toContain('operations360.control_changed');
    expect(timeline).toContain('operations360.manual_reply');
  });

  it('archives verified Telegram documents canonically', () => {
    expect(webhook).toContain('ingestTelegramCaseDocument({');
    expect(attachments).toContain("from('client-documents')");
    expect(attachments).toContain("ingestion_source: 'telegram'");
    expect(attachments).toContain('ingestion_ref: ingestionRef');
    expect(attachments).toContain('telegram.document_ingested');
  });

  it('does not duplicate Admin-only workflow as Telegram commands', () => {
    expect(webhook).not.toContain("command === '/asignar'");
    expect(webhook).not.toContain("command === '/cerrar'");
    expect(webhook).not.toContain("command === '/cliente'");
    expect(webhook).not.toContain("command === '/expediente'");
  });
});
