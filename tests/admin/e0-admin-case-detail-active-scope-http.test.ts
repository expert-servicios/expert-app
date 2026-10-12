import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const CASE_ID = '33333333-3333-4333-8333-333333333333';
const CLIENT_ID = '11111111-1111-4111-8111-111111111111';
const COMPANY_ID = '22222222-2222-4222-8222-222222222222';

const mocks = vi.hoisted(() => ({
  actor: {
    userId: 'staff-A',
    role: 'admin',
    tenantId: null,
  } as { userId: string; role: 'admin' | 'owner'; tenantId: string | null } | null,
  gate: vi.fn(),
  getAdmin: vi.fn(),
  eqs: [] as Array<{ table: string; column: string; value: unknown }>,
  tables: [] as string[],
  updates: [] as Array<{ table: string; value: unknown }>,
  caseRow: {
    id: '33333333-3333-4333-8333-333333333333',
    category: 'Impuestos',
    service: 'Fiscal',
    service_id: 'service-fiscal',
    state: 'nuevo',
    status: 'nuevo',
    priority: 'normal',
    next_action: null,
    due_date: null,
    order_id: null,
    opened_at: '2026-10-12T00:00:00.000Z',
    closed_at: null,
    client_id: '11111111-1111-4111-8111-111111111111',
    company_id: '22222222-2222-4222-8222-222222222222',
    tenant_id: 'tenant-A',
    admin_note: null,
    docs_checklist: [],
    checklist_json: [],
    assigned_to: null,
    google_calendar_event_id: null,
  } as Record<string, unknown> | null,
  membership: { company_id: '22222222-2222-4222-8222-222222222222' } as Record<string, unknown> | null,
  clientScope: { id: '11111111-1111-4111-8111-111111111111' } as Record<string, unknown> | null,
  companyScope: { id: '22222222-2222-4222-8222-222222222222' } as Record<string, unknown> | null,
  statusUpdateMatched: true,
  docs: [{
    id: 'doc-A',
    original_name: 'modelo.pdf',
    state: 'verified',
    created_at: '2026-10-12T00:00:00.000Z',
    file_path: 'client/case/modelo.pdf',
    uploaded_by_role: 'client',
  }] as Record<string, unknown>[],
  notes: [] as Record<string, unknown>[],
  profile: { full_name: 'Cliente A', phone: '+34000000000' } as Record<string, unknown>,
  updatedCase: {
    service: 'Fiscal',
    category: 'Impuestos',
    client_id: '11111111-1111-4111-8111-111111111111',
    google_calendar_event_id: null,
  } as Record<string, unknown>,
  signedUrl: vi.fn(),
  authLookup: vi.fn(),
  sendEmail: vi.fn(),
  push: vi.fn(),
  calendar: vi.fn(),
  profitability: vi.fn(),
  snapshot: vi.fn(),
  tenantLookup: vi.fn(),
  tenantNotify: vi.fn(),
  adminNotify: vi.fn(),
  admin: null as unknown as {
    from: ReturnType<typeof vi.fn>;
    auth: { admin: { getUserById: ReturnType<typeof vi.fn> } };
    storage: { from: ReturnType<typeof vi.fn> };
  },
}));

function makeQuery(table: string) {
  let selected = '';
  let updating = false;

  const result = () => {
    if (table === 'cases') {
      if (!updating) return { data: mocks.caseRow, error: null };
      if (selected === 'id') {
        return {
          data: mocks.statusUpdateMatched ? { id: '33333333-3333-4333-8333-333333333333' } : null,
          error: null,
        };
      }
      return { data: selected ? mocks.updatedCase : null, error: null };
    }
    if (table === 'profile_companies') return { data: mocks.membership, error: null };
    if (table === 'companies') return { data: mocks.companyScope, error: null };
    if (table === 'documents') return { data: mocks.docs, error: null };
    if (table === 'case_document_notes') return { data: mocks.notes, error: null };
    if (table === 'profiles') {
      return { data: selected === 'id' ? mocks.clientScope : mocks.profile, error: null };
    }
    if (table === 'automation_settings') return { data: [], error: null };
    return { data: null, error: null };
  };

  const query = {
    select: vi.fn((columns: string) => {
      selected = columns;
      return query;
    }),
    eq: vi.fn((column: string, value: unknown) => {
      mocks.eqs.push({ table, column, value });
      return query;
    }),
    is: vi.fn((column: string, value: unknown) => {
      mocks.eqs.push({ table, column, value });
      return query;
    }),
    order: vi.fn(() => query),
    in: vi.fn(() => query),
    update: vi.fn((value: unknown) => {
      updating = true;
      mocks.updates.push({ table, value });
      return query;
    }),
    insert: vi.fn(() => query),
    single: vi.fn(async () => result()),
    maybeSingle: vi.fn(async () => result()),
    then: (
      resolve: (value: ReturnType<typeof result>) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result()).then(resolve, reject),
  };

  return query;
}

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: async (_request: unknown, roles: readonly string[]) => {
    mocks.gate(roles);
    return mocks.actor;
  },
}));

