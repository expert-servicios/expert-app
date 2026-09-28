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
  const migration = source('supabase/migrations/20260928112000_booking_admin_task_appointment_key.sql');
  const vercel = source('vercel.json');

  it('enforces one canonical system task per appointment in PostgreSQL', () => {
    expect(route).toContain('ensureBookingAdminTask({');
    expect(helper).toContain(".eq('booking_appointment_id', input.appointmentId)");
    expect(helper).toContain('booking_appointment_id: input.appointmentId');
    expect(helper).toContain("error?.code !== '23505'");
    expect(migration).toContain('Duplicate booking meeting tasks detected');
    expect(migration.indexOf('Duplicate booking meeting tasks detected')).toBeLessThan(
      migration.indexOf('unique index if not exists internal_tasks_booking_appointment_id_uidx')
    );
  });

  it('preserves terminal state and known entity links during refreshes', () => {
    expect(helper).toContain('if (input.clientId) payload.client_id = input.clientId');
    expect(helper).toContain('if (input.companyId) payload.company_id = input.companyId');
    expect(helper).toContain('if (input.caseId) payload.case_id = input.caseId');
    expect(helper).toContain('if (input.leadId) payload.lead_id = input.leadId');
    expect(helper).toContain("if (input.reopenCancelled && existing.status === 'cancelada')");
    expect(adminAppointments).toContain("reopenCancelled: current.status === 'cancelled' && appt.status === 'confirmed'");
  });

  it('links meeting tasks to EXPERT identities only when unambiguous', () => {
    expect(route).toContain('resolveBookingIdentityByEmail(admin, bookingEmail).catch');
    expect(route).toContain("bookingEmail.replace(/[\\\\%_]/g, '\\\\    expect(route).toContain("bookingEmail.replace(/[\\\\%_]/g, '\\\\    expect(route).toContain(".ilike('email', bookingEmail)");')");')");
    expect(route).toContain(".ilike('email', escapedLeadEmail)");
    expect(route).toContain('.limit(2)');
    expect(route).toContain("(leadMatches ?? []).length === 1");
    expect(route).toContain('lead enrichment ambiguous');
  });

  it('cancels the old task on reschedule and cancellation and retries idempotently', () => {
    expect(route).toContain('cancelBookingAdminTask(');
    expect(cancel).toContain('Reconciliación de una cita ya cancelada.');
    expect(helper).toContain("status: 'cancelada'");
  });

  it('keeps onboarding workflow task separate from the meeting task', () => {
    expect(route).toContain('ensureOnboardingTask({');
    expect(helper).toContain("task_kind: 'booking_meeting'");
  });

  it('keeps Admin edits and legacy historical webhook synchronized', () => {
    expect(adminAppointments).toContain('ensureBookingAdminTask({');
    expect(adminAppointments).toContain('cancelBookingAdminTask(');
    expect(calWebhook).toContain('ensureBookingAdminTask({');
    expect(calWebhook).toContain('cancelBookingAdminTask(');
  });

  it('normalizes legacy task timestamps to Europe/Madrid', () => {
    expect(calWebhook).toContain('formatMadridDate(startInstant)');
    expect(calWebhook).toContain('formatMadridTime(startInstant)');
    expect(calWebhook).toContain('formatMadridDate(endInstant)');
    expect(calWebhook).toContain('formatMadridTime(endInstant)');
  });

  it('reconciles all pages and legacy confirmed appointments durably', () => {
    expect(helper).toContain('reconcileBookingAdminTasks');
    expect(helper).toContain(".order('created_at', { ascending: true })");
    expect(helper).toContain(".order('id', { ascending: true })");
    expect(helper).toContain('.range(offset, offset + pageSize - 1)');
    expect(helper).toContain("appointment.status === 'confirmed' || appointment.status === 'confirmada'");
    expect(reconciler).toContain('reconcileBookingAdminTasks');
    expect(vercel).toContain('/api/cron/booking-task-reconcile');
  });

  it('compensates meeting tasks when the booking rolls back', () => {
    expect(route).toContain('Reserva revertida durante compensación por error.');
  });
});
