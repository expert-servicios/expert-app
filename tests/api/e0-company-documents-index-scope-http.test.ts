import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const TENANT_ID = 'tenant-A';
const OTHER_TENANT_ID = 'tenant-B';
const COMPANY_ID = 'company-A';
const CLIENT_ID = 'client-A';

type Filter = {
  op: 'eq' | 'in';
  column: string;
  value: unknown;
};

const mocks = vi.hoisted(() => {
  const state = {
    actor: {
      userId: 'admin-A',
      role: 'admin',
      tenantId: 'tenant-A',
    } as {
      userId: string;
      role: string;
      tenantId: string | null;
    } | null,
    company: {
      id: 'company-A',
      tenant_id: 'tenant-A',
    } as { id: string; tenant_id: string | null } | null,
    companyError: false,
    memberships: [{ profile_id: 'client-A' }] as Array<{ profile_id: string }>,
    membershipError: false,
    memberScopeOk: true,
    memberTenant: 'tenant-A' as string | null,
    memberError: false,
    documentItems: [
      {
        id: 'folder-A',
        relative_path: 'Fiscal',
        name: 'Fiscal',
        is_folder: true,
      },
      {
        id: 'file-A',
        relative_path: 'Fiscal/modelo.pdf',
        name: 'modelo.pdf',
        is_folder: false,
      },
    ] as Array<Record<string, unknown>>,
    documentError: false,
    root: {
      provider: 'google',
      display_name: 'Empresa',
      status: 'ready',
    } as Record<string, unknown> | null,
    rootError: false,
    auditError: false,
    queries: [] as Array<{
      table: string;
      operation: 'select' | 'insert';
      filters: Filter[];
    }>,
    auditPayload: null as Record<string, unknown> | null,
  };

  function result(
    table: string,
    operation: 'select' | 'insert',
    filters: Filter[],
  ) {
    state.queries.push({
      table,
      operation,
      filters: filters.map((filter) => ({ ...filter })),
    });

    if (table === 'companies') {
      const tenantFilter = filters.find((filter) => filter.column === 'tenant_id');
      const matchesTenant =
        !tenantFilter || tenantFilter.value === state.company?.tenant_id;
      return {
        data: matchesTenant ? state.company : null,
        error: state.companyError ? { message: 'company lookup failed' } : null,
      };
    }

    if (table === 'profile_companies') {
      return {
        data: state.memberships,
        error: state.membershipError
          ? { message: 'membership lookup failed' }
          : null,
      };
    }

    if (table === 'profiles') {
      const tenantFilter = filters.find((filter) => filter.column === 'tenant_id');
      const matchesTenant =
        !tenantFilter || tenantFilter.value === state.memberTenant;
      return {
        data: state.memberScopeOk && matchesTenant ? [{ id: CLIENT_ID }] : [],
        error: state.memberError ? { message: 'profile lookup failed' } : null,
      };
    }

    if (table === 'company_document_index') {
      return {
        data: state.documentItems,
        error: state.documentError
          ? { message: 'document lookup failed' }
          : null,
      };
    }

    if (table === 'company_document_roots') {
      return {
        data: state.root,
        error: state.rootError ? { message: 'root lookup failed' } : null,
      };
    }

    if (table === 'audit_logs') {
      return {
        data: null,
        error: state.auditError ? { message: 'audit insert failed' } : null,
      };
    }

    return { data: null, error: null };
  }

  const admin = {
    from(table: string) {
      const filters: Filter[] = [];
      let operation: 'select' | 'insert' = 'select';
      const query = {
        select() {
          return query;
        },
        insert(payload: Record<string, unknown>) {
          operation = 'insert';
          state.auditPayload = payload;
          return query;
        },
        eq(column: string, value: unknown) {
          filters.push({ op: 'eq', column, value });
          return query;
        },
        in(column: string, value: unknown) {
          filters.push({ op: 'in', column, value });
          return query;
        },
        order() {
          return query;
        },
        limit() {
          return query;
        },
        maybeSingle: async () => result(table, operation, filters),
        then<TResult1 = unknown, TResult2 = never>(
          onFulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
          onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
        ) {
          return Promise.resolve(result(table, operation, filters)).then(
            onFulfilled,
            onRejected,
          );
        },
      };
      return query;
    },
  };

  return {
    state,
    gate: vi.fn(),
    getAdmin: vi.fn(() => admin),
    indexDrive: vi.fn(async () => ({ files: 2, folders: 1 })),
  };
});

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: mocks.gate,
}));

vi.mock('@/lib/documents/company-drive-index', () => ({
  indexCompanyGoogleDrive: mocks.indexDrive,
}));

vi.mock('@/lib/integrations/supabase', () => ({
  getSupabaseAdmin: mocks.getAdmin,
}));

import {
  GET,
  POST,
} from '@/app/api/admin/empresas/[id]/documents/index/route';

const context = () => ({
  params: Promise.resolve({ id: COMPANY_ID }),
});

const request = (method: 'GET' | 'POST') =>
  new NextRequest(
    `https://example.test/api/admin/empresas/${COMPANY_ID}/documents/index`,
    { method },
  );

function queriesFor(table: string) {
  return mocks.state.queries.filter((query) => query.table === table);
}

function expectNoDocumentAccess() {
  expect(queriesFor('company_document_index')).toHaveLength(0);
  expect(queriesFor('company_document_roots')).toHaveLength(0);
  expect(mocks.indexDrive).not.toHaveBeenCalled();
}

