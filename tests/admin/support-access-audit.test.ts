import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const portal = readFileSync('app/(protected)/admin/clientes/[id]/portal/page.tsx', 'utf8');
const handler = readFileSync('app/api/admin/clientes/[id]/support-access/route.ts', 'utf8');

describe('delegated support audit route contract', () => {
  it('uses the existing single guarded audit endpoint, not a parallel endpoint', () => {
    expect(portal).toContain("await recordSupportAccess(id, 'entered', initialCompanyId)");
    expect(portal).toContain("await recordSupportAccess(id, 'company_switched', nextCompanyId)");
    expect(portal).toContain("await recordSupportAccess(id, 'exited', companyId)");
    expect(portal).toContain("`/api/admin/clientes/${clientId}/support-access`");
    expect(portal).not.toContain("'/api/admin/support/access'");
    expect(portal).not.toContain('auditReady');
  });

  it('requires an authenticated active admin and checks company membership', () => {
    expect(handler).toContain('supabase.auth.getUser()');
    expect(handler).toContain("actor.status !== 'active'");
    expect(handler).toContain("['admin', 'owner'].includes(actor.role)");
    expect(handler).toContain(".eq('profile_id', id)");
    expect(handler).toContain(".eq('company_id', companyId)");
  });

  it('fails closed on audit insertion failure and restricts browser origins', () => {
    expect(handler).toContain("new URL(origin).host !== request.nextUrl.host");
    expect(handler).toContain("if (error) throw error");
    expect(handler).toContain("status: 500");
    expect(handler).toContain("device_source: 'unverified_user_agent'");
    expect(handler).not.toContain('user_agent: device.userAgent');
  });
});
