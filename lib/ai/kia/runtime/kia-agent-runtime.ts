import type { KiaProviderRequest, KiaProviderResult } from '../kia-provider-router';
import {
  resolveKiaRuntimeProvider,
  type KiaRuntimeCapability,
  type KiaRuntimeProvider,
} from '../kia-capability-router';
import { runOpenAiResponsesRequest } from './openai-responses-adapter';

export interface KiaRuntimeRequest {
  capability: KiaRuntimeCapability;
  providerRequest: KiaProviderRequest;
  preferredProvider?: KiaRuntimeProvider;
  allowFallback?: boolean;
}

export interface KiaRuntimeExecution {
  provider: KiaRuntimeProvider | null;
  result: KiaProviderResult | null;
  usedFallback: boolean;
  error?: string;
}

export async function runKiaAgentRuntime(
  request: KiaRuntimeRequest,
): Promise<KiaRuntimeExecution> {
  const provider = resolveKiaRuntimeProvider({
    capability: request.capability,
    preferredProvider: request.preferredProvider,
    allowFallback: request.allowFallback,
  });

  if (!provider) {
    return {
      provider: null,
      result: null,
      usedFallback: false,
      error: `No runtime provider available for capability ${request.capability}`,
    };
  }

  if (provider === 'openai') {
    const result = await runOpenAiResponsesRequest(request.providerRequest);
    return {
      provider,
      result,
      usedFallback: request.preferredProvider != null && request.preferredProvider !== provider,
      ...(result.error ? { error: result.error } : {}),
    };
  }

  return {
    provider,
    result: null,
    usedFallback: request.preferredProvider != null && request.preferredProvider !== provider,
    error: provider === 'anthropic'
      ? 'Anthropic agent-runtime adapter is not active yet'
      : 'Deterministic runtime must be invoked through a domain executor',
  };
}
