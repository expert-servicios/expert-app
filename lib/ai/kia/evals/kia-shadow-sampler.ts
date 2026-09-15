import type { KiaDecision, KiaTaskType } from '../kia-output-schema';
import type { KiaProviderRequest, KiaProviderResult } from '../kia-provider-router';
import { stableHash } from '../kia-redaction';
import { getKiaToolPolicy } from '../kia-tool-registry';
import type { KiaEvalCase } from './kia-eval-types';
import { runKiaBaselineVsResponsesShadow } from './kia-shadow-comparison';

const SAFE_TASKS: KiaTaskType[] = [
  'waba_reply',
  'company_status_summary',
  'next_best_action',
  'readiness_reasoning',
  'viability_reasoning',
  'checkout_decision',
];

export interface KiaShadowSamplingDecision {
  eligible: boolean;
  sampled: boolean;
  reason: string;
  bucket: number;
  rate: number;
}

export interface KiaShadowTelemetry {
  event: 'kia.shadow.comparison';
  inputHash: string;
  baselineHash: string;
  candidateHash?: string;
  taskType: KiaTaskType;
  baselineProvider: string;
  baselineModel: string;
  candidateModel?: string;
  baselineScore: number;
  candidateScore?: number;
  scoreDelta?: number;
  regression?: boolean;
  improvement?: boolean;
  baselineCostUsd?: number;
  candidateCostUsd?: number;
  candidateLatencyMs?: number;
  candidateError?: string;
}

export function getKiaShadowSampleRate(): number {
  const parsed = Number(process.env.KIA_OPENAI_RESPONSES_SHADOW_SAMPLE_RATE ?? '0.05');
  if (!Number.isFinite(parsed)) return 0.05;
  return Math.max(0, Math.min(1, parsed));
}

export function decideKiaShadowSampling(input: {
  taskType: KiaTaskType;
  decision: KiaDecision;
  sampleKey: unknown;
}): KiaShadowSamplingDecision {
  const rate = getKiaShadowSampleRate();
  const bucket = hashBucket(input.sampleKey);

  if (process.env.KIA_OPENAI_RESPONSES_SHADOW_ENABLED?.toLowerCase() !== 'true') {
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
  const sampling = decideKiaShadowSampling({
    taskType: input.request.taskType,
    decision: input.baselineDecision,
    sampleKey: input.sampleKey,
  });
  if (!sampling.sampled) return null;

  const evalCase = buildBaselineParityCase(input.baselineDecision);
  const result = await runKiaBaselineVsResponsesShadow({
    evalCase,
    request: input.request,
    baseline: {
      decision: input.baselineDecision,
      providerResult: input.baselineProviderResult,
    },
  });

  const telemetry: KiaShadowTelemetry = {
    event: 'kia.shadow.comparison',
    inputHash: result.inputHash,
    baselineHash: result.baselineHash,
    candidateHash: result.candidateHash,
    taskType: input.request.taskType,
    baselineProvider: result.baseline.provider,
    baselineModel: result.baseline.model,
    candidateModel: result.candidate?.model,
    baselineScore: result.baseline.scores.overall,
    candidateScore: result.candidate?.scores.overall,
    scoreDelta: result.comparison?.scoreDelta,
    regression: result.comparison?.regression,
    improvement: result.comparison?.improvement,
    baselineCostUsd: result.baseline.estimatedCostUsd,
    candidateCostUsd: result.candidate?.estimatedCostUsd,
    candidateLatencyMs: result.candidate?.latencyMs,
    candidateError: result.candidate?.error,
  };

  // Intentionally no prompts, responses, client IDs, company IDs or tool arguments.
  console.info('[Kia shadow telemetry]', telemetry);
  return telemetry;
}

function buildBaselineParityCase(decision: KiaDecision): KiaEvalCase {
  const observedTools = decision.toolRequests.map((tool) => tool.toolName);
  return {
    id: `shadow-parity-${decision.taskType}`,
    title: 'Runtime shadow parity check',
    domain: 'general',
    criticality: 'medium',
    taskType: decision.taskType,
    channel: 'dashboard',
    locale: 'es',
    message: '[redacted-shadow-parity]',
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

function hashBucket(value: unknown): number {
  const hash = stableHash(value);
  const prefix = Number.parseInt(hash.slice(0, 8), 16);
  return prefix / 0xffffffff;
}
