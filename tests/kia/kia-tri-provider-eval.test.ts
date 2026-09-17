import { afterEach, describe, expect, it, vi } from 'vitest';
import type { KiaDecision } from '@/lib/ai/kia/kia-output-schema';
import type { KiaProviderRequest, KiaProviderResult } from '@/lib/ai/kia/kia-provider-router';
import {
  buildTriProviderParityCase,
  runKiaTriProviderEval,
} from '@/lib/ai/kia/evals/kia-tri-provider-eval';

const baselineDecision: KiaDecision = {
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

const request: KiaProviderRequest = {
  taskType: 'next_best_action',
  systemPrompt: 'You are KIA.',
  messages: [{ role: 'user', content: '[redacted]' }],
  responseSchema: { type: 'object' },
  tools: [{
    name: 'get_user_expedientes',
    description: 'Read own cases',
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  }],
};

function providerResult(provider: 'openai' | 'anthropic', model: string): KiaProviderResult {
  return {
    provider,
    model,
    parsedJson: baselineDecision,
    toolCalls: [],
    usage: { input_tokens: 1000, output_tokens: 100 },
  };
}

afterEach(() => vi.unstubAllEnvs());

describe('KIA tri-provider eval', () => {
  it('keeps both candidates disabled by default', async () => {
    vi.stubEnv('KIA_OPENAI_RESPONSES_SHADOW_ENABLED', 'false');
    vi.stubEnv('KIA_ANTHROPIC_MESSAGES_SHADOW_ENABLED', 'false');
    const runCandidate = vi.fn();

    const result = await runKiaTriProviderEval({
      evalCase: buildTriProviderParityCase(baselineDecision),
      request,
      baseline: { decision: baselineDecision },
      runCandidate,
    });

    expect(result.openai.enabled).toBe(false);
    expect(result.anthropic.enabled).toBe(false);
    expect(runCandidate).not.toHaveBeenCalled();
  });

  it('evaluates OpenAI and Anthropic with the same baseline contract', async () => {
    vi.stubEnv('KIA_OPENAI_RESPONSES_SHADOW_ENABLED', 'true');
    vi.stubEnv('KIA_ANTHROPIC_MESSAGES_SHADOW_ENABLED', 'true');

    const result = await runKiaTriProviderEval({
      evalCase: buildTriProviderParityCase(baselineDecision),
      request,
      baseline: { decision: baselineDecision },
      runCandidate: async ({ provider }) => ({
        result: provider === 'openai'
          ? providerResult('openai', 'gpt-5.6-terra')
          : providerResult('anthropic', 'claude-sonnet-5'),
        latencyMs: provider === 'openai' ? 120 : 90,
      }),
    });

    expect(result.openai.eval?.passed).toBe(true);
    expect(result.anthropic.eval?.passed).toBe(true);
    expect(result.openai.comparison?.regression).toBe(false);
    expect(result.anthropic.comparison?.regression).toBe(false);
    expect(result.openai.estimatedCostUsd).toBeGreaterThan(0);
    expect(result.anthropic.estimatedCostUsd).toBeGreaterThan(0);
  });

  it('does not execute candidate tool calls', async () => {
    vi.stubEnv('KIA_OPENAI_RESPONSES_SHADOW_ENABLED', 'false');
    vi.stubEnv('KIA_ANTHROPIC_MESSAGES_SHADOW_ENABLED', 'true');

    const result = await runKiaTriProviderEval({
      evalCase: buildTriProviderParityCase(baselineDecision),
      request,
      baseline: { decision: baselineDecision },
      runCandidate: async () => ({
        result: {
          provider: 'anthropic',
          model: 'claude-sonnet-5',
          toolCalls: [{ name: 'get_user_expedientes', arguments: {} }],
        },
        latencyMs: 80,
      }),
    });

    expect(result.anthropic.enabled).toBe(true);
    expect(result.anthropic.eval?.validDecision).toBe(false);
    expect(result.anthropic.outputHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
