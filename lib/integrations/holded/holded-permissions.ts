export interface HoldedPermissions {
  contacts: boolean;
  salesInvoices: boolean;
  purchaseInvoices: boolean;
  taxes: boolean;
  bankAccounts: boolean;
  bankMovements: boolean;
  inboxDocuments: boolean;
  writeInbox: boolean;
  accountingReports: boolean;
  accountingEntries: boolean;
  laborEmployeesRead: boolean;
  laborPayrollsRead: boolean;
  laborEmployeesWrite: boolean;
  laborPayrollsWrite: boolean;
}

export const HOLDED_WRITE_PERMISSION_KEYS = [
  'writeInbox',
  'laborEmployeesWrite',
  'laborPayrollsWrite',
] as const satisfies ReadonlyArray<keyof HoldedPermissions>;

export function createEmptyHoldedPermissions(): HoldedPermissions {
  return {
    contacts: false,
    salesInvoices: false,
    purchaseInvoices: false,
    taxes: false,
    bankAccounts: false,
    bankMovements: false,
    inboxDocuments: false,
    writeInbox: false,
    accountingReports: false,
    accountingEntries: false,
    laborEmployeesRead: false,
    laborPayrollsRead: false,
    laborEmployeesWrite: false,
    laborPayrollsWrite: false,
  };
}

/**
 * HLAB-2 policy: EXPERT may detect and persist read capabilities, but write
 * capabilities remain disabled until the supervised-write phase (HLAB-5).
 */
export function forceHoldedReadOnly(
  permissions: HoldedPermissions,
): HoldedPermissions {
  return {
    ...permissions,
    writeInbox: false,
    laborEmployeesWrite: false,
    laborPayrollsWrite: false,
  };
}
