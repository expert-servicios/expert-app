import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function source(relativePath: string) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('Holded company contact atomic claim', () => {
  it('keeps one active company claim and row-locks acquisition', () => {
    const indexes = source('supabase/migrations/20260912001400_baseline_public_indexes_001_100.sql');
    const functions = source('supabase/migrations/20260912002000_baseline_public_functions_001_010.sql');

    expect(indexes).toContain('holded_contact_creation_claims_active_company_uidx');
    expect(indexes).toContain("state = ANY (ARRAY['claimed'::text, 'creating'::text, 'completed'::text, 'manual_review'::text])");
    expect(functions).toContain('claim_holded_contact_creation');
    expect(functions).toContain('for update');
    expect(functions).toContain("v_row.state='claimed' and v_row.lease_expires_at<=now()");
  });

  it('allows the claim owner to release a failed POST from creating state', () => {
    const migration = source('supabase/migrations/20261006193000_holded_contact_claim_release_creating.sql');

    expect(migration).toContain("state in ('claimed', 'creating')");
    expect(migration).toContain('owner_token = p_owner_token');
    expect(migration).toContain("state = 'released'");
    expect(migration).toContain('grant execute on function public.release_holded_contact_creation_claim');
  });

  it('acquires and marks the claim before the Holded POST and completes only after mapping', () => {
    const holded = source('lib/integrations/holded.ts');
    const start = holded.indexOf('async function resolveCompanyBillingContact');
    const end = holded.indexOf('interface HoldedInvoiceItem', start);
    const resolver = holded.slice(start, end);

    const acquire = resolver.indexOf('claimHoldedContactCreation(');
    const mark = resolver.indexOf('markHoldedContactCreationStarted(');
    const post = resolver.indexOf('createContact({');
    const mapping = resolver.indexOf(".from('external_mappings').insert({");
    const complete = resolver.indexOf('completeHoldedContactCreation(');

    expect(acquire).toBeGreaterThanOrEqual(0);
    expect(mark).toBeGreaterThan(acquire);
    expect(post).toBeGreaterThan(mark);
    expect(mapping).toBeGreaterThan(post);
    expect(complete).toBeGreaterThan(mapping);
    expect(resolver).toContain('releaseHoldedContactCreationClaim(');
    expect(resolver).toContain('flagHoldedContactCreationReview(');
  });

  it('does not write to Holded when another execution owns the claim', () => {
    const holded = source('lib/integrations/holded.ts');
    const start = holded.indexOf('async function resolveCompanyBillingContact');
    const end = holded.indexOf('interface HoldedInvoiceItem', start);
    const resolver = holded.slice(start, end);

    expect(resolver).toContain('if (!claim.acquired || !claim.claimId)');
    expect(resolver).toContain('Holded contact creation already in progress');
    expect(resolver.indexOf('if (!claim.acquired || !claim.claimId)')).toBeLessThan(resolver.indexOf('createContact({'));
  });
});
