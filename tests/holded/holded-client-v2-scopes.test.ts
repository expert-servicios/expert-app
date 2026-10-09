import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getKiaToolPolicy } from '@/lib/ai/kia/kia-tool-registry';
const read = (p: string) => readFileSync(p,'utf8');

describe('Client-owned Holded v2 capabilities', () => {
  it('discovers v2 scopes before storing token and keeps scope-specific effective reads', () => {
    const connect=read('app/api/integrations/holded/connect/route.ts');
    const test=read('app/api/integrations/holded/test/route.ts');
    expect(connect).toContain("apiVersion: z.enum(['v1','v2']).default('v2')");
    expect(connect).toContain('detectHoldedPermissions(apiKey, apiVersion)');
    expect(connect).toContain('intersectHoldedReadPermissions(detectedPermissions, requestedPermissions)');
    expect(test).toContain('detectHoldedPermissions(parsed.data.apiKey, parsed.data.apiVersion)');
  });
  it('keeps managed tenants separate and allows authorized owner to refresh without exposing token', () => {
    const refresh=read('app/api/integrations/holded/refresh-permissions/route.ts');
    expect(refresh).toContain("integration.mode !== 'client_account'");
    expect(refresh).toContain("['owner','admin']");
    expect(refresh).toContain("select('encrypted_api_key')");
    expect(refresh).toContain('intersectHoldedReadPermissions');
    expect(refresh).not.toContain('return NextResponse.json({ apiKey:');
  });
  it('enforces read-only operation and notices to update scopes in Holded', () => {
    const probes=read('lib/integrations/holded/holded-permission-probes.ts');
    const permission=read('lib/ai/kia/kia-holded-access.ts');
    expect(probes).toContain('listTreasuryAccounts');
    expect(probes).not.toContain('createInvoice(');
    expect(permission).toContain('Revisar permisos del token');
    expect(getKiaToolPolicy('get_bank_payment_evidence')).toMatchObject({
      effect:'read',allowedChannels:['admin'],
    });
  });
});
