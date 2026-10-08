import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createEmptyHoldedPermissions, forceHoldedReadOnly, intersectHoldedReadPermissions } from '@/lib/integrations/holded/holded-permissions';
const source = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');
describe('Holded v2 read scope expansion', () => {
  const route = source('app/api/admin/empresas/[id]/holded/route.ts');
  it('tests plan and payments without writing', () => {
    expect(route).toContain("['accountingAccounts', () => client.listAccountingAccounts({ limit: 1 })]");
    expect(route).toContain("['accountingPayments', () => client.listPayments({ limit: 1 })]");
    expect(route).toContain("sync_mode: 'read_only'");
  });
  it('intersects newly detected read scopes with enabled flags', () => {
    const detected = { ...createEmptyHoldedPermissions(), accountingAccounts: true, accountingPayments: true };
    const enabled = { ...createEmptyHoldedPermissions(), accountingAccounts: true, accountingPayments: false };
    const result = intersectHoldedReadPermissions(detected, enabled);
    expect(result.accountingAccounts).toBe(true);
    expect(result.accountingPayments).toBe(false);
  });
  it('disallows implicit write elevation', () => {
    const flags = { ...createEmptyHoldedPermissions(), writeInbox: true, laborEmployeesWrite: true, laborPayrollsWrite: true };
    expect(forceHoldedReadOnly(flags)).toMatchObject({ writeInbox: false, laborEmployeesWrite: false, laborPayrollsWrite: false });
  });
});