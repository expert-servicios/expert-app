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

  it('keeps EXPERT-native tools disabled by default and registers them only behind the flag', () => {
    const example = source('apps/holded-mcp/.env.example');
    const app = source('apps/holded-mcp/src/app.ts');
    expect(example).toContain('EXPERT_BACKEND_TOOLS_ENABLED=0');
    expect(app).toContain("config.EXPERT_BACKEND_TOOLS_ENABLED === '1'");
    expect(app).toContain('registerExpertTools(mcpServer, () => expertClient)');
    expect(app).toContain('createMcpBackend({ holdedApiKey: record.holdedApiKey })');
  });

  it('requires verified OAuth identity and rejects legacy hash sessions', () => {
    const config = source('apps/holded-mcp/src/config.ts');
    const app = source('apps/holded-mcp/src/app.ts');
    expect(config).toContain("EXPERT_BACKEND_TOOLS_ENABLED=1 requires EXPERT_OAUTH_BRIDGE_ENABLED=1");
    expect(app).toContain('isSupabaseUserId(record.userId)');
    expect(app).toContain("error: 'reauthentication_required'");
  });

  it('uses only the authenticated MCP identity to resolve companies', () => {
    const client = source('apps/holded-mcp/src/expert-backend-client.ts');
    expect(client).toContain('constructor(private readonly userId: string)');
    expect(client).toContain("new URLSearchParams({ userId: this.userId })");
    expect(client).not.toContain('companyId:');
  });
});
