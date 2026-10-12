import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  user: { id: 'staff-A' } as { id: string } | null,
  actor: { userId: 'staff-A', role: 'admin', tenantId: null } as {
    userId: string;
    role: 'admin' | 'owner';
    tenantId: string | null;
  } | null,
  gate: vi.fn(),
  getAdmin: vi.fn(),
  listAuthUsers: vi.fn(),
  tables: [] as string[],
  admin: null as unknown as { from: ReturnType<typeof vi.fn> },
}));

function makeQuery(data: unknown[]) {
  const result = { data, error: null };
  const query = {
    select: vi.fn(),
    or: vi.fn(),
    limit: vi.fn(),
    neq: vi.fn(),
    ilike: vi.fn(),
    in: vi.fn(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };

  query.select.mockReturnValue(query);
  query.or.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.neq.mockReturnValue(query);
  query.ilike.mockReturnValue(query);
  query.in.mockReturnValue(query);
  return query;
}

vi.mock('@/lib/integrations/supabase', () => ({
  createServerSupabaseClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: mocks.user }, error: null }),
    },
  }),
  getSupabaseAdmin: () => {
    mocks.getAdmin();
    return mocks.admin;
  },
  listAllAuthUsers: () => mocks.listAuthUsers(),
}));

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: async (_request: unknown, roles: readonly string[]) => {
    mocks.gate(roles);
    return mocks.actor;
  },
}));

import { GET } from '@/app/api/admin/search/route';

const request = (q = 'client') =>
  new NextRequest(`https://example.test/api/admin/search?q=${encodeURIComponent(q)}`);

describe('E0 admin search: exact-active before privileged PII reads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tables.length = 0;
    mocks.user = { id: 'staff-A' };
    mocks.actor = { userId: 'staff-A', role: 'admin', tenantId: null };
    mocks.listAuthUsers.mockResolvedValue([
      { id: 'client-A', email: 'client@example.test' },
    ]);
    mocks.admin = {
      from: vi.fn((table: string) => {
        mocks.tables.push(table);
        return makeQuery(
          table === 'profiles'
            ? [{
                id: 'client-A',
                full_name: 'Cliente A',
                email: null,
                phone: null,
                role: 'client',
                status: 'active',
                tax_id: 'X123',
              }]
            : [],
        );
      }),
    };
  });

  it('preserves the existing 403 contract without a session and performs no privileged read', async () => {
    mocks.user = null;

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(mocks.gate).not.toHaveBeenCalled();
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.listAuthUsers).not.toHaveBeenCalled();
    expect(mocks.tables).toEqual([]);
  });

  it('denies inactive, revoked, or unapproved staff before privileged reads', async () => {
    mocks.actor = null;

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(mocks.gate).toHaveBeenCalledWith(['admin', 'owner']);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.listAuthUsers).not.toHaveBeenCalled();
    expect(mocks.tables).toEqual([]);
  });

  it('denies an active actor that does not match the signed-in session', async () => {
    mocks.actor = { userId: 'staff-B', role: 'admin', tenantId: null };

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.listAuthUsers).not.toHaveBeenCalled();
    expect(mocks.tables).toEqual([]);
  });

  it('returns an empty short-query result without opening service-role or Auth reads', async () => {
    const response = await GET(request('a'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ results: [] });
    expect(mocks.gate).toHaveBeenCalledWith(['admin', 'owner']);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.listAuthUsers).not.toHaveBeenCalled();
    expect(mocks.tables).toEqual([]);
  });

  it.each(['admin', 'owner'] as const)(
    'preserves the search contract for an exact-active %s',
    async (role) => {
      mocks.actor = { userId: 'staff-A', role, tenantId: null };

      const response = await GET(request());
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(mocks.gate).toHaveBeenCalledWith(['admin', 'owner']);
      expect(mocks.getAdmin).toHaveBeenCalledTimes(1);
      expect(mocks.listAuthUsers).toHaveBeenCalledTimes(1);
      expect(mocks.tables).toEqual([
        'profiles',
        'companies',
        'cases',
        'appointments',
        'quotes',
        'documents',
      ]);
      expect(payload).toEqual({
        results: [{
          id: 'client-A',
          type: 'person',
          title: 'Cliente A',
          subtitle: 'Cliente · client@example.test · X123',
          href: '/admin/clientes/client-A',
        }],
      });
    },
  );
});
