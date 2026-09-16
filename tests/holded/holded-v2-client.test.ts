import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildHoldedV2Client,
  createHoldedV2Client,
} from '@/lib/integrations/holded/holded-v2-client';
import { HoldedAuthError, HoldedPermissionError, HoldedRateLimitError } from '@/lib/integrations/holded/holded-errors';

const resolveHoldedAuth = vi.fn();

vi.mock('@/lib/integrations/holded/holded-auth', () => ({
  resolveHoldedAuth: (...args: unknown[]) => resolveHoldedAuth(...args),
}));

describe('Holded labor API v2 client', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    resolveHoldedAuth.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses Bearer authentication and never puts the API key in the URL', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ items: [], cursor: null, has_more: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    const client = buildHoldedV2Client('super-secret-key');
    await client.listEmployees({ search: 'Oksana', limit: 25 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('https://api.holded.com/api/v2/employees?');
    expect(url).toContain('search=Oksana');
    expect(url).toContain('limit=25');
    expect(url).not.toContain('super-secret-key');
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
    expect(init.headers).toMatchObject({ Authorization: 'Bearer super-secret-key' });
  });

  it('reads the active contract through the v2 employee endpoint', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      contractType: 100,
      startDate: '2026-01-01T00:00:00Z',
      employee: 'Oksana Kukhar',
      scheduleHours: 10,
      salary: 420,
      salaryInterval: 'monthly',
      salaryPayments: 14,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    const client = buildHoldedV2Client('key');
    const contract = await client.getActiveContract('emp/1');

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('https://api.holded.com/api/v2/employees/emp%2F1/contract');
    expect(contract.scheduleHours).toBe(10);
    expect(contract.salaryPayments).toBe(14);
  });

  it('lists payslips with employee/date filters and cursor pagination', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      items: [{
        id: 'pay-1',
        employee_id: 'emp-1',
        employee_name: 'Oksana Kukhar',
        payslip_kind: 'nomina_ordinaria',
        date: '2026-09-30',
        period_start: '2026-09-01',
        period_end: '2026-09-30',
        total_days: 30,
        description: 'September 2026',
        tags: [],
        accounting_account_id: null,
        is_draft: true,
        net_salary: '350.00',
        total_company_cost: '500.00',
        payment_total: '0.00',
        payment_pending: '350.00',
        payment_status: 'PENDING',
      }],
      cursor: 'next-cursor',
      has_more: true,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    const client = buildHoldedV2Client('key');
    const page = await client.listPayslips({
      employeeId: 'emp-1',
      startDate: '2026-09-01T00:00:00Z',
      endDate: '2026-09-30T23:59:59Z',
      kind: 'nomina_ordinaria',
      isDraft: true,
      limit: 20,
      cursor: 'abc',
    });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/api/v2/payslips?');
    expect(url).toContain('employee_id=emp-1');
    expect(url).toContain('start_date=2026-09-01T00%3A00%3A00Z');
    expect(url).toContain('end_date=2026-09-30T23%3A59%3A59Z');
    expect(url).toContain('kind=nomina_ordinaria');
    expect(url).toContain('is_draft=true');
    expect(url).toContain('cursor=abc');
    expect(page.items[0].id).toBe('pay-1');
    expect(page.cursor).toBe('next-cursor');
    expect(page.has_more).toBe(true);
  });

  it('distinguishes salary records from calculated payslips', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      items: [{
        id: 'salary-1',
        employee_id: 'emp-1',
        employee_name: 'Oksana Kukhar',
        date: '2026-08-31',
        description: 'August payroll import',
        tags: [],
        accounting_account_id: null,
        is_draft: false,
        total_payable: '500.00',
        payment_total: '500.00',
        payment_pending: '0.00',
        payment_status: 'PAID',
      }],
      cursor: null,
      has_more: false,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    const client = buildHoldedV2Client('key');
    const page = await client.listSalaryRecords({ employeeId: 'emp-1' });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/api/v2/salary-records?');
    expect(page.items).toHaveLength(1);
    expect(page.items[0].id).toBe('salary-1');
    expect(page.has_more).toBe(false);
  });

  it('clamps page size to Holded v2 documented maximum', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ items: [], cursor: null, has_more: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    const client = buildHoldedV2Client('key');
    await client.listEmployees({ limit: 999 });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('limit=200');
  });

  it('downloads PDFs without exposing credentials', async () => {
    const bytes = new Uint8Array([37, 80, 68, 70]);
    fetchMock.mockResolvedValue(new Response(bytes, {
      status: 200,
      headers: { 'Content-Type': 'application/pdf' },
    }));

    const client = buildHoldedV2Client('pdf-key');
    const pdf = await client.getPayslipPdf('pay-1');

    expect(new Uint8Array(pdf)).toEqual(bytes);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.holded.com/api/v2/payslips/pay-1/pdf');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer pdf-key', Accept: 'application/pdf' });
  });

  it.each([
    [401, HoldedAuthError],
    [403, HoldedPermissionError],
    [429, HoldedRateLimitError],
  ])('maps HTTP %s to the existing typed Holded error', async (status, ErrorType) => {
    fetchMock.mockResolvedValue(new Response('failure', { status }));

    const client = buildHoldedV2Client('key');
    await expect(client.getEmployee('emp-1')).rejects.toBeInstanceOf(ErrorType);
  });

  it('reuses the canonical encrypted integration resolver', async () => {
    resolveHoldedAuth.mockResolvedValue({
      apiKey: 'resolved-key',
      baseUrl: 'https://api.holded.com/api/invoicing/v1',
      crmUrl: 'https://api.holded.com/api/crm/v1',
      projectsUrl: 'https://api.holded.com/api/projects/v1',
    });
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      id: 'emp-1', name: 'Oksana', last_name: 'Kukhar', full_name: 'Oksana Kukhar',
      code: '001', email: 'oksana@example.com', phone: null, mobile: null,
      workplace_id: 'work-1', social_security_number: 'x', current_contract: null,
      job_title: 'Auxiliar', terminated: null, payroll_accounts: {},
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    const client = await createHoldedV2Client('11111111-1111-1111-1111-111111111111');
    await client.getEmployee('emp-1');

    expect(resolveHoldedAuth).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ Authorization: 'Bearer resolved-key' });
  });

  it('fails closed if an identifier is empty', async () => {
    const client = buildHoldedV2Client('key');
    await expect(client.getEmployee('   ')).rejects.toThrow(/employeeId is required/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
