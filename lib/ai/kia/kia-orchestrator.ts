import type { KiaTaskType } from './kia-output-schema';
import { resolveKiaSkillAuthorization } from './kia-skill-execution';
import { selectSubAgentProfile, type KiaSubAgentProfile } from './kia-sub-agent-router';
import type { KiaToolAuthorizationContext } from './kia-tool-registry';

export interface KiaOrchestrationPlan {
  requestedTaskType: KiaTaskType;
  resolvedTaskType: KiaTaskType;
  detectedIntent: string | null;
  skillId: string | null;
  skillVersion: string | null;
  subAgent: KiaSubAgentProfile | null;
  authorization: KiaToolAuthorizationContext;
  toolNames: string[];
}

export function resolveKiaOrchestrationPlan(params: {
  requestedTaskType: KiaTaskType;
  resolvedTaskType: KiaTaskType;
  detectedIntent?: string | null;
  policyAuthorization: KiaToolAuthorizationContext;
  policyToolNames: string[];
}): KiaOrchestrationPlan {
  const skillAuthorization = resolveKiaSkillAuthorization({
    taskType: params.resolvedTaskType,
    detectedIntent: params.detectedIntent,
    policyAuthorization: params.policyAuthorization,
    policyToolNames: params.policyToolNames,
  });

  const subAgent = selectSubAgentProfile({
    taskType: params.resolvedTaskType,
    detectedIntent: params.detectedIntent ?? undefined,
  });

  return {
    requestedTaskType: params.requestedTaskType,
    resolvedTaskType: params.resolvedTaskType,
    detectedIntent: params.detectedIntent ?? null,
    skillId: skillAuthorization.skill?.id ?? null,
    skillVersion: skillAuthorization.skill?.version ?? null,
    subAgent,
    authorization: {
      ...skillAuthorization.authorization,
      requestedNames: skillAuthorization.authorization.requestedNames
        ? [...skillAuthorization.authorization.requestedNames]
        : undefined,
      allowedEffects: skillAuthorization.authorization.allowedEffects
        ? [...skillAuthorization.authorization.allowedEffects]
        : undefined,
    },
    toolNames: [...skillAuthorization.toolNames],
  };
}
