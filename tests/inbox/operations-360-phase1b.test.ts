import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const store = source('lib/ai/kia/kia-conversation-store.ts');
const control = source('app/api/admin/inbox/control/route.ts');
const timeline = source('app/api/admin/inbox/timeline/route.ts');
const reply = source('app/api/admin/inbox/reply/route.ts');
const inbox = source('lib/admin/operations-360-inbox.ts');
const page = source('app/(protected)/admin/inbox/page.tsx');
const webKia = source('app/api/ai/kia/route.ts');
const telegram = source('app/api/webhooks/telegram/route.ts');
const escalation = source('app/api/admin/inbox/escalate/route.ts');

describe('Operations 360 Inbox phase 1b', () => {
  it('stores KIA/manual control on the canonical conversation envelope', () => {
    expect(store).toContain("operations360_mode");
    expect(store).toContain("operations360_owner_id");
    expect(store).toContain("export async function setKiaConversationControl");
    expect(store).toContain("export async function appendKiaConversationMessage");
    expect(store).not.toContain("from('operations360_conversations')");
  });

  it('audits takeover and return-to-KIA actions', () => {
    expect(control).toContain("operations360.conversation_taken_over");
    expect(control).toContain("operations360.conversation_returned_to_kia");
    expect(control).toContain("from('audit_logs').insert");
    expect(control).toContain("actor_id: ctx.user.id");
  });

  it('makes dashboard KIA stop autonomous replies during manual takeover', () => {
    expect(webKia).toContain("getKiaConversationControlMode(controlledConversation.metadata) === 'manual'");
    expect(webKia).toContain("appendKiaConversationMessage");
    expect(webKia).toContain("manualTakeover: true");
    expect(webKia.indexOf("manualTakeover: true")).toBeLessThan(webKia.indexOf("runPolicyEnforcedKiaDecision"));
  });

  it('makes Telegram stop autonomous replies and queue inbound messages during manual takeover', () => {
    expect(telegram).toContain("getKiaConversationControlMode(controlledConversation.metadata) === 'manual'");
    expect(telegram).toContain("operations360_manual_queue: true");
    expect(telegram).toContain("reason: 'manual_takeover'");
    expect(telegram).toContain("Telegram en modo manual");
  });

  it('sends confirmed manual Telegram replies and persists professional authorship', () => {
    expect(reply).toContain("sendTelegramMessageConfirmed");
    expect(reply).toContain("role: 'professional'");
    expect(reply).toContain("operations360.telegram_manual_reply_sent");
    expect(reply).toContain("operations360_manual_reply: true");
    expect(reply).toContain("getKiaConversationControlMode(conversation.metadata) !== 'manual'");
  });

  it('returns full canonical KIA timeline including audit events', () => {
    expect(timeline).toContain("from('kia_conversation_messages')");
    expect(timeline).toContain("from('audit_logs')");
    expect(timeline).toContain("kind: 'message'");
    expect(timeline).toContain("kind: 'audit'");
    expect(timeline).toContain("'Cache-Control': 'no-store'");
  });

  it('surfaces owner SLA and manual/KIA state from canonical data', () => {
    expect(inbox).toContain("assigned_to");
    expect(inbox).toContain("ownerName");
    expect(inbox).toContain("slaDueAt");
    expect(inbox).toContain("operations360_mode === 'manual'");
    expect(page).toContain("Tomar yo");
    expect(page).toContain("Dejar a KIA");
    expect(page).toContain("Enviar por Telegram");
    expect(page).toContain("Timeline");
    expect(page).toContain("Owner:");
    expect(page).toContain("SLA:");
  });

  it('assigns manual escalation to the acting admin with a same-day SLA and audit record', () => {
    expect(escalation).toContain("assigned_to: user.id");
    expect(escalation).toContain("due_date: new Date().toISOString().slice(0, 10)");
    expect(escalation).toContain("operations360.escalated_to_admin");
  });
});
