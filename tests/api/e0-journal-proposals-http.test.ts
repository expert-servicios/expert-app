import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const TENANT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_TENANT_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const COMPANY_ID = '22222222-2222-4222-8222-222222222222';
const CLIENT_ID = '11111111-1111-4111-8111-111111111111';
const PROPOSAL_ID = '33333333-3333-4333-8333-333333333333';

type Filter = {
  op: 'eq' | 'in';
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
    company: {
      id: '22222222-2222-4222-8222-222222222222',
      tenant_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    } as { id: string; tenant_id: string | null } | null,
    membershipOk: true,
    memberScopeOk: true,
    proposalFound: true,
    proposalError: false,
    proposals: [] as Array<Record<string, unknown>>,
    updatedProposal: {
      id: '33333333-3333-4333-8333-333333333333',
      status: 'approved',
    } as Record<string, unknown> | null,
    queries: [] as Array<{
      table: string;
      operation: 'select' | 'update';
      filters: Filter[];
    }>,
    updatePayload: null as Record<string, unknown> | null,
    saveResult: {
      ok: true as const,
      proposal: { id: 'saved-proposal' },
      alreadyExists: false,
    },
  };

  function result(
    table: string,
    operation: 'select' | 'update',
    filters: Filter[],
  ) {
    state.queries.push({
      table,
      operation,
      filters: filters.map((filter) => ({ ...filter })),
    });

    if (table === 'companies') {
      const tenantFilter = filters.find((filter) => filter.column === 'tenant_id');
      const matchesTenant =
        !tenantFilter || tenantFilter.value === state.company?.tenant_id;
      return { data: matchesTenant ? state.company : null, error: null };
    }

    if (table === 'profile_companies') {
      return {
        data: state.membershipOk ? [{ profile_id: CLIENT_ID }] : [],
        error: null,
      };
    }

    if (table === 'profiles') {
      const tenantFilter = filters.find((filter) => filter.column === 'tenant_id');
      const matchesTenant = !tenantFilter || tenantFilter.value === TENANT_ID;
      return {
        data: state.memberScopeOk && matchesTenant ? [{ id: CLIENT_ID }] : [],
        error: null,
      };
    }

    if (table === 'kia_journal_proposals') {
      if (operation === 'update') {
        return { data: state.updatedProposal, error: null };
      }

      const isObjectLookup = filters.some((filter) => filter.column === 'id');
      if (isObjectLookup) {
        return {
          data: state.proposalFound
            ? {
                id: PROPOSAL_ID,
                company_id: COMPANY_ID,
                status: 'pending_review',
              }
            : null,
          error: state.proposalError
            ? { message: 'temporary database failure' }
            : null,
        };
      }

      return { data: state.proposals, error: null };
    }

    return { data: null, error: null };
  }

  const admin = {
    from(table: string) {
      const filters: Filter[] = [];
      let operation: 'select' | 'update' = 'select';
      const query = {
        select() {
          return query;
        },
        update(payload: Record<string, unknown>) {
          operation = 'update';
          state.updatePayload = payload;
          return query;
        },
        eq(column: string, value: unknown) {
          filters.push({ op: 'eq', column, value });
          return query;
        },
        in(column: string, value: unknown) {
          filters.push({ op: 'in', column, value });
          return query;
        },
        order() {
          return query;
        },
        limit() {
          return query;
        },
        maybeSingle: async () => result(table, operation, filters),
        then<TResult1 = unknown, TResult2 = never>(
          onFulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
          onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
        ) {
          return Promise.resolve(result(table, operation, filters)).then(
            onFulfilled,
            onRejected,
          );
        },
      };
      return query;
    },
  };

  return {
    state,
    getAdmin: vi.fn(() => admin),
    gate: vi.fn(),
    saveProposal: vi.fn(async () => state.saveResult),
  };
});

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: mocks.gate,
}));

vi.mock('@/lib/integrations/supabase', () => ({
  getSupabaseAdmin: mocks.getAdmin,
}));

vi.mock('@/lib/ai/kia/kia-journal-inbox-save', () => ({
  saveKiaJournalInboxProposal: mocks.saveProposal,
}));

import {
  GET,
  PATCH,
  POST,
} from '@/app/api/admin/empresas/[id]/propuestas-contables/route';

