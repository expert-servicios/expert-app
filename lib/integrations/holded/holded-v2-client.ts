import { createHash } from 'node:crypto';
import { classifyHoldedError } from './holded-errors';
import { resolveHoldedAuth } from './holded-auth';

const HOLDED_V2_BASE = 'https://api.holded.com/api/v2';
// Conservative baseline for Plus/Basic accounts: Holded publishes 60 requests/minute.
// Higher-tier throughput can be introduced later from /usage + rate-limit response headers.
const MIN_DELAY_MS = 1_050;
const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 50;

const nextRequestAtByAccount = new Map<string, number>();

export interface HoldedV2Page<T> {
  items: T[];
  cursor: string | null;
  has_more: boolean;
}

export interface HoldedV2CurrentContractSummary {
  id: string;
  type: string;
  start_date: string | null;
  end_date: string | null;
  job_title: string;
  schedule_hours: number | null;
  schedule_mode: string;
  working_days: string[];
  salary: string | null;
  salary_interval: string;
  salary_payments: number | null;
  salary_extra: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface HoldedV2Employee {
  id: string;
  holded_user_id?: string | null;
  name: string;
  last_name: string;
  full_name: string;
  code: string;
  email: string;
  phone: string | null;
  mobile: string | null;
  workplace_id: string;
  social_security_number: string;
  current_contract: HoldedV2CurrentContractSummary | null;
  job_title: string;
  terminated: number | null;
  payroll_accounts: Record<string, Record<string, string | null>>;
  [key: string]: unknown;
}

export interface HoldedV2ActiveContract {
  employee?: string | null;
  nif?: string | null;
  contractType: number;
  contributionType?: string | null;
  royalDecree?: string | null;
  startDate: string;
  seniorityDate?: string | null;
  endDate?: string | null;
  educationalLevel?: string | null;
  jobTitle?: string | null;
  professionalCategory?: string | null;
  scheduleHours?: number | null;
  scheduleMode?: string | null;
  workingDays?: string[] | null;
  probationPeriodDays?: number | null;
  vacationDays?: number | null;
  isManuallyActivated?: boolean | null;
  workModality?: string | null;
  salary: number;
  salaryInterval: string;
  salaryPayments?: number | null;
  [key: string]: unknown;
}

export interface HoldedV2Payslip {
  id: string;
  employee_id: string | null;
  employee_name: string;
  payslip_kind: 'nomina_ordinaria' | 'gratificacion_no_cuantificable' | 'finiquito' | 'atrasos' | string;
  date: string;
  period_start: string | null;
  period_end: string | null;
  total_days: number;
  description: string;
  tags: string[];
  accounting_account_id: string | null;
  is_draft: boolean;
  net_salary: string;
  total_company_cost: string;
  payment_total: string;
  payment_pending: string;
  payment_status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | string;
  earnings?: unknown[];
  deductions?: unknown[];
  employer_contributions?: unknown[];
  contribution_bases?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface HoldedV2SalaryRecord {
  id: string;
  employee_id: string | null;
  employee_name: string;
  date: string;
  description: string;
  tags: string[];
  accounting_account_id: string | null;
  is_draft: boolean;
  total_payable: string;
  payment_total: string;
  payment_pending: string;
  payment_status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | string;
  lines?: unknown[];
  [key: string]: unknown;
}


export interface HoldedV2Invoice extends Record<string, unknown> {
  id: string;
  document_number?: string | null;
  contact_id?: string | null;
  contact_name?: string | null;
  date?: string | null;
  due_date?: string | null;
  subtotal?: string | number | null;
  tax?: string | number | null;
  total?: string | number | null;
  currency?: string | null;
  status?: string | number | null;
  payments_total?: string | number | null;
  payments_pending?: string | number | null;
  approval_status?: 'draft' | 'approved' | string | null;
}

export interface HoldedV2Purchase extends Record<string, unknown> {
  id: string;
  document_number?: string | null;
  contact_id?: string | null;
  contact_name?: string | null;
  date?: string | null;
  due_date?: string | null;
  subtotal?: string | number | null;
  tax?: string | number | null;
  total?: string | number | null;
  currency?: string | null;
  status?: string | number | null;
  payments_total?: string | number | null;
  payments_pending?: string | number | null;
  approval_status?: 'draft' | 'approved' | string | null;
  deduction_date?: string | null;
}

export interface HoldedV2Contact extends Record<string, unknown> {
  id: string;
  name?: string | null;
  email?: string | null;
  vat_number?: string | null;
}

export interface HoldedV2AccountingAccount extends Record<string, unknown> {
  id: string;
  name?: string | null;
  code?: string | null;
  account_num?: string | null;
}

export interface HoldedV2TreasuryAccount extends Record<string, unknown> {
  id: string;
  name?: string | null;
  iban?: string | null;
  balance?: string | number | null;
  currency?: string | null;
  archived?: boolean | null;
}

export interface HoldedV2Tax extends Record<string, unknown> {
  id?: string;
  key?: string;
  name?: string | null;
  value?: string | number | null;
}

export interface HoldedV2LedgerEntry extends Record<string, unknown> {
  id: string;
  date?: string | null;
  description?: string | null;
}

export interface HoldedV2BankMovement extends Record<string, unknown> {
  id: string;
  banking_account_id?: string | null;
  description?: string | null;
  note?: string | null;
  amount?: string | number | null;
  currency?: string | null;
  balance?: string | number | null;
  accounting_amount?: string | number | null;
  accounting_currency?: string | null;
  booking_date?: string | null;
  value_date?: string | null;
  status?: 'pending' | 'reconciled' | 'partial' | 'forced_reconciled' | string | null;
  reconciled_amount?: string | number | null;
  origin?: string | null;
}

export interface HoldedV2Payment extends Record<string, unknown> {
  id: string;
  date?: string | null;
  amount?: string | number | null;
  document_id?: string | null;
  document_type?: string | null;
  banking_account_id?: string | null;
}

export interface HoldedV2Usage extends Record<string, unknown> {
  type?: string | null;
  period?: string | null;
  usage?: number | null;
  limit?: number | null;
  count?: number | null;
  next_plan?: string | null;
  next_limit?: number | null;
}

export interface HoldedV2Client {
  listEmployees(params?: {
    search?: string;
    limit?: number;
    cursor?: string;
  }): Promise<HoldedV2Page<HoldedV2Employee>>;
  getEmployee(employeeId: string): Promise<HoldedV2Employee>;
  getActiveContract(employeeId: string): Promise<HoldedV2ActiveContract>;
  listPayslips(params?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    kind?: string;
    isDraft?: boolean;
    limit?: number;
    cursor?: string;
  }): Promise<HoldedV2Page<HoldedV2Payslip>>;
  getPayslip(payslipId: string): Promise<HoldedV2Payslip>;
  getPayslipPdf(payslipId: string): Promise<ArrayBuffer>;
  listSalaryRecords(params?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    cursor?: string;
  }): Promise<HoldedV2Page<HoldedV2SalaryRecord>>;
  getSalaryRecord(salaryRecordId: string): Promise<HoldedV2SalaryRecord>;
  getSalaryRecordPdf(salaryRecordId: string): Promise<ArrayBuffer>;
  getUsage(): Promise<HoldedV2Usage>;
  listInvoices(params?: { startDate?: string; endDate?: string; approvalStatus?: 'draft' | 'approved'; limit?: number; cursor?: string }): Promise<HoldedV2Page<HoldedV2Invoice>>;
  listPurchases(params?: { startDate?: string; endDate?: string; approvalStatus?: 'draft' | 'approved'; limit?: number; cursor?: string }): Promise<HoldedV2Page<HoldedV2Purchase>>;
  listContacts(params?: { search?: string; limit?: number; cursor?: string }): Promise<HoldedV2Page<HoldedV2Contact>>;
  listAccountingAccounts(params?: { limit?: number; cursor?: string }): Promise<HoldedV2Page<HoldedV2AccountingAccount>>;
  listTreasuryAccounts(params?: { limit?: number; cursor?: string; archived?: boolean }): Promise<HoldedV2Page<HoldedV2TreasuryAccount>>;
  listTaxes(params?: { limit?: number; cursor?: string }): Promise<HoldedV2Page<HoldedV2Tax>>;
  listLedgerEntries(params?: { startDate?: string; endDate?: string; limit?: number; cursor?: string }): Promise<HoldedV2Page<HoldedV2LedgerEntry>>;
  listPayments(params?: { limit?: number; cursor?: string }): Promise<HoldedV2Page<HoldedV2Payment>>;
  listBankMovements(accountId: string, params?: {
    startDate?: string;
    endDate?: string;
    status?: Array<'pending' | 'reconciled' | 'partial' | 'forced_reconciled'>;
    limit?: number;
    cursor?: string;
  }): Promise<HoldedV2Page<HoldedV2BankMovement>>;
}

