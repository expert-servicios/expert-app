import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const state = {
    actor: { userId: 'user-A', role: 'client', tenantId: 'tenant-A' } as {
      userId: string; role: string; tenantId: string | null;
    } | null,
    membership: true,
    companyTenant: 'tenant-A' as string | null,
    legacyOwnerIds: ['user-A'] as string[],
    legacyOwnerTenants: ['tenant-A'] as (string | null)[],
    legacyOwnerReadError: false,
    tables: [] as string[],
    upserts: [] as Array<Record<string, unknown>>,
    auditEntries: [] as Array<Record<string, unknown>>,
  };
  return { state };
});

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: async () => mocks.state.actor,
}));
vi.mock('@/lib/integrations/supabase', () => ({
  getSupabaseAdmin: () => ({
    from(table: string) {
      mocks.state.tables.push(table);
      const query = {
        select() { return query; },
        eq() { return query; },
        then(onFulfilled: (result: { data: unknown; error: unknown }) => unknown, onRejected?: (error: unknown) => unknown) {
          const result = table === 'profile_companies'
            ? { data: mocks.state.legacyOwnerIds.map((profile_id) => ({ profile_id })), error: mocks.state.legacyOwnerReadError ? { message: 'owner lookup failed' } : null }
            : table === 'profiles'
              ? { data: mocks.state.legacyOwnerIds.map((id, i) => ({ id, tenant_id: mocks.state.legacyOwnerTenants[i] })), error: null }
              : { data: null, error: null };
          return Promise.resolve(result).then(onFulfilled, onRejected);
        },
        in() { return query; },
        upsert(values: Record<string, unknown>) { mocks.state.upserts.push(values); return query; },
        single: async () => ({ data: { company_id: 'company-A', status: 'draft', payload: { cnae: '6201' }, completion_percent: 11, last_saved_at: '2026-10-11T00:00:00Z' }, error: null }),
        insert: async (values: Record<string, unknown>) => { mocks.state.auditEntries.push(values); return { error: null }; },
        maybeSingle: async () => ({
          data: table === 'profile_companies'
            ? (mocks.state.membership ? { role: 'owner' } : null)
            : table === 'companies' ? { tenant_id: mocks.state.companyTenant }
            : { company_id: 'company-A', payload: {}, status: 'draft' },
          error: null,
        }),
      };
      return query;
    },
  }),
}));

import { GET, PATCH } from '@/app/api/companies/[id]/intake/route';

const ctx = { params: Promise.resolve({ id: 'company-A' }) };
const getReq = () => new NextRequest('https://example.test/api/companies/company-A/intake');
const patchReq = () => new NextRequest('https://example.test/api/companies/company-A/intake', {
  method: 'PATCH', body: JSON.stringify({ cnae: '6201' }),
});

describe('E0 Company 360 intake authorization HTTP boundaries', () => {
  beforeEach(() => {
    mocks.state.actor = { userId: 'user-A', role: 'client', tenantId: 'tenant-A' };
    mocks.state.membership = true;
    mocks.state.companyTenant = 'tenant-A';
    mocks.state.legacyOwnerIds = ['user-A'];
    mocks.state.legacyOwnerTenants = ['tenant-A'];
    mocks.state.legacyOwnerReadError = false;
    mocks.state.tables.length = 0;
    mocks.state.upserts.length = 0;
    mocks.state.auditEntries.length = 0;
  });

  it('denies revoked, suspended or unauthenticated actor before service-role queries', async () => {
    mocks.state.actor = null;
    expect((await GET(getReq(), ctx)).status).toBe(403);
    expect((await PATCH(patchReq(), ctx)).status).toBe(403);
    expect(mocks.state.tables).toEqual([]);
  });

  it('denies company without membership before reading intake', async () => {
    mocks.state.membership = false;
    expect((await GET(getReq(), ctx)).status).toBe(403);
    expect(mocks.state.tables).toEqual(['profile_companies']);
  });

  it('denies a foreign tenant despite valid company membership', async () => {
    mocks.state.companyTenant = 'tenant-B';
    expect((await GET(getReq(), ctx)).status).toBe(403);
    expect((await PATCH(patchReq(), ctx)).status).toBe(403);
    expect(mocks.state.tables).toEqual([
      'profile_companies', 'companies',
      'profile_companies', 'companies',
    ]);
  });

  it('allows a legacy null-tenant company only if its recorded owners all belong to the actor tenant', async () => {
    mocks.state.companyTenant = null;
    expect((await GET(getReq(), ctx)).status).toBe(200);
    expect((await PATCH(patchReq(), ctx)).status).toBe(200);
    expect(mocks.state.tables).toContain('profiles');
  });

  it('rejects legacy company with an owner belonging to a foreign tenant', async () => {
    mocks.state.companyTenant = null;
    mocks.state.legacyOwnerIds = ['user-A', 'user-B'];
    mocks.state.legacyOwnerTenants = ['tenant-A', 'tenant-B'];
    expect((await GET(getReq(), ctx)).status).toBe(403);
    expect((await PATCH(patchReq(), ctx)).status).toBe(403);
    expect(mocks.state.tables).not.toContain('company_intake_profiles');
  });

  it('fails closed when legacy company ownership cannot be verified', async () => {
    mocks.state.companyTenant = null;
    mocks.state.legacyOwnerReadError = true;
    expect((await GET(getReq(), ctx)).status).toBe(403);
    expect(mocks.state.tables).not.toContain('company_intake_profiles');
  });

  it('denies a client without canonical tenant before service-role queries', async () => {
    mocks.state.actor = { userId: 'user-A', role: 'client', tenantId: null };
    expect((await GET(getReq(), ctx)).status).toBe(403);
    expect((await PATCH(patchReq(), ctx)).status).toBe(403);
    expect(mocks.state.tables).toEqual([]);
  });

  it('denies tenant administrator without tenant context', async () => {
    mocks.state.actor = { userId: 'user-A', role: 'tenant_admin', tenantId: null };
    expect((await GET(getReq(), ctx)).status).toBe(403);
    expect(mocks.state.tables).toEqual([]);
  });

  it('permits an active client with matching membership and tenant for reading', async () => {
    expect((await GET(getReq(), ctx)).status).toBe(200);
    expect(mocks.state.tables).toEqual(['profile_companies', 'companies', 'company_intake_profiles']);
  });
  it('preserves legitimate active-client intake autosave', async () => {
    const response = await PATCH(patchReq(), ctx);
    expect(response.status).toBe(200);
    expect(mocks.state.upserts).toHaveLength(1);
    expect(mocks.state.upserts[0]).toEqual(expect.objectContaining({
      company_id: 'company-A',
      client_id: 'user-A',
      payload: { cnae: '6201' },
    }));
    expect(mocks.state.auditEntries).toHaveLength(1);
  });

  it('allows internal active staff without a company membership', async () => {
    mocks.state.actor = { userId: 'staff-A', role: 'admin', tenantId: null };
    mocks.state.membership = false;
    expect((await GET(getReq(), ctx)).status).toBe(200);
    expect(mocks.state.tables).toEqual(['company_intake_profiles']);
  });

  it('allows tenant staff with a matching membership and canonical tenant', async () => {
    mocks.state.actor = { userId: 'tenant-A', role: 'tenant_admin', tenantId: 'tenant-A' };
    expect((await GET(getReq(), ctx)).status).toBe(200);
    expect(mocks.state.tables).toEqual(['profile_companies', 'companies', 'company_intake_profiles']);
  });

});
