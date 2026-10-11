import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const state = {
    user: { id: 'staff-A' } as { id: string } | null,
    actor: { userId: 'staff-A', role: 'admin', tenantId: null } as {
      userId: string; role: string; tenantId: string | null;
    } | null,
    tables: [] as string[],
  };
  return { state, gate: vi.fn(), getAdmin: vi.fn() };
});

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: async (_request: unknown, roles: readonly string[]) => {
    mocks.gate(roles);
    return mocks.state.actor;
  },
}));

vi.mock('@/lib/integrations/supabase', () => ({
  createServerSupabaseClient: () => ({
    auth: { getUser: async () => ({ data: { user: mocks.state.user }, error: null }) },
  }),
  getSupabaseAdmin: () => {
    mocks.getAdmin();
    return {
      from(table: string) {
        mocks.state.tables.push(table);
        const counts = { count: 2, data: [] };
        return {
          select() { return this; },
          in: async () => counts,
          eq: async () => ({ data: [{ amount_eur: 45 }], error: null }),
          then(resolve: (v: typeof counts) => void) { return Promise.resolve(counts).then(resolve); },
        };
      },
    };
  },
}));

import { GET } from '@/app/api/admin/stats/route';

const request = () => new NextRequest('https://example.test/api/admin/stats');

describe('E0 admin stats: active actor before privileged aggregate reads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.user = { id: 'staff-A' };
    mocks.state.actor = { userId: 'staff-A', role: 'admin', tenantId: null };
    mocks.state.tables.length = 0;
  });

  it('denies revoked or unapproved profile before opening the admin client', async () => {
    mocks.state.actor = null;
    const res = await GET(request());
    expect(res.status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.state.tables).toEqual([]);
  });

  it('denies an actor that does not match the signed-in session', async () => {
    mocks.state.actor = { userId: 'staff-B', role: 'admin', tenantId: null };
    const res = await GET(request());
    expect(res.status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });

  it('returns 401 for an unauthenticated request', async () => {
    mocks.state.user = null;
    const res = await GET(request());
    expect(res.status).toBe(401);
    expect(mocks.gate).not.toHaveBeenCalled();
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });

  it('keeps active admin aggregate reads scoped to four expected tables', async () => {
    const res = await GET(request());
    expect(res.status).toBe(200);
    expect(mocks.gate).toHaveBeenCalledWith(['admin', 'owner']);
    expect(mocks.state.tables).toEqual(['profiles', 'quotes', 'orders', 'cases']);
    expect(await res.json()).toEqual({ totalUsers: 2, pendingQuotes: 2, activeCases: 0, totalRevenue: 45 });
  });
});
