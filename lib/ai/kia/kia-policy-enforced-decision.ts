import { runKiaDecision } from './kia-decision-engine';
import type { KiaActorCapabilitySnapshot } from './kia-actor-capability-resolver';
import { toKiaPolicyActorContext } from './kia-actor-capability-resolver';
import {
  policyProfileToToolAuthorization,
  resolveKiaPolicyProfile,
  type KiaPolicyProfileName,
} from './kia-policy-profiles';
import { resolveKiaToolDefinitions } from './kia-tool-registry';

export function resolveKiaPolicyToolNames(
  profileName: KiaPolicyProfileName,
  actor: KiaActorCapabilitySnapshot,
): { ok: true; toolNames: string[] } | { ok: false; reason: string } {
  const resolved = resolveKiaPolicyProfile(profileName, toKiaPolicyActorContext(actor));
  if (!resolved.ok) return { ok: false, reason: resolved.reason ?? 'policy_denied' };

  const toolNames = resolveKiaToolDefinitions(
    policyProfileToToolAuthorization(resolved.profile),
  ).map((tool) => tool.name);

  return { ok: true, toolNames };
}

export async function runPolicyEnforcedKiaDecision(
  profileName: KiaPolicyProfileName,
  actor: KiaActorCapabilitySnapshot,
  input: Parameters<typeof runKiaDecision>[0],
): Promise<Awaited<ReturnType<typeof runKiaDecision>>> {
  const policy = resolveKiaPolicyToolNames(profileName, actor);
  if (!policy.ok) {
    throw new Error(`KIA policy denied: ${policy.reason}`);
  }

  return runKiaDecision({
    ...input,
    allowedToolNames: policy.toolNames,
  });
}
