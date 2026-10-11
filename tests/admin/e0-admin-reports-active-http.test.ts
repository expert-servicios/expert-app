import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const state = {
    user: { id: 'staff-A' } as { id: string } | null,
    actor: { userId: 'staff-A', role: 'admin', tenantId: null } as {
      userId: string;
      role: 'admin' | 'owner';
      tenantId: string | null;
    } | null,
    tables: [] as string[],
  };

  return {
    state,
    gate: vi.fn(),
    getAdmin: vi.fn(),
  };
});

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: async (_request: unknown, roles: readonly string[]) => {
    mocks.gate(roles);
    return mocks.state.actor;
  },
}));

vi.mock('@/lib/integrations/supabase', () => ({
  createServerSupabaseClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: mocks.state.user }, error: null }),
    },
  }),
  getSupabaseAdmin: () => {
    mocks.getAdmin();

    const resultFor = (table: string) => {
      const data = {
        orders: [{ amount_eur: 45, created_at: '2026-08-01T10:00:00Z' }],
        cases: [{ state: 'open', created_at: '2026-08-02T10:00:00Z' }],
        quotes: [{ status: 'draft', created_at: '2026-08-03T10:00:00Z' }],
        email_events: [{
          status: 'delivered',
          event_type: 'sent',
          created_at: '2026-08-04T10:00:00Z',
        }],
        subscriptions: [{
          status: 'active',
          plan_name: 'pro',
          created_at: '2026-08-05T10:00:00Z',
        }],
        messages: [{
          case_id: 'case-A',
          sender_role: 'client',
          created_at: '2026-08-06T10:00:00Z',
        }],
      }[table] ?? [];

      const count = table === 'leads' ? 3 : table === 'newsletter_subscribers' ? 4 : null;
      return { data, count, error: null };
    };

    return {
      from(table: string) {
        mocks.state.tables.push(table);
        const query = {
          select() { return query; },
          eq() { return query; },
          order() { return query; },
          limit() { return query; },
          then(
            resolve: (value: ReturnType<typeof resultFor>) => unknown,
            reject?: (reason: unknown) => unknown,
          ) {
            return Promise.resolve(resultFor(table)).then(resolve, reject);
          },
        };
        return query;
      },
    };
  },
}));

import { GET } from '@/app/api/admin/reports/route';

const request = () => new NextRequest('https://example.test/api/admin/reports');

describe('E0 admin reports: active actor before privileged aggregate reads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.user = { id: 'staff-A' };
    mocks.state.actor = { userId: 'staff-A', role: 'admin', tenantId: null };
    mocks.state.tables.length = 0;
  });

  it('returns 401 without a session before invoking the active-actor gate', async () => {
    mocks.state.user = null;

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(mocks.gate).not.toHaveBeenCalled();
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });

  it('denies revoked or unapproved staff before opening the aggregate client', async () => {
    mocks.state.actor = null;

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(mocks.gate).toHaveBeenCalledWith(['admin', 'owner']);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.state.tables).toEqual([]);
  });

  it('denies an active actor that does not match the signed-in session', async () => {
    mocks.state.actor = { userId: 'staff-B', role: 'admin', tenantId: null };

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.state.tables).toEqual([]);
  });

  it.each(['admin', 'owner'] as const)(
    'keeps active %s report reads limited to the eight expected aggregate sources',
    async (role) => {
      mocks.state.actor = { userId: 'staff-A', role, tenantId: null };

      const response = await GET(request());

      expect(response.status).toBe(200);
      expect(mocks.gate).toHaveBeenCalledWith(['admin', 'owner']);
      expect(mocks.state.tables).toEqual([
        'orders',
        'cases',
        'quotes',
        'email_events',
        'subscriptions',
        'messages',
        'leads',
        'newsletter_subscribers',
      ]);
      expect(await response.json()).toEqual({
        totalRevenue: 45,
        revenueByMonth: [{ month: '2026-08', revenue: 45 }],
        casesByState: { open: 1 },
        quotesByStatus: { draft: 1 },
        emailStats: { total: 1, delivered: 1, bounced: 0, failed: 0 },
        subsByPlan: { pro: 1 },
        activeSubs: 1,
        paymentIssuesCount: 0,
        clientMessagesAwaitingResponse: 1,
        leadsCount: 3,
        newsletterCount: 4,
      });
    },
  );
});
