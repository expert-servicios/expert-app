import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const state = {
    actor: { userId: 'user-A', role: 'client', tenantId: 'tenant-A' } as {
      userId: string; role: string; tenantId: string | null;
    } | null,
    membership: true,
    companyTenant: 'tenant-A',
    tables: [] as string[],
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
    mocks.state.tables.length = 0;
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

  it('denies tenant administrator without tenant context', async () => {
    mocks.state.actor = { userId: 'user-A', role: 'tenant_admin', tenantId: null };
    expect((await GET(getReq(), ctx)).status).toBe(403);
    expect(mocks.state.tables).toEqual([]);
  });

  it('permits an active client with matching membership and tenant for reading', async () => {
    expect((await GET(getReq(), ctx)).status).toBe(200);
    expect(mocks.state.tables).toEqual(['profile_companies', 'companies', 'company_intake_profiles']);
  });
});
