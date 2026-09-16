import type { KiaTaskType } from './kia-output-schema';
import { selectKiaSkill, type KiaSkillDefinition } from './kia-skill-registry';
import {
  getKiaToolsForCapability,
  resolveKiaToolDefinitions,
  type KiaToolAuthorizationContext,
  type KiaToolRiskTier,
} from './kia-tool-registry';

const RISK_RANK: Record<KiaToolRiskTier, number> = {
  R0: 0,
  R1: 1,
  R2: 2,
  R3: 3,
  R4: 4,
  R5: 5,
};

export interface KiaSkillAuthorizationResolution {
  skill: KiaSkillDefinition | null;
  authorization: KiaToolAuthorizationContext;
  toolNames: string[];
}

function lowerRiskTier(a: KiaToolRiskTier | undefined, b: KiaToolRiskTier): KiaToolRiskTier {
  const left = a ?? 'R1';
  return RISK_RANK[left] <= RISK_RANK[b] ? left : b;
}

export function resolveKiaSkillAuthorization(params: {
  taskType: KiaTaskType;
  detectedIntent?: string | null;
  policyAuthorization: KiaToolAuthorizationContext;
  policyToolNames: string[];
}): KiaSkillAuthorizationResolution {
  const skill = selectKiaSkill({
    taskType: params.taskType,
    detectedIntent: params.detectedIntent,
  });

  if (!skill) {
    return {
      skill: null,
      authorization: {
        ...params.policyAuthorization,
        requestedNames: [...params.policyToolNames],
        allowedEffects: params.policyAuthorization.allowedEffects
          ? [...params.policyAuthorization.allowedEffects]
          : undefined,
      },
      toolNames: [...params.policyToolNames],
    };
  }

  const skillToolNames = new Set(
    skill.requiredToolCapabilities.flatMap((capability) => getKiaToolsForCapability(capability)),
  );
  const requestedNames = params.policyToolNames.filter((name) => skillToolNames.has(name));
  const authorization: KiaToolAuthorizationContext = {
    channel: params.policyAuthorization.channel,
    requestedNames,
    maxRiskTier: lowerRiskTier(params.policyAuthorization.maxRiskTier, skill.maxRiskTier),
    allowedEffects: params.policyAuthorization.allowedEffects
      ? [...params.policyAuthorization.allowedEffects]
      : undefined,
    autonomousOnly: params.policyAuthorization.autonomousOnly,
  };
  const toolNames = resolveKiaToolDefinitions(authorization).map((tool) => tool.name);

  return {
    skill,
    authorization: {
      ...authorization,
      requestedNames: [...toolNames],
    },
    toolNames,
  };
}
