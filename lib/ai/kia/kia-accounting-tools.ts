import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { resolveHoldedAuth, buildHoldedHeaders } from '@/lib/integrations/holded/holded-auth';
import { resolveKiaCompanyHoldedAccess } from './kia-holded-access';
import type { KiaContext } from './kia-context-builder';
import type { KiaToolResult } from './kia-tool-definitions';
import { EXPERT_IDENTITY } from '@/config/identity';

export type KiaAccountingToolName =
  | 'get_accounts_receivable'
  | 'get_accounts_payable'
  | 'get_overdue_invoices'
  | 'get_unreconciled_transactions'
  | 'draft_payment_reminder'
  | 'draft_credit_note';

export const ACCOUNTING_TOOL_NAMES = new Set<KiaAccountingToolName>([
  'get_accounts_receivable',
  'get_accounts_payable',
  'get_overdue_invoices',
  'get_unreconciled_transactions',
  'draft_payment_reminder',
  'draft_credit_note',
]);

type Raw = Record<string, unknown>;

export function isExpertGlobalHoldedContext(context: KiaContext): boolean {
  return context.company?.taxId?.trim().toUpperCase() === EXPERT_IDENTITY.taxId;
}

async function resolveAccountingAuth(
  context: KiaContext,
  requiredPermission: 'salesInvoices' | 'purchaseInvoices' | 'bankMovements',
): Promise<
  | { ok: true; auth: Awaited<ReturnType<typeof resolveHoldedAuth>>; source: 'expert_global' | 'client_integration' }
  | { ok: false; error: string }
> {
  if (isExpertGlobalHoldedContext(context)) {
    try {
      return { ok: true, auth: await resolveHoldedAuth(null), source: 'expert_global' };
    } catch {
      return { ok: false, error: 'La cuenta global de Holded de EXPERT no está configurada en este entorno.' };
    }
  }

  const admin = getSupabaseAdmin();
  const access = await resolveKiaCompanyHoldedAccess(admin, context, requiredPermission);
  if (!access.ok) return { ok: false, error: access.error };

  return {
    ok: true,
    auth: await resolveHoldedAuth(access.access.integrationId),
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

function outstandingAmount(doc: Raw): number {
  const total = asNumber(doc.total ?? doc.amount ?? doc.subtotal);
  const paid = asNumber(doc.paid ?? doc.amountPaid ?? doc.paidAmount ?? doc.paymentAmount);
  const explicit = asNumber(doc.pending ?? doc.amountDue ?? doc.pendingAmount);
  if (explicit > 0) return explicit;
  return Math.max(0, total - paid);
}

function isPaid(doc: Raw): boolean {
  const status = String(doc.status ?? doc.paymentStatus ?? '').toLowerCase();
  if (['paid', 'cobrado', 'pagado', 'completed', 'complete'].includes(status)) return true;
  return outstandingAmount(doc) <= 0 && asNumber(doc.total ?? doc.amount) > 0;
}

function dueTimestamp(doc: Raw): number | null {
  return asTimestamp(doc.dueDate ?? doc.duedate ?? doc.due_date ?? doc.expirationDate ?? doc.expiration);
}

function isOverdue(doc: Raw, now = Math.floor(Date.now() / 1000)): boolean {
  const due = dueTimestamp(doc);
  return Boolean(due && due < now && !isPaid(doc));
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
    outstanding: outstandingAmount(doc),
    currency: doc.currency ?? 'EUR',
    status: doc.status ?? doc.paymentStatus ?? 'unknown',
    overdue: isOverdue(doc),
  };
}

async function loadDocuments(
  context: KiaContext,
  docType: 'invoice' | 'purchase',
  limit: number,
): Promise<{ ok: true; docs: Raw[] } | { ok: false; error: string }> {
  const requiredPermission = docType === 'purchase' ? 'purchaseInvoices' : 'salesInvoices';
  const resolved = await resolveAccountingAuth(context, requiredPermission);
  if (!resolved.ok) return { ok: false, error: resolved.error };

  const headers = buildHoldedHeaders(resolved.auth.apiKey);
  const response = await fetch(`${resolved.auth.baseUrl}/documents/${docType}?limit=${Math.max(limit, 50)}`, { headers });
  if (!response.ok) return { ok: false, error: `Holded devolvió ${response.status}` };

  const raw = await response.json() as unknown;
  const docs = Array.isArray(raw)
    ? raw as Raw[]
    : raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)
      ? (raw as { data: Raw[] }).data
      : [];
  return { ok: true, docs };
}

