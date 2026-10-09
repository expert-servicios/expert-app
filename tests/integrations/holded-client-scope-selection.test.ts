import { describe, expect, it } from 'vitest';
import {
  patchHoldedReadPermissions, refreshHoldedReadPermissions, selectHoldedReadPermissions,
} from '@/lib/integrations/holded/holded-permissions';

const detected = {
  contacts: true, salesInvoices: true, purchaseInvoices: true, bankAccounts: true,
  accountingEntries: true, laborEmployeesRead: true, writeInbox: true,
};

describe('Client Holded scope selections', () => {
  it('respects explicitly disabled read scopes during initial connection', () => {
    const result = selectHoldedReadPermissions(detected, { contacts: false, salesInvoices: true });
    expect(result.contacts).toBe(false);
    expect(result.salesInvoices).toBe(true);
    expect(result.writeInbox).toBe(false);
    expect(result.laborEmployeesRead).toBe(false);
  });
  it('never re-enables disabled access on refresh', () => {
    const result = refreshHoldedReadPermissions(detected, { contacts: false, salesInvoices: true });
    expect(result.contacts).toBe(false);
    expect(result.salesInvoices).toBe(true);
    expect(result.bankAccounts).toBe(false);
  });
  it('permits activating a detected read scope only', () => {
    const result = patchHoldedReadPermissions(detected, { contacts: false }, { contacts: true, bankAccounts: true });
    expect(result.contacts).toBe(true);
    expect(result.bankAccounts).toBe(true);
    expect(result.purchaseInvoices).toBe(false);
  });
  it('rejects an unavailable or write scope', () => {
    expect(patchHoldedReadPermissions(detected, {}, { accountingReports: true }).accountingReports).toBe(false);
    expect(() => patchHoldedReadPermissions(detected, {}, { writeInbox: true })).toThrow();
  });
});
