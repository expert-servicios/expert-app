import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const standaloneWorkflowPath = path.join(root, '.github', 'workflows', 'supabase-ledger-preflight.yml');
const ciWorkflowPath = path.join(root, '.github', 'workflows', 'ci.yml');
const scriptPath = path.join(root, 'scripts', 'regulatory-ledger-preflight.sh');

function read(file: string) {
  return fs.readFileSync(file, 'utf8');
}

describe('Supabase regulatory ledger preflight contract', () => {
  it('uses the standalone workflow as the single production-ledger gate', () => {
    const standalone = read(standaloneWorkflowPath);
    const ci = read(ciWorkflowPath);

    expect(standalone).toContain('bash scripts/regulatory-ledger-preflight.sh');
    expect(standalone).toContain("'scripts/regulatory-ledger-preflight.sh'");
    expect(standalone).toContain('pull_request:');
    expect(standalone).toContain('workflow_dispatch:');
    expect(ci).not.toContain('regulatory-ledger-preflight:');
  });

  it('requires production to be an exact prefix of local migration history', () => {
    const script = read(scriptPath);

    expect(script).toContain('production ledger is not an exact prefix of local migrations');
    expect(script).toContain('production contains more migration versions than the repository');
    expect(script).toContain('non-forward migration');
    expect(script).toContain('duplicate local migration versions');
  });

  it('pins the audited batch and allows only the exact audited v1.5 recovery state', () => {
    const script = read(scriptPath);
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

    expect(script).toContain("predeploy_tip='20260920073758'");
    expect(script).toContain("recovery_tip='20260920163000'");
    expect(script).toContain("ledger_state='audited_partial_v15_recovery'");
    expect(script).toContain('unexpected partial v1.3-v1.5 production deployment detected');
    expect(script).toContain('expected exactly 9 audited regulatory migrations before deployment');
    expect(script).toContain('expected exactly 4 migrations in audited v1.5 recovery tail');
    for (const version of versions) {
      expect(script).toContain(version);
    }
  });

  it('remains read-only against production and requires a dry-run', () => {
    const script = read(scriptPath);

    expect(script).toContain('supabase db dump');
    expect(script).toContain('supabase migration list --linked');
    expect(script).toContain('supabase db push --linked --dry-run');
    expect(script).not.toMatch(/supabase db push --linked(?:\s|$)(?![^\n]*--dry-run)/);
    expect(script).not.toContain('migration repair');
    expect(script).not.toContain('delete from supabase_migrations');
    expect(script).not.toContain('update supabase_migrations');
  });

  it('allows later legitimate forward-only migrations without rewriting the guard', () => {
    const script = read(scriptPath);

    expect(script).toContain("ledger_state='forward_after_regulatory_batch'");
    expect(script).toContain('pending=("${local_versions[@]:remote_count}")');
    expect(script).toContain('pending migration $version is missing from db push --dry-run');
  });
});
