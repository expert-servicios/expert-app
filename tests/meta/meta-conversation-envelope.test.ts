import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const migration = readFileSync('supabase/migrations/20261008110000_kia_conversations_meta_leads.sql', 'utf8');
const store = readFileSync('lib/ai/kia/kia-conversation-store.ts', 'utf8');
const webhook = readFileSync('app/api/webhooks/meta/route.ts', 'utf8');
const inbox = readFileSync('lib/admin/operations-360-inbox.ts', 'utf8');
const timeline = readFileSync('app/api/admin/inbox/timeline/route.ts', 'utf8');

describe('Meta canonical conversation envelope', () => {
  it('extends conversations to leads without fabricating profile identities', () => {
    expect(migration).toContain('add column if not exists lead_id uuid references public.leads(id) on delete restrict');
    expect(migration).toContain('alter column profile_id drop not null');
    expect(migration).toContain("'dashboard','telegram','waba','email','meta'");
    expect(migration).toContain("'email','dashboard','telegram','waba','meta','system'");
    expect(migration).toContain('(profile_id is not null and lead_id is null)');
    expect(migration).toContain('(profile_id is null and lead_id is not null)');
  });

  it('allows message persistence with nullable profile for lead conversations', () => {
    expect(migration).toContain('alter table public.kia_conversation_messages');
    expect(migration).toContain('alter column profile_id drop not null');
    expect(store).toContain('getOrCreateKiaLeadConversation');
    expect(store).toContain('profile_id: null');
    expect(store).toContain('lead_id: input.leadId');
    expect(store).toContain("origin_type: 'meta'");
  });

  it('persists one canonical Meta thread and honors manual takeover before KIA', () => {
    expect(webhook).toContain('getOrCreateKiaLeadConversation({');
    expect(webhook).toContain('appendKiaConversationMessage({');
    expect(webhook).toContain("getKiaConversationControlMode(conversation.metadata) === 'manual'");
    expect(webhook.indexOf("getKiaConversationControlMode(conversation.metadata) === 'manual'"))
      .toBeLessThan(webhook.indexOf('runKiaOrchestratedDecision({'));
    expect(webhook).toContain("meta_kia_status: 'manual_control'");
  });

  it('keeps KIA drafts internal and degrades failures to human review', () => {
    expect(webhook).toContain("delivery_state: 'prepared'");
    expect(webhook).toContain('not_sent: true');
    expect(webhook).toContain("role: 'system'");
    expect(webhook).toContain("meta_kia_status: 'kia_error'");
    expect(webhook).not.toContain('/messages');
  });

  it('projects lead identity into Operations 360 and timeline', () => {
    expect(inbox).toContain('lead_id,channel');
    expect(inbox).toContain('leadId: row.lead_id ?? null');
    expect(inbox).toContain("identity: clientId ? 'client' : row.lead_id ? 'lead' : 'unknown'");
    expect(timeline).toContain('profile_id,lead_id,company_id');
    expect(timeline).toContain('leadId: conversation.lead_id');
  });
});