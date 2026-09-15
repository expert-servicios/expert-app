export type KiaExplicitGrantKind = 'plan_capability' | 'scope';
export type KiaExplicitGrantSource = 'subscription_entitlement' | 'staff_assignment' | 'manual_approval';

export interface KiaExplicitGrant {
  id: string;
  kind: KiaExplicitGrantKind;
  value: string;
  source: KiaExplicitGrantSource;
  userId: string;
  tenantId?: string | null;
  companyId?: string | null;
  active: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
  revokedAt?: string | null;
}

export interface KiaGrantContext {
  userId: string;
  tenantId?: string | null;
  companyId?: string | null;
  now?: Date;
}

export interface KiaResolvedExplicitGrants {
  planCapabilities: string[];
  scopes: string[];
  acceptedGrantIds: string[];
  rejectedGrantIds: string[];
}

export function resolveKiaExplicitGrants(
  grants: KiaExplicitGrant[] | undefined,
  context: KiaGrantContext,
): KiaResolvedExplicitGrants {
  const now = context.now ?? new Date();
  const planCapabilities = new Set<string>();
  const scopes = new Set<string>();
  const acceptedGrantIds: string[] = [];
  const rejectedGrantIds: string[] = [];

  for (const grant of grants ?? []) {
    if (!isGrantValid(grant, context, now)) {
      rejectedGrantIds.push(grant.id);
      continue;
    }

    acceptedGrantIds.push(grant.id);
    if (grant.kind === 'plan_capability') planCapabilities.add(grant.value);
    if (grant.kind === 'scope') scopes.add(grant.value);
  }

  return {
    planCapabilities: [...planCapabilities].sort(),
    scopes: [...scopes].sort(),
    acceptedGrantIds: acceptedGrantIds.sort(),
    rejectedGrantIds: rejectedGrantIds.sort(),
  };
}

function isGrantValid(grant: KiaExplicitGrant, context: KiaGrantContext, now: Date): boolean {
  if (!grant.active || grant.revokedAt) return false;
  if (grant.userId !== context.userId) return false;
  if (grant.tenantId && grant.tenantId !== (context.tenantId ?? null)) return false;
  if (grant.companyId && grant.companyId !== (context.companyId ?? null)) return false;

  if (grant.validFrom) {
    const validFrom = parseDate(grant.validFrom);
    if (!validFrom || validFrom > now) return false;
  }
  if (grant.validUntil) {
    const validUntil = parseDate(grant.validUntil);
    if (!validUntil || validUntil <= now) return false;
  }

  return isGrantValueAllowed(grant);
}

function isGrantValueAllowed(grant: KiaExplicitGrant): boolean {
  if (grant.kind === 'plan_capability') {
    return grant.value === 'kia.operator';
  }
  return grant.value === 'kia:operator' || grant.value === 'kia:admin';
}

function parseDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
