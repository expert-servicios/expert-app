import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const state = {
    user: { id: 'client-A' } as { id: string } | null,
    actor: { userId: 'client-A', role: 'client', tenantId: 'tenant-A' } as {
      userId: string; role: string; tenantId: string | null;
    } | null,
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
        const query = {
          select() { return query; },
          eq() { return query; },
          order: async () => ({
            data: [{ role: 'owner', company: { id: 'company-A', tenant_id: 'tenant-A' } }],
            error: null,
          }),
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

  it('preserves the active actor company listing', async () => {
    const response = await GET(req());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      companies: [{ id: 'company-A', tenant_id: 'tenant-A', role: 'owner' }],
    });
    expect(mocks.state.tables).toEqual(['profile_companies']);
  });
});
