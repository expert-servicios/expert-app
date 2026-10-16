import { describe, expect, it } from 'vitest';
import { classifyInboundEnvelope, shouldNotifyEmailSyncFallback } from '@/lib/email/kia-inbox-classifier';
import type { GmailMessage, GmailSummary } from '@/lib/integrations/gmail';

function message(overrides: Partial<GmailMessage> = {}): GmailMessage {
  return { id: '1', conversationId: 't', from: 'Sender', fromEmail: 'ilya@example.com',
    to: 'info@expertconsulting.es', subject: '', date: '2026-10-16T07:30:00Z',
    body: '', bodyType: 'text', unread: true, attachments: [], labelIds: [], ...overrides };
}
function summary(overrides: Partial<GmailSummary> = {}): GmailSummary {
  return { id: '1', conversationId: 't', from: 'Sender', fromEmail: 'ilya@example.com',
    subject: '', date: '2026-10-16T07:30:00Z', unread: true, snippet: '', hasAttachment: false, ...overrides };
}

describe('KIA mail alert relevance', () => {
  it('escalates Russian-language forwarded Valencia tax notices by a human', () => {
    const x = classifyInboundEnvelope(message({
      subject: 'Запрос из Налоговой Валенсии по Алвилсу',
      body: 'Прошу подготовить пояснения по требованию налоговой.',
    }));
    expect(x.kind).toBe('human');
    expect(x.requiresAttention).toBe(true);
    expect(x.priority).toBe('critical');
  });

  it('escalates Spanish-language formal requirements forwarded by clients', () => {
    expect(classifyInboundEnvelope(message({ subject: 'Requerimiento de la Generalitat Valenciana' })).requiresAttention).toBe(true);
  });

  it('does not push normal GitHub workflow and PR messages', () => {
    const x = classifyInboundEnvelope(message({
      fromEmail: 'notifications@github.com',
      subject: '[expert-app] PR 800 CI workflow failed - action required',
    }));
    expect(x.requiresAttention).toBe(false);
    expect(shouldNotifyEmailSyncFallback(summary({
      fromEmail: 'notifications@github.com',
      subject: '[expert-app] PR 800 CI workflow failed - action required',
    }))).toBe(false);
  });

  it('silences ordinary promotions and unread-count non-events', () => {
    expect(classifyInboundEnvelope(message({ listUnsubscribe: '<unsubscribe@example.net>' })).requiresAttention).toBe(false);
    expect(shouldNotifyEmailSyncFallback(summary({ unread: false, subject: 'Requerimiento' }))).toBe(false);
  });

  it('retains security emergencies from known providers', () => {
    const x = classifyInboundEnvelope(message({
      fromEmail: 'security@github.com', subject: 'Security alert: account compromised',
    }));
    expect(x.requiresAttention).toBe(true);
  });

  it('keeps important human emails eligible for fallback even when the sender is not official', () => {
    expect(shouldNotifyEmailSyncFallback(summary({
      subject: 'Запрос из Налоговой Валенсии по Алвилсу',
    }))).toBe(true);
  });
});
