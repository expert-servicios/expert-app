import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
  it('aligns dashboard chat viability classification with fiscal skill, subagent and restricted tools', () => {
    const plan = resolveKiaOrchestrationPlan({
      requestedTaskType: 'chat_reply',
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

  it('allows a resolved unskilled email intent to keep its policy-scoped public tools', async () => {
    const source = readFileSync(resolve(process.cwd(), 'lib/ai/kia/kia-orchestrator.ts'), 'utf8');
    expect(source).toContain("classification.detectedIntent !== 'unknown'");
    expect(source).toContain("allowResolvedUnskilled: input.channel === 'email' && classificationResolved");
    expect(source).toContain('params.allowResolvedUnskilled !== true');
  });

  it('retries the provider pool after semantic classifier failure', () => {
    const classifier = readFileSync(resolve(process.cwd(), 'lib/ai/kia/kia-intent-classifier.ts'), 'utf8');
    const router = readFileSync(resolve(process.cwd(), 'lib/ai/kia/kia-provider-router.ts'), 'utf8');
    expect(classifier).toContain('semanticValidator: (candidate) => parseProviderClassification(candidate) !== null');
    expect(router).toContain('semantic_validation_failed');
    expect(router).toContain('request.semanticValidator && !request.semanticValidator(result)');
  });

  it('derives selection basis from the skill that actually matched', () => {
    const source = readFileSync(resolve(process.cwd(), 'lib/ai/kia/kia-orchestrator.ts'), 'utf8');
    expect(source).toContain('skill.intents.includes(params.detectedIntent)');
    expect(source).toContain('skill?.taskTypes.includes(params.resolvedTaskType)');
  });

  it('propagates the resolved intent into final decision task context without overwriting an explicit page task', () => {
    const source = readFileSync(resolve(process.cwd(), 'lib/ai/kia/kia-orchestrator.ts'), 'utf8');
    expect(source).toContain('currentTask: input.contextInput.currentTask ?? plan.detectedIntent ?? undefined');
    expect(source).toContain('contextInput: decisionContextInput');
  });
});