const context = () => ({
  params: Promise.resolve({ id: COMPANY_ID }),
});

const getRequest = () =>
  new NextRequest(
    `https://example.test/api/admin/empresas/${COMPANY_ID}/propuestas-contables`,
  );

const postRequest = (body: unknown) =>
  new NextRequest(
    `https://example.test/api/admin/empresas/${COMPANY_ID}/propuestas-contables`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

const patchRequest = (body: unknown) =>
  new NextRequest(
    `https://example.test/api/admin/empresas/${COMPANY_ID}/propuestas-contables`,
    {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

const validProposal = {
  date: '2026-10-12',
  reason: 'Regularización documentada',
  evidenceRefs: ['document:one'],
  lines: [
    { account: '600', debitCents: 1000, creditCents: 0 },
    { account: '410', debitCents: 0, creditCents: 1000 },
  ],
};

const validDecision = {
  id: PROPOSAL_ID,
  status: 'approved',
  note: 'Revisada con evidencia',
};

function queriesFor(table: string) {
  return mocks.state.queries.filter((query) => query.table === table);
}

function expectNoProposalAccess() {
  expect(queriesFor('kia_journal_proposals')).toHaveLength(0);
  expect(mocks.saveProposal).not.toHaveBeenCalled();
}

describe('E0 company journal proposal HTTP boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.actor = {
      userId: 'actor-id',
      role: 'admin',
      tenantId: TENANT_ID,
    };
    mocks.state.company = {
      id: COMPANY_ID,
      tenant_id: TENANT_ID,
    };
    mocks.state.membershipOk = true;
    mocks.state.memberScopeOk = true;
    mocks.state.proposalFound = true;
    mocks.state.proposalError = false;
    mocks.state.proposals = [];
    mocks.state.updatedProposal = {
      id: PROPOSAL_ID,
      status: 'approved',
    };
    mocks.state.queries.length = 0;
    mocks.state.updatePayload = null;
    mocks.state.saveResult = {
      ok: true,
      proposal: { id: 'saved-proposal' },
      alreadyExists: false,
    };
    mocks.gate.mockImplementation(async () => mocks.state.actor);
  });

  it('rejects a revoked actor before creating a service-role client', async () => {
    mocks.state.actor = null;

    const getResponse = await GET(getRequest(), context());
    const postResponse = await POST(postRequest(validProposal), context());
    const patchResponse = await PATCH(patchRequest(validDecision), context());

    expect(getResponse.status).toBe(403);
    expect(postResponse.status).toBe(403);
    expect(patchResponse.status).toBe(403);
    expect(mocks.gate).toHaveBeenCalledWith(expect.any(NextRequest), [
      'admin',
      'owner',
    ]);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expectNoProposalAccess();
  });

  it('rejects a company outside the actor tenant before proposal access', async () => {
    if (!mocks.state.company) throw new Error('missing company fixture');
    mocks.state.company.tenant_id = OTHER_TENANT_ID;

    const response = await GET(getRequest(), context());

    expect(response.status).toBe(403);
    expect(queriesFor('companies')[0].filters).toEqual([
      { op: 'eq', column: 'id', value: COMPANY_ID },
      { op: 'eq', column: 'tenant_id', value: TENANT_ID },
    ]);
    expectNoProposalAccess();
  });

  it('requires a client-company membership before proposal access', async () => {
    mocks.state.membershipOk = false;

    const response = await POST(postRequest(validProposal), context());

    expect(response.status).toBe(403);
    expect(queriesFor('profile_companies')[0].filters).toEqual([
      { op: 'eq', column: 'company_id', value: COMPANY_ID },
    ]);
    expectNoProposalAccess();
  });

  it('rejects a member profile outside the effective tenant', async () => {
    mocks.state.memberScopeOk = false;

    const response = await PATCH(patchRequest(validDecision), context());

    expect(response.status).toBe(403);
    expect(queriesFor('profiles')[0].filters).toEqual([
      { op: 'in', column: 'id', value: [CLIENT_ID] },
      { op: 'eq', column: 'tenant_id', value: TENANT_ID },
    ]);
    expectNoProposalAccess();
  });

  it('lists proposals only after company and membership scope', async () => {
    mocks.state.proposals = [{ id: PROPOSAL_ID, company_id: COMPANY_ID }];

    const response = await GET(getRequest(), context());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(queriesFor('kia_journal_proposals')[0].filters).toEqual([
      { op: 'eq', column: 'company_id', value: COMPANY_ID },
    ]);
    expect(body).toEqual({
      proposals: mocks.state.proposals,
      holdedMutated: false,
    });
  });

  it('passes only the authorized company to the save helper', async () => {
    const response = await POST(postRequest(validProposal), context());

    expect(response.status).toBe(201);
    expect(mocks.saveProposal).toHaveBeenCalledWith(
      expect.anything(),
      'actor-id',
      expect.objectContaining({
        companyId: COMPANY_ID,
        reason: validProposal.reason,
      }),
    );
    expect(await response.json()).toMatchObject({ holdedMutated: false });
  });

  it('rejects invalid proposal input after object authorization', async () => {
    const response = await POST(postRequest({ reason: 'missing fields' }), context());

    expect(response.status).toBe(400);
    expect(queriesFor('profiles')).toHaveLength(1);
    expect(mocks.saveProposal).not.toHaveBeenCalled();
  });

  it('binds the proposal to the authorized company before full decision validation', async () => {
    mocks.state.proposalFound = false;

    const response = await PATCH(
      patchRequest({
        id: PROPOSAL_ID,
        status: 'invalid',
        note: 'Revisión',
      }),
      context(),
    );

    expect(response.status).toBe(409);
    expect(queriesFor('kia_journal_proposals')[0].filters).toEqual([
      { op: 'eq', column: 'id', value: PROPOSAL_ID },
      { op: 'eq', column: 'company_id', value: COMPANY_ID },
      { op: 'eq', column: 'status', value: 'pending_review' },
    ]);
    expect(mocks.state.updatePayload).toBeNull();
  });

  it('returns a server error when proposal preflight fails', async () => {
    mocks.state.proposalFound = false;
    mocks.state.proposalError = true;

    const response = await PATCH(patchRequest(validDecision), context());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: 'No se pudo comprobar la propuesta',
    });
    expect(mocks.state.updatePayload).toBeNull();
  });

  it('rejects a malformed decision only after finding the scoped proposal', async () => {
    const response = await PATCH(
      patchRequest({
        id: PROPOSAL_ID,
        status: 'invalid',
        note: 'Revisión',
      }),
      context(),
    );

    expect(response.status).toBe(400);
    expect(queriesFor('kia_journal_proposals')).toHaveLength(1);
    expect(mocks.state.updatePayload).toBeNull();
  });

  it('updates only the pending proposal bound to the authorized company', async () => {
    const response = await PATCH(patchRequest(validDecision), context());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(queriesFor('kia_journal_proposals')[1]).toMatchObject({
      operation: 'update',
      filters: [
        { op: 'eq', column: 'id', value: PROPOSAL_ID },
        { op: 'eq', column: 'company_id', value: COMPANY_ID },
        { op: 'eq', column: 'status', value: 'pending_review' },
      ],
    });
    expect(mocks.state.updatePayload).toMatchObject({
      status: 'approved',
      review_note: validDecision.note,
      reviewed_by: 'actor-id',
    });
    expect(body).toMatchObject({ holdedMutated: false });
  });

  it('uses the company tenant for a global owner', async () => {
    mocks.state.actor = {
      userId: 'owner-id',
      role: 'owner',
      tenantId: null,
    };

    const response = await GET(getRequest(), context());

    expect(response.status).toBe(200);
    expect(queriesFor('companies')[0].filters).toEqual([
      { op: 'eq', column: 'id', value: COMPANY_ID },
    ]);
    expect(queriesFor('profiles')[0].filters).toContainEqual(
      { op: 'eq', column: 'tenant_id', value: TENANT_ID },
    );
  });

  it('preserves explicit legacy null-tenant company scope for a global owner', async () => {
    mocks.state.actor = {
      userId: 'owner-id',
      role: 'owner',
      tenantId: null,
    };
    if (!mocks.state.company) throw new Error('missing company fixture');
    mocks.state.company.tenant_id = null;

    const response = await GET(getRequest(), context());

    expect(response.status).toBe(200);
    expect(queriesFor('profiles')[0].filters).toEqual([
      { op: 'in', column: 'id', value: [CLIENT_ID] },
    ]);
  });
});
