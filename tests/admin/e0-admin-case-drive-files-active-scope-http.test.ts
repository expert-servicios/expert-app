import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const CASE_ID = '33333333-3333-4333-8333-333333333333';
const CLIENT_ID = '11111111-1111-4111-8111-111111111111';
const COMPANY_ID = '22222222-2222-4222-8222-222222222222';
const TENANT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

type Predicate = [column: string, value: unknown];

const mocks = vi.hoisted(() => ({
  actor: {
    userId: 'staff-A',
    role: 'admin',
    tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  } as { userId: string; role: 'admin' | 'owner'; tenantId: string | null } | null,
  caseRow: {
    id: '33333333-3333-4333-8333-333333333333',
    service: 'Certificado digital',
    client_id: '11111111-1111-4111-8111-111111111111',
    company_id: '22222222-2222-4222-8222-222222222222',
    tenant_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  } as {
    id: string;
    service: string;
    client_id: string;
    company_id: string | null;
    tenant_id: string | null;
  } | null,
  clientScopeOk: true,
  companyScopeOk: true,
  membershipOk: true,
  clientFullName: 'Cliente Verificado' as string | null,
  queries: [] as Array<{ table: string; predicates: Predicate[] }>,
  gate: vi.fn(),
  getAdmin: vi.fn(),
  getAuthUser: vi.fn(),
  listFiles: vi.fn(),
}));

function createQuery(table: string) {
  const predicates: Predicate[] = [];
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn((column: string, value: unknown) => {
      predicates.push([column, value]);
      return query;
    }),
    maybeSingle: vi.fn(async () => {
      mocks.queries.push({ table, predicates: [...predicates] });

      if (table === 'cases') {
        const tenantPredicate = predicates.find(([column]) => column === 'tenant_id');
        const matchesTenant =
          !tenantPredicate || tenantPredicate[1] === mocks.caseRow?.tenant_id;
        return { data: matchesTenant ? mocks.caseRow : null, error: null };
      }

      if (table === 'profiles') {
        return {
          data: mocks.clientScopeOk
            ? { id: CLIENT_ID, full_name: mocks.clientFullName }
            : null,
          error: null,
        };
      }

      if (table === 'companies') {
        return {
          data: mocks.companyScopeOk ? { id: COMPANY_ID } : null,
          error: null,
        };
      }

      if (table === 'profile_companies') {
        return {
          data: mocks.membershipOk ? { company_id: COMPANY_ID } : null,
          error: null,
        };
      }

      return { data: null, error: null };
    }),
  };

  return query;
}

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: mocks.gate,
}));

vi.mock('@/lib/integrations/supabase', () => ({
  getSupabaseAdmin: mocks.getAdmin,
}));

vi.mock('@/lib/integrations/google-drive', () => ({
  listDriveFilesForClient: mocks.listFiles,
}));

import { GET } from '@/app/api/admin/cases/[id]/drive-files/route';

function request() {
  return new NextRequest(`http://localhost/api/admin/cases/${CASE_ID}/drive-files`);
}

function context() {
  return { params: Promise.resolve({ id: CASE_ID }) };
}

function expectNoExternalReads() {
  expect(mocks.getAuthUser).not.toHaveBeenCalled();
  expect(mocks.listFiles).not.toHaveBeenCalled();
}

