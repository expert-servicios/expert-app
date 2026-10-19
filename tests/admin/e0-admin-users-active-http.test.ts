import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  user: { id: 'staff-A' } as { id: string } | null,
  actor: { userId: 'staff-A', role: 'admin', tenantId: null } as {
    userId: string; role: 'admin' | 'owner'; tenantId: string | null;
  } | null,
  gate: vi.fn(),
  getAdmin: vi.fn(),
  listAuthUsers: vi.fn(),
  tables: [] as string[],
}));

function makeQuery() {
  const result = { data: [], error: null };
  const query = {
    select: () => query,
    order: () => query,
    limit: async () => result,
    update: () => query,
    eq: async () => ({ error: null }),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  return query;
}

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: async (_request: unknown, roles: readonly string[]) => {
    mocks.gate(roles);
    return mocks.actor;
  },
}));

vi.mock('@/lib/integrations/supabase', () => ({
  createServerSupabaseClient: () => ({
    auth: { getUser: async () => ({ data: { user: mocks.user }, error: null }) },
  }),
  getSupabaseAdmin: () => {
    mocks.getAdmin();
    return { from: (table: string) => {
      mocks.tables.push(table);
      return makeQuery();
    }};
  },
  listAllAuthUsers: () => mocks.listAuthUsers(),
}));

import { GET, PATCH, DELETE } from '@/app/api/admin/users/route';

const handlers = { GET, PATCH, DELETE } as const;
type Method = keyof typeof handlers;
function request(method: Method) {
  return new NextRequest('https://example.test/api/admin/users', {
    method,
    ...(method === 'GET' ? {} : {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'client-A', action: 'update_role', role: 'client' }),
    }),
  });
}

describe('E0-M3-06 admin users: canonical exact-active actor gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { id: 'staff-A' };
    mocks.actor = { userId: 'staff-A', role: 'admin', tenantId: null };
    mocks.tables.length = 0;
    mocks.listAuthUsers.mockResolvedValue([]);
  });

  it.each(Object.keys(handlers) as Method[])('%s denies missing session before privileged reads', async (method) => {
    mocks.user = null;
    const response = await handlers[method](request(method));
    expect(response.status).toBe(401);
    expect(mocks.gate).not.toHaveBeenCalled();
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.listAuthUsers).not.toHaveBeenCalled();
  });

  it.each(Object.keys(handlers) as Method[])('%s denies non-active or revoked staff before privileged reads', async (method) => {
    mocks.actor = null;
    const response = await handlers[method](request(method));
    expect(response.status).toBe(403);
    expect(mocks.gate).toHaveBeenCalledWith(['admin', 'owner']);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.listAuthUsers).not.toHaveBeenCalled();
    expect(mocks.tables).toEqual([]);
  });

  it.each(Object.keys(handlers) as Method[])('%s denies an actor mismatched to the session', async (method) => {
    mocks.actor = { userId: 'staff-B', role: 'admin', tenantId: null };
    const response = await handlers[method](request(method));
    expect(response.status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.tables).toEqual([]);
  });

  it.each(['admin', 'owner'] as const)('retains authorized GET for active %s', async (role) => {
    mocks.actor = { userId: 'staff-A', role, tenantId: null };
    const response = await GET(request('GET'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ users: [] });
    expect(mocks.gate).toHaveBeenCalledWith(['admin', 'owner']);
    expect(mocks.getAdmin).toHaveBeenCalledTimes(1);
    expect(mocks.tables).toEqual(['profiles', 'quotes', 'cases', 'profile_companies']);
  });
});
