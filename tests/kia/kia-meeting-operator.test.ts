import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA Google meeting operator', () => {
  const operator = source('lib/booking/kia-booking-operator.ts');
  const executor = source('lib/ai/kia/kia-tool-executor.ts');
  const definitions = source('lib/ai/kia/kia-tool-definitions.ts');
  const registry = source('lib/ai/kia/kia-tool-registry.ts');
  const bookingRoute = source('app/api/booking/route.ts');
  const cancelRoute = source('app/api/booking/manage/cancel/route.ts');
  const notifications = source('lib/booking/booking-admin-notifications.ts');

  it('exposes read availability and consequential meeting creation separately', () => {
    expect(definitions).toContain('get_booking_availability');
    expect(definitions).toContain('create_booking_meeting');
    expect(registry).toContain("get_booking_availability:             policy('R0', 'read',  'calendar')");
    expect(registry).toContain("create_booking_meeting:               policy('R2', 'external_action', 'calendar')");
  });

  it('limits KIA-created meetings to public booking services', () => {
    expect(operator).toContain("'consulta-inicial'");
    expect(operator).toContain("'demo-holded'");
    expect(operator).toContain("'academy-admision'");
    expect(operator).toContain('kia_booking_service_not_allowed');
  });

  it('requires explicit confirmation with exact date and time', () => {
    expect(operator).toContain('hasExplicitSlotConfirmation');
    expect(operator).toContain('affirmative && dateMention && timeMention');
    expect(operator).toContain('kia_booking_explicit_confirmation_required');
    expect(operator).toContain('latestUserText(input.contextMessages)');
  });

  it('rechecks working hours, slot grid and real occupancy before writing', () => {
    expect(operator).toContain('BOOKING_OPEN_HOUR');
    expect(operator).toContain('BOOKING_CLOSE_HOUR');
    expect(operator).toContain('BOOKING_SLOT_STEP_MINUTES');
    expect(operator).toContain('listBookingCalendarBusyWindows');
    expect(operator).toContain("['pending_calendar', 'confirmed']");
    expect(operator).toContain('overlapsBusy(start, end, busy)');
  });

  it('uses the local DB lock before creating Calendar and compensates failures', () => {
    expect(operator.indexOf(".from('appointments')")).toBeLessThan(operator.indexOf('createBookingCalendarMeeting({'));
    expect(operator).toContain("status: 'pending_calendar'");
    expect(operator).toContain("status: 'confirmed'");
    expect(operator).toContain("insertError?.code === '23P01'");
    expect(operator).toContain('deleteBookingCalendarEvent');
    expect(operator).toContain('remoteCleanupSucceeded');
  });

  it('binds the booking email to the conversation identity', () => {
    expect(executor).toContain('context.contact.email.toLowerCase() !== attendeeEmail');
    expect(executor).toContain('El email de la reserva no coincide con el contacto');
  });

  it('creates Meet, Admin task, client confirmation and KIA push', () => {
    expect(operator).toContain('ensureBookingAdminTask({');
    expect(operator).toContain("eventType: 'cita.confirmed'");
    expect(operator).toContain("source: 'kia'");
    expect(operator).toContain("kind: 'kia_created'");
    expect(operator).toContain('meetingUrl: meeting.meetingUrl');
  });

  it('pushes standard booking lifecycle changes too', () => {
    expect(bookingRoute).toContain("kind: rescheduledAppointment ? 'rescheduled' : 'created'");
    expect(cancelRoute).toContain("kind: 'cancelled'");
    expect(notifications).toContain("kia_created: 'KIA creó una reunión'");
    expect(notifications).toContain("url: '/admin/citas'");
  });
});
