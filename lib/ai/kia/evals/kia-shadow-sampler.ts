import type { KiaDecision, KiaTaskType } from '../kia-output-schema';
import type { KiaProviderRequest, KiaProviderResult } from '../kia-provider-router';
import { stableHash } from '../kia-redaction';
import { getKiaToolPolicy } from '../kia-tool-registry';
import {
  buildTriProviderParityCase,
  runKiaTriProviderEval,
  type KiaTriProviderCandidate,
} from './kia-tri-provider-eval';

const SAFE_TASKS: KiaTaskType[] = [
  'waba_reply',
  'company_status_summary',
  'next_best_action',
  'readiness_reasoning',
  'viability_reasoning',
  'checkout_decision',
];

type ShadowProvider = 'openai' | 'anthropic';

export interface KiaShadowSamplingDecision {
  eligible: boolean;
  sampled: boolean;
  reason: string;
  bucket: number;
  rate: number;
}

export interface KiaShadowProviderTelemetry {
  provider: ShadowProvider;
  sampled: boolean;
  inputHash?: string;
  candidateHash?: string;
  candidateModel?: string;
  candidateScore?: number;
  scoreDelta?: number;
  regression?: boolean;
  improvement?: boolean;
  candidateCostUsd?: number;
  candidateLatencyMs?: number;
  candidateError?: string;
}

export interface KiaShadowTelemetry {
  event: 'kia.shadow.tri_provider_comparison';
  taskType: KiaTaskType;
  baselineHash: string;
  baselineProvider: string;
  baselineModel: string;
  baselineScore: number;
  baselineCostUsd?: number;
  openai: KiaShadowProviderTelemetry;
  anthropic: KiaShadowProviderTelemetry;
}

export function getKiaShadowSampleRate(): number {
  return getKiaProviderShadowSampleRate('openai');
}

export function getKiaProviderShadowSampleRate(provider: ShadowProvider): number {
  const envName = provider === 'openai'
    ? 'KIA_OPENAI_RESPONSES_SHADOW_SAMPLE_RATE'
    : 'KIA_ANTHROPIC_MESSAGES_SHADOW_SAMPLE_RATE';
  const fallback = provider === 'openai' ? 0.05 : 0.01;
  const parsed = Number(process.env[envName] ?? String(fallback));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(1, parsed));
}

export function decideKiaShadowSampling(input: {
  taskType: KiaTaskType;
  decision: KiaDecision;
  sampleKey: unknown;
}): KiaShadowSamplingDecision {
  return decideKiaProviderShadowSampling({ ...input, provider: 'openai' });
}

export function decideKiaProviderShadowSampling(input: {
  provider: ShadowProvider;
  taskType: KiaTaskType;
  decision: KiaDecision;
  sampleKey: unknown;
}): KiaShadowSamplingDecision {
  const rate = getKiaProviderShadowSampleRate(input.provider);
  const bucket = hashBucket({ provider: input.provider, sampleKey: input.sampleKey });
  const enabled = input.provider === 'openai'
    ? process.env.KIA_OPENAI_RESPONSES_SHADOW_ENABLED?.toLowerCase() === 'true'
    : process.env.KIA_ANTHROPIC_MESSAGES_SHADOW_ENABLED?.toLowerCase() === 'true';

  if (!enabled) {
    return { eligible: false, sampled: false, reason: 'shadow_disabled', bucket, rate };
  }
  if (!SAFE_TASKS.includes(input.taskType)) {
    return { eligible: false, sampled: false, reason: 'task_not_allowlisted', bucket, rate };
  }
  if (input.decision.requiresManualReview) {
    return { eligible: false, sampled: false, reason: 'manual_review_required', bucket, rate };
  }
  if (input.decision.nextAction === 'update_case' || input.decision.nextAction === 'create_task') {
    return { eligible: false, sampled: false, reason: 'consequential_next_action', bucket, rate };
  }

  for (const request of input.decision.toolRequests) {
    const policy = getKiaToolPolicy(request.toolName);
    if (!policy) return { eligible: false, sampled: false, reason: 'unknown_tool_policy', bucket, rate };
    if (policy.requiresHumanApproval || policy.effect !== 'read' || !['R0', 'R1'].includes(policy.riskTier)) {
      return { eligible: false, sampled: false, reason: 'tool_not_r0_r1_read', bucket, rate };
    }
  }

  return {
    eligible: true,
    sampled: bucket < rate,
    reason: bucket < rate ? 'sampled' : 'outside_sample',
    bucket,
    rate,
  };
}

export async function runSampledKiaShadow(input: {
  request: KiaProviderRequest;
  baselineDecision: KiaDecision;
  baselineProviderResult?: KiaProviderResult;
  sampleKey: unknown;
}): Promise<KiaShadowTelemetry | null> {
  const openaiSampling = decideKiaProviderShadowSampling({
    provider: 'openai',
    taskType: input.request.taskType,
    decision: input.baselineDecision,
    sampleKey: input.sampleKey,
  });
  const anthropicSampling = decideKiaProviderShadowSampling({
    provider: 'anthropic',
    taskType: input.request.taskType,
    decision: input.baselineDecision,
    sampleKey: input.sampleKey,
  });

  if (!openaiSampling.sampled && !anthropicSampling.sampled) return null;

  const result = await runKiaTriProviderEval({
    evalCase: buildTriProviderParityCase(input.baselineDecision),
    request: input.request,
    baseline: {
      decision: input.baselineDecision,
      providerResult: input.baselineProviderResult,
    },
    providerEnabled: {
      openai: openaiSampling.sampled,
      anthropic: anthropicSampling.sampled,
    },
  });

  const telemetry: KiaShadowTelemetry = {
    event: 'kia.shadow.tri_provider_comparison',
    taskType: input.request.taskType,
    baselineHash: result.baselineHash,
    baselineProvider: result.baseline.provider,
    baselineModel: result.baseline.model,
    baselineScore: result.baseline.scores.overall,
    baselineCostUsd: result.baseline.estimatedCostUsd,
    openai: candidateTelemetry('openai', openaiSampling.sampled, result.openai),
    anthropic: candidateTelemetry('anthropic', anthropicSampling.sampled, result.anthropic),
  };

  // Intentionally no prompts, responses, client IDs, company IDs or tool arguments.
  console.info('[Kia shadow telemetry]', telemetry);
  return telemetry;
}

function candidateTelemetry(
  provider: ShadowProvider,
  sampled: boolean,
  candidate: KiaTriProviderCandidate,
): KiaShadowProviderTelemetry {
  return {
    provider,
    sampled,
    inputHash: candidate.inputHash,
    candidateHash: candidate.outputHash,
    candidateModel: candidate.eval?.model,
    candidateScore: candidate.eval?.scores.overall,
    scoreDelta: candidate.comparison?.scoreDelta,
    regression: candidate.comparison?.regression,
    improvement: candidate.comparison?.improvement,
    candidateCostUsd: candidate.estimatedCostUsd,
    candidateLatencyMs: candidate.latencyMs,
    candidateError: candidate.error ?? candidate.eval?.error,
  };
}

function hashBucket(value: unknown): number {
  const hash = stableHash(value);
  const prefix = Number.parseInt(hash.slice(0, 8), 16);
  return prefix / 0xffffffff;
}
