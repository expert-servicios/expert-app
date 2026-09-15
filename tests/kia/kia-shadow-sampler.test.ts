import { afterEach, describe, expect, it, vi } from 'vitest';
import type { KiaDecision } from '@/lib/ai/kia/kia-output-schema';
import { decideKiaShadowSampling, getKiaShadowSampleRate } from '@/lib/ai/kia/evals/kia-shadow-sampler';

const baseDecision: KiaDecision = {
  version: '1.0',
  taskType: 'next_best_action',
  contactStatus: 'client',
  intent: 'case_status',
  userMessage: 'Reviso tus expedientes.',
  nextAction: 'get_case_status',
  quickReplies: [],
  toolRequests: [{ toolName: 'get_user_expedientes', arguments: {}, reason: 'read own cases' }],
  dataToSave: {},
  confidence: 0.95,
  requiresMeeting: false,
  requiresManualReview: false,
  decisionSummary: 'Safe read.',
  rulesApplied: ['safe_read'],
  missingData: [],
  warnings: [],
};

afterEach(() => vi.unstubAllEnvs());

describe('KIA shadow sampler', () => {
  it('is disabled unless explicitly enabled', () => {
    vi.stubEnv('KIA_OPENAI_RESPONSES_SHADOW_ENABLED', 'false');
    const result = decideKiaShadowSampling({ taskType: 'next_best_action', decision: baseDecision, sampleKey: 'same' });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('shadow_disabled');
  });

  it('allows only R0/R1 read-only decisions', () => {
    vi.stubEnv('KIA_OPENAI_RESPONSES_SHADOW_ENABLED', 'true');
    vi.stubEnv('KIA_OPENAI_RESPONSES_SHADOW_SAMPLE_RATE', '1');
    const result = decideKiaShadowSampling({ taskType: 'next_best_action', decision: baseDecision, sampleKey: 'safe' });
    expect(result.eligible).toBe(true);
    expect(result.sampled).toBe(true);
  });

  it('allows the canonical dashboard waba_reply task only after the same R0/R1 guards', () => {
    vi.stubEnv('KIA_OPENAI_RESPONSES_SHADOW_ENABLED', 'true');
    vi.stubEnv('KIA_OPENAI_RESPONSES_SHADOW_SAMPLE_RATE', '1');
    const decision: KiaDecision = { ...baseDecision, taskType: 'waba_reply' };
    const result = decideKiaShadowSampling({ taskType: 'waba_reply', decision, sampleKey: 'dashboard-safe' });
    expect(result.eligible).toBe(true);
    expect(result.sampled).toBe(true);
  });

  it('rejects decisions requiring human approval', () => {
    vi.stubEnv('KIA_OPENAI_RESPONSES_SHADOW_ENABLED', 'true');
    vi.stubEnv('KIA_OPENAI_RESPONSES_SHADOW_SAMPLE_RATE', '1');
    const decision: KiaDecision = {
      ...baseDecision,
      nextAction: 'create_task',
      requiresManualReview: true,
      toolRequests: [{ toolName: 'create_internal_task', arguments: { title: 'x' }, reason: 'draft task' }],
    };
    const result = decideKiaShadowSampling({ taskType: 'next_best_action', decision, sampleKey: 'unsafe' });
    expect(result.sampled).toBe(false);
    expect(result.reason).toBe('manual_review_required');
  });

  it('is deterministic for the same sample key', () => {
    vi.stubEnv('KIA_OPENAI_RESPONSES_SHADOW_ENABLED', 'true');
    vi.stubEnv('KIA_OPENAI_RESPONSES_SHADOW_SAMPLE_RATE', '0.5');
    const a = decideKiaShadowSampling({ taskType: 'next_best_action', decision: baseDecision, sampleKey: { id: 42 } });
    const b = decideKiaShadowSampling({ taskType: 'next_best_action', decision: baseDecision, sampleKey: { id: 42 } });
    expect(a.bucket).toBe(b.bucket);
    expect(a.sampled).toBe(b.sampled);
  });

  it('clamps invalid sample rates', () => {
    vi.stubEnv('KIA_OPENAI_RESPONSES_SHADOW_SAMPLE_RATE', '2');
    expect(getKiaShadowSampleRate()).toBe(1);
    vi.stubEnv('KIA_OPENAI_RESPONSES_SHADOW_SAMPLE_RATE', '-1');
    expect(getKiaShadowSampleRate()).toBe(0);
  });
});
