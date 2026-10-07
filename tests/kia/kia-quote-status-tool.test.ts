import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('KIA quote status tool', () => {
  it('accepts only a result limit, never client/company identifiers', () => {
    const defs = source('lib/ai/kia/kia-tool-definitions.ts');
    const start = defs.indexOf('get_user_quotes: z.object({');
    const end = defs.indexOf('}).strict(),', start);
    const block = defs.slice(start, end);
    expect(block).toContain('limit:');
    expect(block).not.toContain('clientId');
    expect(block).not.toContain('companyId');
  });

  it('derives both client and company scope exclusively from KiaContext', () => {
    const executor = source('lib/ai/kia/kia-tool-executor.ts');
    const start = executor.indexOf("case 'get_user_quotes'");
    const end = executor.indexOf("case 'get_user_orders'", start);
    const block = executor.slice(start, end);
    expect(block).toContain('const clientId = context.contact?.clientId');
    expect(block).toContain('const companyId = context.company?.id ?? null');
    expect(block).toContain(".eq('client_id', clientId)");
    expect(block).toContain(".eq('company_id', companyId)");
    expect(block).not.toContain('args.clientId');
    expect(block).not.toContain('args.companyId');
  });

  it('is read-only and exposes status/expiry without checkout mutation', () => {
    const executor = source('lib/ai/kia/kia-tool-executor.ts');
    const start = executor.indexOf("case 'get_user_quotes'");
    const end = executor.indexOf("case 'get_user_orders'", start);
    const block = executor.slice(start, end);
    expect(block).toContain(".from('quotes')");
    expect(block).toContain("payment_pending: ['sent', 'accepted'].includes");
    expect(block).not.toContain('.update(');
    expect(block).not.toContain('stripe_checkout');
    expect(block).not.toContain('generate_checkout');
  });

  it('registers as an autonomous R0 payment read', () => {
    const registry = source('lib/ai/kia/kia-tool-registry.ts');
    expect(registry).toContain("get_user_quotes:                    policy('R0', 'read',  'payments')");
  });
});
