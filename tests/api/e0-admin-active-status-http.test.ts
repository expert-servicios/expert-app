import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Exercise real Next.js handlers against a synthetic service-role adapter.
// The only permitted DB access for a blocked actor is their own profile lookup.
const mocks = vi.hoisted(() => ({
  status: 'active' as string | null,
  role: 'admin',
  signedIn: true,
  tables: [] as string[],
}));

vi.mock('@/lib/integrations/supabase', () => ({
  createServerSupabaseClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: mocks.signedIn ? { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } : null },
        error: null,
      }),
    },
  }),
  getSupabaseAdmin: () => ({
    from(table: string) {
      mocks.tables.push(table);
      return {
        select() { return this; },
        eq() { return this; },
        single: async () => ({ data: { status: mocks.status, role: mocks.role }, error: null }),
      };
    },
  }),
  listAllAuthUsers: vi.fn(),
}));

import { GET as holdedGet, POST as holdedPost } from '@/app/api/admin/empresas/[id]/holded/route';
import { GET as registryGet, POST as registryPost, DELETE as registryDelete } from '@/app/api/admin/empresas/[id]/registro/route';
import { GET as peopleGet, POST as peoplePost, DELETE as peopleDelete } from '@/app/api/admin/empresas/[id]/personas/route';
import { GET as benefitsGet, POST as benefitsPost, PATCH as benefitsPatch } from '@/app/api/admin/clientes/[id]/subscription-benefits/route';

const COMPANY = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const request = (endpoint: string, method: string) =>
  new NextRequest(`https://expertconsulting.es${endpoint}`, {
    method,
    headers: { 'content-type': 'application/json', origin: 'https://expertconsulting.es' },
    ...(method === 'GET' ? {} : { body: '{}' }),
  });
const params = { params: Promise.resolve({ id: COMPANY }) };

const handlers = [
  { label: 'Holded read', method: 'GET', path: `/api/admin/empresas/${COMPANY}/holded`, action: holdedGet },
  { label: 'Holded write', method: 'POST', path: `/api/admin/empresas/${COMPANY}/holded`, action: holdedPost },
  { label: 'Registry read', method: 'GET', path: `/api/admin/empresas/${COMPANY}/registro`, action: registryGet },
  { label: 'Registry add fact', method: 'POST', path: `/api/admin/empresas/${COMPANY}/registro`, action: registryPost },
  { label: 'Registry revoke', method: 'DELETE', path: `/api/admin/empresas/${COMPANY}/registro`, action: registryDelete },
  { label: 'People read', method: 'GET', path: `/api/admin/empresas/${COMPANY}/personas`, action: peopleGet },
  { label: 'People add', method: 'POST', path: `/api/admin/empresas/${COMPANY}/personas`, action: peoplePost },
  { label: 'People remove', method: 'DELETE', path: `/api/admin/empresas/${COMPANY}/personas`, action: peopleDelete },
  { label: 'Benefits read', method: 'GET', path: `/api/admin/clientes/${COMPANY}/subscription-benefits`, action: benefitsGet },
  { label: 'Benefits create', method: 'POST', path: `/api/admin/clientes/${COMPANY}/subscription-benefits`, action: benefitsPost },
  { label: 'Benefits update', method: 'PATCH', path: `/api/admin/clientes/${COMPANY}/subscription-benefits`, action: benefitsPatch },
] as const;

describe('E0-M3-06: privileged HTTP routes deny non-active actors', () => {
  beforeEach(() => {
    mocks.tables.length = 0;
    mocks.signedIn = true;
    mocks.status = 'active';
    mocks.role = 'admin';
  });

  it.each(['inactive', 'pending', 'suspended', null])(
    'rejects status %s before accessing protected customer tables', async (status) => {
      mocks.status = status;
      for (const test of handlers) {
        mocks.tables.length = 0;
        const response = await test.action(request(test.path, test.method), params);
        expect(response.status, test.label).toBe(403);
        expect(mocks.tables, test.label).toEqual(['profiles']);
      }
    },
  );

  it('rejects authenticated client role on every privileged endpoint', async () => {
    mocks.role = 'client';
    for (const test of handlers) {
      mocks.tables.length = 0;
      const response = await test.action(request(test.path, test.method), params);
      expect(response.status, test.label).toBe(403);
      expect(mocks.tables, test.label).toEqual(['profiles']);
    }
  });

  it('rejects unauthenticated callers without service-role reads', async () => {
    mocks.signedIn = false;
    for (const test of handlers) {
      mocks.tables.length = 0;
      const response = await test.action(request(test.path, test.method), params);
      expect(response.status, test.label).toBe(403);
      expect(mocks.tables, test.label).toEqual([]);
    }
  });
});
