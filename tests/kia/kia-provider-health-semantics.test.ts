import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA provider health semantics', () => {
  const health = source('lib/ai/kia/health/kia-health-checks.ts');
  const router = source('lib/ai/kia/kia-provider-router.ts');

  it('keeps the Gemini primary smoke critical', () => {
    expect(health).toMatch(/checkId: 'gemini_credential_smoke'[\s\S]{0,260}severity: 'critical'/);
  });

  it('reports direct OpenAI/Anthropic failures as degraded fallbacks', () => {
    expect(health).toContain("title: 'Anthropic fallback directo operativo'");
    expect(health).toContain("severity: input.provider === 'google' ? 'critical' : 'warning'");
    expect(health).toContain("status: input.provider === 'google' ? 'failed' : 'warning'");
    expect(health).toMatch(/checkId: 'three_provider_failover_pool'[\s\S]{0,220}severity: 'warning'/);
  });

  it('supports Anthropic workspace-scoped API keys for health and runtime', () => {
    expect(health).toContain("process.env.ANTHROPIC_WORKSPACE_ID");
    expect(health).toContain("'anthropic-workspace-id': workspaceId");
    expect(router).toContain("function anthropicWorkspaceHeader()");
    expect((router.match(/anthropicWorkspaceHeader\(\)/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it('does not silently remove fallback errors', () => {
    expect(health).toContain("error: message");
    expect(health).toContain("error: error instanceof Error ? error.message : String(error)");
  });
});
