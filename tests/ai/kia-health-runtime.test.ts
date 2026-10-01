import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Kia health runtime safeguards', () => {
  it('does not perform live official-source searches inside synthetic canaries', () => {
    const runner = read('lib/ai/kia/health/kia-health-runner.ts');
    const engine = read('lib/ai/kia/kia-decision-engine.ts');

    expect(runner).toContain('includeOfficialSourceContext: false');
    expect(engine).toContain('includeOfficialSourceContext?: boolean');
    expect(engine).toContain("input.includeOfficialSourceContext === false");
  });

  it('does not persist synthetic canary identities into production decision logs', () => {
    const runner = read('lib/ai/kia/health/kia-health-runner.ts');
    const engine = read('lib/ai/kia/kia-decision-engine.ts');

    expect(runner).toContain('persistDecisionLog: false');
    expect(engine).toContain('persistDecisionLog?: boolean');
    expect(engine).toContain('input.persistDecisionLog === false ? null : await saveKiaDecisionLog');
  });

  it('runs canaries with bounded concurrency instead of serial execution', () => {
    const runner = read('lib/ai/kia/health/kia-health-runner.ts');

    expect(runner).toContain("KIA_HEALTH_CANARY_CONCURRENCY ?? '4'");
    expect(runner).toContain('Math.min(6, Math.max(1');
    expect(runner).toContain('mapWithConcurrency(KIA_HEALTH_CANARY_TESTS');
  });
});