function reminderCopy(params: {
  language: 'es' | 'ru';
  stage: 'friendly' | 'firm' | 'formal';
  invoice: ReturnType<typeof normalizeDocument>;
}) {
  const { invoice, language, stage } = params;
  const number = String(invoice.number ?? invoice.id ?? '');
  const amount = Number(invoice.outstanding || invoice.total || 0).toLocaleString(
    language === 'ru' ? 'ru-RU' : 'es-ES',
    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  );

  if (language === 'ru') {
    const subject = stage === 'formal'
      ? `Требование об оплате счета ${number}`
      : `Напоминание об оплате счета ${number}`;
    const opening = stage === 'friendly'
      ? 'Напоминаем, что по нашим данным этот счет остается неоплаченным.'
      : stage === 'firm'
        ? 'По нашим данным срок оплаты этого счета истек, и задолженность остается непогашенной.'
        : 'Настоящим просим погасить просроченную задолженность по указанному счету.';
    return {
      subject,
      body: `${opening}\n\nСчет: ${number}\nОстаток к оплате: ${amount} EUR\n\nЕсли оплата уже произведена, пожалуйста, пришлите подтверждение, чтобы мы могли сверить данные.`,
    };
  }

  const subject = stage === 'formal'
    ? `Requerimiento de pago — factura ${number}`
    : `Recordatorio de pago — factura ${number}`;
  const opening = stage === 'friendly'
    ? 'Te recordamos que, según nuestros datos, esta factura continúa pendiente de pago.'
    : stage === 'firm'
      ? 'Según nuestros registros, el plazo de pago de esta factura ha vencido y el importe continúa pendiente.'
      : 'Por medio del presente, solicitamos la regularización de la deuda vencida correspondiente a la factura indicada.';
  return {
    subject,
    body: `${opening}\n\nFactura: ${number}\nImporte pendiente: ${amount} EUR\n\nSi el pago ya se ha realizado, envíanos el justificante para poder conciliarlo correctamente.`,
  };
}