function clampPageSize(limit: number | undefined): number {
  if (limit === undefined || Number.isNaN(limit)) return DEFAULT_PAGE_SIZE;
  return Math.max(1, Math.min(MAX_PAGE_SIZE, Math.trunc(limit)));
}

async function respectRateLimit(apiKey: string): Promise<void> {
  const accountKey = createHash('sha256').update(apiKey).digest('hex');
  const now = Date.now();
  const reservedAt = Math.max(now, nextRequestAtByAccount.get(accountKey) ?? 0);
  nextRequestAtByAccount.set(accountKey, reservedAt + MIN_DELAY_MS);
  const delay = reservedAt - now;

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

function buildHeaders(apiKey: string, accept = 'application/json'): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: accept,
  };
}

function normalizePage<T>(raw: unknown): HoldedV2Page<T> {
  const obj = (raw ?? {}) as {
    items?: unknown;
    cursor?: unknown;
    has_more?: unknown;
  };

  return {
    items: Array.isArray(obj.items) ? (obj.items as T[]) : [],
    cursor: typeof obj.cursor === 'string' && obj.cursor.length > 0 ? obj.cursor : null,
    has_more: obj.has_more === true,
  };
}

function appendIfPresent(search: URLSearchParams, key: string, value: string | undefined): void {
  const normalized = value?.trim();
  if (normalized) search.set(key, normalized);
}

