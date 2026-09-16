import { runKiaDecision } from './kia-decision-engine';
import { runKiaOrchestratedDecision } from './kia-orchestrator';
import type { KiaActorCapabilitySnapshot } from './kia-actor-capability-resolver';
import { toKiaPolicyActorContext } from './kia-actor-capability-resolver';
import {
  policyProfileToToolAuthorization,
  resolveKiaPolicyProfile,
  type KiaPolicyProfileName,
} from './kia-policy-profiles';
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
): ReturnType<typeof runKiaOrchestratedDecision> {
  const policy = resolveKiaPolicyAuthorization(profileName, actor);
  if (!policy.ok) {
    throw new Error(`KIA policy denied: ${policy.reason}`);
  }

  return runKiaOrchestratedDecision({
    input: {
      ...input,
      channel: policy.authorization.channel,
    },
    policyAuthorization: {
      ...policy.authorization,
      requestedNames: [...policy.toolNames],
      allowedEffects: policy.authorization.allowedEffects
        ? [...policy.authorization.allowedEffects]
        : undefined,
    },
    policyToolNames: [...policy.toolNames],
  });
}
