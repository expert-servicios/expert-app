import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Holded MCP backend boundary', () => {
  it('constructs the MCP backend through the factory', () => {
    const app = source('apps/holded-mcp/src/app.ts');
    expect(app).toContain("import { createMcpBackend } from './backend-factory.js'");
    expect(app).toContain('createMcpBackend({ holdedApiKey: record.holdedApiKey })');
    expect(app).not.toContain('new HoldedClient(record.holdedApiKey)');
  });

  it('keeps MCP tools typed against the backend contract', () => {
    for (const path of [
      'apps/holded-mcp/src/tools/index.ts',
      'apps/holded-mcp/src/tools/invoicing.ts',
      'apps/holded-mcp/src/tools/contacts.ts',
      'apps/holded-mcp/src/tools/other.ts',
    ]) {
      const file = source(path);
      expect(file).toContain('HoldedBackend');
      expect(file).not.toContain('() => HoldedClient');
    }
  });

  it('keeps the direct Holded implementation as the only runtime mode for now', () => {
    const factory = source('apps/holded-mcp/src/backend-factory.ts');
    expect(factory).toContain("export type McpBackendMode = 'direct'");
    expect(factory).toContain("case 'direct'");
    expect(factory).toContain('return new HoldedClient(input.holdedApiKey)');
  });
});