function buildPaginatedUrl(
  path: string,
  params: {
    limit?: number;
    cursor?: string;
    search?: string;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    kind?: string;
    isDraft?: boolean;
    approvalStatus?: 'draft' | 'approved';
    archived?: boolean;
  },
): string {
  const search = new URLSearchParams();
  search.set('limit', String(clampPageSize(params.limit)));
  appendIfPresent(search, 'cursor', params.cursor);
  appendIfPresent(search, 'search', params.search);
  appendIfPresent(search, 'employee_id', params.employeeId);
  appendIfPresent(search, 'start_date', params.startDate);
  appendIfPresent(search, 'end_date', params.endDate);
  appendIfPresent(search, 'kind', params.kind);
  if (typeof params.isDraft === 'boolean') search.set('is_draft', String(params.isDraft));
  appendIfPresent(search, 'approval_status', params.approvalStatus);
  if (typeof params.archived === 'boolean') search.set('archived', String(params.archived));
  return `${HOLDED_V2_BASE}${path}?${search.toString()}`;
}

function safePathSegment(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required`);
  return encodeURIComponent(normalized);
}

async function holdedV2FetchJson<T>(apiKey: string, url: string): Promise<T> {
  await respectRateLimit(apiKey);
  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(apiKey),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw classifyHoldedError(response.status, new URL(url).pathname, body);
  }

  return response.json() as Promise<T>;
}

async function holdedV2FetchPdf(apiKey: string, url: string): Promise<ArrayBuffer> {
  await respectRateLimit(apiKey);
  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(apiKey, 'application/pdf'),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw classifyHoldedError(response.status, new URL(url).pathname, body);
  }

  return response.arrayBuffer();
}

export function buildHoldedV2Client(apiKey: string): HoldedV2Client {
  const key = apiKey.trim();
  if (!key) throw new Error('Holded API key is required');

  return {
    async listEmployees(params = {}) {
      const url = buildPaginatedUrl('/employees', {
        search: params.search,
        limit: params.limit,
        cursor: params.cursor,
      });
      return normalizePage<HoldedV2Employee>(await holdedV2FetchJson<unknown>(key, url));
    },

    async getEmployee(employeeId) {
      const id = safePathSegment(employeeId, 'employeeId');
      return holdedV2FetchJson<HoldedV2Employee>(key, `${HOLDED_V2_BASE}/employees/${id}`);
    },

    async getActiveContract(employeeId) {
      const id = safePathSegment(employeeId, 'employeeId');
      return holdedV2FetchJson<HoldedV2ActiveContract>(
        key,
        `${HOLDED_V2_BASE}/employees/${id}/contract`,
      );
    },

    async listPayslips(params = {}) {
      const url = buildPaginatedUrl('/payslips', {
        employeeId: params.employeeId,
        startDate: params.startDate,
        endDate: params.endDate,
        kind: params.kind,
        isDraft: params.isDraft,
        limit: params.limit,
        cursor: params.cursor,
      });
      return normalizePage<HoldedV2Payslip>(await holdedV2FetchJson<unknown>(key, url));
    },

    async getPayslip(payslipId) {
      const id = safePathSegment(payslipId, 'payslipId');
      return holdedV2FetchJson<HoldedV2Payslip>(key, `${HOLDED_V2_BASE}/payslips/${id}`);
    },

    async getPayslipPdf(payslipId) {
      const id = safePathSegment(payslipId, 'payslipId');
      return holdedV2FetchPdf(key, `${HOLDED_V2_BASE}/payslips/${id}/pdf`);
    },

    async listSalaryRecords(params = {}) {
      const url = buildPaginatedUrl('/salary-records', {
        employeeId: params.employeeId,
        startDate: params.startDate,
        endDate: params.endDate,
        limit: params.limit,
        cursor: params.cursor,
      });
      return normalizePage<HoldedV2SalaryRecord>(await holdedV2FetchJson<unknown>(key, url));
    },

    async getSalaryRecord(salaryRecordId) {
      const id = safePathSegment(salaryRecordId, 'salaryRecordId');
      return holdedV2FetchJson<HoldedV2SalaryRecord>(
        key,
        `${HOLDED_V2_BASE}/salary-records/${id}`,
      );
    },

    async getSalaryRecordPdf(salaryRecordId) {
      const id = safePathSegment(salaryRecordId, 'salaryRecordId');
      return holdedV2FetchPdf(key, `${HOLDED_V2_BASE}/salary-records/${id}/pdf`);
    },

    async getUsage() {
      return holdedV2FetchJson<HoldedV2Usage>(key, `${HOLDED_V2_BASE}/usage`);
    },

    async listInvoices(params = {}) {
      const url = buildPaginatedUrl('/invoices', {
        startDate: params.startDate,
        endDate: params.endDate,
        approvalStatus: params.approvalStatus,
        limit: params.limit,
        cursor: params.cursor,
      });
      return normalizePage<HoldedV2Invoice>(await holdedV2FetchJson<unknown>(key, url));
    },

    async listPurchases(params = {}) {
      const url = buildPaginatedUrl('/purchases', {
        startDate: params.startDate,
        endDate: params.endDate,
        approvalStatus: params.approvalStatus,
        limit: params.limit,
        cursor: params.cursor,
      });
      return normalizePage<HoldedV2Purchase>(await holdedV2FetchJson<unknown>(key, url));
    },

    async listContacts(params = {}) {
      const limit = Math.max(1, Math.min(100, Math.trunc(params.limit ?? 50)));
      if (params.search?.trim()) {
        const search = new URLSearchParams({
          name: params.search.trim(),
          limit: String(limit),
        });
        appendIfPresent(search, 'cursor', params.cursor);
        return normalizePage<HoldedV2Contact>(
          await holdedV2FetchJson<unknown>(key, `${HOLDED_V2_BASE}/contacts/search?${search.toString()}`),
        );
      }
      const url = buildPaginatedUrl('/contacts', {
        limit,
        cursor: params.cursor,
      });
      return normalizePage<HoldedV2Contact>(await holdedV2FetchJson<unknown>(key, url));
    },

    async listAccountingAccounts(params = {}) {
      const url = buildPaginatedUrl('/accounting-accounts', {
        limit: params.limit,
        cursor: params.cursor,
      });
      return normalizePage<HoldedV2AccountingAccount>(await holdedV2FetchJson<unknown>(key, url));
    },

    async listTreasuryAccounts(params = {}) {
      const url = buildPaginatedUrl('/treasury/accounts', {
        limit: params.limit,
        cursor: params.cursor,
        archived: params.archived,
      });
      return normalizePage<HoldedV2TreasuryAccount>(await holdedV2FetchJson<unknown>(key, url));
    },

    async listTaxes(params = {}) {
      const url = buildPaginatedUrl('/taxes', {
        limit: params.limit,
        cursor: params.cursor,
      });
      return normalizePage<HoldedV2Tax>(await holdedV2FetchJson<unknown>(key, url));
    },

    async listLedgerEntries(params = {}) {
      const now = new Date();
      const defaultStart = `${now.getUTCFullYear()}-01-01`;
      const defaultEnd = now.toISOString().slice(0, 10);
      const url = buildPaginatedUrl('/ledger-entries', {
        startDate: params.startDate ?? defaultStart,
        endDate: params.endDate ?? defaultEnd,
        limit: params.limit,
        cursor: params.cursor,
      });
      return normalizePage<HoldedV2LedgerEntry>(await holdedV2FetchJson<unknown>(key, url));
    },

    async listPayments(params = {}) {
      const url = buildPaginatedUrl('/payments', {
        limit: params.limit,
        cursor: params.cursor,
      });
      return normalizePage<HoldedV2Payment>(await holdedV2FetchJson<unknown>(key, url));
    },

    async listBankMovements(accountId, params = {}) {
      const id = safePathSegment(accountId, 'accountId');
      const search = new URLSearchParams();
      search.set('limit', String(clampPageSize(params.limit)));
      appendIfPresent(search, 'cursor', params.cursor);
      appendIfPresent(search, 'start_date', params.startDate);
      appendIfPresent(search, 'end_date', params.endDate);
      if (params.status?.length) search.set('status', params.status.join(','));
      return normalizePage<HoldedV2BankMovement>(
        await holdedV2FetchJson<unknown>(
          key,
          `${HOLDED_V2_BASE}/treasury/accounts/${id}/bank-movements?${search.toString()}`,
        ),
      );
    },
  };
}

export async function createHoldedV2Client(integrationId: string): Promise<HoldedV2Client> {
  const normalizedIntegrationId = integrationId.trim();
  if (!normalizedIntegrationId) throw new Error('integrationId is required');

  const auth = await resolveHoldedAuth(normalizedIntegrationId);
  return buildHoldedV2Client(auth.apiKey);
}

export function createHoldedV2ClientFromRawKey(rawApiKey: string): HoldedV2Client {
  return buildHoldedV2Client(rawApiKey);
}
