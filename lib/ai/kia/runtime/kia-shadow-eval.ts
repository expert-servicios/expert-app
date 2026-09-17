import type { KiaProviderRequest, KiaProviderResult } from '../kia-provider-router';
import { stableHash } from '../kia-redaction';
import { runOpenAiResponsesRequest } from './openai-responses-adapter';

export interface KiaShadowEvalResult {
  enabled: boolean;
  provider: 'openai';
  model?: string;
  inputHash: string;
  outputHash?: string;
  hasError: boolean;
  error?: string;
  latencyMs?: number;
  result?: KiaProviderResult;
}

export function isKiaResponsesShadowEnabled(): boolean {
  return process.env.KIA_OPENAI_RESPONSES_SHADOW_ENABLED?.toLowerCase() === 'true';
}

/**
 * Runs the OpenAI Responses adapter only when the explicit shadow flag is on.
 * The caller decides where/if to persist comparison metadata. This function
 * never changes the primary KIA answer or executes returned tool calls.
 */
export async function runKiaResponsesShadow(
  request: KiaProviderRequest,
): Promise<KiaShadowEvalResult> {
  const inputHash = stableHash({
    taskType: request.taskType,
    systemPrompt: request.systemPrompt,
    messages: request.messages,
    tools: request.tools?.map((tool) => tool.name) ?? [],
  });

  if (!isKiaResponsesShadowEnabled()) {
    return { enabled: false, provider: 'openai', inputHash, hasError: false };
  }

  const startedAt = Date.now();
  const result = await runOpenAiResponsesRequest(request);
  const latencyMs = Date.now() - startedAt;

  return {
    enabled: true,
    provider: 'openai',
    model: result.model,
    inputHash,
    outputHash: stableHash({
      parsedJson: result.parsedJson,
      rawText: result.rawText,
      toolCalls: result.toolCalls,
    }),
    hasError: Boolean(result.error),
    ...(result.error ? { error: result.error } : {}),
    latencyMs,
    result,
  };
}
