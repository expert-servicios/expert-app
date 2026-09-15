import { describe, expect, it } from 'vitest';
import { ROLES } from '@/lib/auth/roles';
import {
  getKiaPolicyProfile,
  normalizeKiaActorRole,
  policyProfileToToolAuthorization,
  resolveKiaPolicyProfile,
} from '@/lib/ai/kia/kia-policy-profiles';
import { resolveKiaToolDefinitions } from '@/lib/ai/kia/kia-tool-registry';

describe('KIA policy profiles', () => {
  it('keeps client dashboard and shadow read-only at R1', () => {
    for (const name of ['client_dashboard', 'shadow_read_only'] as const) {
      const profile = getKiaPolicyProfile(name);
      expect(profile.maxRiskTier).toBe('R1');
      expect(profile.allowedEffects).toEqual(['read']);
      expect(profile.autonomousOnly).toBe(true);
      expect(resolveKiaToolDefinitions(policyProfileToToolAuthorization(profile)).length).toBeGreaterThan(0);
    }
  });

  it('requires role, plan capability, scope and feature flag for professional operator', () => {
    expect(resolveKiaPolicyProfile('professional_operator', {
      role: ROLES.CLIENT,
      planCapabilities: ['kia.operator'],
      scopes: ['kia:operator'],
      featureFlags: ['kia_operator_mode'],
    })).toMatchObject({ ok: false, reason: 'role_not_allowed' });

    expect(resolveKiaPolicyProfile('professional_operator', {
      role: ROLES.TENANT_ADMIN,
      scopes: ['kia:operator'],
      featureFlags: ['kia_operator_mode'],
    })).toMatchObject({ ok: false, reason: 'missing_plan_capability' });

    expect(resolveKiaPolicyProfile('professional_operator', {
      role: ROLES.TENANT_ADMIN,
      planCapabilities: ['kia.operator'],
      featureFlags: ['kia_operator_mode'],
    })).toMatchObject({ ok: false, reason: 'missing_scope' });

    expect(resolveKiaPolicyProfile('professional_operator', {
      role: ROLES.TENANT_ADMIN,
      planCapabilities: ['kia.operator'],
      scopes: ['kia:operator'],
    })).toMatchObject({ ok: false, reason: 'feature_flag_disabled' });

    expect(resolveKiaPolicyProfile('professional_operator', {
      role: ROLES.TENANT_ADMIN,
      planCapabilities: ['kia.operator'],
      scopes: ['kia:operator'],
      featureFlags: ['kia_operator_mode'],
    }).ok).toBe(true);
  });

  it('stages future operator/admin ceilings without activating R2+', () => {
    const operator = getKiaPolicyProfile('professional_operator');
    const admin = getKiaPolicyProfile('internal_admin');
    expect(operator.maxRiskTier).toBe('R1');
    expect(operator.futureRiskCeiling).toBe('R4');
    expect(admin.maxRiskTier).toBe('R1');
    expect(admin.futureRiskCeiling).toBe('R5');
  });

  it('fails unknown application roles down to client', () => {
    expect(normalizeKiaActorRole('unexpected_role')).toBe(ROLES.CLIENT);
    expect(normalizeKiaActorRole(null)).toBe(ROLES.CLIENT);
    expect(normalizeKiaActorRole(ROLES.OWNER)).toBe(ROLES.OWNER);
  });
});
