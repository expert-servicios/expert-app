import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const state = {
    user: { id: 'client-A' } as { id: string } | null,
    actor: { userId: 'client-A', role: 'client', tenantId: 'tenant-A' } as {
      userId: string; role: string; tenantId: string | null;
    } | null,
    tables: [] as string[],
    inserted: null as Record<string, unknown> | null,
  };
  return { state, getAdmin: vi.fn() };
});

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: async () => mocks.state.actor,
}));

vi.mock('@/lib/integrations/kia-engine', () => ({
  SERVICES: {
    'service-A': {
      label: { es: 'Servicio A' },
      area: 'fiscal',
      stripePriceId: 'price-A',
    },
  },
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
          gt() { return query; },
          delete() { return query; },
          insert(payload: Record<string, unknown>) {
            mocks.state.inserted = payload;
            return query;
          },
          order: async () => ({ data: [], error: null }),
          lt: async () => ({ error: null }),
          single: async () => ({
            data: { id: 'cart-A', ...(mocks.state.inserted ?? {}) },
            error: null,
          }),
          then(
            resolve: (value: { data: null; error: null }) => unknown,
            reject?: (reason: unknown) => unknown,
          ) {
            return Promise.resolve({ data: null, error: null }).then(resolve, reject);
          },
        };
        return query;
      },
    };
  },
}));

import { GET as getCart, DELETE as deleteCart } from '@/app/api/kia/cart/route';
import { POST as addCart } from '@/app/api/kia/cart/add/route';

const handlers = [
  ['GET', () => getCart(new NextRequest('https://example.test/api/kia/cart'))],
  ['DELETE', () => deleteCart(new NextRequest('https://example.test/api/kia/cart?id=cart-A'))],
  ['POST add', () => addCart(new NextRequest('https://example.test/api/kia/cart/add', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ service_id: 'service-A' }),
  }))],
] as const;

describe('E0 KIA cart exact-active authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.user = { id: 'client-A' };
    mocks.state.actor = { userId: 'client-A', role: 'client', tenantId: 'tenant-A' };
    mocks.state.tables.length = 0;
    mocks.state.inserted = null;
  });

  it.each(handlers)('rejects a revoked session before privileged access: %s', async (_name, handler) => {
    mocks.state.actor = null;

    const response = await handler();

    expect(response.status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.state.tables).toEqual([]);
  });

  it.each(handlers)('rejects a mismatched actor before privileged access: %s', async (_name, handler) => {
    mocks.state.actor = { userId: 'client-B', role: 'client', tenantId: 'tenant-A' };

    const response = await handler();

    expect(response.status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });

  it('preserves an active client add and derives client_id from the session', async () => {
    const response = await handlers[2][1]();

    expect(response.status).toBe(200);
    expect(mocks.state.inserted).toMatchObject({
      client_id: 'client-A',
      service_id: 'service-A',
      service_label: 'Servicio A',
    });
    expect(mocks.state.tables).toEqual(['kia_cart_items', 'kia_cart_items']);
  });

  it('keeps unauthenticated requests at 401 without privileged access', async () => {
    mocks.state.user = null;

    const response = await handlers[0][1]();

    expect(response.status).toBe(401);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });
});
