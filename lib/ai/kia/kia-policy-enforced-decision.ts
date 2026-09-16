import { runKiaDecision } from './kia-decision-engine';
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
): Promise<Awaited<ReturnType<typeof runKiaDecision>>> {
  const policy = resolveKiaPolicyAuthorization(profileName, actor);
  if (!policy.ok) {
    throw new Error(`KIA policy denied: ${policy.reason}`);
  }

  // The caller cannot widen the profile. M4.6b propagates the immutable
  // policy-resolved constraints into both tool visibility and the engine's
  // pre-execution authorization barrier.
  return runKiaDecision({
    ...input,
    channel: policy.authorization.channel,
    allowedToolNames: policy.toolNames,
    toolAuthorization: {
      maxRiskTier: policy.authorization.maxRiskTier,
      allowedEffects: policy.authorization.allowedEffects
        ? [...policy.authorization.allowedEffects]
        : undefined,
      autonomousOnly: policy.authorization.autonomousOnly,
    },
  });
}
