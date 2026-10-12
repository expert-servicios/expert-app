import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const CLIENT_ID = '11111111-1111-4111-8111-111111111111';
const COMPANY_ID = '22222222-2222-4222-8222-222222222222';
const CASE_ID = '33333333-3333-4333-8333-333333333333';

const mocks = vi.hoisted(() => ({
  user: { id: 'staff-A' } as { id: string } | null,
  actor: { userId: 'staff-A', role: 'admin', tenantId: null } as {
    userId: string;
    role: 'admin' | 'owner';
    tenantId: string | null;
  } | null,
  gate: vi.fn(),
  getAdmin: vi.fn(),
  sync: vi.fn(),
  authLookup: vi.fn(),
  tables: [] as string[],
  inserts: [] as unknown[],
  caseRows: [] as Record<string, unknown>[],
  profiles: [] as Record<string, unknown>[],
  clientProfile: { id: '11111111-1111-4111-8111-111111111111' } as { id: string } | null,
  clientProfileError: null as { message: string } | null,
  membership: { company_id: '22222222-2222-4222-8222-222222222222' } as { company_id: string } | null,
  membershipError: null as { message: string } | null,
  insertedCase: {
    id: '33333333-3333-4333-8333-333333333333',
    service: 'Fiscal',
    state: null,
    status: 'nuevo',
    category: 'Impuestos',
  } as Record<string, unknown>,
  syncProfile: { full_name: 'Cliente A', phone: '+34000000000' } as Record<string, unknown>,
  admin: null as unknown as {
    from: ReturnType<typeof vi.fn>;
    auth: { admin: { getUserById: ReturnType<typeof vi.fn> } };
  },
}));

function makeQuery(table: string) {
  let selected = '';
  let inserting = false;
  const eqs: Array<[string, unknown]> = [];

  const result = () => {
    if (table === 'cases') {
      return { data: inserting ? mocks.insertedCase : mocks.caseRows, error: null };
    }
    if (table === 'profile_companies') {
      return { data: mocks.membership, error: mocks.membershipError };
    }
    if (table === 'profiles') {
      if (
        selected === 'id' &&
        eqs.some(([column, value]) => column === 'role' && value === 'client') &&
        eqs.some(([column, value]) => column === 'status' && value === 'active')
      ) {
        return { data: mocks.clientProfile, error: mocks.clientProfileError };
      }
      if (selected === 'full_name,phone') {
        return { data: mocks.syncProfile, error: null };
      }
      return { data: mocks.profiles, error: null };
    }
    return { data: null, error: null };
  };

  const query = {
    select: vi.fn((columns: string) => {
      selected = columns;
      return query;
    }),
    order: vi.fn(() => query),
    eq: vi.fn((column: string, value: unknown) => {
      eqs.push([column, value]);
      return query;
    }),
    in: vi.fn(() => query),
    insert: vi.fn((value: unknown) => {
      inserting = true;
      mocks.inserts.push(value);
      return query;
    }),
    single: vi.fn(async () => result()),
    maybeSingle: vi.fn(async () => result()),
    then: (
      resolve: (value: ReturnType<typeof result>) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result()).then(resolve, reject),
  };

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
}));

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: async (_request: unknown, roles: readonly string[]) => {
    mocks.gate(roles);
    return mocks.actor;
  },
}));

vi.mock('@/lib/integrations/holded', () => ({
  syncProjectToHolded: (input: unknown) => mocks.sync(input),
}));

import { GET, POST } from '@/app/api/admin/cases/route';

const getRequest = () => new NextRequest('https://example.test/api/admin/cases');
const postRequest = (body: unknown) => new NextRequest('https://example.test/api/admin/cases', {
  method: 'POST',
  body: JSON.stringify(body),
  headers: { 'content-type': 'application/json' },
});
const validBody = {
  client_id: CLIENT_ID,
  company_id: COMPANY_ID,
  service: 'Fiscal',
  category: 'Impuestos',
};

