import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  createExpertHoldedGateway,
  createHoldedGatewayForIntegration,
  listHoldedBankAccounts,
  listHoldedBankMovements,
  listHoldedDocuments,
  type HoldedGateway,
  type HoldedReadDocument,
} from '@/lib/integrations/holded/holded-gateway';
import { resolveKiaCompanyHoldedAccess } from './kia-holded-access';
import type { KiaContext } from './kia-context-builder';
import type { KiaToolResult } from './kia-tool-definitions';
import { EXPERT_IDENTITY } from '@/config/identity';

export type KiaAccountingToolName =
  | 'get_accounts_receivable'
  | 'get_accounts_payable'
  | 'get_overdue_invoices'
  | 'get_unreconciled_transactions';

export const ACCOUNTING_TOOL_NAMES = new Set<KiaAccountingToolName>([
  'get_accounts_receivable',
  'get_accounts_payable',
  'get_overdue_invoices',
  'get_unreconciled_transactions',
]);

type Raw = Record<string, unknown>;

export function isExpertGlobalHoldedContext(context: KiaContext): boolean {
  return context.company?.taxId?.trim().toUpperCase() === EXPERT_IDENTITY.taxId;
}

async function resolveAccountingGateway(
  context: KiaContext,
  requiredPermission: 'salesInvoices' | 'purchaseInvoices' | 'bankMovements',
): Promise<
  | { ok: true; gateway: HoldedGateway; source: 'expert_global' | 'client_integration' }
  | { ok: false; error: string }
> {
  if (isExpertGlobalHoldedContext(context)) {
    try {
      return { ok: true, gateway: await createExpertHoldedGateway(), source: 'expert_global' };
    } catch {
      return { ok: false, error: 'La cuenta global de Holded de EXPERT no está configurada en este entorno.' };
    }
  }

  const admin = getSupabaseAdmin();
  const access = await resolveKiaCompanyHoldedAccess(admin, context, requiredPermission);
  if (!access.ok) return { ok: false, error: access.error };

  return {
    ok: true,
    gateway: await createHoldedGatewayForIntegration(access.access.integrationId),
    source: 'client_integration',
  };
}

function ok(toolName: string, result: Record<string, unknown>): KiaToolResult {
  return { toolName, ok: true, result };
}

function fail(toolName: string, error: string): KiaToolResult {
  return { toolName, ok: false, error };
}

function asNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstPresent(doc: Raw, keys: string[]): unknown {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(doc, key) && doc[key] !== null && doc[key] !== undefined) {
      return doc[key];
    }
  }
  return undefined;
}

export function isIssuedHoldedDocument(doc: Raw): boolean {
  if (doc.isDraft === true) return false;
  const status = String(doc.status ?? '').trim().toLowerCase();
  if (status === '0' || status === 'draft' || status === 'borrador') return false;
  return true;
}

export function holdedOutstandingAmount(doc: Raw): number {
  if (!isIssuedHoldedDocument(doc)) return 0;

  const explicitPending = firstPresent(doc, [
    'paymentsPending',
    'pending',
    'amountDue',
    'pendingAmount',
  ]);
  if (explicitPending !== undefined) return Math.max(0, asNumber(explicitPending));

  const total = asNumber(doc.total ?? doc.amount ?? doc.subtotal);
  const paidValue = firstPresent(doc, [
    'paymentsTotal',
    'paid',
    'amountPaid',
    'paidAmount',
    'paymentAmount',
  ]);
  if (paidValue !== undefined) return Math.max(0, total - asNumber(paidValue));

  const status = String(doc.status ?? doc.paymentStatus ?? '').trim().toLowerCase();
  if (['paid', 'cobrado', 'pagado', 'completed', 'complete'].includes(status)) return 0;
  return Math.max(0, total);
}

export function isHoldedDocumentPaid(doc: Raw): boolean {
  if (!isIssuedHoldedDocument(doc)) return false;
  const pending = holdedOutstandingAmount(doc);
  const total = asNumber(doc.total ?? doc.amount ?? doc.subtotal);
  if (total > 0 && pending <= 0.05) return true;
  const status = String(doc.status ?? doc.paymentStatus ?? '').trim().toLowerCase();
  return ['paid', 'cobrado', 'pagado', 'completed', 'complete'].includes(status);
}

