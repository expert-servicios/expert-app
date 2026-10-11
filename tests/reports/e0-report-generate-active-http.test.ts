import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const state = {
    actor: {
      userId: '11111111-1111-4111-8111-111111111111',
      role: 'client',
      tenantId: 'tenant-A',
    } as { userId: string; role: string; tenantId: string | null } | null,
    tables: [] as string[],
  };

  const admin = {
    from(table: string) {
      state.tables.push(table);
      const query = {
        select() { return query; },
        eq() { return query; },
        is() { return query; },
        order() { return query; },
        limit() { return query; },
        single: async () => ({
          data: table === 'profiles' ? { active_company_id: null } : null,
          error: null,
        }),
        maybeSingle: async () => ({
          data: table === 'client_integrations' ? { id: 'integration-A' } : null,
          error: null,
        }),
      };
      return query;
    },
  };

  return {
    state,
    getAdmin: vi.fn(() => admin),
    generateReport: vi.fn(async () => ({ reportId: 'report-A' })),
  };
});

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: async () => mocks.state.actor,
}));

vi.mock('@/lib/integrations/supabase', () => ({
  getSupabaseAdmin: mocks.getAdmin,
}));

vi.mock('@/lib/reports/report-generator', () => ({
  generateCompanyReport: mocks.generateReport,
}));

import { POST } from '@/app/api/reports/generate/route';

const request = (body: Record<string, unknown> = {}) =>
  new NextRequest('https://example.test/api/reports/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  });

describe('E0 financial report generation HTTP boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.actor = {
      userId: '11111111-1111-4111-8111-111111111111',
      role: 'client',
      tenantId: 'tenant-A',
    };
    mocks.state.tables.length = 0;
  });

  it('rejects revoked, suspended or unauthenticated actors before service-role access', async () => {
    mocks.state.actor = null;

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.generateReport).not.toHaveBeenCalled();
  });

  it('rejects an active client attempting to generate another client report', async () => {
    const response = await POST(request({
      clientId: '22222222-2222-4222-8222-222222222222',
    }));

    expect(response.status).toBe(403);
    expect(mocks.state.tables).toEqual([]);
    expect(mocks.generateReport).not.toHaveBeenCalled();
  });

  it('preserves report generation for the active client itself', async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(mocks.state.tables).toEqual(['profiles', 'client_integrations']);
    expect(mocks.generateReport).toHaveBeenCalledWith(expect.objectContaining({
      clientId: '11111111-1111-4111-8111-111111111111',
      companyId: null,
      integrationId: 'integration-A',
      generatedBy: 'user',
    }));
  });

  it('allows an active internal admin to generate for an explicit client', async () => {
    mocks.state.actor = {
      userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      role: 'admin',
      tenantId: null,
    };

    const response = await POST(request({
      clientId: '22222222-2222-4222-8222-222222222222',
      lang: 'ru',
    }));

    expect(response.status).toBe(200);
    expect(mocks.generateReport).toHaveBeenCalledWith(expect.objectContaining({
      clientId: '22222222-2222-4222-8222-222222222222',
      integrationId: 'integration-A',
      lang: 'ru',
      generatedBy: 'admin',
    }));
  });
});