describe('E0 admin case drive-files exact-active and object scope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.actor = {
      userId: 'staff-A',
      role: 'admin',
      tenantId: TENANT_ID,
    };
    mocks.caseRow = {
      id: CASE_ID,
      service: 'Certificado digital',
      client_id: CLIENT_ID,
      company_id: COMPANY_ID,
      tenant_id: TENANT_ID,
    };
    mocks.clientScopeOk = true;
    mocks.companyScopeOk = true;
    mocks.membershipOk = true;
    mocks.clientFullName = 'Cliente Verificado';
    mocks.queries.length = 0;

    mocks.gate.mockImplementation(async () => mocks.actor);
    mocks.getAdmin.mockReturnValue({
      from: vi.fn((table: string) => createQuery(table)),
      auth: {
        admin: {
          getUserById: mocks.getAuthUser,
        },
      },
    });
    mocks.getAuthUser.mockResolvedValue({
      data: {
        user: {
          email: 'cliente@example.com',
          user_metadata: { full_name: 'Nombre Auth' },
        },
      },
    });
    mocks.listFiles.mockResolvedValue([
      { id: 'file-1', name: 'documento.pdf' },
    ]);
  });

  it('rejects a revoked actor before creating a privileged client', async () => {
    mocks.actor = null;

    const response = await GET(request(), context());

    expect(response.status).toBe(403);
    expect(mocks.gate).toHaveBeenCalledWith(expect.any(NextRequest), ['admin', 'owner']);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expectNoExternalReads();
  });

  it('hides a case outside the actor tenant before dependent reads', async () => {
    if (!mocks.caseRow) throw new Error('missing fixture');
    mocks.caseRow.tenant_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

    const response = await GET(request(), context());

    expect(response.status).toBe(404);
    expect(mocks.queries).toEqual([
      {
        table: 'cases',
        predicates: [
          ['id', CASE_ID],
          ['tenant_id', TENANT_ID],
        ],
      },
    ]);
    expectNoExternalReads();
  });

  it('rejects a client whose tenant does not match the scoped case', async () => {
    mocks.clientScopeOk = false;

    const response = await GET(request(), context());

    expect(response.status).toBe(404);
    expect(mocks.queries).toContainEqual({
      table: 'profiles',
      predicates: [
        ['id', CLIENT_ID],
        ['tenant_id', TENANT_ID],
      ],
    });
    expectNoExternalReads();
  });

  it('rejects a company whose tenant does not match the scoped case', async () => {
    mocks.companyScopeOk = false;

    const response = await GET(request(), context());

    expect(response.status).toBe(404);
    expect(mocks.queries).toContainEqual({
      table: 'companies',
      predicates: [
        ['id', COMPANY_ID],
        ['tenant_id', TENANT_ID],
      ],
    });
    expectNoExternalReads();
  });

  it('rejects a case whose client-company membership is missing', async () => {
    mocks.membershipOk = false;

    const response = await GET(request(), context());

    expect(response.status).toBe(404);
    expect(mocks.queries).toContainEqual({
      table: 'profile_companies',
      predicates: [
        ['profile_id', CLIENT_ID],
        ['company_id', COMPANY_ID],
      ],
    });
    expectNoExternalReads();
  });

  it('loads Drive only after resolving the scoped client identity', async () => {
    const response = await GET(request(), context());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.queries.map(({ table }) => table)).toEqual([
      'cases',
      'profiles',
      'companies',
      'profile_companies',
    ]);
    expect(mocks.getAuthUser).toHaveBeenCalledWith(CLIENT_ID);
    expect(mocks.listFiles).toHaveBeenCalledWith(
      'Cliente Verificado',
      'Certificado digital',
    );
    expect(body).toEqual({
      files: [{ id: 'file-1', name: 'documento.pdf' }],
      clientName: 'Cliente Verificado',
      serviceName: 'Certificado digital',
    });
  });

  it('uses the auth email only after scope when the profile name is absent', async () => {
    mocks.clientFullName = null;

    const response = await GET(request(), context());

    expect(response.status).toBe(200);
    expect(mocks.getAuthUser).toHaveBeenCalledWith(CLIENT_ID);
    expect(mocks.listFiles).toHaveBeenCalledWith('cliente', 'Certificado digital');
  });

  it('uses the scoped case tenant for a global owner', async () => {
    mocks.actor = {
      userId: 'owner-A',
      role: 'owner',
      tenantId: null,
    };

    const response = await GET(request(), context());

    expect(response.status).toBe(200);
    expect(mocks.queries[0]).toEqual({
      table: 'cases',
      predicates: [['id', CASE_ID]],
    });
    expect(mocks.queries).toContainEqual({
      table: 'profiles',
      predicates: [
        ['id', CLIENT_ID],
        ['tenant_id', TENANT_ID],
      ],
    });
    expect(mocks.queries).toContainEqual({
      table: 'companies',
      predicates: [
        ['id', COMPANY_ID],
        ['tenant_id', TENANT_ID],
      ],
    });
  });

  it('keeps client-company membership mandatory for a legacy tenant-null case', async () => {
    if (!mocks.caseRow) throw new Error('missing fixture');
    mocks.actor = {
      userId: 'owner-A',
      role: 'owner',
      tenantId: null,
    };
    mocks.caseRow.tenant_id = null;

    const response = await GET(request(), context());

    expect(response.status).toBe(200);
    expect(mocks.queries.map(({ table }) => table)).toEqual([
      'cases',
      'profiles',
      'profile_companies',
    ]);
    expect(mocks.listFiles).toHaveBeenCalledTimes(1);
  });

  it('supports a scoped case without a company', async () => {
    if (!mocks.caseRow) throw new Error('missing fixture');
    mocks.caseRow.company_id = null;

    const response = await GET(request(), context());

    expect(response.status).toBe(200);
    expect(mocks.queries.map(({ table }) => table)).toEqual([
      'cases',
      'profiles',
    ]);
    expect(mocks.listFiles).toHaveBeenCalledTimes(1);
  });

  it('does not expose provider errors in the HTTP response', async () => {
    mocks.listFiles.mockRejectedValue(new Error('sensitive provider detail'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await GET(request(), context());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Error interno del servidor' });
    expect(JSON.stringify(body)).not.toContain('sensitive provider detail');
    consoleSpy.mockRestore();
  });
});
