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
    getUser: vi.fn<() => Promise<{ data: { user: { id: string } | null }; error: null }>>(async () => ({ data: { user: { id: 'actor-id' } }, error: null })),
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
import { PATCH as patchCase } from '@/app/api/cases/[id]/route';
import { PATCH as patchCompany } from '@/app/api/companies/[id]/route';
import { POST as createAdminCompany } from '@/app/api/admin/companies/route';

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

  it('blocks inactive users at each privileged HTTP mutation before service-role writes', async () => {
    profileResult.current = { data: { role: 'admin', status: 'inactive', tenant_id: null }, error: null };

    const caseResponse = await patchCase(
      new NextRequest('http://localhost/api/cases/test-case', { method: 'PATCH', body: JSON.stringify({ admin_note: 'blocked' }) }),
      { params: Promise.resolve({ id: 'test-case' }) },
    );
    expect(caseResponse.status).toBe(403);

    const companyResponse = await patchCompany(
      new NextRequest('http://localhost/api/companies/test-company', { method: 'PATCH', body: JSON.stringify({ nombre_comercial: 'blocked' }) }),
      { params: Promise.resolve({ id: 'test-company' }) },
    );
    expect(companyResponse.status).toBe(403);

    const adminResponse = await createAdminCompany(
      new NextRequest('http://localhost/api/admin/companies', { method: 'POST', body: JSON.stringify({ razon_social: 'Blocked SL' }) }),
    );
    expect(adminResponse.status).toBe(403);
    expect(adminFrom).toHaveBeenCalledTimes(3);
    expect(adminFrom.mock.calls.every(([table]) => table === 'profiles')).toBe(true);
  });
});
