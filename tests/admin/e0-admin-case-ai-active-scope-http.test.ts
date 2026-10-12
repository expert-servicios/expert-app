import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const CASE_ID = '33333333-3333-4333-8333-333333333333';
const CLIENT_ID = '11111111-1111-4111-8111-111111111111';
const COMPANY_ID = '22222222-2222-4222-8222-222222222222';
const TENANT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

type Predicate = [column: string, value: unknown];

const mocks = vi.hoisted(() => ({
  actor: {
    userId: 'staff-A',
    role: 'admin',
    tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  } as { userId: string; role: 'admin' | 'owner'; tenantId: string | null } | null,
  caseRow: {
    id: '33333333-3333-4333-8333-333333333333',
    service: 'Certificado digital',
    client_id: '11111111-1111-4111-8111-111111111111',
    company_id: '22222222-2222-4222-8222-222222222222',
    tenant_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  } as {
    id: string;
    service: string;
    client_id: string;
    company_id: string | null;
    tenant_id: string | null;
  } | null,
  clientScopeOk: true,
  companyScopeOk: true,
  membershipOk: true,
  queries: [] as Array<{ table: string; predicates: Predicate[] }>,
  gate: vi.fn(),
  getAdmin: vi.fn(),
  summarize: vi.fn(),
  missingDocs: vi.fn(),
  draft: vi.fn(),
}));

function createQuery(table: string) {
  const predicates: Predicate[] = [];
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn((column: string, value: unknown) => {
      predicates.push([column, value]);
      return query;
    }),
    maybeSingle: vi.fn(async () => {
      mocks.queries.push({ table, predicates: [...predicates] });

      if (table === 'cases') {
        const tenantPredicate = predicates.find(([column]) => column === 'tenant_id');
        const matchesTenant =
          !tenantPredicate || tenantPredicate[1] === mocks.caseRow?.tenant_id;
        return { data: matchesTenant ? mocks.caseRow : null, error: null };
      }

      if (table === 'profiles') {
        return {
          data: mocks.clientScopeOk ? { id: CLIENT_ID } : null,
          error: null,
        };
      }

      if (table === 'companies') {
        return {
          data: mocks.companyScopeOk ? { id: COMPANY_ID } : null,
          error: null,
        };
      }

      if (table === 'profile_companies') {
        return {
          data: mocks.membershipOk ? { company_id: COMPANY_ID } : null,
          error: null,
        };
      }

      return { data: null, error: null };
    }),
  };
  return query;
}

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: mocks.gate,
}));

vi.mock('@/lib/integrations/supabase', () => ({
  getSupabaseAdmin: mocks.getAdmin,
}));

vi.mock('@/lib/integrations/ai', () => ({
  summarizeCaseHistory: mocks.summarize,
  detectMissingDocuments: mocks.missingDocs,
  draftClientMessage: mocks.draft,
}));

import { POST } from '@/app/api/admin/cases/[id]/ai/route';

