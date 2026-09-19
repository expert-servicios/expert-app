import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Holded one-off billing identity', () => {
  it('resolves order company from the persisted accounting boundary', () => {
    const holded = source('lib/integrations/holded.ts');
    expect(holded).toContain(".select('amount_eur,company_id')");
    expect(holded).toContain('Order company mismatch');
    expect(holded).toContain('resolvedCompanyId = persistedCompanyId');
    expect(holded).toContain("Order company ${resolvedCompanyId} not found; manual review required");
  });

  it('uses a company-scoped Holded contact for company orders', () => {
    const holded = source('lib/integrations/holded.ts');
    expect(holded).toContain('resolvedCompanyId\n      ? await resolveCompanyBillingContact');
    expect(holded).toContain('companyId: resolvedCompanyId');
    expect(holded).toContain("email ${params.email} already exists without an entity mapping");
  });

  it('keeps personal orders on the personal contact path', () => {
    const holded = source('lib/integrations/holded.ts');
    expect(holded).toContain(': await upsertContact({');
    expect(holded).toContain('name: billingName');
    expect(holded).toContain('email: billingEmail');
  });

  it('propagates company identity through webhook and durable retry jobs', () => {
    const webhook = source('app/api/stripe/webhook/route.ts');
    const cron = source('app/api/cron/holded-sync/route.ts');
    expect(webhook).toContain('companyId: quote.company_id ?? null');
    expect(webhook).toContain('companyId: session.metadata?.company_id ?? null');
    expect(webhook).toContain('company_id: quote.company_id ?? null');
    expect(cron).toContain('companyId  : m.companyId');
  });

  it('uses company-scoped contact mapping for Holded quote estimates', () => {
    const holded = source('lib/integrations/holded.ts');
    const quotes = source('app/api/admin/quotes/route.ts');
    expect(holded).toContain('companyId?: string | null;');
    expect(holded).toContain('const contactId = params.companyId');
    expect(holded).toContain('company_id: params.companyId ?? null');
    expect(quotes).toContain('clientEmail: contractingCompany?.email ?? clientEmail');
    expect(quotes).toContain('companyId,');
  });
});
