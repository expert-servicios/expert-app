export type KiaRuntimeProvider = 'openai' | 'anthropic' | 'deterministic';

export type KiaRuntimeCapability =
  | 'reasoning'
  | 'structured_output'
  | 'tool_use'
  | 'web_search'
  | 'file_search'
  | 'code_execution'
  | 'computer_use'
  | 'long_running_agent'
  | 'mcp';

export interface KiaProviderCapabilityProfile {
  provider: KiaRuntimeProvider;
  capabilities: Partial<Record<KiaRuntimeCapability, boolean>>;
  enabled: boolean;
  notes?: string[];
}

export interface KiaCapabilityRequest {
  capability: KiaRuntimeCapability;
  preferredProvider?: KiaRuntimeProvider;
  allowFallback?: boolean;
}

export const KIA_PROVIDER_CAPABILITIES: KiaProviderCapabilityProfile[] = [
  {
    provider: 'openai',
    enabled: true,
    capabilities: {
      reasoning: true,
      structured_output: true,
      tool_use: true,
      web_search: true,
      file_search: true,
      code_execution: true,
      computer_use: true,
      long_running_agent: true,
      mcp: true,
    },
    notes: ['Responses/Agents adoption is gradual and feature-flagged.'],
  },
  {
    provider: 'anthropic',
    enabled: true,
    capabilities: {
      reasoning: true,
      structured_output: true,
      tool_use: true,
      web_search: true,
      file_search: false,
      code_execution: false,
      computer_use: true,
      long_running_agent: false,
      mcp: true,
    },
    notes: ['Capability availability must be revalidated before production activation.'],
  },
  {
    provider: 'deterministic',
    enabled: true,
    capabilities: {
      reasoning: false,
      structured_output: true,
      tool_use: true,
      web_search: false,
      file_search: false,
      code_execution: true,
      computer_use: false,
      long_running_agent: true,
      mcp: true,
    },
    notes: ['Preferred for stable APIs, known workflows and deterministic browser steps.'],
  },
];

export function providersForCapability(capability: KiaRuntimeCapability): KiaRuntimeProvider[] {
  return KIA_PROVIDER_CAPABILITIES
    .filter((profile) => profile.enabled && profile.capabilities[capability] === true)
    .map((profile) => profile.provider);
}

export function resolveKiaRuntimeProvider(request: KiaCapabilityRequest): KiaRuntimeProvider | null {
  const candidates = providersForCapability(request.capability);
  if (request.preferredProvider && candidates.includes(request.preferredProvider)) {
    return request.preferredProvider;
  }
  if (request.preferredProvider && request.allowFallback === false) return null;

  // Safe default order: deterministic first when it can do the job, then OpenAI,
  // then Anthropic. Evals can later replace this static ordering.
  const priority: KiaRuntimeProvider[] = ['deterministic', 'openai', 'anthropic'];
  return priority.find((provider) => candidates.includes(provider)) ?? null;
}
