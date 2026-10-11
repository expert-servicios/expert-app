import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const state = {
    status: 'inactive' as string | null,
    tables: [] as string[],
  };
  return {
    state,
    getAdmin: vi.fn(),
    messageLimit: vi.fn(() => true),
    costCap: vi.fn(async () => ({ ok: true, spentUsd: 0 })),
  };
});

vi.mock('@/lib/integrations/supabase', () => ({
  createServerSupabaseClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: 'user-A' } },
        error: null,
      }),
    },
  }),
  getSupabaseAdmin: () => {
    mocks.getAdmin();
    return {
      from(table: string) {
        mocks.state.tables.push(table);
        const query = {
          select() { return query; },
          eq() { return query; },
          maybeSingle: async () => ({
            data: table === 'profiles'
              ? {
                  tenant_id: 'tenant-A',
                  active_company_id: 'company-A',
                  preferred_language: 'es',
                  role: 'admin',
                  status: mocks.state.status,
                }
              : null,
            error: null,
          }),
        };
        return query;
      },
    };
  },
}));

vi.mock('@/lib/ai/kia/kia-rate-limit', () => ({
  checkKiaMessageRateLimit: mocks.messageLimit,
  checkKiaDailyCostCap: mocks.costCap,
}));

import { POST } from '@/app/api/ai/kia/route';

const request = () => new NextRequest('https://example.test/api/ai/kia', {
  method: 'POST',
  body: JSON.stringify({ message: 'Necesito revisar mi expediente' }),
});

describe('E0 KIA dashboard active actor HTTP boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.tables.length = 0;
  });

  it.each(['inactive', 'pending', 'suspended', null])(
    'rejects profile status %s before cost, context and object-scope reads',
    async (status) => {
      mocks.state.status = status;

      const response = await POST(request());

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toMatchObject({ error: 'account_inactive' });
      expect(mocks.state.tables).toEqual(['profiles']);
      expect(mocks.getAdmin).toHaveBeenCalledTimes(1);
      expect(mocks.messageLimit).not.toHaveBeenCalled();
      expect(mocks.costCap).not.toHaveBeenCalled();
    },
  );
});
