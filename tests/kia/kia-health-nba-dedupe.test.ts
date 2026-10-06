import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA Health NBA deduplication', () => {
  const alerts = source('lib/ai/kia/health/kia-health-alerts.ts');
  const nba = source('lib/nba/create-nba.ts');
  const runner = source('lib/ai/kia/health/kia-health-runner.ts');
  const migration = source('supabase/migrations/20261006092254_dedupe_global_health_nbas_20261006.sql');

  it('uses a stable source/check key for global health alerts', () => {
    expect(alerts).toContain('healthNbaKey');
    expect(alerts).toContain('metadata.checkId');
    expect(alerts).toContain('dedup_key: dedupKey');
  });

  it('reconciles recovered canary alerts even when the current anomaly list is empty', () => {
    expect(runner).toContain("saveKiaBehaviorAnomalies(anomalies, 'canary')");
    expect(alerts).toContain('activeKeys');
    expect(alerts).toContain("status: 'done'");
  });

  it('lets generic NBA creation deduplicate unscoped alerts', () => {
    expect(nba).toContain('dedup_key?: string');
    expect(nba).toContain(".contains('metadata', { dedup_key: params.dedup_key })");
    expect(nba).toContain("error.code !== '23505'");
  });

  it('resolves historical duplicates and prevents concurrent re-inserts', () => {
    expect(migration).toContain('row_number() over');
    expect(migration).toContain("status = 'done'");
    expect(migration).toContain('next_best_actions_open_global_dedup_uidx');
    expect(migration).toContain("metadata ->> 'dedup_key'");
  });
});
