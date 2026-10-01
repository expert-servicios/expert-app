import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const holdedClient = readFileSync(
  resolve(process.cwd(), 'lib/integrations/holded/holded-client.ts'),
  'utf8',
);

describe('Holded connection probe latency', () => {
  it('starts capability probes concurrently while preserving the shared rate limiter', () => {
    expect(holdedClient).toContain('const probeResults = await Promise.all(');
    expect(holdedClient).toContain('checks.map(async ({ key: permissionKey, probe }) =>');
    expect(holdedClient).toContain('await respectRateLimit();');
    expect(holdedClient).not.toContain('for (const { key: permissionKey, probe } of checks) {\n      try {\n        await probe();');
  });
});