export async function executeKiaAccountingTool(
  toolName: KiaAccountingToolName,
  args: Record<string, unknown>,
  context: KiaContext,
): Promise<KiaToolResult> {
  const limit = Number(args.limit ?? 20);

  if (toolName === 'get_accounts_receivable' || toolName === 'get_accounts_payable') {
    const docType = toolName === 'get_accounts_payable' ? 'purchase' : 'invoice';
    const loaded = await loadDocuments(context, docType, limit);
    if (!loaded.ok) return fail(toolName, loaded.error);

    const includeNotDue = args.includeNotDue !== false;
    const rows = loaded.docs
      .filter((doc) => !isPaid(doc))
      .map(normalizeDocument)
      .filter((doc) => includeNotDue || doc.overdue)
      .sort((a, b) => Number(b.overdue) - Number(a.overdue))
      .slice(0, limit);

    return ok(toolName, {
      source: isExpertGlobalHoldedContext(context) ? 'holded_expert_global' : 'holded_client_integration',
      derived: true,
      count: rows.length,
      totalOutstanding: rows.reduce((sum, row) => sum + row.outstanding, 0),
      documents: rows,
    });
  }

  if (toolName === 'get_overdue_invoices') {
    const side = String(args.side ?? 'receivable');
    const types: Array<'invoice' | 'purchase'> = side === 'both'
      ? ['invoice', 'purchase']
      : [side === 'payable' ? 'purchase' : 'invoice'];

    const groups = await Promise.all(types.map((type) => loadDocuments(context, type, limit)));
    const firstError = groups.find((group) => !group.ok);
    if (firstError && !firstError.ok) return fail(toolName, firstError.error);

    const rows = groups.flatMap((group, index) => {
      if (!group.ok) return [];
      const type = types[index];
      return group.docs
        .filter((doc) => isOverdue(doc))
        .map((doc) => ({ ...normalizeDocument(doc), side: type === 'purchase' ? 'payable' : 'receivable' }));
    })
      .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0))
      .slice(0, limit);

    return ok(toolName, {
      source: isExpertGlobalHoldedContext(context) ? 'holded_expert_global' : 'holded_client_integration',
      derived: true,
      count: rows.length,
      totalOutstanding: rows.reduce((sum, row) => sum + row.outstanding, 0),
      documents: rows,
    });
  }

  if (toolName === 'get_unreconciled_transactions') {
    const resolved = await resolveAccountingAuth(context, 'bankMovements');
    if (!resolved.ok) return fail(toolName, resolved.error);
    const headers = buildHoldedHeaders(resolved.auth.apiKey);
    const response = await fetch(`${resolved.auth.baseUrl}/treasury/movements?limit=${Math.max(limit, 50)}`, { headers });
    if (!response.ok) return fail(toolName, `Holded devolvió ${response.status}`);
    const raw = await response.json() as unknown;
    const movements = Array.isArray(raw)
      ? raw as Raw[]
      : raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)
        ? (raw as { data: Raw[] }).data
        : [];

    const rows = movements.filter((movement) => {
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
    }));

    return ok(toolName, {
      source: isExpertGlobalHoldedContext(context) ? 'holded_expert_global' : 'holded_client_integration',
      derived: true,
      derivation: 'movement_without_document_or_match_and_without_reconciled_status',
      count: rows.length,
      transactions: rows,
    });
  }

  if (toolName === 'draft_payment_reminder') {
    const loaded = await loadDocuments(context, 'invoice', 100);
    if (!loaded.ok) return fail(toolName, loaded.error);
    const invoiceId = String(args.invoiceId ?? '');
    const rawInvoice = loaded.docs.find((doc) => String(doc.id ?? '') === invoiceId);
    if (!rawInvoice) return fail(toolName, 'No se ha encontrado la factura indicada en el ámbito Holded autorizado.');
    const invoice = normalizeDocument(rawInvoice);
    if (isPaid(rawInvoice)) return fail(toolName, 'La factura consta como pagada; no se genera reclamación.');

    const language = (args.language === 'ru' ? 'ru' : args.language === 'es' ? 'es' : context.contact.language === 'ru' ? 'ru' : 'es') as 'es' | 'ru';
    const stage = (['friendly', 'firm', 'formal'].includes(String(args.stage)) ? args.stage : 'friendly') as 'friendly' | 'firm' | 'formal';
    const draft = reminderCopy({ language, stage, invoice });

    return ok(toolName, {
      status: 'draft_only',
      source: isExpertGlobalHoldedContext(context) ? 'holded_expert_global' : 'holded_client_integration',
      invoice,
      stage,
      ...draft,
      requiresHumanApproval: true,
      sent: false,
    });
  }

  if (toolName === 'draft_credit_note') {
    const loaded = await loadDocuments(context, 'invoice', 100);
    if (!loaded.ok) return fail(toolName, loaded.error);
    const invoiceId = String(args.invoiceId ?? '');
    const rawInvoice = loaded.docs.find((doc) => String(doc.id ?? '') === invoiceId);
    if (!rawInvoice) return fail(toolName, 'No se ha encontrado la factura indicada en el ámbito Holded autorizado.');
    const invoice = normalizeDocument(rawInvoice);
    const requestedAmount = typeof args.amount === 'number' ? args.amount : invoice.total;

    if (requestedAmount <= 0 || requestedAmount > invoice.total) {
      return fail(toolName, 'El importe propuesto para la rectificativa debe ser positivo y no superar el total de la factura original.');
    }

    return ok(toolName, {
      status: 'proposal_only',
      source: isExpertGlobalHoldedContext(context) ? 'holded_expert_global' : 'holded_client_integration',
      originalInvoice: invoice,
      proposedDocumentType: 'creditnote',
      proposedAmount: requestedAmount,
      reason: String(args.reason ?? ''),
      requiresHumanApproval: true,
      createdInHolded: false,
      accountingMutation: false,
    });
  }

  return fail(toolName, 'Herramienta contable no soportada.');
}
