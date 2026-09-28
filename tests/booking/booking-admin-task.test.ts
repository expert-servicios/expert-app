import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('booking admin task lifecycle', () => {
  const route = source('app/api/booking/route.ts');
  const cancel = source('app/api/booking/manage/cancel/route.ts');
  const helper = source('lib/booking/booking-admin-task.ts');
  const adminAppointments = source('app/api/admin/citas/route.ts');
  const calWebhook = source('app/api/webhooks/cal/route.ts');
  const reconciler = source('app/api/cron/booking-task-reconcile/route.ts');
  const vercel = source('vercel.json');

  it('creates one idempotent system task per confirmed appointment', () => {
    expect(route).toContain('ensureBookingAdminTask({');
    expect(helper).toContain(".contains('metadata', { appointment_id: input.appointmentId })");
    expect(helper).toContain("task_kind: 'booking_meeting'");
    expect(helper).toContain("source: 'system'");
  });

  it('links meeting tasks to EXPERT identities when available', () => {
    expect(route).toContain('resolveBookingIdentityByEmail(admin, bookingEmail)');
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

  it('keeps Admin edits and Cal.com fallback synchronized', () => {
    expect(adminAppointments).toContain('ensureBookingAdminTask({');
    expect(adminAppointments).toContain('cancelBookingAdminTask(');
    expect(calWebhook).toContain('ensureBookingAdminTask({');
    expect(calWebhook).toContain('cancelBookingAdminTask(');
  });

  it('reconciles transient failures durably', () => {
    expect(helper).toContain('reconcileBookingAdminTasks');
    expect(reconciler).toContain('reconcileBookingAdminTasks');
    expect(vercel).toContain('/api/cron/booking-task-reconcile');
  });

  it('uses the canonical booking identity resolver', () => {
    expect(route).toContain('resolveBookingIdentityByEmail(admin, bookingEmail)');
  });

  it('compensates meeting tasks when the booking rolls back', () => {
    expect(route).toContain('Reserva revertida durante compensación por error.');
  });
});
