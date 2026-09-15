import { ROLES, type AppRole } from '@/lib/auth/roles';
import type { KiaChannel } from './kia-output-schema';
import type {
  KiaToolAuthorizationContext,
  KiaToolEffect,
  KiaToolRiskTier,
} from './kia-tool-registry';

export type KiaPolicyProfileName =
  | 'client_dashboard'
  | 'shadow_read_only'
  | 'professional_operator'
  | 'internal_admin';

export interface KiaPolicyProfileDefinition {
  name: KiaPolicyProfileName;
  channel: KiaChannel;
  allowedRoles: AppRole[];
  maxRiskTier: KiaToolRiskTier;
  futureRiskCeiling: KiaToolRiskTier;
  allowedEffects: KiaToolEffect[];
  autonomousOnly: boolean;
  requiredPlanCapabilities: string[];
  requiredScopes: string[];
  requiredFeatureFlags: string[];
}

export interface KiaPolicyActorContext {
  role: AppRole;
  planCapabilities?: string[];
  scopes?: string[];
  featureFlags?: string[];
}

export interface KiaResolvedPolicyProfile {
  ok: boolean;
  profile: KiaPolicyProfileDefinition;
  missingPlanCapabilities: string[];
  missingScopes: string[];
  missingFeatureFlags: string[];
  reason?: string;
}

const POLICY_PROFILES: Record<KiaPolicyProfileName, KiaPolicyProfileDefinition> = {
  client_dashboard: {
    name: 'client_dashboard',
    channel: 'dashboard',
    allowedRoles: [ROLES.CLIENT, ROLES.TENANT_ADMIN, ROLES.ADMIN, ROLES.OWNER],
    maxRiskTier: 'R1',
    futureRiskCeiling: 'R1',
    allowedEffects: ['read'],
    autonomousOnly: true,
    requiredPlanCapabilities: [],
    requiredScopes: [],
    requiredFeatureFlags: [],
  },
  shadow_read_only: {
    name: 'shadow_read_only',
    channel: 'dashboard',
    allowedRoles: [ROLES.CLIENT, ROLES.TENANT_ADMIN, ROLES.ADMIN, ROLES.OWNER],
    maxRiskTier: 'R1',
    futureRiskCeiling: 'R1',
    allowedEffects: ['read'],
    autonomousOnly: true,
    requiredPlanCapabilities: [],
    requiredScopes: [],
    requiredFeatureFlags: [],
  },
  professional_operator: {
    name: 'professional_operator',
    channel: 'admin',
    allowedRoles: [ROLES.TENANT_ADMIN, ROLES.ADMIN, ROLES.OWNER],
    maxRiskTier: 'R1',
    futureRiskCeiling: 'R4',
    allowedEffects: ['read', 'draft'],
    autonomousOnly: false,
    requiredPlanCapabilities: ['kia.operator'],
    requiredScopes: ['kia:operator'],
    requiredFeatureFlags: ['kia_operator_mode'],
  },
  internal_admin: {
    name: 'internal_admin',
    channel: 'admin',
    allowedRoles: [ROLES.ADMIN, ROLES.OWNER],
    maxRiskTier: 'R1',
    futureRiskCeiling: 'R5',
    allowedEffects: ['read', 'draft', 'write'],
    autonomousOnly: false,
    requiredPlanCapabilities: [],
    requiredScopes: ['kia:admin'],
    requiredFeatureFlags: ['kia_internal_admin_mode'],
  },
};

export function getKiaPolicyProfile(name: KiaPolicyProfileName): KiaPolicyProfileDefinition {
  return POLICY_PROFILES[name];
}

export function resolveKiaPolicyProfile(
  name: KiaPolicyProfileName,
  actor: KiaPolicyActorContext,
): KiaResolvedPolicyProfile {
  const profile = getKiaPolicyProfile(name);
  const missingPlanCapabilities = missing(profile.requiredPlanCapabilities, actor.planCapabilities);
  const missingScopes = missing(profile.requiredScopes, actor.scopes);
  const missingFeatureFlags = missing(profile.requiredFeatureFlags, actor.featureFlags);

  if (!profile.allowedRoles.includes(actor.role)) {
    return { ok: false, profile, missingPlanCapabilities, missingScopes, missingFeatureFlags, reason: 'role_not_allowed' };
  }
  if (missingPlanCapabilities.length > 0) {
    return { ok: false, profile, missingPlanCapabilities, missingScopes, missingFeatureFlags, reason: 'missing_plan_capability' };
  }
  if (missingScopes.length > 0) {
    return { ok: false, profile, missingPlanCapabilities, missingScopes, missingFeatureFlags, reason: 'missing_scope' };
  }
  if (missingFeatureFlags.length > 0) {
    return { ok: false, profile, missingPlanCapabilities, missingScopes, missingFeatureFlags, reason: 'feature_flag_disabled' };
  }

  return { ok: true, profile, missingPlanCapabilities: [], missingScopes: [], missingFeatureFlags: [] };
}

export function policyProfileToToolAuthorization(
  profile: KiaPolicyProfileDefinition,
  requestedNames?: string[],
): KiaToolAuthorizationContext {
  return {
    channel: profile.channel,
    requestedNames,
    maxRiskTier: profile.maxRiskTier,
    allowedEffects: profile.allowedEffects,
    autonomousOnly: profile.autonomousOnly,
  };
}

export function normalizeKiaActorRole(role: string | null | undefined): AppRole {
  const values = Object.values(ROLES) as AppRole[];
  return role && values.includes(role as AppRole) ? role as AppRole : ROLES.CLIENT;
}

function missing(required: string[], granted: string[] | undefined): string[] {
  if (required.length === 0) return [];
  const grantedSet = new Set(granted ?? []);
  return required.filter((item) => !grantedSet.has(item));
}
