import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const scriptPath = resolve(
  process.cwd(),
  'scripts',
  'supabase-ledger-repair-20260918.sh',
);

const manifestPath = resolve(
  process.cwd(),
  'docs',
  'migration-history',
  'production-ledger-repair-manifest-2026-09-18.md',
);

const script = readFileSync(scriptPath, 'utf8');
const manifest = readFileSync(manifestPath, 'utf8');

function extractArray(name: string): string[] {
  const match = script.match(
    new RegExp(`${name}=\\\\(\\\\n([\\\\s\\\\S]*?)\\\\n\\\\)`),
  );
  if (!match) throw new Error(`Missing ${name}`);
  return match[1]
    .trim()
    .split(/\\s+/)
    .filter(Boolean);
}

describe('production ledger repair phase 3 plan', () => {
  it('freezes exactly 133 historical versions and 36 baseline versions', () => {
    const oldVersions = extractArray('OLD_VERSIONS');
    const baselineVersions = extractArray('BASELINE_VERSIONS');

    expect(oldVersions).toHaveLength(133);
    expect(baselineVersions).toHaveLength(36);
    expect(oldVersions[0]).toBe('20260508082323');
    expect(oldVersions.at(-1)).toBe('20260911174615');
    expect(baselineVersions[0]).toBe('20260912000100');
    expect(baselineVersions.at(-1)).toBe('20260912003600');
  });

  it('keeps execution blocked before any migration repair command', () => {
    expect(script).toContain('exit 64');

    const hardStopIndex = script.indexOf('exit 64');
    const revertedIndex = script.indexOf('supabase migration repair "${OLD_VERSIONS[@]}" --status reverted');
    const appliedIndex = script.indexOf('supabase migration repair "${BASELINE_VERSIONS[@]}" --status applied');

    expect(hardStopIndex).toBeGreaterThan(-1);
    expect(revertedIndex).toBeGreaterThan(hardStopIndex);
    expect(appliedIndex).toBeGreaterThan(hardStopIndex);
  });

  it('keeps the destructive repair commands commented out', () => {
    expect(script).toContain(
      '# supabase migration repair "${OLD_VERSIONS[@]}" --status reverted',
    );
    expect(script).toContain(
      '# supabase migration repair "${BASELINE_VERSIONS[@]}" --status applied',
    );
  });

  it('documents the frozen before-state and preserved post-baseline tail', () => {
    expect(manifest).toContain('ledger rows: **156**');
    expect(manifest).toContain('pre-baseline historical rows: **133**');
    expect(manifest).toContain('recovery baseline rows currently remote: **0**');
    expect(manifest).toContain('post-baseline rows to preserve unchanged: **23**');
    expect(manifest).toContain('20260918114535');
  });

  it('forbids direct DML against the Supabase migration ledger', () => {
    expect(manifest).toContain(
      'Never issue direct `DELETE`, `INSERT`, or `UPDATE` against `supabase_migrations.schema_migrations`.',
    );
  });
});
