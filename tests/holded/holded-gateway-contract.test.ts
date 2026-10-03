import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const gateway = readFileSync(resolve(process.cwd(), 'lib/integrations/holded/holded-gateway.ts'), 'utf8');
const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20261003190500_holded_advisor_managed_mode.sql'), 'utf8');

describe('Holded version-aware gateway contract', () => {
  it('selects API version from canonical client_integrations metadata', () => {
    expect(gateway).toContain("apiVersion === 'v2'");
    expect(gateway).toContain('createHoldedV2Client(normalized)');
    expect(gateway).toContain('createHoldedClient(normalized)');
    expect(gateway).toContain(".from('client_integrations')");
    expect(gateway).toContain(".eq('provider', 'holded')");
  });

  it('keeps per-client credentials behind the canonical encrypted resolver', () => {
    expect(gateway).not.toContain('HOLDED_DGM_API_TOKEN');
    expect(gateway).not.toContain('process.env');
    expect(gateway).toContain('createHoldedGatewayForIntegration');
  });

  it('requires advisor-managed connections to use v2', () => {
    expect(gateway).toContain("mode === 'advisor_managed' && apiVersion !== 'v2'");
    expect(migration).toContain("'advisor_managed'::text");
  });
});
