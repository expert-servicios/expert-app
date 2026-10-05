import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('EXPERT MCP list_companies boundary', () => {
  it('requires the server-to-server shared secret', () => {
    const route = source('app/api/integrations/mcp/companies/route.ts');
    expect(route).toContain('validateMcpSharedSecret');
    expect(route).toContain(".from('profile_companies')");
    expect(route).toContain(".eq('profile_id', supabaseUserId)");
  });

  it('keeps EXPERT-native tools disabled by default', () => {
    const example = source('apps/holded-mcp/.env.example');
    expect(example).toContain('EXPERT_BACKEND_TOOLS_ENABLED=0');
  });

  it('uses only the authenticated MCP identity to resolve companies', () => {
    const client = source('apps/holded-mcp/src/expert-backend-client.ts');
    expect(client).toContain('constructor(private readonly userId: string)');
    expect(client).toContain("new URLSearchParams({ userId: this.userId })");
    expect(client).not.toContain('companyId:');
  });
});
