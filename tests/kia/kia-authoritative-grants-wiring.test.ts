import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('KIA authoritative grants wiring', () => {
  it('keeps commercial capability and operational scopes in separate authoritative sources', () => {
    const loader = source('lib/ai/kia/kia-authoritative-grants.ts');

    expect(loader).toContain(".from('subscription_entitlements')");
    expect(loader).toContain(".eq('feature_key', 'kia.operator')");
    expect(loader).toContain("kind: 'plan_capability'");
    expect(loader).toContain("value: 'kia.operator'");

    expect(loader).toContain(".from('kia_access_grants')");
    expect(loader).toContain("kind: row.grant_kind");
    expect(loader).toContain("value: row.grant_value");
    expect(loader).not.toContain("grant_value: 'kia.operator'");
  });

  it('requires active or trialing backing subscriptions for commercial operator capability', () => {
    const loader = source('lib/ai/kia/kia-authoritative-grants.ts');
    expect(loader).toContain("subscription.status === 'active' || subscription.status === 'trialing'");
    expect(loader).toContain('(row.beneficiary_company_id ?? row.primary_company_id) === input.companyId');
  });

  it('keeps the operational grant table server-side only and scope-limited', () => {
    const migration = source('supabase/migrations/20260915142000_kia_access_grants.sql');
    expect(migration).toContain("grant_kind = 'scope'");
    expect(migration).toContain("grant_value in ('kia:operator', 'kia:admin')");
    expect(migration).toContain("source in ('staff_assignment', 'manual_approval')");
    expect(migration).toContain('enable row level security');
    expect(migration).toContain('revoke all on table public.kia_access_grants from anon, authenticated');
  });

  it('loads authoritative grants automatically unless tests explicitly inject grants', () => {
    const resolver = source('lib/ai/kia/kia-actor-capability-resolver.ts');
    expect(resolver).toContain('input.explicitGrants ?? (profile');
    expect(resolver).toContain('await loadKiaAuthoritativeGrants({');
    expect(resolver).toContain('explicitGrants: authoritativeGrants');
  });
});
