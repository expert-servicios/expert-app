import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  createHoldedClient,
  createExpertHoldedClient,
  type HoldedBankAccount,
  type HoldedClient,
  type HoldedContact,
  type HoldedDocument,
} from './holded-client';
import {
  createHoldedV2Client,
  type HoldedV2Client,
  type HoldedV2Contact,
  type HoldedV2Invoice,
  type HoldedV2Purchase,
  type HoldedV2TreasuryAccount,
} from './holded-v2-client';
import { HoldedIntegrationError } from './holded-errors';

export type HoldedIntegrationMode = 'expert_account' | 'client_account' | 'advisor_managed';
export type HoldedApiVersion = 'v1' | 'v2';

export interface HoldedGatewayMetadata {
  integrationId: string | null;
  companyId: string | null;
  mode: HoldedIntegrationMode;
  apiVersion: HoldedApiVersion;
  syncMode: 'read_only' | 'read_write';
}

export type HoldedGateway =
  | { metadata: HoldedGatewayMetadata & { apiVersion: 'v1' }; client: HoldedClient; v1: HoldedClient; v2: null }
  | { metadata: HoldedGatewayMetadata & { apiVersion: 'v2' }; client: HoldedV2Client; v1: null; v2: HoldedV2Client };

export interface HoldedReadDocument {
  id: string;
  number: string;
  date: string;
  timestamp: number;
  total: number;
  subtotal: number;
  tax: number;
  currency: string;
  status: string;
  contactId: string | null;
  contactName: string;
  paymentsPending: number;
  isDraft: boolean;
}

export interface HoldedReadContact {
  id: string;
  name: string;
  email: string | null;
  type: string | number | null;
  vatNumber: string | null;
}

export interface HoldedReadBankAccount {
  id: string;
  name: string;
  iban: string | null;
  balance: number;
  currency: string;
}

function toUnixDate(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.floor(timestamp / 1000) : undefined;
}

function v1DocumentToReadModel(doc: HoldedDocument): HoldedReadDocument {
  const raw = doc as unknown as Record<string, unknown>;
  const timestamp = Number(doc.date ?? 0);
  const total = Number(doc.total ?? 0);
  const itemsSubtotal = Array.isArray(doc.items)
    ? doc.items.reduce((sum, item) => sum + Number(item.subtotal ?? 0), 0)
    : 0;
  const subtotal = Number(raw.subtotal ?? itemsSubtotal);
  const tax = Number(raw.tax ?? Math.max(0, total - subtotal));
  const status = String(doc.status ?? '');
  const paymentsPending = Number(raw.paymentsPending ?? raw.payments_pending ?? 0);

  return {
    id: String(doc.id ?? ''),
    number: String(doc.docNumber ?? raw.document_number ?? ''),
    date: timestamp ? new Date(timestamp * 1000).toISOString().slice(0, 10) : '',
    timestamp,
    total,
    subtotal,
    tax,
    currency: String(doc.currency ?? 'EUR'),
    status,
    contactId: doc.contact?.id ? String(doc.contact.id) : null,
    contactName: String(doc.contact?.name ?? raw.contactName ?? ''),
    paymentsPending,
    isDraft: Number(status) === 0 || status.toLowerCase() === 'draft',
  };
}

function v2DocumentToReadModel(doc: HoldedV2Invoice | HoldedV2Purchase): HoldedReadDocument {
  const date = typeof doc.date === 'string' ? doc.date : '';
  const timestamp = date ? Math.floor(Date.parse(date) / 1000) : 0;
  const status = String(doc.status ?? '');

  return {
    id: String(doc.id ?? ''),
    number: String(doc.document_number ?? ''),
    date,
    timestamp: Number.isFinite(timestamp) ? timestamp : 0,
    total: Number(doc.total ?? 0),
    subtotal: Number(doc.subtotal ?? 0),
    tax: Number(doc.tax ?? 0),
    currency: String(doc.currency ?? 'EUR'),
    status,
    contactId: doc.contact_id ? String(doc.contact_id) : null,
    contactName: String(doc.contact_name ?? ''),
    paymentsPending: Number(doc.payments_pending ?? 0),
    isDraft: status.toLowerCase() === 'draft',
  };
}

