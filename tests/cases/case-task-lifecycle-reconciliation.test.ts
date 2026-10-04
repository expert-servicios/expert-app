import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20261004111500_case_task_lifecycle_reconciliation.sql',
  'utf8',
);

describe('case task lifecycle reconciliation', () => {
  it('closes pre-submission workflow tasks when a case becomes presentado', () => {
    expect(migration).toContain("new.status = 'presentado' or new.state = 'presentado'");
    expect(migration).toContain("metadata ->> 'blocks_submission'");
    expect(migration).toContain("metadata ->> 'task_key' = 'submit_and_archive_receipt'");
    expect(migration).toContain("status in ('pendiente', 'en_progreso')");
  });

  it('keeps post-submission follow-up eligible instead of closing every presented task', () => {
    expect(migration).not.toContain("metadata ->> 'task_key' = 'follow_up_after_submission'");
    expect(migration).toContain("metadata ->> 'blocks_submission'");
  });

  it('closes all remaining case tasks when the case is finalized and clears case deadlines', () => {
    expect(migration).toContain("new.status = 'finalizado' or new.state = 'finalizado'");
    expect(migration).toContain("new.due_date := null");
  });

  it('backfills existing presented/finalized drift', () => {
    expect(migration).toContain("'presentado_backfill'");
    expect(migration).toContain("'finalizado_backfill'");
  });
});
