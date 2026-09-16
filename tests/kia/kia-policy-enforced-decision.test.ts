import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROLES } from '@/lib/auth/roles';
import { deriveKiaActorCapabilities } from '@/lib/ai/kia/kia-actor-capability-resolver';
import { resolveKiaPolicyToolNames } from '@/lib/ai/kia/kia-policy-enforced-decision';
import { getKiaToolPolicy } from '@/lib/ai/kia/kia-tool-registry';

function clientActor() {
  return deriveKiaActorCapabilities({
    userId: 'user-1',
    clientId: 'user-1',
    profile: { role: ROLES.CLIENT, status: 'active', tenant_id: 'tenant-1' },
    companyId: 'company-1',
    membership: { company_id: 'company-1', role: 'owner' },
    coverage: {
      covered: true,
      source: 'direct_subscription',
      companyId: 'company-1',
      subscriptionId: 'sub-1',
      subscriptionStatus: 'active',
      planName: 'Profesional',
      primaryCompanyId: 'company-1',
      primaryCompanyName: null,
      coverageScope: 'subscription_fee',
      entitlementId: null,
      validFrom: null,
      validUntil: null,
      excludedServices: [],
    },
  });
}

describe('KIA policy-enforced decision', () => {
  it('exposes only autonomous R0/R1 read tools for client dashboard', () => {
    const resolved = resolveKiaPolicyToolNames('client_dashboard', clientActor());
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    expect(resolved.toolNames.length).toBeGreaterThan(0);
    for (const name of resolved.toolNames) {
      const policy = getKiaToolPolicy(name);
      expect(policy).not.toBeNull();
      expect(policy?.effect).toBe('read');
      expect(['R0', 'R1']).toContain(policy?.riskTier);
      expect(policy?.requiresHumanApproval).toBe(false);
    }
    expect(resolved.toolNames).not.toContain('create_internal_task');
    expect(resolved.toolNames).not.toContain('create_next_best_action');
    expect(resolved.toolNames).not.toContain('create_kia_decision_log');
  });

  it('keeps internal admin denied without explicit admin scope even for owner', () => {
    const actor = deriveKiaActorCapabilities({
      userId: 'owner-1',
      clientId: 'client-1',
      profile: { role: ROLES.OWNER, status: 'active', tenant_id: 'tenant-1' },
      featureFlags: ['kia_internal_admin_mode'],
    });
    expect(resolveKiaPolicyToolNames('internal_admin', actor))
      .toMatchObject({ ok: false, reason: 'missing_scope' });
  });

  it('propagates effective authorization into visibility and execution barriers', () => {
    const wrapper = readFileSync(
      resolve(process.cwd(), 'lib/ai/kia/kia-policy-enforced-decision.ts'),
      'utf8',
    );
    const engine = readFileSync(
      resolve(process.cwd(), 'lib/ai/kia/kia-decision-engine.ts'),
      'utf8',
    );

    expect(wrapper).toContain('const initialSkillAuthorization = resolveKiaSkillAuthorization({');
    expect(wrapper).toContain('const effectiveAuthorization = {');
    expect(wrapper).toContain('toolAuthorization: {');
    expect(wrapper).toContain('maxRiskTier: effectiveAuthorization.maxRiskTier');
    expect(wrapper).toContain('allowedEffects: effectiveAuthorization.allowedEffects');
    expect(wrapper).toContain('autonomousOnly: effectiveAuthorization.autonomousOnly');

    expect(engine).toContain("toolAuthorization?: Pick<KiaToolAuthorizationContext, 'maxRiskTier' | 'allowedEffects' | 'autonomousOnly'>");
    expect(engine).toContain('const effectiveToolAuthorization: KiaToolAuthorizationContext = {');
    expect(engine).toContain('...input.toolAuthorization');
    expect(engine).toContain('channel: input.channel');
    expect(engine).toContain('requestedNames: input.allowedToolNames');
    expect(engine).toContain('resolveKiaToolDefinitions(effectiveToolAuthorization)');
    expect(engine).toContain('isKiaToolAuthorized(req.toolName, effectiveToolAuthorization)');
  });
});
