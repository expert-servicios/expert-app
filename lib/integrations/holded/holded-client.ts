/**
 * Holded Client — unified HTTP client for per-integration API calls.
 *
 * Architecture rules:
 * - Every public method in this client is read-only.
 * - Rate limiting reserves request slots synchronously so concurrent callers do
 *   not wake in a burst.
 * - All errors are typed through holded-errors.
 * - API keys are never logged or returned.
 */

import { buildHoldedHeaders, resolveHoldedAuth } from './holded-auth';
import { classifyHoldedError, holdedErrorMessage } from './holded-errors';
import {
  createEmptyHoldedPermissions,
  normalizeDetectedHoldedPermissions,
  type HoldedPermissions,
} from './holded-permissions';

export type { HoldedPermissions } from './holded-permissions';

export interface HoldedContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  code?: string;
  type?: number;
  customId?: string;
}

export interface HoldedDocument {
  id: string;
  docNumber: string;
  date: number;
  total: number;
  currency: string;
  status: string;
  contact: { id: string; name: string };
  items: HoldedDocumentItem[];
}

export interface HoldedDocumentItem {
  name: string;
  units: number;
  subtotal: number;
  tax?: number;
  taxId?: string;
}

export interface HoldedTax {
  id: string;
  name: string;
  value: number;
}

export interface HoldedBankAccount {
  id: string;
  name: string;
  iban?: string;
  balance?: number;
}

export interface HoldedBankMovement {
  id: string;
  date: number;
  amount: number;
  description: string;
  reference?: string;
  contactId?: string;
  documentId?: string;
  status: string;
}

export interface HoldedInboxDocument {
  id: string;
  name: string;
  date: number;
  total?: number;
  status: string;
  type?: string;
}

const MIN_DELAY_MS = 150;
let nextRequestAt = 0;

async function respectRateLimit(): Promise<void> {
  const now = Date.now();
  const reservedAt = Math.max(now, nextRequestAt);
  nextRequestAt = reservedAt + MIN_DELAY_MS;
  const delay = reservedAt - now;
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
}

async function holdedFetch<T>(
  apiKey: string,
  method: string,
  url: string,
  body?: Record<string, unknown>,
): Promise<T> {
  await respectRateLimit();

  const res = await fetch(url, {
    method,
    headers: buildHoldedHeaders(apiKey),
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw classifyHoldedError(res.status, url, text);
  }

  return res.json() as Promise<T>;
}

function listOrData<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (!raw || typeof raw !== 'object') return [];
  const obj = raw as { data?: unknown };
  return Array.isArray(obj.data) ? obj.data as T[] : [];
}

export interface HoldedClient {
  testConnection(): Promise<{ ok: boolean; permissions: HoldedPermissions; warnings: string[] }>;
  detectPermissions(): Promise<HoldedPermissions>;
  listContacts(params?: { page?: number; email?: string }): Promise<HoldedContact[]>;
  listSalesInvoices(params?: { page?: number; dateFrom?: number; dateTo?: number }): Promise<HoldedDocument[]>;
  listPurchaseInvoices(params?: { page?: number; dateFrom?: number; dateTo?: number }): Promise<HoldedDocument[]>;
  listTaxes(): Promise<HoldedTax[]>;
  listBankAccounts(): Promise<HoldedBankAccount[]>;
  listBankMovements(params?: { page?: number; dateFrom?: number; dateTo?: number }): Promise<HoldedBankMovement[]>;
  listInboxDocuments(params?: { page?: number }): Promise<HoldedInboxDocument[]>;
  getDocument(docType: 'invoice' | 'estimate' | 'proforma' | 'order', docId: string): Promise<HoldedDocument | null>;
  getContact(contactId: string): Promise<HoldedContact | null>;
}

const INVOICING_BASE = 'https://api.holded.com/api/invoicing/v1';

