import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const state = {
    actor: { userId: 'actor-id', role: 'admin', tenantId: null } as {
      userId: string;
      role: string;
      tenantId: string | null;
    } | null,
    caseFound: true,
    tables: [] as string[],
    eqCalls: [] as Array<[string, string, unknown]>,
    lifecycleResult: {
      ok: false as const,
      error: 'Solicitud de firma no encontrada en el expediente.',
    },
  };

  const admin = {
    from(table: string) {
      state.tables.push(table);
      const query = {
        select() {
          return query;
        },
        eq(column: string, value: unknown) {
          state.eqCalls.push([table, column, value]);
          return query;
        },
        in() {
          return query;
        },
        like() {
          return query;
        },
        order() {
          return query;
        },
        limit: async () => ({ data: [], error: null }),
        maybeSingle: async () => ({
          data: table === 'cases' && state.caseFound ? { id: 'case-A' } : null,
          error: null,
        }),
      };
      return query;
    },
  };

  return {
    state,
    getAdmin: vi.fn(() => admin),
    recordLifecycle: vi.fn(async () => state.lifecycleResult),
  };
});

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: async () => mocks.state.actor,
}));

vi.mock('@/lib/integrations/supabase', () => ({
  getSupabaseAdmin: mocks.getAdmin,
}));

vi.mock('@/lib/ai/kia/kia-signature-workflow', () => ({
  KIA_SIGNATURE_CAPABILITY: 'documents.signature',
  KIA_SIGNATURE_ACTION_TYPE: 'google_esignature',
  recordKiaSignatureLifecycle: mocks.recordLifecycle,
}));

import { GET } from '@/app/api/admin/cases/[id]/signature-actions/route';
import { PATCH } from '@/app/api/admin/cases/[id]/signature-actions/[actionId]/route';

const listRequest = () =>
  new NextRequest('https://example.test/api/admin/cases/case-A/signature-actions');

const patchRequest = () =>
  new NextRequest('https://example.test/api/admin/cases/case-A/signature-actions/action-B', {
    method: 'PATCH',
    body: JSON.stringify({ lifecycle: 'cancelled' }),
  });

describe('E0 signature action HTTP boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.actor = { userId: 'actor-id', role: 'admin', tenantId: null };
    mocks.state.caseFound = true;
    mocks.state.tables.length = 0;
    mocks.state.eqCalls.length = 0;
    mocks.state.lifecycleResult = {
      ok: false,
      error: 'Solicitud de firma no encontrada en el expediente.',
    };
  });

  it('rejects inactive or unauthenticated actors before service-role access', async () => {
    mocks.state.actor = null;

    const listResponse = await GET(listRequest(), {
      params: Promise.resolve({ id: 'case-A' }),
    });
    const patchResponse = await PATCH(patchRequest(), {
      params: Promise.resolve({ id: 'case-A', actionId: 'action-B' }),
    });

    expect(listResponse.status).toBe(403);
    expect(patchResponse.status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.recordLifecycle).not.toHaveBeenCalled();
  });

  it('scopes the list query to the requested case and signature action type', async () => {
    const response = await GET(listRequest(), {
      params: Promise.resolve({ id: 'case-A' }),
    });

    expect(response.status).toBe(200);
    expect(mocks.state.eqCalls).toContainEqual(['cases', 'id', 'case-A']);
    expect(mocks.state.eqCalls).toContainEqual(['administrative_actions', 'case_id', 'case-A']);
    expect(mocks.state.eqCalls).toContainEqual([
      'administrative_actions',
      'capability',
      'documents.signature',
    ]);
    expect(mocks.state.eqCalls).toContainEqual([
      'administrative_actions',
      'action_type',
      'google_esignature',
    ]);
  });

  it('passes both case and action identifiers to the lifecycle object-scope check', async () => {
    const response = await PATCH(patchRequest(), {
      params: Promise.resolve({ id: 'case-A', actionId: 'action-B' }),
    });

    expect(response.status).toBe(409);
    expect(mocks.recordLifecycle).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        actionId: 'action-B',
        caseId: 'case-A',
        actorId: 'actor-id',
        lifecycle: 'cancelled',
      }),
    );
  });
});