function asTimestamp(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 10_000_000_000 ? Math.floor(value / 1000) : Math.floor(value);
  }
  if (typeof value !== 'string' || !value.trim()) return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric > 10_000_000_000 ? Math.floor(numeric / 1000) : Math.floor(numeric);
  }
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.floor(date / 1000);
}

function dueTimestamp(doc: Raw): number | null {
  return asTimestamp(doc.dueDate ?? doc.duedate ?? doc.due_date ?? doc.expirationDate ?? doc.expiration);
}

function madridDateKey(timestampMs: number): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(timestampMs));
}

export function isHoldedDocumentOverdue(doc: Raw, nowMs = Date.now()): boolean {
  if (!isIssuedHoldedDocument(doc) || isHoldedDocumentPaid(doc)) return false;
  const due = dueTimestamp(doc);
  if (!due) return false;
  return madridDateKey(due * 1000) < madridDateKey(nowMs);
}

function normalizeDocument(doc: Raw) {
  const due = dueTimestamp(doc);
  return {
    id: doc.id,
    number: doc.docNumber ?? doc.number ?? doc.invoiceNumber,
    date: doc.date ?? doc.createdAt,
    dueDate: due,
    contact: doc.contactName ?? (doc.contact as Raw | undefined)?.name ?? doc.supplierName,
    total: asNumber(doc.total ?? doc.amount),
    outstanding: holdedOutstandingAmount(doc),
    currency: String(doc.currency ?? 'EUR').toUpperCase(),
    status: doc.status ?? doc.paymentStatus ?? 'unknown',
    overdue: isHoldedDocumentOverdue(doc),
  };
}

export function totalsByCurrency(rows: Array<{ outstanding: number; currency: string }>): Record<string, number> {
  return rows.reduce<Record<string, number>>((totals, row) => {
    totals[row.currency] = Math.round(((totals[row.currency] ?? 0) + row.outstanding) * 100) / 100;
    return totals;
  }, {});
}

export function defaultAccountingDocumentRange(now = new Date()): { starttmp: string; endtmp: string } {
  const start = Date.UTC(now.getUTCFullYear() - 1, 0, 1, 0, 0, 0);
  return {
    starttmp: String(Math.floor(start / 1000)),
    endtmp: String(Math.floor(now.getTime() / 1000)),
  };
}

function rangeToIso(range: { starttmp: string; endtmp: string }): { startDate: string; endDate: string } {
  return {
    startDate: new Date(Number(range.starttmp) * 1000).toISOString().slice(0, 10),
    endDate: new Date(Number(range.endtmp) * 1000).toISOString().slice(0, 10),
  };
}

function readDocumentToRaw(doc: HoldedReadDocument): Raw {
  return {
    ...doc,
    docNumber: doc.number,
    contactName: doc.contactName,
    paymentsPending: doc.paymentsPending,
    dueDate: doc.dueDate,
  };
}

