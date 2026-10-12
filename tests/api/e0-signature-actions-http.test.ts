import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const TENANT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_TENANT_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CLIENT_ID = '11111111-1111-4111-8111-111111111111';
const COMPANY_ID = '22222222-2222-4222-8222-222222222222';

type Filter = {
  op: 'eq' | 'is' | 'in' | 'like';
  column: string;
  value: unknown;
};

const mocks = vi.hoisted(() => {
  const state = {
    actor: {
      userId: 'actor-id',
      role: 'admin',
      tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    } as {
      userId: string;
      role: string;
      tenantId: string | null;
    } | null,
    caseRow: {
      id: 'case-A',
      client_id: '11111111-1111-4111-8111-111111111111',
      company_id: '22222222-2222-4222-8222-222222222222',
      tenant_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    } as {
      id: string;
      client_id: string;
      company_id: string | null;
      tenant_id: string | null;
    } | null,
    clientScopeOk: true,
    companyScopeOk: true,
    membershipOk: true,
    actionFound: true,
    actions: [] as Array<Record<string, unknown>>,
    events: [] as Array<Record<string, unknown>>,
    queries: [] as Array<{ table: string; filters: Filter[] }>,
    lifecycleResult: {
      ok: false as const,
      error: 'Solicitud de firma no encontrada en el expediente.',
    },
  };

  function result(table: string, filters: Filter[]) {
    state.queries.push({
      table,
      filters: filters.map((filter) => ({ ...filter })),
    });

    if (table === 'cases') {
      const tenantFilter = filters.find(
        (filter) => filter.op === 'eq' && filter.column === 'tenant_id',
      );
      const matchesTenant =
        !tenantFilter || tenantFilter.value === state.caseRow?.tenant_id;
      return { data: matchesTenant ? state.caseRow : null, error: null };
    }

    if (table === 'profiles') {
      return {
        data: state.clientScopeOk ? { id: CLIENT_ID } : null,
        error: null,
      };
    }

    if (table === 'companies') {
      return {
        data: state.companyScopeOk ? { id: COMPANY_ID } : null,
        error: null,
      };
    }

    if (table === 'profile_companies') {
      return {
        data: state.membershipOk ? { company_id: COMPANY_ID } : null,
        error: null,
      };
    }

    if (table === 'administrative_actions') {
      const isObjectLookup = filters.some(
        (filter) => filter.op === 'eq' && filter.column === 'id',
      );
      return {
        data: isObjectLookup
          ? state.actionFound ? { id: 'action-B' } : null
          : state.actions,
        error: null,
      };
    }

    if (table === 'administrative_action_events') {
      return { data: state.events, error: null };
    }

    return { data: null, error: null };
  }

  const admin = {
    from(table: string) {
      const filters: Filter[] = [];
      const query = {
        select() {
          return query;
        },
        eq(column: string, value: unknown) {
          filters.push({ op: 'eq', column, value });
          return query;
        },
        is(column: string, value: unknown) {
          filters.push({ op: 'is', column, value });
          return query;
        },
        in(column: string, value: unknown) {
          filters.push({ op: 'in', column, value });
          return query;
        },
        like(column: string, value: unknown) {
          filters.push({ op: 'like', column, value });
          return query;
        },
        order() {
          return query;
        },
        limit: async () => result(table, filters),
        maybeSingle: async () => result(table, filters),
        then<TResult1 = unknown, TResult2 = never>(
          onFulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
          onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
        ) {
          return Promise.resolve(result(table, filters)).then(onFulfilled, onRejected);
        },
      };
      return query;
    },
  };

  return {
    state,
    getAdmin: vi.fn(() => admin),
    gate: vi.fn(),
    recordLifecycle: vi.fn(async () => state.lifecycleResult),
  };
});

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: mocks.gate,
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

