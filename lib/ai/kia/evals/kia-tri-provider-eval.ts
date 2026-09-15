import type { KiaDecision } from '../kia-output-schema';
import type { KiaProviderRequest, KiaProviderResult } from '../kia-provider-router';
import { stableHash } from '../kia-redaction';
import { runKiaAgentRuntime } from '../runtime/kia-agent-runtime';
import type { KiaRuntimeProvider } from '../kia-capability-router';
import { compareKiaEvalResults, evaluateKiaObservation } from './kia-evaluator';
import type { KiaEvalCase, KiaEvalComparison, KiaEvalResult } from './kia-eval-types';
import { estimateProviderResultCost, type KiaBaselineObservationInput } from './kia-shadow-comparison';

export interface KiaTriProviderCandidate {
  enabled: boolean;
  provider: 'openai' | 'anthropic';
  inputHash: string;
  outputHash?: string;
  eval?: KiaEvalResult;
  comparison?: KiaEvalComparison;
  latencyMs?: number;
  estimatedCostUsd?: number;
  error?: string;
}

export interface KiaTriProviderEvalResult {
  caseId: string;
  baselineHash: string;
  baseline: KiaEvalResult;
  openai: KiaTriProviderCandidate;
  anthropic: KiaTriProviderCandidate;
}

type CandidateRunner = (input: {
  provider: 'openai' | 'anthropic';
  request: KiaProviderRequest;
}) => Promise<{ result: KiaProviderResult | null; error?: string; latencyMs: number }>;

export async function runKiaTriProviderEval(params: {
  evalCase: KiaEvalCase;
  request: KiaProviderRequest;
  baseline: KiaBaselineObservationInput;
  runCandidate?: CandidateRunner;
  providerEnabled?: Partial<Record<'openai' | 'anthropic', boolean>>;
}): Promise<KiaTriProviderEvalResult> {
  const baselineProvider = params.baseline.providerResult?.provider ?? 'legacy-kia';
  const baselineModel = params.baseline.providerResult?.model ?? 'deterministic/unknown';
  const baselineCost = params.baseline.estimatedCostUsd
    ?? estimateProviderResultCost(params.baseline.providerResult);

  const baseline = evaluateKiaObservation(params.evalCase, {
    provider: baselineProvider,
    model: baselineModel,
    decision: params.baseline.decision,
    latencyMs: params.baseline.latencyMs,
    estimatedCostUsd: baselineCost,
    error: params.baseline.providerResult?.error,
  });

  const baselineHash = stableHash({
    caseId: params.evalCase.id,
    decision: params.baseline.decision,
    provider: baselineProvider,
    model: baselineModel,
  });

  const runner = params.runCandidate ?? defaultCandidateRunner;
  const openaiEnabled = params.providerEnabled?.openai
    ?? envEnabled('KIA_OPENAI_RESPONSES_SHADOW_ENABLED');
  const anthropicEnabled = params.providerEnabled?.anthropic
    ?? envEnabled('KIA_ANTHROPIC_MESSAGES_SHADOW_ENABLED');

  const [openai, anthropic] = await Promise.all([
    evaluateCandidate({
      provider: 'openai',
      enabled: openaiEnabled,
      evalCase: params.evalCase,
      request: params.request,
      baseline,
      runner,
    }),
    evaluateCandidate({
      provider: 'anthropic',
      enabled: anthropicEnabled,
      evalCase: params.evalCase,
      request: params.request,
      baseline,
      runner,
    }),
  ]);

  return { caseId: params.evalCase.id, baselineHash, baseline, openai, anthropic };
}

async function evaluateCandidate(input: {
  provider: 'openai' | 'anthropic';
  enabled: boolean;
  evalCase: KiaEvalCase;
  request: KiaProviderRequest;
  baseline: KiaEvalResult;
  runner: CandidateRunner;
}): Promise<KiaTriProviderCandidate> {
  const inputHash = stableHash({
    provider: input.provider,
    taskType: input.request.taskType,
    systemPrompt: input.request.systemPrompt,
    messages: input.request.messages,
    tools: input.request.tools?.map((tool) => tool.name) ?? [],
    responseSchema: input.request.responseSchema,
  });

  if (!input.enabled) {
    return { enabled: false, provider: input.provider, inputHash };
  }

  const execution = await input.runner({ provider: input.provider, request: input.request });
  if (!execution.result) {
    return {
      enabled: true,
      provider: input.provider,
      inputHash,
      latencyMs: execution.latencyMs,
      error: execution.error ?? 'Candidate runtime returned no result',
    };
  }

  const estimatedCostUsd = estimateProviderResultCost(execution.result);
  const evalResult = evaluateKiaObservation(input.evalCase, {
    provider: execution.result.provider,
    model: execution.result.model,
    decision: execution.result.parsedJson,
    latencyMs: execution.latencyMs,
    estimatedCostUsd,
    error: execution.result.error ?? execution.error,
  });
  const comparison = compareKiaEvalResults(input.baseline, evalResult);

  return {
    enabled: true,
    provider: input.provider,
    inputHash,
    outputHash: stableHash({
      provider: execution.result.provider,
      model: execution.result.model,
      parsedJson: execution.result.parsedJson,
      toolNames: execution.result.toolCalls?.map((tool) => tool.name) ?? [],
    }),
    eval: evalResult,
    comparison,
    latencyMs: execution.latencyMs,
    estimatedCostUsd,
    error: execution.result.error ?? execution.error,
  };
}

async function defaultCandidateRunner(input: {
  provider: 'openai' | 'anthropic';
  request: KiaProviderRequest;
}): Promise<{ result: KiaProviderResult | null; error?: string; latencyMs: number }> {
  const startedAt = Date.now();
  const execution = await runKiaAgentRuntime({
    capability: input.request.tools?.length ? 'tool_use' : 'structured_output',
    preferredProvider: input.provider as KiaRuntimeProvider,
    allowFallback: false,
    providerRequest: input.request,
  });
  return {
    result: execution.result,
    error: execution.error,
    latencyMs: Date.now() - startedAt,
  };
}

function envEnabled(name: string): boolean {
  return process.env[name]?.toLowerCase() === 'true';
}

export function buildTriProviderParityCase(decision: KiaDecision): KiaEvalCase {
  const observedTools = decision.toolRequests.map((tool) => tool.toolName);
  return {
    id: `tri-provider-parity-${decision.taskType}`,
    title: 'Runtime tri-provider parity check',
    domain: 'general',
    criticality: 'medium',
    taskType: decision.taskType,
    channel: 'dashboard',
    locale: 'es',
    message: '[redacted-tri-provider-parity]',
    expectation: {
      intents: [decision.intent],
      nextActions: [decision.nextAction],
      requiredTools: observedTools,
      allowedTools: observedTools,
      expectedManualReview: decision.requiresManualReview,
      expectedMeeting: decision.requiresMeeting,
      maxToolRiskTier: 'R1',
      forbiddenToolEffects: ['draft', 'write', 'external_action'],
    },
  };
}
