// Model pricing (USD per 1M tokens).
// Verified 2026-10-01 against official OpenAI, Anthropic and Google pricing.
// Keep this table conservative and explicit: an unknown model must be visible
// in telemetry instead of silently inheriting a cheaper price.
const MODEL_PRICING: Record<string, { inputPer1M: number; outputPer1M: number }> = {
  'claude-sonnet-5':            { inputPer1M: 2.00,  outputPer1M: 10.00 },
  'claude-sonnet-4-6':          { inputPer1M: 3.00,  outputPer1M: 15.00 },
  'claude-haiku-4-5-20251001':  { inputPer1M: 1.00,  outputPer1M: 5.00  },
  'claude-haiku-4-5':           { inputPer1M: 1.00,  outputPer1M: 5.00  },
  'claude-opus-4-8':            { inputPer1M: 5.00,  outputPer1M: 25.00 },
  'gpt-5.6-sol':                { inputPer1M: 4.00,  outputPer1M: 20.00 },
  'gpt-5.6-terra':              { inputPer1M: 2.00,  outputPer1M: 12.00 },
  'gpt-5.6-luna':               { inputPer1M: 0.20,  outputPer1M: 1.20  },
  'gpt-4.1-mini':               { inputPer1M: 0.40,  outputPer1M: 1.60  },
  'gpt-4o':                     { inputPer1M: 5.00,  outputPer1M: 15.00 },
  'gemini-3.8-flash':           { inputPer1M: 0.75,  outputPer1M: 3.75  },
  'gemini-3.6-flash':           { inputPer1M: 0.75,  outputPer1M: 3.75  },
  'gemini-3.5-flash':           { inputPer1M: 1.50,  outputPer1M: 9.00  },
  'gemini-2.5-flash':           { inputPer1M: 0.30,  outputPer1M: 2.50  },
  'text-embedding-3-small':     { inputPer1M: 0.02,  outputPer1M: 0     },
};

export interface KiaTokenUsage {
  tokensIn: number;
  tokensOut: number;
}

export interface KiaCostEstimate extends KiaTokenUsage {
  estimatedCostUsd: number;
  model: string;
  pricingKnown: boolean;
}

function normalizeModelName(model: string): string {
  return model.trim().replace(/^(?:openai|anthropic|google)\//, '');
}

export function estimateCost(model: string, tokensIn: number, tokensOut: number): KiaCostEstimate {
  const normalizedModel = normalizeModelName(model);
  const pricing = MODEL_PRICING[normalizedModel];
  const estimatedCostUsd = pricing
    ? (tokensIn * pricing.inputPer1M + tokensOut * pricing.outputPer1M) / 1_000_000
    : 0;
  return { model, tokensIn, tokensOut, estimatedCostUsd, pricingKnown: Boolean(pricing) };
}

export function sumCostEstimates(estimates: KiaCostEstimate[]): KiaCostEstimate {
  if (!estimates.length) return { model: 'unknown', tokensIn: 0, tokensOut: 0, estimatedCostUsd: 0, pricingKnown: false };
  return {
    model: estimates.map((e) => e.model).join('+'),
    tokensIn: estimates.reduce((s, e) => s + e.tokensIn, 0),
    tokensOut: estimates.reduce((s, e) => s + e.tokensOut, 0),
    estimatedCostUsd: estimates.reduce((s, e) => s + e.estimatedCostUsd, 0),
    pricingKnown: estimates.every((e) => e.pricingKnown),
  };
}

/**
 * Normalizes usage from Anthropic Messages, OpenAI Responses and legacy
 * OpenAI Chat Completions so evals can compare cost on the same axes.
 */
export function extractTokenUsageFromProviderResult(providerResult: unknown): KiaTokenUsage {
  if (!providerResult || typeof providerResult !== 'object') return { tokensIn: 0, tokensOut: 0 };
  const r = providerResult as Record<string, unknown>;
  const usage = r.usage as Record<string, unknown> | undefined;

  const tokensIn = firstNumber(
    usage?.input_tokens,
    usage?.prompt_tokens,
    usage?.inputTokens,
  );
  const tokensOut = firstNumber(
    usage?.output_tokens,
    usage?.completion_tokens,
    usage?.outputTokens,
  );

  return { tokensIn, tokensOut };
}

function firstNumber(...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return 0;
}
