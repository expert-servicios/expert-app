import { afterEach, describe, expect, it, vi } from 'vitest';
import type { KiaDecision } from '@/lib/ai/kia/kia-output-schema';
import type { KiaProviderRequest } from '@/lib/ai/kia/kia-provider-router';
import { KIA_EVAL_CASES } from '@/lib/ai/kia/evals/kia-eval-cases';
import {
  estimateProviderResultCost,
  runKiaBaselineVsResponsesShadow,
} from '@/lib/ai/kia/evals/kia-shadow-comparison';

const decision: KiaDecision = {
  version: '1.0',
  taskType: 'next_best_action',
  contactStatus: 'client',
  intent: 'case_status',
  userMessage: 'Reviso tus expedientes.',
  nextAction: 'get_case_status',
  quickReplies: [],
  toolRequests: [{ toolName: 'get_user_expedientes', arguments: {}, reason: 'Consultar expedientes propios' }],
  dataToSave: {},
  confidence: 0.95,
  requiresMeeting: false,
  requiresManualReview: false,
  decisionSummary: 'Consulta segura de expedientes propios.',
  rulesApplied: ['authenticated_own_data'],
  missingData: [],
  warnings: [],
};

const request: KiaProviderRequest = {
  taskType: 'next_best_action',
  systemPrompt: 'Eres KIA.',
  messages: [{ role: 'user', content: '¿Qué expedientes tengo abiertos?' }],
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('KIA baseline vs Responses shadow', () => {
  it('keeps baseline authoritative and performs no provider call when shadow is disabled', async () => {
    vi.stubEnv('KIA_OPENAI_RESPONSES_SHADOW_ENABLED', 'false');
    const evalCase = KIA_EVAL_CASES.find((item) => item.id === 'dashboard-own-cases-es');
    expect(evalCase).toBeDefined();

    const result = await runKiaBaselineVsResponsesShadow({
      evalCase: evalCase!,
      request,
      baseline: {
        decision,
        providerResult: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-6',
          usage: { input_tokens: 100, output_tokens: 20 },
        },
      },
    });

    expect(result.enabled).toBe(false);
    expect(result.baseline.validDecision).toBe(true);
    expect(result.candidate).toBeUndefined();
    expect(result.comparison).toBeUndefined();
    expect(result.baselineHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('normalizes cost for legacy Chat Completions usage', () => {
    expect(estimateProviderResultCost({
      provider: 'openai',
      model: 'gpt-5.6-terra',
      usage: { prompt_tokens: 1_000_000, completion_tokens: 1_000_000 },
    })).toBe(17.5);
  });

  it('normalizes cost for Responses usage', () => {
    expect(estimateProviderResultCost({
      provider: 'openai',
      model: 'gpt-5.6-luna',
      usage: { input_tokens: 500_000, output_tokens: 500_000 },
    })).toBe(3.5);
  });
});