function v1ContactToReadModel(contact: HoldedContact): HoldedReadContact {
  const raw = contact as unknown as Record<string, unknown>;
  return {
    id: String(contact.id ?? ''),
    name: String(contact.name ?? ''),
    email: contact.email ? String(contact.email) : null,
    type: contact.type ?? null,
    vatNumber: raw.vatnumber ? String(raw.vatnumber) : null,
  };
}

function v2ContactToReadModel(contact: HoldedV2Contact): HoldedReadContact {
  return {
    id: String(contact.id ?? ''),
    name: String(contact.name ?? ''),
    email: contact.email ? String(contact.email) : null,
    type: typeof contact.type === 'string' || typeof contact.type === 'number' ? contact.type : null,
    vatNumber: contact.vat_number ? String(contact.vat_number) : null,
  };
}

function v1BankToReadModel(account: HoldedBankAccount): HoldedReadBankAccount {
  return {
    id: String(account.id ?? ''),
    name: String(account.name ?? ''),
    iban: account.iban ? String(account.iban) : null,
    balance: Number(account.balance ?? 0),
    currency: 'EUR',
  };
}

function v2BankToReadModel(account: HoldedV2TreasuryAccount): HoldedReadBankAccount {
  return {
    id: String(account.id ?? ''),
    name: String(account.name ?? ''),
    iban: account.iban ? String(account.iban) : null,
    balance: Number(account.balance ?? 0),
    currency: String(account.currency ?? 'EUR'),
  };
}

export async function listHoldedDocuments(
  gateway: HoldedGateway,
  kind: 'sales' | 'purchase',
  params: { startDate?: string; endDate?: string; maxItems?: number } = {},
): Promise<HoldedReadDocument[]> {
  const maxItems = Math.max(1, Math.min(2_000, Math.trunc(params.maxItems ?? 2_000)));

  if (gateway.v2) {
    const v2 = gateway.v2;
    const items: HoldedReadDocument[] = [];
    let cursor: string | undefined;
    while (items.length < maxItems) {
      const page = kind === 'sales'
        ? await v2.listInvoices({
            startDate: params.startDate,
            endDate: params.endDate,
            limit: Math.min(200, maxItems - items.length),
            cursor,
          })
        : await v2.listPurchases({
            startDate: params.startDate,
            endDate: params.endDate,
            limit: Math.min(200, maxItems - items.length),
            cursor,
          });
      items.push(...page.items.map(v2DocumentToReadModel));
      if (!page.has_more || !page.cursor) break;
      cursor = page.cursor;
    }
    return items.slice(0, maxItems);
  }

  const v1 = gateway.v1;
  if (!v1) throw new HoldedIntegrationError('Holded v1 client is unavailable.');
  const items: HoldedReadDocument[] = [];
  const dateFrom = toUnixDate(params.startDate);
  const dateTo = toUnixDate(params.endDate);
  for (let page = 1; page <= 20 && items.length < maxItems; page++) {
    const docs = kind === 'sales'
      ? await v1.listSalesInvoices({ page, dateFrom, dateTo })
      : await v1.listPurchaseInvoices({ page, dateFrom, dateTo });
    if (docs.length === 0) break;
    items.push(...docs.map(v1DocumentToReadModel));
  }
  return items.slice(0, maxItems);
}

export async function listHoldedContacts(
  gateway: HoldedGateway,
  params: { search?: string; maxItems?: number } = {},
): Promise<HoldedReadContact[]> {
  const maxItems = Math.max(1, Math.min(100, Math.trunc(params.maxItems ?? 50)));

  if (gateway.v2) {
    const page = await gateway.v2.listContacts({ search: params.search, limit: maxItems });
    return page.items.map(v2ContactToReadModel).slice(0, maxItems);
  }

  const v1 = gateway.v1;
  if (!v1) throw new HoldedIntegrationError('Holded v1 client is unavailable.');
  const query = params.search?.trim().toLocaleLowerCase('es') ?? '';
  const matches: HoldedReadContact[] = [];
  for (let page = 1; page <= 20 && matches.length < maxItems; page++) {
    const contacts = await v1.listContacts({ page });
    if (contacts.length === 0) break;
    matches.push(
      ...contacts
        .map(v1ContactToReadModel)
        .filter((contact) => !query || contact.name.toLocaleLowerCase('es').includes(query)),
    );
  }
  return matches.slice(0, maxItems);
}

