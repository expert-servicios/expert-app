import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowPath = path.join(
  process.cwd(),
  '.github',
  'workflows',
  'supabase-ledger-preflight.yml',
);

function workflow() {
  return fs.readFileSync(workflowPath, 'utf8');
}

describe('Supabase regulatory ledger preflight contract', () => {
  it('accepts only the audited pre-deploy and exact post-deploy ledger states', () => {
    const yaml = workflow();

    expect(yaml).toContain('PREDEPLOY_LEDGER_ROWS: "72"');
    expect(yaml).toContain('PREDEPLOY_LAST_VERSION: "20260920073758"');
    expect(yaml).toContain('POSTDEPLOY_LEDGER_ROWS: "81"');
    expect(yaml).toContain('POSTDEPLOY_LAST_VERSION: "20260920230000"');
    expect(yaml).toContain("ledger_state='pre_deploy'");
    expect(yaml).toContain("ledger_state='post_deploy'");
    expect(yaml).toContain('partial v1.3-v1.5 deployment detected');
  });

  it('pins the exact nine audited regulatory migrations', () => {
    const yaml = workflow();
    const versions = [
      '20260920111500',
      '20260920123000',
      '20260920133000',
      '20260920150000',
      '20260920163000',
      '20260920180000',
      '20260920201500',
      '20260920213000',
      '20260920230000',
    ];

    expect(yaml).toContain('EXPECTED_BATCH_COUNT: "9"');
    for (const version of versions) {
      expect(yaml).toContain(version);
    }
  });

  it('remains read-only against production and requires a dry-run', () => {
    const yaml = workflow();

    expect(yaml).toContain('supabase db push --linked --dry-run');
    expect(yaml).not.toMatch(/supabase db push --linked(?:\s|$)(?![^\n]*--dry-run)/);
    expect(yaml).not.toContain('migration repair');
    expect(yaml).not.toContain('delete from supabase_migrations');
    expect(yaml).not.toContain('update supabase_migrations');
  });

  it('runs for migration and preflight-contract changes', () => {
    const yaml = workflow();

    expect(yaml).toContain("'supabase/migrations/**'");
    expect(yaml).toContain("'.github/workflows/supabase-ledger-preflight.yml'");
    expect(yaml).toContain("'tests/infra/supabase-migration-*.test.ts'");
  });
});
