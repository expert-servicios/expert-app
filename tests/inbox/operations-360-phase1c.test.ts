import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const controlLib = source('lib/admin/operations-360-email-control.ts');
const controlRoute = source('app/api/admin/inbox/email-control/route.ts');
const agent = source('app/api/cron/kia-email-agent/route.ts');
const inbox = source('lib/admin/operations-360-inbox.ts');
const page = source('app/(protected)/admin/inbox/page.tsx');

describe('Operations 360 Inbox phase 1c email takeover', () => {
  it('uses one idempotent internal task as the canonical human lock', () => {
    expect(controlLib).toContain("task_kind: 'email_manual_lock'");
    expect(controlLib).toContain("gmail_thread_id: input.threadId");
    expect(controlLib).toContain("{ onConflict: 'source_key' }");
    expect(controlLib).toContain("status: 'completada'");
    expect(controlLib).not.toContain("from('email_manual_locks')");
  });

  it('resolves the real inbox item before changing email control and audits the actor', () => {
    expect(controlRoute).toContain('loadOperations360Inbox');
    expect(controlRoute).toContain("item.source !== 'email_inbox_cache'");
    expect(controlRoute).toContain('setEmailThreadControl');
    expect(controlRoute).toContain("operations360.email_taken_over");
    expect(controlRoute).toContain("operations360.email_returned_to_kia");
    expect(controlRoute).toContain("actor_id: ctx.user.id");
  });

  it('blocks the autonomous email agent before orchestration when a manual lock exists', () => {
    expect(agent).toContain('getEmailManualLock(admin, row.thread_id)');
    expect(agent).toContain("block_reason: 'manual_takeover'");
    expect(agent).toContain('manual_lock_task_id: manualLock.id');
    expect(agent).toContain('responder desde Correo 360 o devolver el hilo a KIA');
    expect(agent.indexOf('getEmailManualLock(admin, row.thread_id)'))
      .toBeLessThan(agent.indexOf('const result = await runKiaOrchestratedDecision'));
  });

  it('still records inbound email evidence while manual control is active', () => {
    expect(agent.indexOf('recordInboundEmailEvent({'))
      .toBeLessThan(agent.indexOf('getEmailManualLock(admin, row.thread_id)'));
    expect(agent).toContain('firstInboundProcessing');
  });

  it('surfaces the lock as manual mode with owner and SLA in the read model', () => {
    expect(inbox).toContain("metadata.task_kind === 'email_manual_lock'");
    expect(inbox).toContain("metadata.gmail_thread_id === item.threadId");
    expect(inbox).toContain("item.controlMode = 'manual'");
    expect(inbox).toContain("item.status = 'needs_action'");
    expect(inbox).toContain('emailManualLock ?? matchingTasks.find');
  });

  it('offers explicit takeover and return-to-KIA controls for email', () => {
    expect(page).toContain("fetch('/api/admin/inbox/email-control'");
    expect(page).toContain('Tomar email');
    expect(page).toContain('Dejar email a KIA');
    expect(page).toContain('Responder en Correo 360');
  });
});
