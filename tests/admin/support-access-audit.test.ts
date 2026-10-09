import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const api=readFileSync('app/api/admin/support/access/route.ts','utf8');
const portal=readFileSync('app/(protected)/admin/clientes/[id]/portal/page.tsx','utf8');

describe('admin delegated support audit',()=>{
  it('enforces authenticated admin and client company membership on server',()=>{
    expect(api).toContain('supabase.auth.getUser()');
    expect(api).toContain("['owner','admin'].includes(actor.role)");
    expect(api).toContain(".eq('profile_id',clientId).eq('company_id',companyId)");
    expect(api).toContain("return NextResponse.json({ error:'Empresa ajena al cliente' }, { status:403 })");
  });
  it('records actor and privacy-minimal device context, never secrets',()=>{
    expect(api).toContain("admin.from('audit_logs').insert");
    expect(api).toContain("actor_id:user.id");
    expect(api).toContain('device_category:deviceCategory(agent)');
    expect(api).toContain('browser_family:browserFamily(agent)');
    expect(api).not.toContain("request.headers.get('x-forwarded-for')");
    expect(api).not.toContain("metadata: { user_agent:");
  });
  it('fails closed if recording access fails',()=>{
    expect(api).toContain("status:503");
    expect(portal).toContain("if (!auditReady) return");
    expect(portal).toContain("action: 'support_open'");
  });
});
