import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const healthChecks = readFileSync(
  resolve(process.cwd(), 'lib/ai/kia/health/kia-health-checks.ts'),
  'utf8',
);

describe('KIA health runtime resilience', () => {
  it('runs independent network checks concurrently', () => {
    expect(healthChecks).toContain('] = await Promise.all([');
    expect(healthChecks).toContain('checkGeminiCredential(),');
    expect(healthChecks).toContain('checkHoldedMcpBridge(),');
  });

  it('bounds public provider status calls', () => {
    expect(healthChecks).toContain('signal: AbortSignal.timeout(5_000)');
  });

  it('uses a Gemini 3.8 compatible credential smoke request', () => {
    expect(healthChecks).toContain("/^gemini-3\\.8(?:-|$)/i.test(input.model)");
    expect(healthChecks).toContain("? { reasoning_effort: 'low' }");
    expect(healthChecks).toContain(": { temperature: 0 }");
  });
});
