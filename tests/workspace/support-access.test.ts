import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { describeClientDevice, supportAuditAction, supportEventSchema } from '@/lib/workspace/support-audit';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  stored: [] as Array<Record<string, unknown>>,
  actorRole: 'admin',
  actorStatus: 'active',
  subjectExists: true,
  membershipExists: true,
  auditError: false,
}));

vi.mock('@/lib/integrations/supabase', () => ({
  createServerSupabaseClient: () => ({ auth: { getUser: mocks.getUser } }),
  getSupabaseAdmin: () => ({ from: mocks.from }),
}));

import { GET, POST } from '@/app/api/admin/clientes/[id]/support-access/route';

const SUBJECT = '11111111-1111-4111-8111-111111111111';
const ACTOR = '22222222-2222-4222-8222-222222222222';
const COMPANY = '33333333-3333-4333-8333-333333333333';
const params = { params: Promise.resolve({ id: SUBJECT }) };

function createRequest(
  body: unknown = { event: 'entered', companyId: COMPANY },
  origin = 'https://expertconsulting.es',
) {
  return new NextRequest(`https://expertconsulting.es/api/admin/clientes/${SUBJECT}/support-access`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin, 'user-agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124.0' },
    body: JSON.stringify(body),
  });
}

function query(table: string) {
  let id = '';
  const chain = {
    select: (_fields?: string) => chain,
    eq: (field: string, value: string) => { if (field === 'id') id = value; return chain; },
    in: () => chain,
    order: () => chain,
    limit: async () => ({ data: [], error: null }),
    maybeSingle: async () => {
      if (table === 'profiles') {
        if (id === ACTOR) return { data: { id: ACTOR, role: mocks.actorRole, status: mocks.actorStatus }, error: null };
        return { data: mocks.subjectExists ? { id: SUBJECT } : null, error: null };
      }
      return { data: mocks.membershipExists ? { company_id: COMPANY } : null, error: null };
    },
    insert: (event: Record<string, unknown>) => { mocks.stored.push(event); return chain; },
    single: async () => ({
      data: mocks.auditError ? null : { id: '44444444-4444-4444-8444-444444444444', created_at: '2026-10-09T18:00:00Z' },
      error: mocks.auditError ? { message: 'audit_unavailable' } : null,
    }),
  };
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.stored.length = 0;
  mocks.actorRole = 'admin';
  mocks.actorStatus = 'active';
  mocks.subjectExists = true;
  mocks.membershipExists = true;
  mocks.auditError = false;
  mocks.getUser.mockResolvedValue({ data: { user: { id: ACTOR } }, error: null });
  mocks.from.mockImplementation(query);
});

describe('Support access event validation', () => {
  it('accepts only known event types and UUID company selection', () => {
    expect(supportEventSchema.safeParse({ event: 'entered', companyId: null }).success).toBe(true);
    expect(supportEventSchema.safeParse({ event: 'company_switched', companyId: COMPANY }).success).toBe(true);
    expect(supportEventSchema.safeParse({ event: 'read_sensitive_record', companyId: null }).success).toBe(false);
    expect(supportEventSchema.safeParse({ event: 'entered', companyId: 'other-client' }).success).toBe(false);
    expect(supportAuditAction('exited')).toBe('workspace.support.exited');
  });

  it('treats user-agent as an unverified hint, bounded in length', () => {
    const result = describeClientDevice('Mozilla/5.0 (Linux; Android 14) Chrome/124.0');
    expect(result.platform).toBe('Android');
    expect(result.browser).toBe('Chrome');
    expect(describeClientDevice('x'.repeat(1000)).userAgent.length).toBe(300);
  });
});

describe('Admin delegated support API', () => {
  it('rejects clients without writing any audit record', async () => {
    mocks.actorRole = 'client';
    const response = await POST(createRequest(), params);
    expect(response.status).toBe(403);
    expect(mocks.stored).toHaveLength(0);
  });

  it('rejects inactive administrators', async () => {
    mocks.actorStatus = 'inactive';
    expect((await POST(createRequest(), params)).status).toBe(403);
    expect(mocks.stored).toHaveLength(0);
  });

  it('rejects missing profile and unrelated companies', async () => {
    mocks.subjectExists = false;
    expect((await POST(createRequest(), params)).status).toBe(403);
    mocks.subjectExists = true;
    mocks.membershipExists = false;
    expect((await POST(createRequest(), params)).status).toBe(403);
    expect(mocks.stored).toHaveLength(0);
  });

  it('rejects cross-origin and malformed events', async () => {
    expect((await POST(createRequest(undefined, 'https://malicious.example'), params)).status).toBe(403);
    expect((await POST(createRequest({ event: 'invalid', companyId: null }), params)).status).toBe(400);
    expect(mocks.stored).toHaveLength(0);
  });

  it('records a server-authenticated actor and validated company, never client-supplied actor', async () => {
    const response = await POST(createRequest({ event: 'entered', companyId: COMPANY, actorId: ACTOR }), params);
    expect(response.status).toBe(400);
    const actual = await POST(createRequest(), params);
    expect(actual.status).toBe(200);
    expect(mocks.stored).toHaveLength(1);
    expect(mocks.stored[0]).toMatchObject({
      actor_id: ACTOR,
      action: 'workspace.support.entered',
      entity: 'profiles',
      entity_id: SUBJECT,
      metadata: { company_id: COMPANY, platform: 'Android', browser: 'Chrome', device_source: 'unverified_user_agent' },
    });
  });

  it('fails closed when the audit write fails', async () => {
    mocks.auditError = true;
    const response = await POST(createRequest(), params);
    expect(response.status).toBe(500);
  });

  it('does not expose audit history to clients', async () => {
    mocks.actorRole = 'client';
    const response = await GET(new NextRequest(`https://expertconsulting.es/api/admin/clientes/${SUBJECT}/support-access`), params);
    expect(response.status).toBe(403);
  });

  it('supports auditing personal context without a company', async () => {
    const response = await POST(createRequest({ event: 'exited', companyId: null }), params);
    expect(response.status).toBe(200);
    expect((mocks.stored[0].metadata as Record<string, unknown>).company_id).toBeNull();
  });
});