function buildHoldedClient(apiKey: string, baseUrl: string): HoldedClient {
  const key = apiKey.trim();
  if (!key) throw new Error('Holded API key is required');
  const get = <T>(path: string) => holdedFetch<T>(key, 'GET', `${baseUrl}${path}`);

  async function detectPermissions(): Promise<HoldedPermissions> {
    const getAccounting = <T>(path: string) =>
      holdedFetch<T>(key, 'GET', `https://api.holded.com/api/accounting/v1${path}`);

    const checks: Array<{ key: keyof HoldedPermissions; probe: () => Promise<unknown> }> = [
      { key: 'contacts', probe: () => get('/contacts?page=1') },
      { key: 'salesInvoices', probe: () => get('/documents/invoice?page=1') },
      { key: 'purchaseInvoices', probe: () => get('/documents/purchase?page=1') },
      { key: 'taxes', probe: () => get('/taxes') },
      { key: 'bankAccounts', probe: () => get('/treasury/accounts') },
      { key: 'bankMovements', probe: () => get('/treasury/movements?page=1') },
      { key: 'inboxDocuments', probe: () => get('/documents/inbox?page=1') },
      { key: 'accountingReports', probe: () => getAccounting(`/reports/vat?year=${new Date().getFullYear()}`) },
      { key: 'accountingEntries', probe: () => getAccounting('/entries?page=1') },
    ];

    const permissions = createEmptyHoldedPermissions();
    for (const { key: permissionKey, probe } of checks) {
      try {
        await probe();
        permissions[permissionKey] = true;
      } catch {
        permissions[permissionKey] = false;
      }
    }

    // This client has no write probes. Writes are never inferred from a
    // successful read endpoint and labor capabilities are detected separately.
    return normalizeDetectedHoldedPermissions(permissions);
  }

  async function testConnection(): Promise<{ ok: boolean; permissions: HoldedPermissions; warnings: string[] }> {
    const warnings: string[] = [];
    let permissions: HoldedPermissions;

    try {
      permissions = await detectPermissions();
    } catch (err) {
      return {
        ok: false,
        permissions: createEmptyHoldedPermissions(),
        warnings: [holdedErrorMessage(err)],
      };
    }

    if (!permissions.salesInvoices) warnings.push('Sin acceso a facturas emitidas — necesario para resumen fiscal.');
    if (!permissions.purchaseInvoices) warnings.push('Sin acceso a facturas recibidas/compras — necesario para calcular IVA soportado.');
    if (!permissions.taxes) warnings.push('Sin acceso a impuestos — necesario para resumen Modelo 303.');
    if (!permissions.bankAccounts) warnings.push('Sin acceso a bancos — la conciliación no estará disponible.');

    return { ok: true, permissions, warnings };
  }

  return {
    testConnection,
    detectPermissions,

    async listContacts({ page = 1, email } = {}) {
      const qs = new URLSearchParams({ page: String(page) });
      if (email) qs.set('email', email);
      const raw = await get<unknown>(`/contacts?${qs}`);
      return listOrData<HoldedContact>(raw);
    },

    async listSalesInvoices({ page = 1, dateFrom, dateTo } = {}) {
      const qs = new URLSearchParams({ page: String(page) });
      if (dateFrom) qs.set('dateFrom', String(dateFrom));
      if (dateTo) qs.set('dateTo', String(dateTo));
      const raw = await get<unknown>(`/documents/invoice?${qs}`);
      return listOrData<HoldedDocument>(raw);
    },

    async listPurchaseInvoices({ page = 1, dateFrom, dateTo } = {}) {
      const qs = new URLSearchParams({ page: String(page) });
      if (dateFrom) qs.set('dateFrom', String(dateFrom));
      if (dateTo) qs.set('dateTo', String(dateTo));
      const raw = await get<unknown>(`/documents/purchase?${qs}`);
      return listOrData<HoldedDocument>(raw);
    },

    async listTaxes() {
      return listOrData<HoldedTax>(await get<unknown>('/taxes'));
    },

    async listBankAccounts() {
      return listOrData<HoldedBankAccount>(await get<unknown>('/treasury/accounts'));
    },

    async listBankMovements({ page = 1, dateFrom, dateTo } = {}) {
      const qs = new URLSearchParams({ page: String(page) });
      if (dateFrom) qs.set('dateFrom', String(dateFrom));
      if (dateTo) qs.set('dateTo', String(dateTo));
      return listOrData<HoldedBankMovement>(await get<unknown>(`/treasury/movements?${qs}`));
    },

    async listInboxDocuments({ page = 1 } = {}) {
      return listOrData<HoldedInboxDocument>(await get<unknown>(`/documents/inbox?page=${page}`));
    },

    async getDocument(docType, docId) {
      try {
        return await get<HoldedDocument>(`/documents/${docType}/${encodeURIComponent(docId.trim())}`);
      } catch {
        return null;
      }
    },

    async getContact(contactId) {
      try {
        return await get<HoldedContact>(`/contacts/${encodeURIComponent(contactId.trim())}`);
      } catch {
        return null;
      }
    },
  };
}

export async function createHoldedClient(integrationId: string | null): Promise<HoldedClient> {
  const auth = await resolveHoldedAuth(integrationId);
  return buildHoldedClient(auth.apiKey, auth.baseUrl);
}

export function createHoldedClientFromRawKey(rawApiKey: string): HoldedClient {
  return buildHoldedClient(rawApiKey, INVOICING_BASE);
}

export function createExpertHoldedClient(): Promise<HoldedClient> {
  return createHoldedClient(null);
}

export function isEncryptionConfigured(): boolean {
  const key = process.env.SECRET_ENCRYPTION_KEY;
  if (!key) return false;
  try {
    const buf = Buffer.from(key, 'hex');
    return buf.length === 32;
  } catch {
    return false;
  }
}

export function getMissingPlanPermissions(permissions: HoldedPermissions): string[] {
  const missing: string[] = [];
  if (!permissions.salesInvoices) missing.push('Facturas emitidas');
  if (!permissions.purchaseInvoices) missing.push('Facturas recibidas / compras');
  if (!permissions.taxes) missing.push('Impuestos');
  return missing;
}
