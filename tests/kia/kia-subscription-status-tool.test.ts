import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('KIA subscription status tool', () => {
  it('accepts no arbitrary client or company identifiers', () => {
    const defs = source('lib/ai/kia/kia-tool-definitions.ts');
    expect(defs).toContain('get_user_subscription_status: emptyObjectSchema');
    expect(defs).toContain('Takes no client/company identifiers');
  });

  it('derives scope only from authorized KiaContext and reuses canonical coverage', () => {
    const executor = source('lib/ai/kia/kia-tool-executor.ts');
    const start = executor.indexOf("case 'get_user_subscription_status'");
    const end = executor.indexOf("case 'get_user_subscriptions'", start);
    const block = executor.slice(start, end);

    expect(block).toContain('const clientId = context.contact?.clientId');
    expect(block).toContain('const companyId = context.company?.id ?? null');
    expect(block).toContain('resolveCompanyCommercialCoverage(admin, clientId, companyId)');
    expect(block).not.toContain('args.companyId');
    expect(block).not.toContain('args.clientId');
  });

  it('returns support-safe detail without Stripe or entitlement identifiers', () => {
    const executor = source('lib/ai/kia/kia-tool-executor.ts');
    const start = executor.indexOf("case 'get_user_subscription_status'");
    const end = executor.indexOf("case 'get_user_subscriptions'", start);
    const block = executor.slice(start, end);

    for (const key of ['plan:', 'status:', 'coverage_scope:', 'valid_from:', 'valid_until:', 'excluded_services:']) {
      expect(block).toContain(key);
    }
    expect(block).not.toContain('subscriptionId');
    expect(block).not.toContain('entitlementId');
    expect(block).not.toContain('stripe_');
  });

  it('registers the tool as an autonomous R0 subscription read', () => {
    const registry = source('lib/ai/kia/kia-tool-registry.ts');
    expect(registry).toContain("get_user_subscription_status:      policy('R0', 'read',  'subscriptions')");
  });
});
