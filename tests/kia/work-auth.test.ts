import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const fixture = vi.hoisted(() => ({ rows: {} as Record<string, unknown> }));
vi.mock('@/lib/integrations/supabase', () => ({
  getSupabaseAdmin: () => ({ from: (table: string) => ({ select() { return this; }, eq() { return this; },
    maybeSingle: async () => ({ data: fixture.rows[table], error: null }) }) }),
  createServerSupabaseClient: () => ({ auth: { getUser: async () => ({ data: { user: null }, error: null }) } }),
}));
import { requireWorkConnection, requireWorkProfessional } from '@/lib/ai/kia/work-auth';
const request = () => new NextRequest('https://example.test/api/kia/work', { headers: { authorization: `Bearer kw_${'a'.repeat(43)}` } });
beforeEach(() => {
  vi.stubEnv('KIA_WORK_CONNECTOR_ENABLED', 'true');
  fixture.rows = { profiles: { id: 'staff', role: 'owner', status: 'active', tenant_id: null },
    cases: { id: 'case', client_id: 'client', company_id: null, tenant_id: null, closed_at: null },
    kia_work_connections: { id: 'connection', created_by: 'staff', case_id: 'case', client_id: 'client',
      company_id: null, tenant_id: null, expires_at: new Date(Date.now()+60000).toISOString() } };
});
describe('Work credentials', () => {
  it('accepts an authorized personal case without inventing a company', async () => {
    expect((await requireWorkConnection(request())).caseRow.company_id).toBeNull();
  });
  it('rejects disabled, missing and expired credentials', async () => {
    vi.stubEnv('KIA_WORK_CONNECTOR_ENABLED', 'false');
    await expect(requireWorkConnection(request())).rejects.toThrow('connector_disabled');
    vi.stubEnv('KIA_WORK_CONNECTOR_ENABLED', 'true');
    await expect(requireWorkConnection(new NextRequest('https://example.test'))).rejects.toThrow('unauthorized');
    Object.assign(fixture.rows.kia_work_connections as object, { expires_at: '2000-01-01' });
    await expect(requireWorkConnection(request())).rejects.toThrow('unauthorized');
  });
  it('rechecks role and tenant on every invocation', async () => {
    fixture.rows.profiles = { role: 'client', status: 'active' };
    await expect(requireWorkConnection(request())).rejects.toThrow('forbidden');
    fixture.rows.profiles = { role: 'tenant_admin', status: 'active', tenant_id: 'other' };
    await expect(requireWorkConnection(request())).rejects.toThrow('forbidden');
  });
  it('rejects changed case ownership and revoked credentials', async () => {
    Object.assign(fixture.rows.cases as object, { client_id: 'other' });
    await expect(requireWorkConnection(request())).rejects.toThrow('scope_changed');
    Object.assign(fixture.rows.kia_work_connections as object, { revoked_at: new Date().toISOString() });
    await expect(requireWorkConnection(request())).rejects.toThrow('unauthorized');
  });
  it('does not let a connector credential grant itself new tasks', async () => {
    await expect(requireWorkProfessional(request(), 'case')).rejects.toThrow('unauthorized');
  });
});
