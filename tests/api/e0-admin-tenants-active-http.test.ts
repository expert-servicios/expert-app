import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const state = {
    actor: { userId: 'staff-A', role: 'admin', tenantId: null } as {
      userId: string; role: string; tenantId: string | null;
    } | null,
    listed: [] as string[],
    created: 0,
  };
  return { state, gate: vi.fn() };
});

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: async (_request: unknown, roles: readonly string[]) => {
    mocks.gate(roles);
    return mocks.state.actor;
  },
}));

vi.mock('@/lib/integrations/supabase', () => ({
  getSupabaseAdmin: () => ({
    from(table: string) {
      mocks.state.listed.push(table);
      return {
        select() { return this; },
        order: async () => ({ data: [], error: null }),
      };
    },
  }),
}));

vi.mock('@/lib/auth/tenant', () => ({
  createTenant: async () => {
    mocks.state.created++;
    return { tenant: { id: 'tenant-created', name: 'Example' }, error: null };
  },
}));

import { GET, POST } from '@/app/api/admin/tenants/route';

const request = (method: 'GET' | 'POST') => new NextRequest('https://example.test/api/admin/tenants', {
  method,
  ...(method === 'POST' ? {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Example', slug: 'example' }),
  } : {}),
});

describe('E0-M3-06 tenant admin requires currently active privileged actor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.actor = { userId: 'staff-A', role: 'admin', tenantId: null };
    mocks.state.listed.length = 0;
    mocks.state.created = 0;
  });

  it.each(['GET', 'POST'] as const)('%s denies revoked or unapproved staff before protected operations', async method => {
    mocks.state.actor = null;
    const result = await (method === 'GET' ? GET(request(method)) : POST(request(method)));
    expect(result.status).toBe(403);
    expect(mocks.gate).toHaveBeenCalledWith(['admin', 'owner']);
    expect(mocks.state.listed).toEqual([]);
    expect(mocks.state.created).toBe(0);
  });

  it('keeps active admin tenant listing available', async () => {
    const result = await GET(request('GET'));
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ tenants: [] });
    expect(mocks.state.listed).toEqual(['tenants']);
  });

  it('keeps active owner tenant creation available', async () => {
    mocks.state.actor = { userId: 'owner-A', role: 'owner', tenantId: null };
    const result = await POST(request('POST'));
    expect(result.status).toBe(201);
    expect(mocks.state.created).toBe(1);
  });
});