function request(body: unknown) {
  return new NextRequest(`http://localhost/api/admin/cases/${CASE_ID}/ai`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function context() {
  return { params: Promise.resolve({ id: CASE_ID }) };
}

function expectNoProviderCalls() {
  expect(mocks.summarize).not.toHaveBeenCalled();
  expect(mocks.missingDocs).not.toHaveBeenCalled();
  expect(mocks.draft).not.toHaveBeenCalled();
}

describe('E0 admin case AI exact-active and object scope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.actor = {
      userId: 'staff-A',
      role: 'admin',
      tenantId: TENANT_ID,
    };
    mocks.caseRow = {
      id: CASE_ID,
      service: 'Certificado digital',
      client_id: CLIENT_ID,
      company_id: COMPANY_ID,
      tenant_id: TENANT_ID,
    };
    mocks.clientScopeOk = true;
    mocks.companyScopeOk = true;
    mocks.membershipOk = true;
    mocks.queries.length = 0;

    mocks.gate.mockImplementation(async () => mocks.actor);
    mocks.getAdmin.mockReturnValue({
      from: vi.fn((table: string) => createQuery(table)),
    });
    mocks.summarize.mockResolvedValue({
      summary: 'Resumen',
      keyDates: [],
      pendingActions: [],
    });
    mocks.missingDocs.mockResolvedValue({
      missing: ['Pasaporte'],
      present: [],
    });
    mocks.draft.mockResolvedValue({
      subject: 'Actualización',
      body: 'Mensaje',
    });
  });

  it('rejects a revoked actor before creating a privileged client or calling AI', async () => {
    mocks.actor = null;

    const response = await POST(request({ action: 'summary' }), context());

    expect(response.status).toBe(403);
    expect(mocks.gate).toHaveBeenCalledWith(expect.any(NextRequest), ['admin', 'owner']);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expectNoProviderCalls();
  });

  it('hides a case outside the actor tenant before calling AI', async () => {
    if (!mocks.caseRow || !mocks.actor) throw new Error('missing fixture');
    mocks.caseRow.tenant_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

    const response = await POST(request({ action: 'summary' }), context());

    expect(response.status).toBe(404);
    expect(mocks.queries[0]).toEqual({
      table: 'cases',
      predicates: [
        ['id', CASE_ID],
        ['tenant_id', TENANT_ID],
      ],
    });
    expectNoProviderCalls();
  });

  it('rejects a client whose tenant does not match the scoped case', async () => {
    mocks.clientScopeOk = false;

    const response = await POST(request({ action: 'summary' }), context());

    expect(response.status).toBe(404);
    expect(mocks.queries).toContainEqual({
      table: 'profiles',
      predicates: [
        ['id', CLIENT_ID],
        ['tenant_id', TENANT_ID],
      ],
    });
    expectNoProviderCalls();
  });

  it('rejects a company whose tenant does not match the scoped case', async () => {
    mocks.companyScopeOk = false;

    const response = await POST(request({ action: 'summary' }), context());

    expect(response.status).toBe(404);
    expect(mocks.queries).toContainEqual({
      table: 'companies',
      predicates: [
        ['id', COMPANY_ID],
        ['tenant_id', TENANT_ID],
      ],
    });
    expectNoProviderCalls();
  });

  it('rejects a case whose client-company membership is missing', async () => {
    mocks.membershipOk = false;

    const response = await POST(request({ action: 'summary' }), context());

    expect(response.status).toBe(404);
    expect(mocks.queries).toContainEqual({
      table: 'profile_companies',
      predicates: [
        ['profile_id', CLIENT_ID],
        ['company_id', COMPANY_ID],
      ],
    });
    expectNoProviderCalls();
  });

  it('validates the object scope before rejecting an invalid action', async () => {
    const response = await POST(request({ action: 'unknown' }), context());

    expect(response.status).toBe(400);
    expect(mocks.queries.map(({ table }) => table)).toEqual([
      'cases',
      'profiles',
      'companies',
      'profile_companies',
    ]);
    expectNoProviderCalls();
  });

  it('calls summary only after the exact scoped case is resolved', async () => {
    const response = await POST(request({ action: 'summary' }), context());

    expect(response.status).toBe(200);
    expect(mocks.summarize).toHaveBeenCalledWith(CASE_ID);
    expect(mocks.missingDocs).not.toHaveBeenCalled();
    expect(mocks.draft).not.toHaveBeenCalled();
  });

  it('passes only the scoped case id and service to missing-docs', async () => {
    const response = await POST(request({ action: 'missing-docs' }), context());

    expect(response.status).toBe(200);
    expect(mocks.missingDocs).toHaveBeenCalledWith(CASE_ID, 'Certificado digital');
    expect(mocks.summarize).not.toHaveBeenCalled();
    expect(mocks.draft).not.toHaveBeenCalled();
  });

  it('does not call the draft provider when goal is absent', async () => {
    const response = await POST(request({ action: 'draft' }), context());

    expect(response.status).toBe(400);
    expectNoProviderCalls();
  });

  it('passes the scoped case id and validated goal to draft', async () => {
    const response = await POST(
      request({ action: 'draft', goal: 'Solicitar la documentación pendiente' }),
      context(),
    );

    expect(response.status).toBe(200);
    expect(mocks.draft).toHaveBeenCalledWith(
      CASE_ID,
      'Solicitar la documentación pendiente',
    );
    expect(mocks.summarize).not.toHaveBeenCalled();
    expect(mocks.missingDocs).not.toHaveBeenCalled();
  });

  it('uses the case tenant to validate scope for a global owner', async () => {
    mocks.actor = {
      userId: 'owner-A',
      role: 'owner',
      tenantId: null,
    };

    const response = await POST(request({ action: 'summary' }), context());

    expect(response.status).toBe(200);
    expect(mocks.queries[0]).toEqual({
      table: 'cases',
      predicates: [['id', CASE_ID]],
    });
    expect(mocks.queries).toContainEqual({
      table: 'profiles',
      predicates: [
        ['id', CLIENT_ID],
        ['tenant_id', TENANT_ID],
      ],
    });
    expect(mocks.queries).toContainEqual({
      table: 'companies',
      predicates: [
        ['id', COMPANY_ID],
        ['tenant_id', TENANT_ID],
      ],
    });
    expect(mocks.summarize).toHaveBeenCalledWith(CASE_ID);
  });

  it('supports a legacy tenant-null case without skipping company membership', async () => {
    if (!mocks.caseRow) throw new Error('missing fixture');
    mocks.actor = {
      userId: 'owner-A',
      role: 'owner',
      tenantId: null,
    };
    mocks.caseRow.tenant_id = null;

    const response = await POST(request({ action: 'summary' }), context());

    expect(response.status).toBe(200);
    expect(mocks.queries.map(({ table }) => table)).toEqual([
      'cases',
      'profile_companies',
    ]);
    expect(mocks.summarize).toHaveBeenCalledWith(CASE_ID);
  });
});
