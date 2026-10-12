import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const state = {
    actor: { userId: 'admin-A', role: 'admin', tenantId: 'tenant-A' } as {userId:string;role:string;tenantId:string|null}|null,
    company: { id: 'company-A', tenant_id: 'tenant-A' } as {id:string;tenant_id:string|null}|null,
    member: true,
    memberTenant: 'tenant-A',
    tables: [] as string[],
  };
  const indexDrive = vi.fn(async () => ({ files: 2 }));
  return { state, indexDrive };
});
vi.mock('@/lib/auth/active-actor', () => ({ requireActiveActor: async () => mocks.state.actor }));
vi.mock('@/lib/documents/company-drive-index', () => ({ indexCompanyGoogleDrive: mocks.indexDrive }));
vi.mock('@/lib/integrations/supabase', () => ({
  getSupabaseAdmin: () => ({
    from(table: string) {
      mocks.state.tables.push(table);
      const filters: Array<[string, unknown]> = [];
      const query = {
        select() { return query; },
        eq(k: string, v: unknown) { filters.push([k,v]); return query; },
        in() { return query; },
        order() { return query; },
        limit: (n: number) => {
          if (table === 'profiles') return Promise.resolve({ data: mocks.state.member && mocks.state.memberTenant === (mocks.state.actor?.tenantId ?? mocks.state.company?.tenant_id) ? [{id:'client-A'}] : [], error: null });
          return Promise.resolve({data: [],error:null});
        },
        maybeSingle: async () => ({
          data: table === 'companies' ? (
            filters.some(([k,v]) => k === 'tenant_id' && v !== mocks.state.company?.tenant_id) ? null : mocks.state.company
          ) : {provider:'google'}, error:null,
        }),
        insert: async () => ({error:null}),
      };
      return query;
    },
  }),
}));
import { GET, POST } from '@/app/api/admin/empresas/[id]/documents/index/route';
const ctx = {params:Promise.resolve({id:'company-A'})};
const req = (method:'GET'|'POST') => new NextRequest('https://example.test/api/admin/empresas/company-A/documents/index',{method});

describe('E0 document index scoped access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.actor = {userId:'admin-A',role:'admin',tenantId:'tenant-A'};
    mocks.state.company = {id:'company-A',tenant_id:'tenant-A'};
    mocks.state.member = true;
    mocks.state.memberTenant = 'tenant-A';
    mocks.state.tables.length = 0;
  });
  it('denies revoked profile before any privileged query or Drive call', async () => {
    mocks.state.actor = null;
    expect((await GET(req('GET'),ctx)).status).toBe(403);
    expect((await POST(req('POST'),ctx)).status).toBe(403);
    expect(mocks.state.tables).toEqual([]);
    expect(mocks.indexDrive).not.toHaveBeenCalled();
  });
  it('denies cross-tenant company before document queries', async () => {
    mocks.state.company = {id:'company-A',tenant_id:'tenant-B'};
    expect((await GET(req('GET'),ctx)).status).toBe(403);
    expect((await POST(req('POST'),ctx)).status).toBe(403);
    expect(mocks.state.tables).not.toContain('company_document_index');
    expect(mocks.indexDrive).not.toHaveBeenCalled();
  });
  it('denies absent or foreign membership before external access', async () => {
    mocks.state.member = false;
    expect((await POST(req('POST'),ctx)).status).toBe(403);
    mocks.state.member = true;
    mocks.state.memberTenant = 'tenant-B';
    expect((await GET(req('GET'),ctx)).status).toBe(403);
    expect(mocks.indexDrive).not.toHaveBeenCalled();
  });
  it('allows scoped document index reading', async () => {
    expect((await GET(req('GET'),ctx)).status).toBe(200);
    expect(mocks.state.tables).toContain('company_document_index');
  });
  it('passes only authorized company to indexing helper', async () => {
    expect((await POST(req('POST'),ctx)).status).toBe(200);
    expect(mocks.indexDrive).toHaveBeenCalledWith('company-A');
  });
});
