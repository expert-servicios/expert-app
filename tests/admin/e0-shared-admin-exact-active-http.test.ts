import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  status: 'active' as string | null,
  role: 'admin' as string | null,
  signedIn: true,
  touched: [] as string[],
}));

vi.mock('@/lib/integrations/supabase', () => ({
  createServerSupabaseClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: mocks.signedIn ? { id: 'staff-A' } : null },
        error: null,
      }),
    },
  }),
  getSupabaseAdmin: () => ({
    from(table: string) {
      mocks.touched.push(table);
      const query = {
        select() { return query; },
        eq() { return query; },
        single: async () => ({
          data: { status: mocks.status, role: mocks.role },
          error: null,
        }),
        order() { return query; },
        limit: async () => ({ data: [], error: null }),
      };
      return query;
    },
  }),
}));

import { requireAdminClient } from '@/lib/auth/require-admin';
import { GET as healthRunsGet } from '@/app/api/admin/kia/health/runs/route';

const request = (path = '/api/admin/kia/health/runs') =>
  new NextRequest('https://example.test' + path);

describe('E0 shared admin guard revocation and privileged HTTP path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.status = 'active';
    mocks.role = 'admin';
    mocks.signedIn = true;
    mocks.touched.length = 0;
  });

  it.each(['inactive', 'pending', 'suspended', null])(
    'blocks staff profile status %s before reading privileged health runs',
    async (status) => {
      mocks.status = status;

      const response = await healthRunsGet(request());

      expect(response.status).toBe(403);
      expect(mocks.touched).toEqual(['profiles']);
    },
  );

  it('rejects an anonymous session before all service-role access', async () => {
    mocks.signedIn = false;

    const response = await healthRunsGet(request());

    expect(response.status).toBe(403);
    expect(mocks.touched).toEqual([]);
  });

  it.each(['client', 'tenant_admin', null])(
    'rejects role %s even when active',
    async (role) => {
      mocks.role = role;

      expect(await requireAdminClient(request())).toBeNull();
      expect(mocks.touched).toEqual(['profiles']);
    },
  );

  it.each(['admin', 'owner'])(
    'preserves health run reads for active %s',
    async (role) => {
      mocks.role = role;

      const response = await healthRunsGet(request());

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ runs: [] });
      expect(mocks.touched).toEqual(['profiles', 'kia_health_runs']);
    },
  );
});
