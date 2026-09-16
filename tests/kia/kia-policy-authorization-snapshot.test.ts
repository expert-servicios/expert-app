import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROLES } from '@/lib/auth/roles';
import {
  resolveKiaPolicyAuthorization,
} from '@/lib/ai/kia/kia-policy-enforced-decision';
import type { KiaActorCapabilitySnapshot } from '@/lib/ai/kia/kia-actor-capability-resolver';

function actor(overrides: Partial<KiaActorCapabilitySnapshot> = {}): KiaActorCapabilitySnapshot {
  return {
    userId: '11111111-1111-1111-1111-111111111111',
    clientId: '11111111-1111-1111-1111-111111111111',
    role: ROLES.CLIENT,
    active: true,
    tenantId: null,
    companyId: null,
    companyMember: false,
    companyMembershipRole: null,
    coverage: null,
    planCapabilities: [],
    scopes: ['kia:authenticated', 'kia:self:read'],
    featureFlags: [],
    acceptedGrantIds: [],
    rejectedGrantIds: [],
    ...overrides,
  };
}

describe('KIA policy authorization snapshot', () => {
  it('retains full client-dashboard constraints together with resolved names', () => {
    const resolved = resolveKiaPolicyAuthorization('client_dashboard', actor());
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    expect(resolved.authorization.channel).toBe('dashboard');
    expect(resolved.authorization.maxRiskTier).toBe('R1');
    expect(resolved.authorization.allowedEffects).toEqual(['read']);
    expect(resolved.authorization.autonomousOnly).toBe(true);
    expect(resolved.authorization.requestedNames).toEqual(resolved.toolNames);
    expect(resolved.toolNames).not.toContain('create_internal_task');
    expect(resolved.toolNames).not.toContain('create_next_best_action');
    expect(resolved.toolNames).not.toContain('create_kia_decision_log');
  });

  it('fails closed when the actor cannot use an elevated profile', () => {
    expect(resolveKiaPolicyAuthorization('professional_operator', actor())).toEqual({
      ok: false,
      reason: 'role_not_allowed',
    });
  });

  it('overrides caller channel and allowlist after effective authorization and input spread', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'lib/ai/kia/kia-policy-enforced-decision.ts'),
      'utf8',
    );
    const spread = source.indexOf('...input');
    const channel = source.indexOf('channel: effectiveAuthorization.channel');
    const allowlist = source.indexOf('allowedToolNames: effectiveToolNames');

    expect(spread).toBeGreaterThan(-1);
    expect(channel).toBeGreaterThan(spread);
    expect(allowlist).toBeGreaterThan(channel);
  });
});
