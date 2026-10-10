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
    expect(telegram.indexOf('const leadConversationId = await')).toBeGreaterThan(telegram.indexOf('await sendTelegramMessage({\n        chatId: inbound.chatId,\n        text: escapeTelegramHtml(result.userMessage)'));
  });
  it('preserves existing Meta linkage', () => {
    expect(meta).toContain("channel: 'meta'");
    expect(meta).toContain('originRef: `${event.channel}:${event.senderId}`');
  });
});