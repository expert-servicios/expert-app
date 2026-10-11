import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  actor: { userId: 'actor', role: 'tenant_admin', tenantId: 'tenant-A' } as {userId:string;role:string;tenantId:string|null}|null,
  caseTenant: 'tenant-B',
  clientTenant: 'tenant-A',
  tables: [] as string[],
  uploads: 0,
}));

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: async () => state.actor,
}));
vi.mock('@/lib/integrations/supabase', () => ({
  getSupabaseAdmin: () => ({
    from(table:string) {
      state.tables.push(table);
      return {
        select() { return this; }, eq() { return this; },
        single: async () => ({
          data: table==='cases'
            ? { id:'case', client_id:'client', company_id:'company', tenant_id:state.caseTenant, service:'test' }
            : {tenant_id:state.clientTenant},
          error:null,
        }),
      };
    },
    storage: { from:() => ({ upload:async()=>{state.uploads++;return {data:{path:'a'},error:null};} }) },
  }),
}));
import { POST } from '@/app/api/tenant/cases/[id]/documents/route';
const request = () => new NextRequest('https://example.test/api/tenant/cases/case/documents', {method:'POST'});
const params = {params:Promise.resolve({id:'case'})};

describe('E0 tenant document boundary',()=>{
  beforeEach(()=>{
    state.actor={userId:'actor',role:'tenant_admin',tenantId:'tenant-A'};
    state.caseTenant='tenant-B';state.clientTenant='tenant-A';state.tables.length=0;state.uploads=0;
  });
  it('rejects a foreign-tenant case before reading documents or uploading',async()=>{
    const response=await POST(request(),params);
    expect(response.status).toBe(404);
    expect(state.tables).toEqual(['cases']);
    expect(state.uploads).toBe(0);
  });
  it('rejects suspended or unauthenticated actors before service-role reads',async()=>{
    state.actor=null;
    const response=await POST(request(),params);
    expect(response.status).toBe(403);
    expect(state.tables).toEqual([]);
  });
  it('rejects mismatched client tenant after case ownership check',async()=>{
    state.caseTenant='tenant-A';state.clientTenant='tenant-B';
    const response=await POST(request(),params);
    expect(response.status).toBe(403);
    expect(state.tables).toEqual(['cases','profiles']);
    expect(state.uploads).toBe(0);
  });
});