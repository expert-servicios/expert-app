import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildKiaSkillExecutionTrace,
  resolveKiaSkillAuthorization,
} from '@/lib/ai/kia/kia-skill-execution';

const policyAuthorization = {
  channel: 'dashboard' as const,
  requestedNames: ['get_client_profile', 'get_case_status', 'get_holded_connection_status'],
  maxRiskTier: 'R1' as const,
  allowedEffects: ['read'] as const,
  autonomousOnly: true,
};

describe('KIA skill execution trace', () => {
  it('captures resolved orchestration identity and effective authorization without user data', () => {
    const resolution = resolveKiaSkillAuthorization({
      taskType: 'viability_reasoning',
      detectedIntent: 'viability',
      policyAuthorization: { ...policyAuthorization, allowedEffects: ['read'] },
      policyToolNames: [...policyAuthorization.requestedNames],
    });
    const trace = buildKiaSkillExecutionTrace({
      taskType: 'waba_reply',
      resolvedTaskType: 'viability_reasoning',
      detectedIntent: 'viability',
      selectionBasis: 'resolved_intent',
      resolution,
    });

    expect(trace).toMatchObject({
      version: '1.0',
      requestedTaskType: 'waba_reply',
      resolvedTaskType: 'viability_reasoning',
      detectedIntent: 'viability',
      selectionBasis: 'resolved_intent',
      skillId: 'fiscal.viability',
      skillVersion: '1.0',
      preferredSubAgentId: 'fiscal',
      effectiveMaxRiskTier: 'R1',
      effectiveAllowedEffects: ['read'],
      autonomousOnly: true,
      lateClassificationFailClosed: false,
    });
    expect(JSON.stringify(trace)).not.toContain('clientId');
    expect(JSON.stringify(trace)).not.toContain('message');
  });

  it('keeps backward-compatible requested-task defaults', () => {
    const resolution = resolveKiaSkillAuthorization({
      taskType: 'viability_reasoning',
      policyAuthorization: { ...policyAuthorization, allowedEffects: ['read'] },
      policyToolNames: [...policyAuthorization.requestedNames],
    });
    const trace = buildKiaSkillExecutionTrace({
      taskType: 'viability_reasoning',
      resolution,
    });

    expect(trace.resolvedTaskType).toBe('viability_reasoning');
    expect(trace.detectedIntent).toBeNull();
    expect(trace.selectionBasis).toBe('requested_task');
  });

  it('wires orchestration trace after classification instead of pre-classification WABA narrowing', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'lib/ai/kia/kia-orchestrator.ts'),
      'utf8',
    );

    expect(source).toContain('const resolvedTaskType = resolveTaskAfterClassification');
    expect(source).toContain('const plan = resolveKiaOrchestrationPlan({');
    expect(source).toContain('selectionBasis: selectionBasis(plan)');
    expect(source).toContain("console.info('[KIA orchestration]', executionTrace)");
    expect(source).toContain('executionTrace,');
  });
});
