import { describe, expect, it } from 'vitest';
import { ROLES } from '@/lib/auth/roles';
import {
  deriveKiaActorCapabilities,
  getEnabledKiaPolicyFeatureFlags,
  toKiaPolicyActorContext,
} from '@/lib/ai/kia/kia-actor-capability-resolver';
import { resolveKiaPolicyProfile } from '@/lib/ai/kia/kia-policy-profiles';

const COVERAGE = {
  covered: true,
  source: 'included_entity' as const,
  companyId: 'company-1',
  subscriptionId: 'sub-1',
  subscriptionStatus: 'active',
  planName: 'Profesional',
  primaryCompanyId: 'company-primary',
  primaryCompanyName: 'Primary SL',
  coverageScope: 'recurring_management',
  entitlementId: 'ent-1',
  validFrom: null,
  validUntil: null,
  excludedServices: [],
};

describe('KIA actor capability resolver', () => {
  it('derives client read scopes and commercial coverage without elevating privileges', () => {
    const snapshot = deriveKiaActorCapabilities({
      userId: 'user-1',
      clientId: 'user-1',
      profile: { role: ROLES.CLIENT, status: 'active', tenant_id: 'tenant-1' },
      companyId: 'company-1',
      membership: { company_id: 'company-1', role: 'owner' },
      coverage: COVERAGE,
      featureFlags: [],
    });

    expect(snapshot.companyMember).toBe(true);
    expect(snapshot.planCapabilities).toEqual([
      'subscription.covered',
      'subscription.scope.recurring_management',
      'subscription.source.included_entity',
    ]);
    expect(snapshot.scopes).toEqual(['kia:authenticated', 'kia:company:read', 'kia:self:read']);
    expect(snapshot.scopes).not.toContain('kia:operator');
    expect(snapshot.scopes).not.toContain('kia:admin');
  });

  it('drops company coverage when actor is not a member of the selected company', () => {
    const snapshot = deriveKiaActorCapabilities({
      userId: 'user-1',
      clientId: 'user-1',
      profile: { role: ROLES.CLIENT, status: 'active', tenant_id: 'tenant-1' },
      companyId: 'company-2',
      membership: { company_id: 'company-1', role: 'owner' },
      coverage: COVERAGE,
    });

    expect(snapshot.companyMember).toBe(false);
    expect(snapshot.coverage).toBeNull();
    expect(snapshot.planCapabilities).toEqual([]);
    expect(snapshot.scopes).toEqual(['kia:authenticated', 'kia:self:read']);
  });

  it('does not infer elevated KIA privileges from admin or owner role alone', () => {
    for (const role of [ROLES.ADMIN, ROLES.OWNER] as const) {
      const snapshot = deriveKiaActorCapabilities({
        userId: 'staff-1',
        clientId: 'client-1',
        profile: { role, status: 'active', tenant_id: 'tenant-1' },
        companyId: 'company-1',
        membership: { company_id: 'company-1', role: 'staff' },
        coverage: COVERAGE,
        featureFlags: ['kia_internal_admin_mode'],
      });

      expect(snapshot.scopes).toContain('kia:staff:read');
      expect(snapshot.scopes).not.toContain('kia:admin');
      expect(resolveKiaPolicyProfile('internal_admin', toKiaPolicyActorContext(snapshot)))
        .toMatchObject({ ok: false, reason: 'missing_scope' });
    }
  });

  it('keeps professional operator fail-closed even with commercial coverage and feature flag', () => {
    const snapshot = deriveKiaActorCapabilities({
      userId: 'tenant-admin-1',
      clientId: 'client-1',
      profile: { role: ROLES.TENANT_ADMIN, status: 'active', tenant_id: 'tenant-1' },
      companyId: 'company-1',
      membership: { company_id: 'company-1', role: 'admin' },
      coverage: COVERAGE,
      featureFlags: ['kia_operator_mode'],
    });

    const resolved = resolveKiaPolicyProfile('professional_operator', toKiaPolicyActorContext(snapshot));
    expect(resolved.ok).toBe(false);
    expect(resolved.reason).toBe('missing_plan_capability');
  });

  it('maps only explicit environment flags', () => {
    expect(getEnabledKiaPolicyFeatureFlags({
      KIA_OPERATOR_MODE_ENABLED: 'true',
      KIA_INTERNAL_ADMIN_MODE_ENABLED: 'FALSE',
    } as NodeJS.ProcessEnv)).toEqual(['kia_operator_mode']);
  });
});
