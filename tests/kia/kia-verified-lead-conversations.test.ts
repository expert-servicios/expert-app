import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const store = readFileSync('lib/ai/kia/kia-conversation-store.ts', 'utf8');
const telegram = readFileSync('app/api/webhooks/telegram/route.ts', 'utf8');
const meta = readFileSync('app/api/webhooks/meta/route.ts', 'utf8');
describe('KIA verified lead conversation persistence', () => {
  it('scopes conversation lookups to lead, channel and source sender', () => {
    expect(store).toContain("channel: 'meta' | 'telegram'");
    expect(store).toContain(".eq('lead_id', input.leadId)");
    expect(store).toContain(".eq('origin_ref', input.originRef)");
    expect(store).toContain('origin_type: input.channel');
  });
  it('stores public Telegram turns after obtaining a canonical lead', () => {
    expect(telegram).toContain("getOrCreateKiaLeadConversation({");
    expect(telegram).toContain("channel: 'telegram'");
    expect(telegram).toContain('originRef: `telegram:${inbound.userId}`');
    expect(telegram).toContain('leadId: lead.leadId');
    expect(telegram).toContain('role: \'user\'');
    expect(telegram).toContain('role: \'assistant\'');
    expect(telegram.indexOf('leadConversationId = await getOrCreateKiaLeadConversation')).toBeLessThan(telegram.indexOf('const result = await runKiaDecision({'));
  });
  it('honors human takeover before Telegram KIA generates replies', () => {
    const manual = telegram.indexOf("getKiaConversationControlMode(leadConversation.metadata) === 'manual'");
    const decision = telegram.indexOf("const result = await runKiaDecision({");
    expect(manual).toBeGreaterThan(0);
    expect(manual).toBeLessThan(decision);
    expect(telegram).toContain("reason: 'manual_control'");
    expect(telegram).toContain("role: 'user'");
    expect(telegram).toContain("reason: 'conversation_persistence_failed'");
    expect(telegram).toContain("delivery_state: 'sent'");
  });

  it('preserves existing Meta linkage', () => {
    expect(meta).toContain("channel: 'meta'");
    expect(meta).toContain('originRef: `${event.channel}:${event.senderId}`');
  });
});