const patchRequest = (body: unknown = { lifecycle: 'cancelled' }) =>
  new NextRequest('https://example.test/api/admin/cases/case-A/signature-actions/action-B', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const listContext = () => ({
  params: Promise.resolve({ id: 'case-A' }),
});

const patchContext = () => ({
  params: Promise.resolve({ id: 'case-A', actionId: 'action-B' }),
});

function queryFor(table: string, occurrence = 0) {
  return mocks.state.queries.filter((query) => query.table === table)[occurrence];
}

function expectNoSignatureAccess() {
  expect(
    mocks.state.queries.some((query) => query.table === 'administrative_actions'),
  ).toBe(false);
  expect(
    mocks.state.queries.some((query) => query.table === 'administrative_action_events'),
  ).toBe(false);
  expect(mocks.recordLifecycle).not.toHaveBeenCalled();
}

describe('E0 signature action HTTP boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.actor = {
      userId: 'actor-id',
      role: 'admin',
      tenantId: TENANT_ID,
    };
    mocks.state.caseRow = {
      id: 'case-A',
      client_id: CLIENT_ID,
      company_id: COMPANY_ID,
      tenant_id: TENANT_ID,
    };
    mocks.state.clientScopeOk = true;
    mocks.state.companyScopeOk = true;
    mocks.state.membershipOk = true;
    mocks.state.actionFound = true;
    mocks.state.actions = [];
    mocks.state.events = [];
    mocks.state.queries.length = 0;
    mocks.state.lifecycleResult = {
      ok: false,
      error: 'Solicitud de firma no encontrada en el expediente.',
    };
    mocks.gate.mockImplementation(async () => mocks.state.actor);
  });

  it('rejects inactive actors before creating a service-role client', async () => {
    mocks.state.actor = null;

    const listResponse = await GET(listRequest(), listContext());
    const patchResponse = await PATCH(patchRequest(), patchContext());

    expect(listResponse.status).toBe(403);
    expect(patchResponse.status).toBe(403);
    expect(mocks.gate).toHaveBeenCalledWith(expect.any(NextRequest), ['admin', 'owner']);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.recordLifecycle).not.toHaveBeenCalled();
  });

  it('hides a case outside the actor tenant before signature reads', async () => {
    if (!mocks.state.caseRow) throw new Error('missing fixture');
    mocks.state.caseRow.tenant_id = OTHER_TENANT_ID;

    const response = await GET(listRequest(), listContext());

    expect(response.status).toBe(404);
    expect(queryFor('cases').filters).toEqual([
      { op: 'eq', column: 'id', value: 'case-A' },
      { op: 'eq', column: 'tenant_id', value: TENANT_ID },
    ]);
    expectNoSignatureAccess();
  });

  it('rejects a client outside the effective tenant before signature reads', async () => {
    mocks.state.clientScopeOk = false;

    const response = await GET(listRequest(), listContext());

    expect(response.status).toBe(404);
    expect(queryFor('profiles').filters).toEqual([
      { op: 'eq', column: 'id', value: CLIENT_ID },
      { op: 'eq', column: 'tenant_id', value: TENANT_ID },
    ]);
    expectNoSignatureAccess();
  });

  it('rejects a company outside the effective tenant before mutation', async () => {
    mocks.state.companyScopeOk = false;

    const response = await PATCH(patchRequest(), patchContext());

    expect(response.status).toBe(404);
    expect(queryFor('companies').filters).toEqual([
      { op: 'eq', column: 'id', value: COMPANY_ID },
      { op: 'eq', column: 'tenant_id', value: TENANT_ID },
    ]);
    expectNoSignatureAccess();
  });

  it('rejects a missing client-company membership before mutation', async () => {
    mocks.state.membershipOk = false;

    const response = await PATCH(patchRequest(), patchContext());

    expect(response.status).toBe(404);
    expect(queryFor('profile_companies').filters).toEqual([
      { op: 'eq', column: 'profile_id', value: CLIENT_ID },
      { op: 'eq', column: 'company_id', value: COMPANY_ID },
    ]);
    expectNoSignatureAccess();
  });

  it('scopes list actions and events to the authorized case tenant and company', async () => {
    mocks.state.actions = [{
      id: 'action-B',
      state: 'running',
      action_snapshot: { provider: 'google_esignature' },
      row_version: 3,
      created_at: '2026-10-12T00:00:00Z',
      updated_at: '2026-10-12T01:00:00Z',
    }];
    mocks.state.events = [{
      action_id: 'action-B',
      event_type: 'signature.requested',
      payload: {},
      created_at: '2026-10-12T00:30:00Z',
    }];

    const response = await GET(listRequest(), listContext());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(queryFor('administrative_actions').filters).toEqual([
      { op: 'eq', column: 'case_id', value: 'case-A' },
      { op: 'eq', column: 'capability', value: 'documents.signature' },
      { op: 'eq', column: 'action_type', value: 'google_esignature' },
      { op: 'eq', column: 'tenant_id', value: TENANT_ID },
      { op: 'eq', column: 'company_id', value: COMPANY_ID },
    ]);
    expect(queryFor('administrative_action_events').filters).toEqual([
      { op: 'in', column: 'action_id', value: ['action-B'] },
      { op: 'like', column: 'event_type', value: 'signature.%' },
      { op: 'eq', column: 'tenant_id', value: TENANT_ID },
    ]);
    expect(body.actions[0]).toMatchObject({
      id: 'action-B',
      state: 'running',
      rowVersion: 3,
      latestEvent: { event_type: 'signature.requested' },
    });
  });

  it('validates the scoped action before parsing an invalid payload', async () => {
    mocks.state.actionFound = false;

    const response = await PATCH(patchRequest({ lifecycle: 'invalid' }), patchContext());

    expect(response.status).toBe(404);
    expect(queryFor('administrative_actions').filters).toEqual([
      { op: 'eq', column: 'id', value: 'action-B' },
      { op: 'eq', column: 'case_id', value: 'case-A' },
      { op: 'eq', column: 'capability', value: 'documents.signature' },
      { op: 'eq', column: 'action_type', value: 'google_esignature' },
      { op: 'eq', column: 'tenant_id', value: TENANT_ID },
      { op: 'eq', column: 'company_id', value: COMPANY_ID },
    ]);
    expect(mocks.recordLifecycle).not.toHaveBeenCalled();
  });

  it('rejects an invalid payload only after case and action authorization', async () => {
    const response = await PATCH(patchRequest({ lifecycle: 'invalid' }), patchContext());

    expect(response.status).toBe(400);
    expect(queryFor('administrative_actions')).toBeDefined();
    expect(mocks.recordLifecycle).not.toHaveBeenCalled();
  });

  it('passes only authorized identifiers to the lifecycle helper', async () => {
    const response = await PATCH(patchRequest(), patchContext());

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

  it('uses the case tenant to scope a global owner', async () => {
    mocks.state.actor = {
      userId: 'owner-id',
      role: 'owner',
      tenantId: null,
    };

    const response = await GET(listRequest(), listContext());

    expect(response.status).toBe(200);
    expect(queryFor('cases').filters).toEqual([
      { op: 'eq', column: 'id', value: 'case-A' },
    ]);
    expect(queryFor('profiles').filters).toContainEqual(
      { op: 'eq', column: 'tenant_id', value: TENANT_ID },
    );
    expect(queryFor('administrative_actions').filters).toContainEqual(
      { op: 'eq', column: 'tenant_id', value: TENANT_ID },
    );
  });

  it('keeps null scope explicit for a legacy tenant-null case', async () => {
    if (!mocks.state.caseRow) throw new Error('missing fixture');
    mocks.state.actor = {
      userId: 'owner-id',
      role: 'owner',
      tenantId: null,
    };
    mocks.state.caseRow.tenant_id = null;
    mocks.state.actions = [{
      id: 'action-B',
      state: 'running',
      action_snapshot: {},
      row_version: 1,
      created_at: '2026-10-12T00:00:00Z',
      updated_at: '2026-10-12T00:00:00Z',
    }];

    const response = await GET(listRequest(), listContext());

    expect(response.status).toBe(200);
    expect(queryFor('profiles').filters).toEqual([
      { op: 'eq', column: 'id', value: CLIENT_ID },
    ]);
    expect(queryFor('companies').filters).toEqual([
      { op: 'eq', column: 'id', value: COMPANY_ID },
    ]);
    expect(queryFor('administrative_actions').filters).toContainEqual(
      { op: 'is', column: 'tenant_id', value: null },
    );
    expect(queryFor('administrative_action_events').filters).toContainEqual(
      { op: 'is', column: 'tenant_id', value: null },
    );
  });

  it('requires null company scope when the case has no company', async () => {
    if (!mocks.state.caseRow) throw new Error('missing fixture');
    mocks.state.caseRow.company_id = null;

    const response = await PATCH(patchRequest(), patchContext());

    expect(response.status).toBe(409);
    expect(
      mocks.state.queries.some((query) => query.table === 'companies'),
    ).toBe(false);
    expect(
      mocks.state.queries.some((query) => query.table === 'profile_companies'),
    ).toBe(false);
    expect(queryFor('administrative_actions').filters).toContainEqual(
      { op: 'is', column: 'company_id', value: null },
    );
  });
});