vi.mock('@/lib/integrations/supabase', () => ({
  getSupabaseAdmin: () => {
    mocks.getAdmin();
    return mocks.admin;
  },
}));

vi.mock('@/lib/cases/case-status', () => ({
  canTransition: () => true,
  caseStatusToVisualState: (status: string) => status,
  resolveEffectiveCaseStatus: (status: string | null, state: string | null) => status ?? state ?? 'nuevo',
}));

vi.mock('@/lib/profitability/register-event', () => ({
  registerProfitabilityEvent: (value: unknown) => mocks.profitability(value),
}));

vi.mock('@/lib/profitability/generate-snapshot', () => ({
  generateCaseSnapshot: (value: unknown) => mocks.snapshot(value),
}));

vi.mock('@/lib/email/send', () => ({
  sendEmail: (value: unknown) => mocks.sendEmail(value),
}));

vi.mock('@/lib/integrations/push', () => ({
  notifyClient: (...args: unknown[]) => mocks.push(...args),
}));

vi.mock('@/lib/integrations/google-calendar', () => ({
  hasCalendarSA: () => false,
  upsertCalendarEventSA: (...args: unknown[]) => mocks.calendar(...args),
}));

vi.mock('@/lib/email/templates', () => ({
  caseDocsRequired: () => ({ subject: 'Pendiente', html: '<p>Pendiente</p>' }),
  caseDocsReceived: () => ({ subject: 'Recibido', html: '<p>Recibido</p>' }),
  caseInProgress: () => ({ subject: 'En curso', html: '<p>En curso</p>' }),
  casePendingExternal: () => ({ subject: 'Presentado', html: '<p>Presentado</p>' }),
  caseDelivered: () => ({ subject: 'Finalizado', html: '<p>Finalizado</p>' }),
  caseBlocked: () => ({ subject: 'Bloqueado', html: '<p>Bloqueado</p>' }),
  reviewRequest: () => ({ subject: 'Reseña', html: '<p>Reseña</p>' }),
}));

vi.mock('@/lib/auth/tenant', () => ({
  getTenantForUser: (value: unknown) => mocks.tenantLookup(value),
}));

vi.mock('@/lib/email/notify-tenant-admins', () => ({
  notifyTenantAdminStatusChanged: (value: unknown) => mocks.tenantNotify(value),
}));

vi.mock('@/lib/admin/case-admin-notifications', () => ({
  notifyAdminCaseActivity: (value: unknown) => mocks.adminNotify(value),
}));

import { GET, PATCH } from '@/app/api/admin/cases/[id]/route';

const getRequest = () => new NextRequest(`https://example.test/api/admin/cases/${CASE_ID}`);
const patchRequest = (body: unknown) => new NextRequest(
  `https://example.test/api/admin/cases/${CASE_ID}`,
  {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  },
);
const context = { params: Promise.resolve({ id: CASE_ID }) };

