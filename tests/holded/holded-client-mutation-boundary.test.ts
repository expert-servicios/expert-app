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

  it('prevents the client surface from rewriting or revoking managed v2 integrations', () => {
    const connect = source('app/api/integrations/holded/connect/route.ts');
    const disconnect = source('app/api/integrations/holded/disconnect/route.ts');
    const card = source('components/integrations/HoldedConnectionCard.tsx');

    expect(connect).toContain("existing.data.mode === 'advisor_managed'");
    expect(connect).toContain("existing.data.api_version === 'v2'");
    expect(disconnect).toContain("integration.mode === 'advisor_managed'");
    expect(disconnect).toContain("integration.api_version === 'v2'");
    expect(card).toContain('isManagedByExpert');
    expect(card).toContain('Esta conexión está gestionada por EXPERT');
  });

  it('writes client-created connections explicitly as legacy v1', () => {
    const connect = source('app/api/integrations/holded/connect/route.ts');
    expect(connect).toContain("api_version: 'v1'");
  });
});