export async function listHoldedBankAccounts(
  gateway: HoldedGateway,
  maxItems = 20,
): Promise<HoldedReadBankAccount[]> {
  const limit = Math.max(1, Math.min(100, Math.trunc(maxItems)));
  if (gateway.v2) {
    const page = await gateway.v2.listTreasuryAccounts({ limit });
    return page.items.map(v2BankToReadModel).slice(0, limit);
  }
  const v1 = gateway.v1;
  if (!v1) throw new HoldedIntegrationError('Holded v1 client is unavailable.');
  return (await v1.listBankAccounts()).map(v1BankToReadModel).slice(0, limit);
}

type IntegrationRow = {
  id: string;
  company_id: string | null;
  mode: string | null;
  api_version: string | null;
  sync_mode: string | null;
  status: string;
};

function normalizeMode(value: string | null): HoldedIntegrationMode {
  if (value === 'expert_account' || value === 'advisor_managed') return value;
  return 'client_account';
}

function normalizeVersion(value: string | null): HoldedApiVersion {
  return value === 'v2' ? 'v2' : 'v1';
}

function normalizeSyncMode(value: string | null): 'read_only' | 'read_write' {
  return value === 'read_write' ? 'read_write' : 'read_only';
}

export async function createExpertHoldedGateway(): Promise<HoldedGateway> {
  const client = await createExpertHoldedClient();
  return {
    metadata: {
      integrationId: null,
      companyId: null,
      mode: 'expert_account',
      apiVersion: 'v1',
      syncMode: 'read_only',
    },
    client,
    v1: client,
    v2: null,
  };
}

export async function createHoldedGatewayForIntegration(integrationId: string): Promise<HoldedGateway> {
  const normalized = integrationId.trim();
  if (!normalized) throw new HoldedIntegrationError('integrationId is required');

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('client_integrations')
    .select('id,company_id,mode,api_version,sync_mode,status')
    .eq('id', normalized)
    .eq('provider', 'holded')
    .maybeSingle();

  if (error || !data) {
    throw new HoldedIntegrationError(
      `Holded integration not found for id=${normalized}: ${error?.message ?? 'no data'}`,
    );
  }

  const row = data as IntegrationRow;
  if (row.status !== 'active') {
    throw new HoldedIntegrationError(`Holded integration ${normalized} is not active (status=${row.status}).`);
  }

  const mode = normalizeMode(row.mode);
  const apiVersion = normalizeVersion(row.api_version);
  const syncMode = normalizeSyncMode(row.sync_mode);

  if (mode === 'advisor_managed' && apiVersion !== 'v2') {
    throw new HoldedIntegrationError(
      `advisor_managed integration ${normalized} must use Holded API v2 Bearer authentication.`,
    );
  }

  if (apiVersion === 'v2') {
    const client = await createHoldedV2Client(normalized);
    return {
      metadata: { integrationId: normalized, companyId: row.company_id, mode, apiVersion, syncMode },
      client,
      v1: null,
      v2: client,
    };
  }

  const client = await createHoldedClient(normalized);
  return {
    metadata: { integrationId: normalized, companyId: row.company_id, mode, apiVersion, syncMode },
    client,
    v1: client,
    v2: null,
  };
}

export async function createHoldedGatewayForCompany(companyId: string): Promise<HoldedGateway> {
  const normalized = companyId.trim();
  if (!normalized) throw new HoldedIntegrationError('companyId is required');

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('client_integrations')
    .select('id')
    .eq('provider', 'holded')
    .eq('company_id', normalized)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) {
    throw new HoldedIntegrationError(
      `No active Holded integration found for company=${normalized}: ${error?.message ?? 'no data'}`,
    );
  }

  return createHoldedGatewayForIntegration(data.id);
}
