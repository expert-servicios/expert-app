import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  user: { id: 'staff-A' } as { id: string } | null,
  actor: { userId: 'staff-A', role: 'admin', tenantId: null } as {
    userId: string;
    role: 'admin' | 'owner';
    tenantId: string | null;
  } | null,
  gate: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('@/lib/integrations/supabase', () => ({
  createServerSupabaseClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: mocks.user }, error: null }),
    },
  }),
}));

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: async (_request: unknown, roles: readonly string[]) => {
    mocks.gate(roles);
    return mocks.actor;
  },
}));

import { GET } from '@/app/api/admin/holded-charts/route';

const request = () => new NextRequest('https://example.test/api/admin/holded-charts');

describe('E0 admin Holded charts: exact-active before external financial reads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { id: 'staff-A' };
    mocks.actor = { userId: 'staff-A', role: 'admin', tenantId: null };
    vi.stubEnv('HOLDED_API_KEY', 'test-holded-key');
    vi.stubGlobal('fetch', mocks.fetch);

    const now = Math.floor(Date.now() / 1000);
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 'paid', date: now, status: 2, totalWithTaxes: 100.25, contactName: 'Acme' },
        { id: 'pending', date: now, status: 1, total: 50.5, contactName: 'Acme' },
        { id: 'draft', date: now, status: 0, subtotal: 25, contactName: 'Draft' },
        { id: 'overdue', date: now, status: 4, total: 12.34, contactName: 'Other' },
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('returns 401 without a session before the active-actor gate or Holded', async () => {
    mocks.user = null;

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(mocks.gate).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('denies revoked or unapproved staff before any Holded request', async () => {
    mocks.actor = null;

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(mocks.gate).toHaveBeenCalledWith(['admin', 'owner']);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('denies an active actor that does not match the signed-in session', async () => {
    mocks.actor = { userId: 'staff-B', role: 'admin', tenantId: null };

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('preserves the unconfigured read-only response without contacting Holded', async () => {
    vi.stubEnv('HOLDED_API_KEY', '');

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ configured: false, invoices: [] });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it.each(['admin', 'owner'] as const)(
    'preserves read-only financial aggregates for an active %s',
    async (role) => {
      mocks.actor = { userId: 'staff-A', role, tenantId: null };

      const response = await GET(request());
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(mocks.gate).toHaveBeenCalledWith(['admin', 'owner']);
      expect(mocks.fetch).toHaveBeenCalledTimes(1);
      expect(mocks.fetch).toHaveBeenCalledWith(
        'https://api.holded.com/api/invoicing/v1/documents/invoice?page=1',
        expect.objectContaining({
          headers: { key: 'test-holded-key', 'Content-Type': 'application/json' },
          next: { revalidate: 900 },
        }),
      );
      expect(payload).toMatchObject({
        configured: true,
        totalInvoices: 4,
        totalInvoiced: 188.09,
        totalPaid: 100.25,
        outstanding: 62.84,
        statusCounts: { borrador: 1, pendiente: 1, pagada: 1, vencida: 1 },
        statusAmounts: { borrador: 25, pendiente: 50.5, pagada: 100.25, vencida: 12.34 },
        topClients: [
          { name: 'Acme', amount: 150.75 },
          { name: 'Other', amount: 12.34 },
        ],
      });
      expect(payload.revenueByMonth).toHaveLength(12);
      expect(payload.revenueByMonth).toEqual(
        expect.arrayContaining([expect.objectContaining({ revenue: 100.25 })]),
      );
    },
  );
});