describe('E0 admin cases: exact-active and target scope before reads or effects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tables.length = 0;
    mocks.inserts.length = 0;
    mocks.user = { id: 'staff-A' };
    mocks.actor = { userId: 'staff-A', role: 'admin', tenantId: null };
    mocks.caseRows = [{
      id: CASE_ID,
      category: 'Impuestos',
      service: 'Fiscal',
      state: 'pendiente',
      status: 'nuevo',
      opened_at: '2026-10-12T00:00:00.000Z',
      closed_at: null,
      client_id: CLIENT_ID,
      company_id: COMPANY_ID,
      admin_note: null,
      docs_checklist: [],
      assigned_to: null,
    }];
    mocks.profiles = [{ id: CLIENT_ID, full_name: 'Cliente A' }];
    mocks.clientProfile = { id: CLIENT_ID };
    mocks.clientProfileError = null;
    mocks.membership = { company_id: COMPANY_ID };
    mocks.membershipError = null;
    mocks.authLookup.mockResolvedValue({
      data: { user: { id: CLIENT_ID, email: 'client@example.test' } },
      error: null,
    });
    mocks.sync.mockResolvedValue({ success: true });
    mocks.admin = {
      from: vi.fn((table: string) => {
        mocks.tables.push(table);
        return makeQuery(table);
      }),
      auth: { admin: { getUserById: mocks.authLookup } },
    };
  });

  it('denies GET without a session before the actor gate or service-role reads', async () => {
    mocks.user = null;

    const response = await GET(getRequest());

    expect(response.status).toBe(403);
    expect(mocks.gate).not.toHaveBeenCalled();
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.tables).toEqual([]);
  });

  it('denies revoked or unapproved staff before GET reads', async () => {
    mocks.actor = null;

    const response = await GET(getRequest());

    expect(response.status).toBe(403);
    expect(mocks.gate).toHaveBeenCalledWith(['admin', 'owner']);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.tables).toEqual([]);
  });

  it('denies an actor that does not match the signed-in session', async () => {
    mocks.actor = { userId: 'staff-B', role: 'admin', tenantId: null };

    const response = await GET(getRequest());

    expect(response.status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.tables).toEqual([]);
  });

  it.each(['admin', 'owner'] as const)(
    'preserves the enriched GET contract for an exact-active %s',
    async (role) => {
      mocks.actor = { userId: 'staff-A', role, tenantId: null };

      const response = await GET(getRequest());
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(mocks.gate).toHaveBeenCalledWith(['admin', 'owner']);
      expect(mocks.getAdmin).toHaveBeenCalledTimes(1);
      expect(mocks.tables).toEqual(['cases', 'profiles']);
      expect(mocks.authLookup).toHaveBeenCalledWith(CLIENT_ID);
      expect(payload.cases).toHaveLength(1);
      expect(payload.cases[0]).toMatchObject({
        id: CASE_ID,
        client: { full_name: 'Cliente A', email: 'client@example.test' },
        assignee: null,
      });
    },
  );

  it('denies POST for revoked staff before parsing, inserts, or Holded', async () => {
    mocks.actor = null;

    const response = await POST(postRequest(validBody));

    expect(response.status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.inserts).toEqual([]);
    expect(mocks.sync).not.toHaveBeenCalled();
  });

  it('rejects a missing, inactive, or non-client target before insert or Holded', async () => {
    mocks.clientProfile = null;

    const response = await POST(postRequest(validBody));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'El cliente indicado no está activo' });
    expect(mocks.tables).toEqual(['profiles']);
    expect(mocks.inserts).toEqual([]);
    expect(mocks.sync).not.toHaveBeenCalled();
  });

  it('rejects a company outside the target client scope before insert or Holded', async () => {
    mocks.membership = null;

    const response = await POST(postRequest(validBody));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'La empresa no pertenece al cliente indicado' });
    expect(mocks.tables).toEqual(['profiles', 'profile_companies']);
    expect(mocks.inserts).toEqual([]);
    expect(mocks.sync).not.toHaveBeenCalled();
  });

  it.each(['admin', 'owner'] as const)(
    'preserves scoped case creation for an exact-active %s with Holded simulated',
    async (role) => {
      mocks.actor = { userId: 'staff-A', role, tenantId: null };

      const response = await POST(postRequest(validBody));
      const payload = await response.json();

      expect(response.status).toBe(201);
      expect(payload).toEqual({ case: mocks.insertedCase });
      expect(mocks.gate).toHaveBeenCalledWith(['admin', 'owner']);
      expect(mocks.inserts).toHaveLength(1);
      expect(mocks.inserts[0]).toMatchObject({
        client_id: CLIENT_ID,
        company_id: COMPANY_ID,
        service: 'Fiscal',
        category: 'Impuestos',
        status: 'nuevo',
      });

      await vi.waitFor(() => {
        expect(mocks.sync).toHaveBeenCalledWith({
          caseId: CASE_ID,
          service: 'Fiscal',
          category: 'Impuestos',
          state: 'pendiente',
          clientName: 'Cliente A',
          clientEmail: 'client@example.test',
          clientPhone: '+34000000000',
        });
      });
      expect(mocks.tables).toEqual(['profiles', 'profile_companies', 'cases', 'profiles']);
    },
  );
});
