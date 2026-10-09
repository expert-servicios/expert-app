import { createHoldedClientFromRawKey } from './holded-client';
import { createHoldedV2ClientFromRawKey } from './holded-v2-client';
import { detectHoldedLaborPermissions } from './holded-labor-permissions';
import { HoldedApiError } from './holded-errors';
import {
  createEmptyHoldedPermissions,
  normalizeDetectedHoldedPermissions,
  type HoldedPermissions,
} from './holded-permissions';

/**
 * Safe read probes. Never assume the token grants a scope just because the
 * customer selected it, and never make write requests to inspect a scope.
 * A transient 401/429 must not silently revoke all previously known scopes.
 */
export async function detectHoldedPermissions(
  rawApiKey: string,
  apiVersion: 'v1' | 'v2',
): Promise<{ ok: boolean; permissions: HoldedPermissions; warnings: string[] }> {
  if (apiVersion === 'v1') {
    const client = createHoldedClientFromRawKey(rawApiKey);
    const [result, labor] = await Promise.all([
      client.testConnection(),
      detectHoldedLaborPermissions(rawApiKey),
    ]);
    return {
      ok: result.ok,
      permissions: normalizeDetectedHoldedPermissions({ ...result.permissions, ...labor }),
      warnings: result.warnings,
    };
  }

  const client = createHoldedV2ClientFromRawKey(rawApiKey);
  const permissions = createEmptyHoldedPermissions();
  const checks: Array<[keyof HoldedPermissions, () => Promise<unknown>]> = [
    ['contacts', () => client.listContacts({ limit: 1 })],
    ['salesInvoices', () => client.listInvoices({ limit: 1 })],
    ['purchaseInvoices', () => client.listPurchases({ limit: 1 })],
    ['taxes', () => client.listTaxes({ limit: 1 })],
    ['bankAccounts', () => client.listTreasuryAccounts({ limit: 1 })],
    ['accountingEntries', () => client.listLedgerEntries({ limit: 1 })],
    ['accountingAccounts', () => client.listAccountingAccounts({ limit: 1 })],
    ['accountingPayments', () => client.listPayments({ limit: 1 })],
  ];

  const results = await Promise.all(checks.map(async ([capability, probe]) => {
    try {
      await probe();
      return { capability, allowed: true, uncertain: false };
    } catch (error) {
      if (error instanceof HoldedApiError && (error.status === 401 || error.status === 429)) {
        throw error;
      }
      // 403 is a missing scope; network/5xx is uncertain, never a reason
      // to permanently withdraw access on a refresh.
      const uncertain = !(error instanceof HoldedApiError && error.status === 403);
      return { capability, allowed: false, uncertain };
    }
  }));
  if (results.some((r) => r.uncertain)) {
    throw new Error('No se pudieron verificar todos los permisos de Holded. Reintenta la comprobación.');
  }
  for (const r of results) permissions[r.capability] = r.allowed;
  // Holded v2 shares the accounting:banks.read scope between accounts and movements.
  permissions.bankMovements = permissions.bankAccounts;
  const labor = await detectHoldedLaborPermissions(rawApiKey);
  const normalized = normalizeDetectedHoldedPermissions({ ...permissions, ...labor });
  const warnings: string[] = [];
  const ok = results.some((r) => r.allowed) || labor.laborEmployeesRead || labor.laborPayrollsRead;
  if (!ok) warnings.push('El token no permite leer ninguna de las áreas comprobadas.');
  if (!normalized.bankAccounts) warnings.push('El token no permite consultar bancos ni movimientos.');
  if (!normalized.salesInvoices) warnings.push('El token no permite consultar facturas emitidas.');
  if (!normalized.purchaseInvoices) warnings.push('El token no permite consultar facturas recibidas.');
  return { ok, permissions: normalized, warnings };
}
