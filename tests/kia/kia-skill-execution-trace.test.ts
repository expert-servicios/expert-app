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

describe('KIA M6.3 skill execution trace', () => {
  it('captures selected skill identity and effective authorization without user data', () => {
    const resolution = resolveKiaSkillAuthorization({
      taskType: 'viability_reasoning',
      policyAuthorization: { ...policyAuthorization, allowedEffects: ['read'] },
      policyToolNames: [...policyAuthorization.requestedNames],
    });
    const trace = buildKiaSkillExecutionTrace({
      taskType: 'viability_reasoning',
      resolution,
    });

    expect(trace).toMatchObject({
      version: '1.0',
      requestedTaskType: 'viability_reasoning',
      selectionBasis: 'requested_task',
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

  it('supports an explicit fail-closed late-classification marker', () => {
    const resolution = resolveKiaSkillAuthorization({
      taskType: 'waba_reply',
      policyAuthorization: { ...policyAuthorization, allowedEffects: ['read'] },
      policyToolNames: [...policyAuthorization.requestedNames],
    });
    const trace = buildKiaSkillExecutionTrace({
      taskType: 'waba_reply',
      resolution: {
        ...resolution,
        authorization: { ...resolution.authorization, requestedNames: [] },
        toolNames: [],
      },
      lateClassificationFailClosed: true,
    });

    expect(trace.skillId).toBeNull();
    expect(trace.effectiveToolNames).toEqual([]);
    expect(trace.lateClassificationFailClosed).toBe(true);
  });

  it('wires waba_reply to fail closed before late intent classification', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'lib/ai/kia/kia-policy-enforced-decision.ts'),
      'utf8',
    );

    expect(source).toContain("input.taskType === 'waba_reply' && !initialSkillAuthorization.skill");
    expect(source).toContain('lateClassificationFailClosed');
    expect(source).toContain('? []');
    expect(source).toContain("console.info('[KIA skill execution]', executionTrace)");
    expect(source).toContain('executionTrace,');
  });
});
