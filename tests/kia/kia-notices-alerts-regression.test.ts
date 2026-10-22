import { describe, expect, it } from 'vitest';
import { classifyInboundEnvelope, shouldNotifyEmailSyncFallback } from '@/lib/email/kia-inbox-classifier';
import type { GmailMessage, GmailSummary } from '@/lib/integrations/gmail';

function msg(overrides: Partial<GmailMessage>): GmailMessage {
  return {
    id: '1', conversationId: 'a', from: 'Cliente', fromEmail: 'cliente@example.org',
    subject: '', body: '', bodyType: 'text', date: '2026-10-16T07:00:00Z',
    to: 'info@expertconsulting.es', unread: true, attachments: [], ...overrides,
  };
}
function summary(overrides: Partial<GmailSummary>): GmailSummary {
  return {
    id: '1', conversationId: 'a', from: 'Cliente', fromEmail: 'cliente@example.org',
    subject: '', snippet: '', date: '2026-10-16T07:00:00Z', unread: true,
    hasAttachment: false, ...overrides,
  };
}
describe('KIA official notices and spam alerts', () => {
  it('treats Ilya Russian forwarded ATV request as critical', () => {
    const result = classifyInboundEnvelope(msg({ subject: 'Запрос из Налоговой Валенсии по Алвилсу' }));
    expect(result.priority).toBe('critical');
    expect(result.requiresAttention).toBe(true);
    expect(result.reasons).toContain('human_forwarded_formal_notice');
  });
  it('recognizes official GVA notice', () => {
    const result = classifyInboundEnvelope(msg({ fromEmail: 'notificaciones@gva.es', subject: 'Requerimiento de subsanación' }));
    expect(result.kind).toBe('official');
    expect(result.priority).toBe('critical');
  });
  it('does not alert for GitHub routine workflow updates', () => {
    const result = classifyInboundEnvelope(msg({ fromEmail: 'notifications@github.com', subject: 'Action required: workflow build' }));
    expect(result.requiresAttention).toBe(false);
  });
  it('does not alert for promotional or spam messages that claim legal urgency', () => {
    const result = classifyInboundEnvelope(msg({ subject: 'Requerimiento urgente', labelIds: ['SPAM'] }));
    expect(result.requiresAttention).toBe(false);
    expect(result.kind).toBe('marketing');
  });
  it('suppresses newsletter in Gmail-sync fallback even with urgency words', () => {
    expect(shouldNotifyEmailSyncFallback(summary({ subject: 'Plazo urgente', labelIds: ['CATEGORY_PROMOTIONS'] }))).toBe(false);
  });
  it('notifies important human forwarded notice in Gmail-sync fallback', () => {
    expect(shouldNotifyEmailSyncFallback(summary({ subject: 'Запрос из Налоговой Валенсии по Алвилсу' }))).toBe(true);
  });
  it('does not alert about already-read human mail', () => {
    expect(shouldNotifyEmailSyncFallback(summary({ unread: false, subject: 'Requerimiento' }))).toBe(false);
  });
});
