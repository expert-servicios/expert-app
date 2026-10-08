import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const materializer = source('lib/admin/kia-operational-task.ts');
const agenda = source('lib/admin/admin-daily-agenda.ts');
const dailySummary = source('app/api/cron/daily-summary/route.ts');
const googleCalendar = source('lib/integrations/google-calendar.ts');
const registry = source('lib/ai/kia/kia-tool-registry.ts');
const executor = source('lib/ai/kia/kia-tool-executor.ts');

describe('Operations 360 Phase 2 operational tasks and agenda', () => {
  it('materializes only safe real human actions', () => {
    expect(materializer).toContain("input.nextAction !== 'create_task'");
    expect(materializer).toContain('input.requiresManualReview || input.confidence < 0.75');
    expect(materializer).toContain("input.operationalCategory === 'manual_review'");
    expect(materializer).toContain("input.operationalCategory === 'non_human'");
    expect(materializer).toContain('if (!scope) return null');
  });

  it('deduplicates open actions semantically across channels', () => {
    expect(materializer).toContain('action_fingerprint');
    expect(materializer).toContain("metadata->>action_fingerprint");
    expect(materializer).toContain(".in('status', ['pendiente', 'en_progreso'])");
    expect(materializer).toContain("task_kind: 'kia_operational_action'");
  });

  it('puts operational work into today Madrid agenda without changing tool approval policy', () => {
    expect(materializer).toContain("timeZone: 'Europe/Madrid'");
    expect(materializer).toContain('due_date: dueDate');
    expect(materializer).toContain('refreshAdminDailyAgenda(input.admin)');
    expect(registry).toContain("create_internal_task:               policy('R1', 'draft', 'internal_operations', true)");
    expect(executor).toContain("case 'create_internal_task':");
    expect(executor).toContain("status: 'draft_only'");
  });

  it('recalculates one canonical Calendar agenda from current tasks and meetings', () => {
    expect(agenda).toContain('admin_agenda_event:');
    expect(agenda).toContain('upsertAdminAgendaEventSA');
    expect(agenda).toContain(".in('status', ['confirmed', 'confirmada'])");
    expect(agenda).toContain("metadata.task_kind !== 'booking_meeting'");
    expect(agenda).toContain('https://expertconsulting.es/admin/expedientes/');
    expect(agenda).toContain('https://expertconsulting.es/admin/clientes/');
    expect(googleCalendar).toContain('export async function upsertAdminAgendaEventSA');
    expect(googleCalendar).toContain('cal.events.patch');
  });

  it('uses the same reconciler from the daily cron instead of a frozen snapshot implementation', () => {
    expect(dailySummary).toContain('refreshAdminDailyAgenda(admin, now)');
    expect(dailySummary).not.toContain('createAdminAgendaEventSA({');
  });
});