describe('E0 admin case detail: exact-active and object scope before reads or effects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.eqs.length = 0;
    mocks.tables.length = 0;
    mocks.updates.length = 0;
    mocks.actor = { userId: 'staff-A', role: 'admin', tenantId: null };
    mocks.caseRow = {
      id: CASE_ID,
      category: 'Impuestos',
      service: 'Fiscal',
      service_id: 'service-fiscal',
      state: 'nuevo',
      status: 'nuevo',
      priority: 'normal',
      next_action: null,
      due_date: null,
      order_id: null,
      opened_at: '2026-10-12T00:00:00.000Z',
      closed_at: null,
      client_id: CLIENT_ID,
      company_id: COMPANY_ID,
      tenant_id: 'tenant-A',
      admin_note: null,
      docs_checklist: [],
      checklist_json: [],
      assigned_to: null,
      google_calendar_event_id: null,
    };
    mocks.membership = { company_id: COMPANY_ID };
    mocks.clientScope = { id: CLIENT_ID };
    mocks.companyScope = { id: COMPANY_ID };
    mocks.statusUpdateMatched = true;
    mocks.authLookup.mockResolvedValue({
      data: { user: { id: CLIENT_ID, email: 'client@example.test' } },
      error: null,
    });
    mocks.signedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.example.test/modelo.pdf' },
      error: null,
    });
    mocks.sendEmail.mockResolvedValue({ success: true });
    mocks.push.mockResolvedValue(undefined);
    mocks.profitability.mockResolvedValue(undefined);
    mocks.snapshot.mockResolvedValue(undefined);
    mocks.tenantLookup.mockResolvedValue(null);
    mocks.adminNotify.mockResolvedValue(undefined);
    mocks.admin = {
      from: vi.fn((table: string) => {
        mocks.tables.push(table);
        return makeQuery(table);
      }),
      auth: { admin: { getUserById: mocks.authLookup } },
      storage: {
        from: vi.fn(() => ({ createSignedUrl: mocks.signedUrl })),
      },
    };
  });

  it('denies a revoked actor before service-role access, body parsing, or effects', async () => {
    mocks.actor = null;

    const response = await PATCH(new NextRequest(
      `https://example.test/api/admin/cases/${CASE_ID}`,
      { method: 'PATCH', body: '{invalid-json' },
    ), context);

    expect(response.status).toBe(403);
    expect(mocks.gate).toHaveBeenCalledWith(['admin', 'owner']);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.tables).toEqual([]);
    expect(mocks.updates).toEqual([]);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.calendar).not.toHaveBeenCalled();
  });

  it('filters the case by the active actor tenant before any dependent read', async () => {
    mocks.actor = { userId: 'staff-A', role: 'admin', tenantId: 'tenant-B' };
    mocks.caseRow = null;

    const response = await GET(getRequest(), context);

    expect(response.status).toBe(404);
    expect(mocks.eqs).toContainEqual({ table: 'cases', column: 'tenant_id', value: 'tenant-B' });
    expect(mocks.tables).toEqual(['cases']);
    expect(mocks.signedUrl).not.toHaveBeenCalled();
    expect(mocks.authLookup).not.toHaveBeenCalled();
  });

  it('denies a case whose client is outside the case tenant', async () => {
    mocks.clientScope = null;

    const response = await GET(getRequest(), context);

    expect(response.status).toBe(404);
    expect(mocks.eqs).toContainEqual({ table: 'profiles', column: 'tenant_id', value: 'tenant-A' });
    expect(mocks.tables).toEqual(['cases', 'profiles', 'companies']);
    expect(mocks.signedUrl).not.toHaveBeenCalled();
  });

  it('denies a case whose company is outside the case tenant', async () => {
    mocks.companyScope = null;

    const response = await GET(getRequest(), context);

    expect(response.status).toBe(404);
    expect(mocks.eqs).toContainEqual({ table: 'companies', column: 'tenant_id', value: 'tenant-A' });
    expect(mocks.tables).toEqual(['cases', 'profiles', 'companies']);
    expect(mocks.signedUrl).not.toHaveBeenCalled();
  });

  it('denies a case whose company is outside the case client membership', async () => {
    mocks.membership = null;

    const response = await GET(getRequest(), context);

    expect(response.status).toBe(404);
    expect(mocks.tables).toEqual(['cases', 'profiles', 'companies', 'profile_companies']);
    expect(mocks.eqs).toContainEqual({ table: 'profile_companies', column: 'profile_id', value: CLIENT_ID });
    expect(mocks.eqs).toContainEqual({ table: 'profile_companies', column: 'company_id', value: COMPANY_ID });
    expect(mocks.signedUrl).not.toHaveBeenCalled();
    expect(mocks.authLookup).not.toHaveBeenCalled();
  });

  it.each(['admin', 'owner'] as const)(
    'preserves the detail contract for an exact-active scoped %s',
    async (role) => {
      mocks.actor = { userId: 'staff-A', role, tenantId: 'tenant-A' };

      const response = await GET(getRequest(), context);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(mocks.gate).toHaveBeenCalledWith(['admin', 'owner']);
      expect(mocks.eqs).toContainEqual({ table: 'cases', column: 'tenant_id', value: 'tenant-A' });
      expect(payload.case).toMatchObject({
        id: CASE_ID,
        client: {
          email: 'client@example.test',
          full_name: 'Cliente A',
          phone: '+34000000000',
        },
      });
      expect(payload.documents).toEqual([
        expect.objectContaining({
          id: 'doc-A',
          downloadUrl: 'https://signed.example.test/modelo.pdf',
        }),
      ]);
      expect(mocks.eqs).toEqual(expect.arrayContaining([
        { table: 'documents', column: 'case_id', value: CASE_ID },
        { table: 'documents', column: 'client_id', value: CLIENT_ID },
        { table: 'documents', column: 'company_id', value: COMPANY_ID },
      ]));
      expect(mocks.signedUrl).toHaveBeenCalledWith('client/case/modelo.pdf', 3600);
    },
  );

  it('blocks PATCH for a client/company mismatch before mutation or integrations', async () => {
    mocks.membership = null;

    const response = await PATCH(patchRequest({ priority: 'alta' }), context);

    expect(response.status).toBe(404);
    expect(mocks.updates).toEqual([]);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.calendar).not.toHaveBeenCalled();
    expect(mocks.profitability).not.toHaveBeenCalled();
    expect(mocks.adminNotify).not.toHaveBeenCalled();
  });

  it('scopes a non-status update to case, client, company, and tenant', async () => {
    mocks.actor = { userId: 'staff-A', role: 'owner', tenantId: 'tenant-A' };

    const response = await PATCH(patchRequest({ priority: 'alta' }), context);

    expect(response.status).toBe(200);
    expect(mocks.updates).toHaveLength(1);
    expect(mocks.eqs).toEqual(expect.arrayContaining([
      { table: 'cases', column: 'id', value: CASE_ID },
      { table: 'cases', column: 'client_id', value: CLIENT_ID },
      { table: 'cases', column: 'company_id', value: COMPANY_ID },
      { table: 'cases', column: 'tenant_id', value: 'tenant-A' },
    ]));
    expect(mocks.adminNotify).toHaveBeenCalledWith(expect.objectContaining({
      kind: 'case_updated',
      caseId: CASE_ID,
    }));
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.calendar).not.toHaveBeenCalled();
  });

  it('does not emit effects when the scoped status update matches no row', async () => {
    mocks.statusUpdateMatched = false;

    const response = await PATCH(patchRequest({ status: 'en_revision' }), context);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: 'El expediente cambió durante la actualización',
    });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.profitability).not.toHaveBeenCalled();
    expect(mocks.snapshot).not.toHaveBeenCalled();
    expect(mocks.adminNotify).not.toHaveBeenCalled();
  });

  it('attributes a valid status transition to the exact active actor', async () => {
    const response = await PATCH(patchRequest({ status: 'en_revision' }), context);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, status: 'en_revision' });
    expect(mocks.updates[0]).toMatchObject({
      table: 'cases',
      value: expect.objectContaining({ status: 'en_revision' }),
    });
    expect(mocks.profitability).toHaveBeenCalledWith(expect.objectContaining({
      caseId: CASE_ID,
      clientId: CLIENT_ID,
      metadata: expect.objectContaining({ changed_by: 'staff-A' }),
    }));
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'client@example.test',
      eventType: 'case.en_revision',
    }));
    expect(mocks.push).toHaveBeenCalledWith(
      CLIENT_ID,
      expect.objectContaining({ tag: `case-status-${CASE_ID}` }),
    );
  });
});
