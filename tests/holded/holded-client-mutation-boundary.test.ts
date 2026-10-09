import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Holded client mutation boundary', () => {
  it('allows company Holded changes only to owner/admin memberships', () => {
    const connect = source('app/api/integrations/holded/connect/route.ts');
    const disconnect = source('app/api/integrations/holded/disconnect/route.ts');

    expect(connect).toContain("!['owner', 'admin'].includes");
    expect(disconnect).toContain("['owner', 'admin'].includes");
    expect(connect).toContain('Solo un propietario o administrador');
    expect(disconnect).toContain('Solo un propietario o administrador');
  });

  it('prevents client changes to advisor-managed and EXPERT-owned integrations', () => {
    const connect = source('app/api/integrations/holded/connect/route.ts');
    const disconnect = source('app/api/integrations/holded/disconnect/route.ts');
    const card = source('components/integrations/HoldedConnectionCard.tsx');

    expect(connect).toContain("existing.data.mode === 'advisor_managed'");
    expect(connect).toContain("existing.data.mode === 'expert_account'");
    expect(disconnect).toContain("integration.mode === 'advisor_managed'");
    expect(disconnect).toContain("integration.mode === 'expert_account'");
    expect(card).toContain('isManagedByExpert');
    expect(card).toContain('Esta conexión está gestionada por EXPERT');
  });

  it('creates client-owned Holded connections as API v2 by default without treating every v2 tenant as managed', () => {
    const connect = source('app/api/integrations/holded/connect/route.ts');
    const card = source('components/integrations/HoldedConnectionCard.tsx');
    expect(connect).toContain("apiVersion: z.enum(['v1','v2']).default('v2')");
    expect(connect).toContain('api_version: apiVersion');
    expect(connect).toContain("mode: 'client_account'");
    expect(card).toContain("integration?.mode === 'advisor_managed' || integration?.mode === 'expert_account'");
    expect(card).not.toContain("integration?.api_version === 'v2'");
  });
});
