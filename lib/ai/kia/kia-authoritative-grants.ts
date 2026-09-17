import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import type { KiaExplicitGrant } from './kia-explicit-grants';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

type SubscriptionEntitlementRow = {
  id: string;
  subscription_id: string | null;
  feature_key: string;
  active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  revoked_at: string | null;
  primary_company_id: string | null;
  beneficiary_company_id: string | null;
};

type AccessGrantRow = {
  id: string;
  user_id: string;
  tenant_id: string | null;
  company_id: string | null;
  grant_kind: 'scope';
  grant_value: 'kia:operator' | 'kia:admin';
  source: 'staff_assignment' | 'manual_approval';
  active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  revoked_at: string | null;
};

export async function loadKiaAuthoritativeGrants(input: {
  admin: AdminClient;
  userId: string;
  tenantId?: string | null;
  companyId?: string | null;
}): Promise<KiaExplicitGrant[]> {
  const [commercial, operational] = await Promise.all([
    loadCommercialOperatorCapability(input),
    loadOperationalScopes(input),
  ]);

  return [...commercial, ...operational];
}

async function loadCommercialOperatorCapability(input: {
  admin: AdminClient;
  userId: string;
  companyId?: string | null;
}): Promise<KiaExplicitGrant[]> {
  if (!input.companyId) return [];

  const { data, error } = await input.admin
    .from('subscription_entitlements')
    .select('id,subscription_id,feature_key,active,valid_from,valid_until,revoked_at,primary_company_id,beneficiary_company_id')
    .eq('client_id', input.userId)
    .eq('feature_key', 'kia.operator')
    .eq('active', true)
    .is('revoked_at', null);

  if (error) throw error;

  const rows = (data ?? []) as SubscriptionEntitlementRow[];
  const matching = rows.filter((row) =>
    (row.beneficiary_company_id ?? row.primary_company_id) === input.companyId
    && Boolean(row.subscription_id),
  );

  const subscriptionIds = [...new Set(matching.map((row) => row.subscription_id).filter(Boolean))] as string[];
  if (subscriptionIds.length === 0) return [];

  const { data: subscriptions, error: subscriptionError } = await input.admin
    .from('subscriptions')
    .select('id,status')
    .in('id', subscriptionIds);

  if (subscriptionError) throw subscriptionError;
  const activeSubscriptionIds = new Set(
    (subscriptions ?? [])
      .filter((subscription) => subscription.status === 'active' || subscription.status === 'trialing')
      .map((subscription) => subscription.id),
  );

  return matching
    .filter((row) => row.subscription_id && activeSubscriptionIds.has(row.subscription_id))
    .map((row) => ({
      id: `subscription_entitlement:${row.id}`,
      kind: 'plan_capability',
      value: 'kia.operator',
      source: 'subscription_entitlement',
      userId: input.userId,
      companyId: row.beneficiary_company_id ?? row.primary_company_id,
      active: row.active,
      validFrom: row.valid_from,
      validUntil: row.valid_until,
      revokedAt: row.revoked_at,
    }));
}

async function loadOperationalScopes(input: {
  admin: AdminClient;
  userId: string;
  tenantId?: string | null;
  companyId?: string | null;
}): Promise<KiaExplicitGrant[]> {
  const { data, error } = await input.admin
    .from('kia_access_grants')
    .select('id,user_id,tenant_id,company_id,grant_kind,grant_value,source,active,valid_from,valid_until,revoked_at')
    .eq('user_id', input.userId);

  if (error) {
    // During staged rollout the migration may not yet exist on an environment.
    // Fail closed rather than granting elevated scopes from another source.
    if (error.code === '42P01' || error.code === 'PGRST205') return [];
    throw error;
  }

  return ((data ?? []) as AccessGrantRow[]).map((row) => ({
    id: `kia_access_grant:${row.id}`,
    kind: row.grant_kind,
    value: row.grant_value,
    source: row.source,
    userId: row.user_id,
    tenantId: row.tenant_id,
    companyId: row.company_id,
    active: row.active,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    revokedAt: row.revoked_at,
  }));
}
