import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const state = {
    user: { id: 'client-A' } as { id: string } | null,
    actor: { userId: 'client-A', role: 'client', tenantId: 'tenant-A' } as {
      userId: string; role: string; tenantId: string | null;
    } | null,
    tables: [] as string[],
    filters: [] as Array<[string, unknown]>,
    obligations: [
      {
        id: 'obligation-A',
        modelo: '303',
        description: 'IVA',
        deadline: '2026-10-01',
        period_label: '3T 2026',
        status: 'pending',
      },
    ],
  };

  return { state, getAdmin: vi.fn(), requireActor: vi.fn() };
});

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: async () => {
    mocks.requireActor();
    return mocks.state.actor;
  },
}));

vi.mock('@/lib/utils/fiscal-calendar', () => ({
  urgencyLevel: () => 'overdue',
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
        const query = {
          select() { return query; },
          eq(column: string, value: unknown) {
            mocks.state.filters.push([column, value]);
            return query;
          },
          lte() { return query; },
          order: async () => ({ data: mocks.state.obligations, error: null }),
        };
        return query;
      },
    };
  },
}));

import { GET } from '@/app/api/notifications/route';

const request = () => new NextRequest('https://example.test/api/notifications');

describe('E0 notifications exact-active authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.user = { id: 'client-A' };
    mocks.state.actor = { userId: 'client-A', role: 'client', tenantId: 'tenant-A' };
    mocks.state.tables.length = 0;
    mocks.state.filters.length = 0;
  });

  it('rejects a revoked session before the route privileged read', async () => {
    mocks.state.actor = null;

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.state.tables).toEqual([]);
  });

  it('rejects a mismatched actor before the route privileged read', async () => {
    mocks.state.actor = { userId: 'client-B', role: 'client', tenantId: 'tenant-A' };

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });

  it('preserves the active client response and user scope', async () => {
    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      notifications: [
        {
          id: 'obligation-A',
          modelo: '303',
          description: 'IVA',
          deadline: '2026-10-01',
          period_label: '3T 2026',
          urgency: 'overdue',
        },
      ],
      count: 1,
    });
    expect(mocks.state.tables).toEqual(['fiscal_obligations']);
    expect(mocks.state.filters).toEqual([
      ['user_id', 'client-A'],
      ['status', 'pending'],
    ]);
  });

  it('preserves the anonymous empty response without privileged access', async () => {
    mocks.state.user = null;

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ notifications: [], count: 0 });
    expect(mocks.requireActor).not.toHaveBeenCalled();
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });
});
