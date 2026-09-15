import type { KiaChannel, KiaDecision, KiaTaskType } from '../kia-output-schema';
import type { KiaToolEffect, KiaToolRiskTier } from '../kia-tool-registry';

export type KiaEvalCriticality = 'low' | 'medium' | 'high' | 'legal';

export interface KiaEvalExpectation {
  intents?: KiaDecision['intent'][];
  nextActions?: KiaDecision['nextAction'][];
  requiredTools?: string[];
  forbiddenTools?: string[];
  allowedTools?: string[];
  expectedManualReview?: boolean;
  expectedMeeting?: boolean;
  minConfidence?: number;
  maxToolRiskTier?: KiaToolRiskTier;
  forbiddenToolEffects?: KiaToolEffect[];
}

export interface KiaEvalCase {
  id: string;
  title: string;
  domain: 'general' | 'client_data' | 'holded' | 'fiscal' | 'laboral' | 'documental' | 'reporting' | 'checkout';
  criticality: KiaEvalCriticality;
  taskType: KiaTaskType;
  channel: KiaChannel;
  locale: 'es' | 'ru';
  message: string;
  notes?: string;
  expectation: KiaEvalExpectation;
}

export interface KiaEvalObservation {
  provider: string;
  model: string;
  decision?: unknown;
  latencyMs?: number;
  estimatedCostUsd?: number;
  error?: string;
}

export interface KiaEvalDimensionScores {
  schema: number;
  intent: number;
  nextAction: number;
  tools: number;
  manualReview: number;
  confidence: number;
  safety: number;
  overall: number;
}

export interface KiaEvalResult {
  caseId: string;
  provider: string;
  model: string;
  validDecision: boolean;
  scores: KiaEvalDimensionScores;
  passed: boolean;
  hardFailures: string[];
  mismatches: string[];
  observedTools: string[];
  latencyMs?: number;
  estimatedCostUsd?: number;
  error?: string;
}

export interface KiaEvalComparison {
  caseId: string;
  baseline: KiaEvalResult;
  candidate: KiaEvalResult;
  scoreDelta: number;
  latencyDeltaMs?: number;
  costDeltaUsd?: number;
  regression: boolean;
  improvement: boolean;
  reasons: string[];
}

export interface KiaEvalSuiteSummary {
  total: number;
  passed: number;
  passRate: number;
  hardFailures: number;
  regressions: number;
  improvements: number;
  averageScore: number;
  releaseGatePassed: boolean;
}
