import { describe, expect, it } from 'vitest';
import { resolveKiaOrchestrationPlan } from '@/lib/ai/kia/kia-orchestrator';

const policyAuthorization = {
  channel: 'dashboard' as const,
  requestedNames: [
    'get_client_profile',
    'get_case_status',
    'get_holded_connection_status',
    'get_holded_accounting_summary',
  ],
  maxRiskTier: 'R1' as const,
  allowedEffects: ['read'] as const,
  autonomousOnly: true,
};

describe('KIA M7 orchestration plan', () => {
  it('aligns WABA viability classification with fiscal skill, subagent and restricted tools', () => {
    const plan = resolveKiaOrchestrationPlan({
      requestedTaskType: 'waba_reply',
      resolvedTaskType: 'viability_reasoning',
      detectedIntent: 'viability',
      policyAuthorization: { ...policyAuthorization, allowedEffects: ['read'] },
      policyToolNames: [...policyAuthorization.requestedNames],
    });

    expect(plan.skillId).toBe('fiscal.viability');
    expect(plan.subAgent?.id).toBe('fiscal');
    expect(plan.authorization.maxRiskTier).toBe('R1');
    expect(plan.authorization.allowedEffects).toEqual(['read']);
    expect(plan.toolNames).toEqual(
      plan.toolNames.filter((name) => policyAuthorization.requestedNames.includes(name)),
    );
  });

  it('uses detected intent and preferred subagent from the same plan', () => {
    const plan = resolveKiaOrchestrationPlan({
      requestedTaskType: 'document_classification',
      resolvedTaskType: 'document_classification',
      detectedIntent: 'viability',
      policyAuthorization: { ...policyAuthorization, allowedEffects: ['read'] },
      policyToolNames: [...policyAuthorization.requestedNames],
    });

    expect(plan.skillId).toBe('fiscal.viability');
    expect(plan.subAgent?.id).toBe('fiscal');
    expect(plan.detectedIntent).toBe('viability');
  });

  it('never widens the policy ceiling', () => {
    const restrictedNames = ['get_client_profile'];
    const plan = resolveKiaOrchestrationPlan({
      requestedTaskType: 'viability_reasoning',
      resolvedTaskType: 'viability_reasoning',
      detectedIntent: 'viability',
      policyAuthorization: {
        ...policyAuthorization,
        requestedNames: restrictedNames,
        allowedEffects: ['read'],
      },
      policyToolNames: restrictedNames,
    });

    expect(plan.toolNames.every((name) => restrictedNames.includes(name))).toBe(true);
    expect(plan.authorization.requestedNames).toEqual(plan.toolNames);
  });
});
