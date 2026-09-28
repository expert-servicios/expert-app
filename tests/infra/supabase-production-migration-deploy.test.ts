import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), '.github/workflows/supabase-production-migrations.yml'),
  'utf8',
);

describe('Supabase production migration deploy workflow', () => {
  it('deploys only after the validated forward-only preflight', () => {
    const preflight = source.indexOf('bash scripts/regulatory-ledger-preflight.sh');
    const push = source.indexOf('supabase db push --linked');
    expect(preflight).toBeGreaterThan(-1);
    expect(push).toBeGreaterThan(preflight);
  });

  it('pins the validated CLI and serializes production migrations', () => {
    expect(source).toContain('version: 2.117.0');
    expect(source).toContain('group: supabase-production-migrations');
    expect(source).toContain('cancel-in-progress: false');
    expect(source).toContain('environment: production');
  });

  it('uses dry-runs around the real push and never resets or seeds production', () => {
    expect(source).toContain('supabase db push --linked --dry-run');
    expect(source).toContain('supabase db push --linked');
    expect(source).not.toContain('db reset --linked');
    expect(source).not.toContain('--include-seed');
  });

  it('uses repository secrets without embedding credentials', () => {
    expect(source).toContain('secrets.SUPABASE_ACCESS_TOKEN');
    expect(source).toContain('secrets.SUPABASE_DB_PASSWORD');
    expect(source).toContain('PROJECT_REF: ybtpqscmqrrjjmuoryap');
  });
});
