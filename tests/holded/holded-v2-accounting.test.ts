import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildHoldedV2Client } from '@/lib/integrations/holded/holded-v2-client';

describe('Holded v2 accounting reads', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads usage with Bearer auth', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      type: 'standard', period: 'monthly', usage: 12, limit: 7500, count: 12,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const client = buildHoldedV2Client('secret-v2');
    const usage = await client.getUsage();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.holded.com/api/v2/usage');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer secret-v2' });
    expect(usage.limit).toBe(7500);
  });

  it.each([
    ['listInvoices', '/api/v2/invoices?limit=25'],
    ['listSalesReceipts', '/api/v2/sales-receipts?limit=25'],
    ['listCreditNotes', '/api/v2/credit-notes?limit=25'],
    ['listAccountingAccounts', '/api/v2/accounting-accounts?limit=25'],
    ['listTreasuryAccounts', '/api/v2/treasury/accounts?limit=25'],
  ] as const)('%s uses the documented v2 endpoint', async (method, expected) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      items: [{ id: 'one' }],
      cursor: null,
      has_more: false,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const client = buildHoldedV2Client('secret-v2');
    const page = await client[method]({ limit: 25 });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain(expected);
    expect(url).not.toContain('secret-v2');
    expect(page.items).toHaveLength(1);
  });

  it('supports contact search without exposing credentials', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      items: [{ id: 'contact-1', name: 'Diseño Global Meridiano' }],
      cursor: 'next',
      has_more: true,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const client = buildHoldedV2Client('secret-v2');
    const page = await client.listContacts({ search: 'Meridiano', limit: 10 });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/v2/contacts/search?');
    expect(url).toContain('name=Meridiano');
    expect(url).not.toContain('secret-v2');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer secret-v2' });
    expect(page.cursor).toBe('next');
  });
});

describe('Holded v2 accounting safety filters', () => {
  it('requests approved invoices and active treasury accounts when asked', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      items: [],
      cursor: null,
      has_more: false,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
    vi.stubGlobal('fetch', fetchMock);

    const client = buildHoldedV2Client('safety-key-a');
    await client.listInvoices({ limit: 10, approvalStatus: 'approved' });
    await client.listTreasuryAccounts({ limit: 10, archived: false });

    const invoiceUrl = String(fetchMock.mock.calls[0]?.[0] ?? '');
    const treasuryUrl = String(fetchMock.mock.calls[1]?.[0] ?? '');
    expect(invoiceUrl).toContain('approval_status=approved');
    expect(treasuryUrl).toContain('archived=false');

    vi.unstubAllGlobals();
  });
});


describe('Holded v2 ledger date requirements', () => {
  it('adds start_date and end_date when reading the ledger', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify({
      items: [],
      cursor: null,
      has_more: false,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const client = buildHoldedV2Client('secret-v2');
    await client.listLedgerEntries({ limit: 1 });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/api/v2/ledger-entries?');
    expect(url).toContain('start_date=');
    expect(url).toContain('end_date=');
    expect(url).toContain('limit=1');

    vi.unstubAllGlobals();
  });
});


describe('Holded v2 contact limits', () => {
  it('clamps contact page size to the documented maximum of 100', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      items: [],
      cursor: null,
      has_more: false,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const client = buildHoldedV2Client('secret-v2');
    await client.listContacts({ limit: 180 });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/api/v2/contacts?');
    expect(url).toContain('limit=100');

    vi.unstubAllGlobals();
  });
});


describe('Holded v2 bank movements', () => {
  it('uses the account-scoped bank-movements endpoint and status filter', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      items: [],
      cursor: null,
      has_more: false,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const client = buildHoldedV2Client('bank-key');
    await client.listBankMovements('acc-1', { status: ['pending', 'partial'], limit: 20 });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/api/v2/treasury/accounts/acc-1/bank-movements?');
    expect(url).toContain('status=pending%2Cpartial');
    expect(url).toContain('limit=20');

    vi.unstubAllGlobals();
  });
});
