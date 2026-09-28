import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('booking admin task lifecycle', () => {
  const route = source('app/api/booking/route.ts');
  const cancel = source('app/api/booking/manage/cancel/route.ts');
  const helper = source('lib/booking/booking-admin-task.ts');

  it('creates one idempotent system task per confirmed appointment', () => {
    expect(route).toContain('ensureBookingAdminTask({');
    expect(helper).toContain(".contains('metadata', { appointment_id: input.appointmentId })");
    expect(helper).toContain("task_kind: 'booking_meeting'");
    expect(helper).toContain("source: 'system'");
  });

  it('links meeting tasks to EXPERT identities when available', () => {
    expect(route).toContain(".from('profiles')");
    expect(route).toContain(".from('leads')");
    expect(helper).toContain('client_id: input.clientId ?? null');
    expect(helper).toContain('lead_id: input.leadId ?? null');
    expect(helper).toContain('company_id: input.companyId ?? null');
  });

  it('cancels the old task on reschedule and cancellation', () => {
    expect(route).toContain('cancelBookingAdminTask(');
    expect(cancel).toContain('cancelBookingAdminTask(');
    expect(helper).toContain("status: 'cancelada'");
  });

  it('keeps onboarding workflow task separate from the meeting task', () => {
    expect(route).toContain('ensureOnboardingTask({');
    expect(helper).toContain("task_kind: 'booking_meeting'");
  });
});
