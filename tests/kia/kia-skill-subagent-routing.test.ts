import { describe, expect, it } from 'vitest';
import { selectSubAgentProfile } from '@/lib/ai/kia/kia-sub-agent-router';


describe('KIA M6.2 skill-first subagent routing', () => {
  it('routes fiscal viability through the skill preferred subagent', () => {
    expect(selectSubAgentProfile({ taskType: 'viability_reasoning' })?.id).toBe('fiscal');
  });

  it('routes Holded readiness through the technical Holded sub-agent', () => {
    expect(selectSubAgentProfile({ taskType: 'readiness_reasoning' })?.id).toBe('holded');
    expect(selectSubAgentProfile({
      taskType: 'chat_reply',
      detectedIntent: 'connect_holded',
    })?.id).toBe('holded');
  });

  it('routes accounting analysis through the accounting sub-agent', () => {
    expect(selectSubAgentProfile({ taskType: 'accounting_anomaly_review' })?.id).toBe('accounting');
    expect(selectSubAgentProfile({ taskType: 'company_status_summary' })?.id).toBe('accounting');
    expect(selectSubAgentProfile({
      taskType: 'chat_reply',
      detectedIntent: 'accounting_summary',
    })?.id).toBe('accounting');
  });

  it('lets explicit skill intent win over a conflicting task fallback', () => {
    expect(selectSubAgentProfile({
      taskType: 'document_classification',
      detectedIntent: 'viability',
    })?.id).toBe('fiscal');
  });

  it('routes explicit operational intent through the assistant skill', () => {
    expect(selectSubAgentProfile({
      taskType: 'chat_reply',
      detectedIntent: 'assistant_operations',
      channel: 'email',
    })?.id).toBe('assistant');
  });

  it('routes generic email work through the operational assistant', () => {
    expect(selectSubAgentProfile({
      taskType: 'chat_reply',
      channel: 'email',
    })?.id).toBe('assistant');
  });

  it('keeps domain specialists ahead of the email assistant fallback', () => {
    expect(selectSubAgentProfile({
      taskType: 'chat_reply',
      detectedIntent: 'accounting_summary',
      channel: 'email',
    })?.id).toBe('accounting');
  });

  it('keeps legacy fallback for non-email task types without a matching skill', () => {
    expect(selectSubAgentProfile({ taskType: 'checkout_decision' })).toBeNull();
  });
});
