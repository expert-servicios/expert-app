import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const route = readFileSync('app/api/cron/kia-email-agent/route.ts', 'utf8');
const migration = readFileSync(
  'supabase/migrations/20261004183000_internal_tasks_open_action_fingerprint.sql',
  'utf8',
);

describe('KIA email action deduplication', () => {
  it('preserves Unicode letters and numbers in action fingerprints', () => {
    expect(route).toContain("\\p{M}+");
    expect(route).toContain("[^\\p{L}\\p{N}]+");
    expect(route).toContain("|| input.message.id");
  });

  it('enforces one open task per action fingerprint at database level', () => {
    expect(migration).toContain('create unique index if not exists uq_internal_tasks_open_action_fingerprint');
    expect(migration).toContain("(metadata ->> 'action_fingerprint')");
    expect(migration).toContain("status in ('pendiente', 'en_progreso')");
  });

  it('resolves concurrent unique conflicts back to the existing open task', () => {
    expect(route).toContain("error.code !== '23505'");
    expect(route).toContain(".eq('metadata->>action_fingerprint', actionFingerprint)");
  });

  it('blocks task creation and auto-send when orchestration failed closed', () => {
    expect(route).toContain('!result.executionTrace.lateClassificationFailClosed');
    expect(route).toContain("blockReason = 'orchestration_requires_review'");
    expect(route).toContain("'orchestration_requires_review'");
  });

  it('rechecks open status before reusing an action task', () => {
    expect(route).toContain(".in('status', ['pendiente', 'en_progreso'])");
    expect(route).toContain(".select('id,title')");
    expect(route).toContain('if (reused?.id)');
  });

  it('uses the partial unique expression index as the canonical lookup index', () => {
    expect(migration).toContain("on public.internal_tasks ((metadata ->> 'action_fingerprint'))");
    expect(migration).not.toContain('using gin');
  });
});
