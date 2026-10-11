import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const state = {
    user: { id: 'client-A' } as { id: string } | null,
    actor: { userId: 'client-A', role: 'client', tenantId: 'tenant-A' } as {
      userId: string; role: string; tenantId: string | null;
    } | null,
    queries: [] as Array<{ table: string; filters: Array<[string, unknown]> }>,
  };
  return { state, getAdmin: vi.fn() };
});

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: async () => mocks.state.actor,
}));

vi.mock('@/lib/integrations/supabase', () => ({
  createServerSupabaseClient: () => ({
    auth: { getUser: async () => ({ data: { user: mocks.state.user }, error: null }) },
  }),
  getSupabaseAdmin: () => {
    mocks.getAdmin();
    return {
      from(table: string) {
        const filters: Array<[string, unknown]> = [];
        mocks.state.queries.push({ table, filters });
        const query = {
          select() { return query; },
          eq(column: string, value: unknown) { filters.push([column, value]); return query; },
          order() { return query; },
          limit: async () => ({ data: [{ id: 'report-A' }], error: null }),
        };
        return query;
      },
    };
  },
}));

import { GET } from '@/app/api/reports/route';

const req = () => new NextRequest('https://example.test/api/reports');

describe('E0 financial report collection authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.user = { id: 'client-A' };
    mocks.state.actor = { userId: 'client-A', role: 'client', tenantId: 'tenant-A' };
    mocks.state.queries.length = 0;
  });

  it('rejects unauthenticated sessions before service role reads', async () => {
    mocks.state.user = null;
    expect((await GET(req())).status).toBe(401);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });

  it('rejects inactive, suspended and pending sessions before service role reads', async () => {
    mocks.state.actor = null;
    expect((await GET(req())).status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });

  it('rejects an actor that differs from the authenticated user', async () => {
    mocks.state.actor = { userId: 'another-client', role: 'client', tenantId: 'tenant-A' };
    expect((await GET(req())).status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });

  it('allows an active client to list only their own reports', async () => {
    const response = await GET(req());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ reports: [{ id: 'report-A' }] });
    expect(mocks.state.queries).toEqual([{
      table: 'kia_financial_reports',
      filters: [['client_id', 'client-A']],
    }]);
  });
});
