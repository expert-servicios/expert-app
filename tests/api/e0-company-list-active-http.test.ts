import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const state = {
    user: { id: 'client-A' } as { id: string } | null,
    actor: { userId: 'client-A', role: 'client', tenantId: 'tenant-A' } as {
      userId: string; role: string; tenantId: string | null;
    } | null,
    companyTenant: 'tenant-A' as string | null,
    ownerIds: ['client-A'] as string[],
    ownerTenants: ['tenant-A'] as (string | null)[],
    tables: [] as string[],
  };
  return { state, getAdmin: vi.fn() };
});

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: async () => mocks.state.actor,
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
        const filters: Array<[string, unknown]> = [];
        const query = {
          select() { return query; },
          eq(column: string, value: unknown) { filters.push([column, value]); return query; },
          in() { return query; },
          order: async () => ({
            data: [{
              role: 'owner',
              company: { id: 'company-A', tenant_id: mocks.state.companyTenant },
            }],
            error: null,
          }),
          then(
            resolve: (value: { data: unknown; error: null }) => unknown,
            reject?: (reason: unknown) => unknown,
          ) {
            const data = table === 'profile_companies'
              ? mocks.state.ownerIds.map((profile_id) => ({ profile_id }))
              : table === 'profiles'
                ? mocks.state.ownerIds.map((id, index) => ({
                    id, tenant_id: mocks.state.ownerTenants[index],
                  }))
                : null;
            return Promise.resolve({ data, error: null }).then(resolve, reject);
          },
        };
        return query;
      },
    };
  },
}));

import { GET } from '@/app/api/companies/route';

const req = () => new NextRequest('https://example.test/api/companies');

describe('E0 company collection authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.user = { id: 'client-A' };
    mocks.state.actor = { userId: 'client-A', role: 'client', tenantId: 'tenant-A' };
    mocks.state.companyTenant = 'tenant-A';
    mocks.state.ownerIds = ['client-A'];
    mocks.state.ownerTenants = ['tenant-A'];
    mocks.state.tables.length = 0;
  });

  it('rejects unauthenticated sessions before service-role reads', async () => {
    mocks.state.user = null;
    expect((await GET(req())).status).toBe(401);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });

  it('rejects inactive, suspended and pending sessions before service-role reads', async () => {
    mocks.state.actor = null;
    expect((await GET(req())).status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });

  it('rejects an actor that differs from the authenticated user', async () => {
    mocks.state.actor = { userId: 'another-client', role: 'client', tenantId: 'tenant-A' };
    expect((await GET(req())).status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });

  it('rejects a tenant-bound actor without canonical tenant before service-role reads', async () => {
    mocks.state.actor = { userId: 'client-A', role: 'client', tenantId: null };
    expect((await GET(req())).status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });

  it('preserves the active actor company listing for a matching tenant', async () => {
    const response = await GET(req());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      companies: [{ id: 'company-A', tenant_id: 'tenant-A', role: 'owner' }],
    });
    expect(mocks.state.tables).toEqual(['profile_companies']);
  });

  it('filters a stale membership that points to a foreign-tenant company', async () => {
    mocks.state.companyTenant = 'tenant-B';
    const response = await GET(req());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ companies: [] });
    expect(mocks.state.tables).toEqual(['profile_companies']);
  });

  it('allows a legacy null-tenant company only when every owner matches the actor tenant', async () => {
    mocks.state.companyTenant = null;
    const response = await GET(req());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      companies: [{ id: 'company-A', tenant_id: null }],
    });
    expect(mocks.state.tables).toEqual(['profile_companies', 'profile_companies', 'profiles']);
  });

  it('filters a legacy company when any owner belongs to another tenant', async () => {
    mocks.state.companyTenant = null;
    mocks.state.ownerIds = ['client-A', 'client-B'];
    mocks.state.ownerTenants = ['tenant-A', 'tenant-B'];
    const response = await GET(req());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ companies: [] });
  });
});
