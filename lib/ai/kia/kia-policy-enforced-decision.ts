import { runKiaDecision } from './kia-decision-engine';
import type { KiaActorCapabilitySnapshot } from './kia-actor-capability-resolver';
import { toKiaPolicyActorContext } from './kia-actor-capability-resolver';
import {
  policyProfileToToolAuthorization,
  resolveKiaPolicyProfile,
  type KiaPolicyProfileName,
} from './kia-policy-profiles';
import {
  buildKiaSkillExecutionTrace,
  resolveKiaSkillAuthorization,
} from './kia-skill-execution';
import {
  resolveKiaToolDefinitions,
  type KiaToolAuthorizationContext,
} from './kia-tool-registry';

export type KiaResolvedPolicyAuthorization = {
  ok: true;
  authorization: KiaToolAuthorizationContext;
  toolNames: string[];
} | {
  ok: false;
  reason: string;
};

export function resolveKiaPolicyAuthorization(
  profileName: KiaPolicyProfileName,
  actor: KiaActorCapabilitySnapshot,
): KiaResolvedPolicyAuthorization {
  const resolved = resolveKiaPolicyProfile(profileName, toKiaPolicyActorContext(actor));
  if (!resolved.ok) return { ok: false, reason: resolved.reason ?? 'policy_denied' };

  const authorization = policyProfileToToolAuthorization(resolved.profile);
  const toolNames = resolveKiaToolDefinitions(authorization).map((tool) => tool.name);

  return {
    ok: true,
    authorization: {
      channel: authorization.channel,
      requestedNames: [...toolNames],
      maxRiskTier: authorization.maxRiskTier,
      allowedEffects: authorization.allowedEffects ? [...authorization.allowedEffects] : undefined,
      autonomousOnly: authorization.autonomousOnly,
    },
    toolNames,
  };
}

export function resolveKiaPolicyToolNames(
  profileName: KiaPolicyProfileName,
  actor: KiaActorCapabilitySnapshot,
): { ok: true; toolNames: string[] } | { ok: false; reason: string } {
  const resolved = resolveKiaPolicyAuthorization(profileName, actor);
  return resolved.ok
    ? { ok: true, toolNames: resolved.toolNames }
    : resolved;
}

export async function runPolicyEnforcedKiaDecision(
  profileName: KiaPolicyProfileName,
  actor: KiaActorCapabilitySnapshot,
  input: Parameters<typeof runKiaDecision>[0],
): Promise<Awaited<ReturnType<typeof runKiaDecision>> & {
  executionTrace: ReturnType<typeof buildKiaSkillExecutionTrace>;
}> {
  const policy = resolveKiaPolicyAuthorization(profileName, actor);
  if (!policy.ok) {
    throw new Error(`KIA policy denied: ${policy.reason}`);
  }

  const initialSkillAuthorization = resolveKiaSkillAuthorization({
    taskType: input.taskType,
    policyAuthorization: policy.authorization,
    policyToolNames: policy.toolNames,
  });

  // waba_reply can be reclassified after the engine starts. Until M7 moves
  // orchestration after classification, tools fail closed instead of inheriting
  // a broad profile before the final domain skill is known.
  const lateClassificationFailClosed = input.taskType === 'waba_reply' && !initialSkillAuthorization.skill;
  const effectiveToolNames = lateClassificationFailClosed
    ? []
    : initialSkillAuthorization.toolNames;
  const effectiveAuthorization = {
    ...initialSkillAuthorization.authorization,
    requestedNames: [...effectiveToolNames],
  };

  const executionTrace = buildKiaSkillExecutionTrace({
    taskType: input.taskType,
    resolution: {
      ...initialSkillAuthorization,
      authorization: effectiveAuthorization,
      toolNames: [...effectiveToolNames],
    },
    lateClassificationFailClosed,
  });

  const result = await runKiaDecision({
    ...input,
    channel: effectiveAuthorization.channel,
    allowedToolNames: effectiveToolNames,
    toolAuthorization: {
      maxRiskTier: effectiveAuthorization.maxRiskTier,
      allowedEffects: effectiveAuthorization.allowedEffects
        ? [...effectiveAuthorization.allowedEffects]
        : undefined,
      autonomousOnly: effectiveAuthorization.autonomousOnly,
    },
  });

  return {
    ...result,
    executionTrace,
  };
}
