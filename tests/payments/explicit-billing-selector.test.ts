import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const contratar = source('app/(public)/contratar/page.tsx');
const wizard = source('components/profile/ProfileCompletionWizard.tsx');
const viability = source('components/services/ViabilityModal.tsx');

describe('explicit billing target UX', () => {
  it('loads billing policy and linked entities in the canonical contratar gate', () => {
    expect(contratar).toContain('getServiceBillingPolicy(catalogService.slug)');
    expect(contratar).toContain(".from('profile_companies')");
    expect(contratar).toContain("company:companies(id,razon_social,cif_nif,forma_juridica)");
    expect(contratar).toContain('billingPolicy={billingPolicy}');
    expect(contratar).toContain('companies={companies}');
  });

  it('offers profile billing only when policy and client type allow it', () => {
    expect(wizard).toContain("billingPolicy !== 'company_only' && profile?.client_type !== 'empresa'");
    expect(wizard).toContain("billingPolicy === 'profile_only'");
    expect(wizard).toContain("billingPolicy === 'flexible' && profileCanBeBilled");
    expect(wizard).toContain("billingTarget !== 'profile' ? { companyId: billingTarget } : {}");
    expect(wizard).toContain('¿A nombre de quién se contrata?');
  });

  it('routes viability checkout through contratar instead of creating Stripe directly', () => {
    expect(viability).toContain('/contratar?service=');
    expect(viability).toContain('source=viability');
    expect(viability).not.toContain("fetch('/api/services/checkout'");
  });
});
