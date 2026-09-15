import { describe, expect, it } from 'vitest';
import { ROLES } from '@/lib/auth/roles';
import { deriveKiaActorCapabilities } from '@/lib/ai/kia/kia-actor-capability-resolver';
import { resolveKiaExplicitGrants, type KiaExplicitGrant } from '@/lib/ai/kia/kia-explicit-grants';
import { resolveKiaPolicyProfile } from '@/lib/ai/kia/kia-policy-profiles';
import { toKiaPolicyActorContext } from '@/lib/ai/kia/kia-actor-capability-resolver';

const NOW = new Date('2026-09-15T14:00:00.000Z');

function grant(overrides: Partial<KiaExplicitGrant>): KiaExplicitGrant {
  return {
    id: 'grant-1',
    kind: 'scope',
    value: 'kia:operator',
    source: 'staff_assignment',
    userId: 'user-1',
    tenantId: 'tenant-1',
    companyId: 'company-1',
    active: true,
    validFrom: '2026-09-01T00:00:00.000Z',
    validUntil: '2026-10-01T00:00:00.000Z',
    revokedAt: null,
    ...overrides,
  };
}

describe('KIA explicit grants', () => {
  it('accepts only active grants bound to the current actor, tenant and company', () => {
    const resolved = resolveKiaExplicitGrants([
      grant({ id: 'ok' }),
      grant({ id: 'wrong-user', userId: 'other' }),
      grant({ id: 'wrong-tenant', tenantId: 'tenant-2' }),
      grant({ id: 'wrong-company', companyId: 'company-2' }),
    ], {
      userId: 'user-1', tenantId: 'tenant-1', companyId: 'company-1', now: NOW,
    });

    expect(resolved.scopes).toEqual(['kia:operator']);
    expect(resolved.acceptedGrantIds).toEqual(['ok']);
    expect(resolved.rejectedGrantIds).toEqual(['wrong-company', 'wrong-tenant', 'wrong-user']);
  });

  it('rejects expired, future, revoked and unknown elevated values', () => {
    const resolved = resolveKiaExplicitGrants([
      grant({ id: 'expired', validUntil: '2026-09-15T13:59:59.000Z' }),
      grant({ id: 'future', validFrom: '2026-09-16T00:00:00.000Z' }),
      grant({ id: 'revoked', revokedAt: '2026-09-10T00:00:00.000Z' }),
      grant({ id: 'unknown', value: 'kia:root' }),
    ], {
      userId: 'user-1', tenantId: 'tenant-1', companyId: 'company-1', now: NOW,
    });

    expect(resolved.scopes).toEqual([]);
    expect(resolved.acceptedGrantIds).toEqual([]);
    expect(resolved.rejectedGrantIds).toHaveLength(4);
  });

  it('enables professional_operator only when capability, scope and feature flag all exist', () => {
    const actor = deriveKiaActorCapabilities({
      userId: 'user-1',
      clientId: 'user-1',
      profile: { role: ROLES.TENANT_ADMIN, status: 'active', tenant_id: 'tenant-1' },
      companyId: 'company-1',
      membership: { company_id: 'company-1', role: 'admin' },
      featureFlags: ['kia_operator_mode'],
      explicitGrants: [
        grant({ id: 'operator-scope', kind: 'scope', value: 'kia:operator' }),
        grant({ id: 'operator-cap', kind: 'plan_capability', value: 'kia.operator', source: 'subscription_entitlement' }),
      ],
      now: NOW,
    });

    expect(resolveKiaPolicyProfile('professional_operator', toKiaPolicyActorContext(actor)).ok).toBe(true);
    expect(actor.acceptedGrantIds).toEqual(['operator-cap', 'operator-scope']);
  });

  it('enables internal_admin only for an allowed role with explicit admin scope and flag', () => {
    const actor = deriveKiaActorCapabilities({
      userId: 'user-1',
      clientId: 'user-1',
      profile: { role: ROLES.OWNER, status: 'active', tenant_id: 'tenant-1' },
      featureFlags: ['kia_internal_admin_mode'],
      explicitGrants: [grant({ id: 'admin-scope', value: 'kia:admin', companyId: null, source: 'manual_approval' })],
      now: NOW,
    });

    expect(resolveKiaPolicyProfile('internal_admin', toKiaPolicyActorContext(actor)).ok).toBe(true);
  });

  it('rejects every explicit grant for an inactive actor', () => {
    const actor = deriveKiaActorCapabilities({
      userId: 'user-1',
      clientId: 'user-1',
      profile: { role: ROLES.OWNER, status: 'inactive', tenant_id: 'tenant-1' },
      featureFlags: ['kia_internal_admin_mode'],
      explicitGrants: [grant({ id: 'admin-scope', value: 'kia:admin', companyId: null })],
      now: NOW,
    });

    expect(actor.scopes).toEqual([]);
    expect(actor.acceptedGrantIds).toEqual([]);
    expect(actor.rejectedGrantIds).toEqual(['admin-scope']);
  });
});