async function loadDocuments(
  context: KiaContext,
  docType: 'invoice' | 'purchase',
): Promise<{ ok: true; docs: Raw[] } | { ok: false; error: string }> {
  const requiredPermission = docType === 'purchase' ? 'purchaseInvoices' : 'salesInvoices';
  const resolved = await resolveAccountingGateway(context, requiredPermission);
  if (!resolved.ok) return { ok: false, error: resolved.error };

  try {
    const range = rangeToIso(defaultAccountingDocumentRange());
    const docs = await listHoldedDocuments(
      resolved.gateway,
      docType === 'purchase' ? 'purchase' : 'sales',
      { ...range, maxItems: 2_000 },
    );
    return { ok: true, docs: docs.map(readDocumentToRaw) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Error consultando documentos Holded.' };
  }
}

async function loadBankMovements(context: KiaContext, limit: number): Promise<
  | { ok: true; movements: Raw[] }
  | { ok: false; error: string }
> {
  const resolved = await resolveAccountingGateway(context, 'bankMovements');
  if (!resolved.ok) return { ok: false, error: resolved.error };

  try {
    const accounts = await listHoldedBankAccounts(resolved.gateway, 10);
    const perAccount = await Promise.all(
      accounts.map(async (account) => {
        const rows = await listHoldedBankMovements(resolved.gateway, account.id, {
          pendingOnly: true,
          maxItems: Math.max(limit, 50),
        }).catch(() => []);
        return rows.map((movement) => ({
          ...movement,
          treasuryAccountId: account.id,
          treasuryAccountName: account.name,
        }));
      }),
    );
    return { ok: true, movements: perAccount.flat().slice(0, Math.max(limit, 50)) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Error consultando movimientos Holded.' };
  }
}

export async function executeKiaAccountingTool(
  toolName: KiaAccountingToolName,
  args: Record<string, unknown>,
  context: KiaContext,
): Promise<KiaToolResult> {
  const limit = Number(args.limit ?? 20);
  const source = isExpertGlobalHoldedContext(context)
    ? 'holded_expert_global'
    : 'holded_client_integration';

  if (toolName === 'get_accounts_receivable' || toolName === 'get_accounts_payable') {
    const docType = toolName === 'get_accounts_payable' ? 'purchase' : 'invoice';
    const loaded = await loadDocuments(context, docType);
    if (!loaded.ok) return fail(toolName, loaded.error);

    const includeNotDue = args.includeNotDue !== false;
    const rows = loaded.docs
      .filter((doc) => isIssuedHoldedDocument(doc) && !isHoldedDocumentPaid(doc))
      .map(normalizeDocument)
      .filter((doc) => doc.outstanding > 0.05)
      .filter((doc) => includeNotDue || doc.overdue)
      .sort((a, b) => Number(b.overdue) - Number(a.overdue))
      .slice(0, limit);

    return ok(toolName, {
      source,
      derived: true,
      count: rows.length,
      totalsByCurrency: totalsByCurrency(rows),
      documents: rows,
    });
  }

  if (toolName === 'get_overdue_invoices') {
    const side = String(args.side ?? 'receivable');
    const types: Array<'invoice' | 'purchase'> = side === 'both'
      ? ['invoice', 'purchase']
      : [side === 'payable' ? 'purchase' : 'invoice'];

    const groups = await Promise.all(types.map((type) => loadDocuments(context, type)));
    const firstError = groups.find((group) => !group.ok);
    if (firstError && !firstError.ok) return fail(toolName, firstError.error);

    const rows = groups.flatMap((group, index) => {
      if (!group.ok) return [];
      const type = types[index];
      return group.docs
        .filter((doc) => isHoldedDocumentOverdue(doc))
        .map((doc) => ({ ...normalizeDocument(doc), side: type === 'purchase' ? 'payable' : 'receivable' }));
    })
      .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0))
      .slice(0, limit);

    return ok(toolName, {
      source,
      derived: true,
      count: rows.length,
      totalsByCurrency: totalsByCurrency(rows),
      documents: rows,
    });
  }

  if (toolName === 'get_unreconciled_transactions') {
    const loaded = await loadBankMovements(context, limit);
    if (!loaded.ok) return fail(toolName, loaded.error);

    const rows = loaded.movements.filter((movement) => {
      const status = String(movement.status ?? movement.reconciled ?? '').toLowerCase();
      const hasDocument = Boolean(movement.documentId ?? movement.invoiceId ?? movement.matchId);
      return !hasDocument && !['reconciled', 'conciliated', 'conciliado', 'matched', 'true'].includes(status);
    }).slice(0, limit).map((movement) => ({
      id: movement.id,
      date: movement.date,
      amount: asNumber(movement.amount),
      description: movement.description ?? movement.name,
      reference: movement.reference,
      status: movement.status ?? 'unknown',
      treasuryAccountId: movement.treasuryAccountId,
      treasuryAccountName: movement.treasuryAccountName,
    }));

    return ok(toolName, {
      source,
      derived: true,
      derivation: 'movement_without_document_or_match_and_without_reconciled_status',
      count: rows.length,
      transactions: rows,
    });
  }

  return fail(toolName, 'Herramienta contable no soportada.');
}
