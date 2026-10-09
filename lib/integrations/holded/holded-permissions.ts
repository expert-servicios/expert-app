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
  accountingAccounts: boolean;
  accountingPayments: boolean;
  laborEmployeesRead: boolean;
  laborPayrollsRead: boolean;
  laborEmployeesWrite: boolean;
  laborPayrollsWrite: boolean;
}

export const HOLDED_READ_PERMISSION_KEYS = [
  'contacts',
  'salesInvoices',
  'purchaseInvoices',
  'taxes',
  'bankAccounts',
  'bankMovements',
  'inboxDocuments',
  'accountingReports',
  'accountingEntries',
  'accountingAccounts',
  'accountingPayments',
  'laborEmployeesRead',
  'laborPayrollsRead',
] as const satisfies ReadonlyArray<keyof HoldedPermissions>;

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
    accountingAccounts: false,
    accountingPayments: false,
    laborEmployeesRead: false,
    laborPayrollsRead: false,
    laborEmployeesWrite: false,
    laborPayrollsWrite: false,
  };
}

/**
 * Normalize a partially detected permission map into the canonical shape and
 * enforce the current EXPERT read-only policy.
 */
export function normalizeDetectedHoldedPermissions(
  permissions: Partial<HoldedPermissions> | null | undefined,
): HoldedPermissions {
  return forceHoldedReadOnly({
    ...createEmptyHoldedPermissions(),
    ...(permissions ?? {}),
  });
}

/**
 * Effective permissions are always an intersection:
 *
 *   detected by Holded AND explicitly enabled by EXPERT/the user.
 *
 * A requested permission can therefore never elevate a capability that the
 * current API key does not actually expose. Writes remain disabled regardless
 * of either input until the supervised-write phase is implemented.
 */
export function intersectHoldedReadPermissions(
  detected: Partial<HoldedPermissions> | null | undefined,
  requested: Partial<HoldedPermissions> | null | undefined,
): HoldedPermissions {
  const available = normalizeDetectedHoldedPermissions(detected);
  const desired = requested ?? {};
  const effective = createEmptyHoldedPermissions();

  for (const key of HOLDED_READ_PERMISSION_KEYS) {
    effective[key] = available[key] === true && desired[key] === true;
  }

  return forceHoldedReadOnly(effective);
}

/**
 * HLAB policy: EXPERT may detect and persist read capabilities, but write
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


/**
 * For a newly connected v2 token, respect every read toggle submitted by the
 * owner. Older integrations without a selection default to detected read
 * capabilities, except employee and payroll data requiring explicit consent.
 */
export function selectHoldedReadPermissions(
  detected: Partial<HoldedPermissions>,
  selected: Partial<HoldedPermissions> | null | undefined,
): HoldedPermissions {
  const defaults: Partial<HoldedPermissions> = {
    ...normalizeDetectedHoldedPermissions(detected),
    laborEmployeesRead: false,
    laborPayrollsRead: false,
  };
  const desired = selected ? { ...defaults, ...selected } : defaults;
  return intersectHoldedReadPermissions(detected, desired);
}

/** A token refresh must NOT silently restore any owner-disabled access. */
export function refreshHoldedReadPermissions(
  detected: Partial<HoldedPermissions>,
  existing: Partial<HoldedPermissions> | null | undefined,
): HoldedPermissions {
  return intersectHoldedReadPermissions(detected, existing ?? {});
}

/** Patch only explicitly submitted read scopes; unsupported scopes are rejected. */
export function patchHoldedReadPermissions(
  detected: Partial<HoldedPermissions>,
  existing: Partial<HoldedPermissions>,
  changes: Partial<HoldedPermissions>,
): HoldedPermissions {
  for (const key of Object.keys(changes)) {
    if (!(HOLDED_READ_PERMISSION_KEYS as readonly string[]).includes(key)) {
      throw new Error('Permiso de escritura/no reconocido');
    }
  }
  return intersectHoldedReadPermissions(detected, { ...existing, ...changes });
}
