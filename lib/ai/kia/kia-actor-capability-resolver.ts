import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { ROLES, type AppRole } from '@/lib/auth/roles';
import {
  resolveCompanyCommercialCoverage,
  type CompanyCommercialCoverage,
} from '@/lib/subscriptions/company-commercial-coverage';
import {
  normalizeKiaActorRole,
  type KiaPolicyActorContext,
} from './kia-policy-profiles';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export interface KiaActorCapabilitySnapshot {
  userId: string;
  clientId: string;
  role: AppRole;
  active: boolean;
  tenantId: string | null;
  companyId: string | null;
  companyMember: boolean;
  companyMembershipRole: string | null;
  coverage: CompanyCommercialCoverage | null;
  planCapabilities: string[];
  scopes: string[];
  featureFlags: string[];
}

interface DeriveActorCapabilityInput {
  userId: string;
  clientId: string;
  profile: {
    role?: string | null;
    status?: string | null;
    tenant_id?: string | null;
  } | null;
  companyId?: string | null;
  membership?: {
    company_id?: string | null;
    role?: string | null;
  } | null;
  coverage?: CompanyCommercialCoverage | null;
  featureFlags?: string[];
}

export async function resolveKiaActorCapabilities(input: {
  admin: AdminClient;
  userId: string;
  clientId: string;
  companyId?: string | null;
  featureFlags?: string[];
}): Promise<KiaActorCapabilitySnapshot> {
  const { data: profile, error: profileError } = await input.admin
    .from('profiles')
    .select('role,status,tenant_id')
    .eq('id', input.userId)
    .maybeSingle();

  if (profileError) throw profileError;

  let membership: { company_id?: string | null; role?: string | null } | null = null;
  if (input.companyId) {
    const { data, error } = await input.admin
      .from('profile_companies')
      .select('company_id,role')
      .eq('profile_id', input.userId)
      .eq('company_id', input.companyId)
      .maybeSingle();
    if (error) throw error;
    membership = data;
  }

  let coverage: CompanyCommercialCoverage | null = null;
  if (input.companyId && membership) {
    coverage = await resolveCompanyCommercialCoverage(
      input.admin,
      input.clientId,
      input.companyId,
    );
  }

  return deriveKiaActorCapabilities({
    userId: input.userId,
    clientId: input.clientId,
    profile,
    companyId: input.companyId,
    membership,
    coverage,
    featureFlags: input.featureFlags,
  });
}

export function deriveKiaActorCapabilities(input: DeriveActorCapabilityInput): KiaActorCapabilitySnapshot {
  const role = normalizeKiaActorRole(input.profile?.role);
  const active = Boolean(input.profile) && input.profile?.status !== 'inactive';
  const companyId = input.companyId ?? null;
  const companyMember = Boolean(
    companyId
      && input.membership
      && input.membership.company_id === companyId,
  );
  const coverage = companyMember ? input.coverage ?? null : null;

  const planCapabilities = new Set<string>();
  const scopes = new Set<string>();

  // Capabilities are derived only from authoritative commercial evidence.
  // Never infer operator/admin permissions from plan names.
  if (coverage?.covered) {
    planCapabilities.add('subscription.covered');
    planCapabilities.add(`subscription.source.${coverage.source}`);
    if (coverage.coverageScope) {
      planCapabilities.add(`subscription.scope.${coverage.coverageScope}`);
    }
  }

  if (active) {
    scopes.add('kia:authenticated');
    if (companyMember) scopes.add('kia:company:read');

    if (role === ROLES.CLIENT) scopes.add('kia:self:read');
    if (role === ROLES.TENANT_ADMIN) scopes.add('kia:tenant:read');
    if (role === ROLES.ADMIN || role === ROLES.OWNER) scopes.add('kia:staff:read');
  }

  // Deliberately do not grant kia:operator or kia:admin here. Those require a
  // future explicit authorization path in addition to role/capability/feature flag.
  return {
    userId: input.userId,
    clientId: input.clientId,
    role,
    active,
    tenantId: input.profile?.tenant_id ?? null,
    companyId,
    companyMember,
    companyMembershipRole: companyMember ? input.membership?.role ?? null : null,
    coverage,
    planCapabilities: [...planCapabilities].sort(),
    scopes: [...scopes].sort(),
    featureFlags: [...new Set(input.featureFlags ?? [])].sort(),
  };
}

export function toKiaPolicyActorContext(snapshot: KiaActorCapabilitySnapshot): KiaPolicyActorContext {
  return {
    role: snapshot.role,
    planCapabilities: snapshot.planCapabilities,
    scopes: snapshot.scopes,
    featureFlags: snapshot.featureFlags,
  };
}

export function getEnabledKiaPolicyFeatureFlags(env: NodeJS.ProcessEnv = process.env): string[] {
  const enabled: string[] = [];
  if (env.KIA_OPERATOR_MODE_ENABLED?.toLowerCase() === 'true') enabled.push('kia_operator_mode');
  if (env.KIA_INTERNAL_ADMIN_MODE_ENABLED?.toLowerCase() === 'true') enabled.push('kia_internal_admin_mode');
  return enabled;
}