describe('E0 document index scoped access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.actor = {
      userId: 'admin-A',
      role: 'admin',
      tenantId: TENANT_ID,
    };
    mocks.state.company = {
      id: COMPANY_ID,
      tenant_id: TENANT_ID,
    };
    mocks.state.companyError = false;
    mocks.state.memberships = [{ profile_id: CLIENT_ID }];
    mocks.state.membershipError = false;
    mocks.state.memberScopeOk = true;
    mocks.state.memberTenant = TENANT_ID;
    mocks.state.memberError = false;
    mocks.state.documentItems = [
      {
        id: 'folder-A',
        relative_path: 'Fiscal',
        name: 'Fiscal',
        is_folder: true,
      },
      {
        id: 'file-A',
        relative_path: 'Fiscal/modelo.pdf',
        name: 'modelo.pdf',
        is_folder: false,
      },
    ];
    mocks.state.documentError = false;
    mocks.state.root = {
      provider: 'google',
      display_name: 'Empresa',
      status: 'ready',
    };
    mocks.state.rootError = false;
    mocks.state.auditError = false;
    mocks.state.queries.length = 0;
    mocks.state.auditPayload = null;
    mocks.gate.mockImplementation(async () => mocks.state.actor);
    mocks.indexDrive.mockImplementation(async () => ({ files: 2, folders: 1 }));
  });

  it('denies a revoked actor before creating a service-role client', async () => {
    mocks.state.actor = null;

    expect((await GET(request('GET'), context())).status).toBe(403);
    expect((await POST(request('POST'), context())).status).toBe(403);
    expect(mocks.gate).toHaveBeenCalledWith(expect.any(NextRequest), [
      'admin',
      'owner',
    ]);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.state.queries).toEqual([]);
    expectNoDocumentAccess();
  });

  it('denies a cross-tenant company before document or Drive access', async () => {
    if (!mocks.state.company) throw new Error('missing company fixture');
    mocks.state.company.tenant_id = OTHER_TENANT_ID;

    expect((await GET(request('GET'), context())).status).toBe(403);
    expect((await POST(request('POST'), context())).status).toBe(403);
    expect(queriesFor('companies')[0].filters).toEqual([
      { op: 'eq', column: 'id', value: COMPANY_ID },
      { op: 'eq', column: 'tenant_id', value: TENANT_ID },
    ]);
    expectNoDocumentAccess();
  });

  it('denies missing membership before external access', async () => {
    mocks.state.memberships = [];

    expect((await POST(request('POST'), context())).status).toBe(403);
    expect(queriesFor('profile_companies')[0].filters).toEqual([
      { op: 'eq', column: 'company_id', value: COMPANY_ID },
    ]);
    expectNoDocumentAccess();
  });

  it('denies a member outside the effective tenant', async () => {
    mocks.state.memberTenant = OTHER_TENANT_ID;

    expect((await GET(request('GET'), context())).status).toBe(403);
    expect(queriesFor('profiles')[0].filters).toEqual([
      { op: 'in', column: 'id', value: [CLIENT_ID] },
      { op: 'eq', column: 'tenant_id', value: TENANT_ID },
    ]);
    expectNoDocumentAccess();
  });

  it('fails closed on a membership lookup error', async () => {
    mocks.state.membershipError = true;

    expect((await GET(request('GET'), context())).status).toBe(403);
    expectNoDocumentAccess();
  });

  it('lists only the authorized company index and reports its summary', async () => {
    const response = await GET(request('GET'), context());

    expect(response.status).toBe(200);
    expect(queriesFor('company_document_index')[0].filters).toEqual([
      { op: 'eq', column: 'company_id', value: COMPANY_ID },
    ]);
    expect(queriesFor('company_document_roots')[0].filters).toEqual([
      { op: 'eq', column: 'company_id', value: COMPANY_ID },
      { op: 'eq', column: 'provider', value: 'google' },
    ]);
    expect(await response.json()).toEqual({
      root: mocks.state.root,
      summary: { total: 2, folders: 1, files: 1 },
      items: mocks.state.documentItems,
    });
  });

  it('passes only the authorized company to Drive and records its actor', async () => {
    const response = await POST(request('POST'), context());

    expect(response.status).toBe(200);
    expect(mocks.indexDrive).toHaveBeenCalledWith(COMPANY_ID);
    expect(mocks.state.auditPayload).toEqual({
      actor_id: 'admin-A',
      action: 'company_documents.drive_indexed',
      entity: 'companies',
      entity_id: COMPANY_ID,
      metadata: { files: 2, folders: 1 },
    });
  });

  it('uses the company tenant for a global owner', async () => {
    mocks.state.actor = {
      userId: 'owner-A',
      role: 'owner',
      tenantId: null,
    };

    const response = await GET(request('GET'), context());

    expect(response.status).toBe(200);
    expect(queriesFor('companies')[0].filters).toEqual([
      { op: 'eq', column: 'id', value: COMPANY_ID },
    ]);
    expect(queriesFor('profiles')[0].filters).toContainEqual({
      op: 'eq',
      column: 'tenant_id',
      value: TENANT_ID,
    });
  });

  it('preserves explicit legacy null-tenant company scope for a global owner', async () => {
    mocks.state.actor = {
      userId: 'owner-A',
      role: 'owner',
      tenantId: null,
    };
    if (!mocks.state.company) throw new Error('missing company fixture');
    mocks.state.company.tenant_id = null;
    mocks.state.memberTenant = null;

    const response = await GET(request('GET'), context());

    expect(response.status).toBe(200);
    expect(queriesFor('profiles')[0].filters).toEqual([
      { op: 'in', column: 'id', value: [CLIENT_ID] },
    ]);
  });

  it('does not write audit data when Drive indexing fails', async () => {
    mocks.indexDrive.mockRejectedValueOnce(new Error('Drive unavailable'));

    const response = await POST(request('POST'), context());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Drive unavailable' });
    expect(mocks.state.auditPayload).toBeNull();
  });
});
