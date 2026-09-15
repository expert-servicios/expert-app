import type { KiaDecision } from '../kia-output-schema';
import type { KiaProviderRequest, KiaProviderResult } from '../kia-provider-router';
import { estimateCost, extractTokenUsageFromProviderResult } from '../kia-cost-tracker';
import { stableHash } from '../kia-redaction';
import { runKiaResponsesShadow, type KiaShadowEvalResult } from '../runtime/kia-shadow-eval';
import { compareKiaEvalResults, evaluateKiaObservation } from './kia-evaluator';
import type { KiaEvalCase, KiaEvalComparison, KiaEvalResult } from './kia-eval-types';

export interface KiaBaselineObservationInput {
  decision: KiaDecision;
  providerResult?: KiaProviderResult;
  latencyMs?: number;
  estimatedCostUsd?: number;
}

export interface KiaBaselineVsShadowResult {
  enabled: boolean;
  caseId: string;
  inputHash: string;
  baselineHash: string;
  candidateHash?: string;
  baseline: KiaEvalResult;
  candidate?: KiaEvalResult;
  comparison?: KiaEvalComparison;
  shadow: Omit<KiaShadowEvalResult, 'result'>;
}

/**
 * Compares the decision already chosen by KIA with an OpenAI Responses shadow
 * run. The baseline remains authoritative. The candidate can never execute
 * tools or change the response returned to the user.
 */
export async function runKiaBaselineVsResponsesShadow(params: {
  evalCase: KiaEvalCase;
  request: KiaProviderRequest;
  baseline: KiaBaselineObservationInput;
}): Promise<KiaBaselineVsShadowResult> {
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

  const shadow = await runKiaResponsesShadow(params.request);
  const { result: shadowProviderResult, ...safeShadow } = shadow;

  if (!shadow.enabled || !shadowProviderResult) {
    return {
      enabled: false,
      caseId: params.evalCase.id,
      inputHash: shadow.inputHash,
      baselineHash,
      baseline,
      shadow: safeShadow,
    };
  }

  const candidate = evaluateKiaObservation(params.evalCase, {
    provider: shadowProviderResult.provider,
    model: shadowProviderResult.model,
    decision: shadowProviderResult.parsedJson,
    latencyMs: shadow.latencyMs,
    estimatedCostUsd: estimateProviderResultCost(shadowProviderResult),
    error: shadowProviderResult.error,
  });

  const comparison = compareKiaEvalResults(baseline, candidate);

  return {
    enabled: true,
    caseId: params.evalCase.id,
    inputHash: shadow.inputHash,
    baselineHash,
    candidateHash: shadow.outputHash,
    baseline,
    candidate,
    comparison,
    shadow: safeShadow,
  };
}

export function estimateProviderResultCost(result?: KiaProviderResult): number | undefined {
  if (!result?.usage || !result.model) return undefined;
  const { tokensIn, tokensOut } = extractTokenUsageFromProviderResult(result);
  return estimateCost(result.model, tokensIn, tokensOut).estimatedCostUsd;
}
