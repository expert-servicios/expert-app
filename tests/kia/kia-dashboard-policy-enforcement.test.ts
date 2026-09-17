import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const route = readFileSync(resolve(process.cwd(), 'app/api/ai/kia/route.ts'), 'utf8');

describe('KIA dashboard policy enforcement wiring', () => {
  it('resolves the actor and client dashboard policy before running KIA', () => {
    expect(route).toContain('resolveKiaActorCapabilities({');
    expect(route).toContain("resolveKiaPolicyToolNames('client_dashboard', actor)");
    expect(route).toContain("runPolicyEnforcedKiaDecision('client_dashboard', actor");
  });

  it('removes the legacy static dashboard tool allowlist', () => {
    expect(route).not.toContain('LEGACY_DASHBOARD_SAFE_TOOLS');
    expect(route).not.toContain('allowedToolNames: [...LEGACY_DASHBOARD_SAFE_TOOLS]');
  });

  it('keeps shadow on the same policy-resolved tool surface as primary', () => {
    expect(route).toContain('new Set(dashboardPolicy.toolNames)');
    expect(route).toContain('allowedShadowToolNames.has(tool.name)');
  });
});
