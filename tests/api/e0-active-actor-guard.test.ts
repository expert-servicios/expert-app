import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { getUser, profileQuery, adminFrom, profileResult } = vi.hoisted(() => {
  const profileResult = { current: { data: { role: 'admin', status: 'active', tenant_id: null }, error: null } as { data: { role: string; status: string; tenant_id: string | null } | null; error: { message: string } | null } };
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(async () => profileResult.current),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return {
    getUser: vi.fn(async () => ({ data: { user: { id: 'actor-id' } }, error: null })),
    profileQuery: query,
    adminFrom: vi.fn(() => query),
    profileResult,
  };
});

vi.mock('@/lib/integrations/supabase', () => ({
  createServerSupabaseClient: vi.fn(() => ({ auth: { getUser } })),
  getSupabaseAdmin: vi.fn(() => ({ from: adminFrom })),
}));

import { requireActiveActor } from '@/lib/auth/active-actor';

const req = () => new NextRequest('http://localhost/api/companies/id', { method: 'PATCH' });

describe('E0 active actor gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileResult.current = { data: { role: 'admin', status: 'active', tenant_id: null }, error: null };
    getUser.mockResolvedValue({ data: { user: { id: 'actor-id' } }, error: null });
    profileQuery.select.mockReturnValue(profileQuery);
    profileQuery.eq.mockReturnValue(profileQuery);
  });

  it('returns a scoped snapshot only for active actors', async () => {
    await expect(requireActiveActor(req(), ['admin', 'owner'])).resolves.toEqual({
      userId: 'actor-id', role: 'admin', tenantId: null,
    });
    expect(profileQuery.select).toHaveBeenCalledWith('role,status,tenant_id');
    expect(profileQuery.eq).toHaveBeenCalledWith('id', 'actor-id');
  });

  it.each(['inactive', 'pending', 'suspended'])('rejects %s profile with still-valid JWT', async (status) => {
    profileResult.current = { data: { role: 'admin', status, tenant_id: null }, error: null };
    await expect(requireActiveActor(req(), ['admin', 'owner'])).resolves.toBeNull();
  });

  it('fails closed when profile row cannot be loaded', async () => {
    profileResult.current = { data: null, error: null };
    await expect(requireActiveActor(req(), ['admin', 'owner'])).resolves.toBeNull();
    profileResult.current = { data: { role: 'owner', status: 'active', tenant_id: null }, error: { message: 'db-failed' } };
    await expect(requireActiveActor(req(), ['admin', 'owner'])).resolves.toBeNull();
  });

  it('rejects authorized session with an unprivileged role', async () => {
    profileResult.current = { data: { role: 'client', status: 'active', tenant_id: null }, error: null };
    await expect(requireActiveActor(req(), ['admin', 'owner'])).resolves.toBeNull();
  });

  it('rejects unauthenticated callers', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(requireActiveActor(req())).resolves.toBeNull();
  });
});
