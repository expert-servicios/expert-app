import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const route = readFileSync('app/api/cron/kia-email-agent/route.ts', 'utf8');
const materializer = readFileSync('lib/admin/kia-operational-task.ts', 'utf8');
const migration = readFileSync(
  'supabase/migrations/20261006110514_internal_tasks_open_action_fingerprint.sql',
  'utf8',
);

describe('KIA email action deduplication', () => {
  it('preserves Unicode letters and numbers in action fingerprints', () => {
    expect(materializer).toContain("\\p{M}+");
    expect(materializer).toContain("[^\\p{L}\\p{N}]+");
    expect(materializer).toContain('input.originId');
  });

  it('enforces one open task per action fingerprint at database level', () => {
    expect(migration).toContain('create unique index if not exists uq_internal_tasks_open_action_fingerprint');
    expect(migration).toContain("(metadata ->> 'action_fingerprint')");
    expect(migration).toContain("status in ('pendiente', 'en_progreso')");
  });

  it('resolves concurrent unique conflicts back to the existing open task', () => {
    expect(materializer).toContain("error.code !== '23505'");
    expect(materializer).toContain(".eq('metadata->>action_fingerprint', actionFingerprint)");
  });

  it('blocks task creation and auto-send when orchestration failed closed', () => {
    expect(route).toContain('!result.executionTrace.lateClassificationFailClosed');
    expect(route).toContain("blockReason = 'orchestration_requires_review'");
    expect(route).toContain("'orchestration_requires_review'");
  });

  it('rechecks open status before reusing an action task', () => {
    expect(materializer).toContain(".in('status', ['pendiente', 'en_progreso'])");
    expect(materializer).toContain(".select('id,title,metadata')");
    expect(materializer).toContain('if (reused)');
  });

  it('uses the partial unique expression index as the canonical lookup index', () => {
    expect(migration).toContain("on public.internal_tasks ((metadata ->> 'action_fingerprint'))");
    expect(migration).not.toContain('using gin');
  });
});
