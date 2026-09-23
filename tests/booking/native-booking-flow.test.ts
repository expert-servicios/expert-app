import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('native booking public flow', () => {
  const route = read('app/api/booking/route.ts');
  const availability = read('app/api/booking/availability/route.ts');
  const migration = read('supabase/migrations/20260923132714_native_google_booking.sql');
  const calendar = read('lib/integrations/google-calendar.ts');
  const adminRoute = read('app/api/admin/citas/route.ts');
  const dashboardRoute = read('app/api/dashboard/citas/route.ts');
  const badge = read('components/site/CalBadge.tsx');

  it('protects public booking creation', () => {
    expect(route).toContain("action: 'booking_create'");
    expect(route).toContain('checkRateLimit(ip)');
    expect(route).toContain('checkSpam(');
    expect(route).toContain("status: 'pending_calendar'");
  });

  it('creates Google Meet only after acquiring the local lock', () => {
    expect(route.indexOf(".from('appointments')")).toBeLessThan(route.indexOf('createCalendarMeetingSA({'));
    expect(route).toContain("booking_provider: 'google_native'");
    expect(route).toContain("status: 'confirmed'");
  });

  it('prevents concurrent overlaps at the database layer', () => {
    expect(migration).toContain('appointments_no_active_overlap');
    expect(migration).toContain("status in ('pending_calendar', 'confirmed')");
    expect(migration).toContain("tstzrange(appointment_date, appointment_end, '[)')");
  });

  it('extends legacy appointment constraints for native service keys and states', () => {
    expect(migration).toContain("'demo-holded'");
    expect(migration).toContain("'formacion-holded'");
    expect(migration).toContain("'pending_calendar'");
    expect(migration).toContain("'confirmed'");
  });

  it('uses both Google and local pending/confirmed occupancy', () => {
    expect(availability).toContain('listCalendarBusyWindowsSA');
    expect(availability).toContain("['pending_calendar', 'confirmed']");
  });

  it('enforces the same maximum booking horizon on POST', () => {
    expect(route).toContain('BOOKING_MAX_DAYS');
    expect(route).toContain('start.getTime() > now + BOOKING_MAX_DAYS');
  });

  it('binds private bookings to authenticated authorized emails', () => {
    expect(route).toContain('resolveAuthenticatedBookingIdentity');
    expect(route).toContain('getAuthorizedBookingEmails');
    expect(route).toContain('bookingEmail');
    expect(dashboardRoute).toContain('getAuthorizedBookingEmails');
    expect(dashboardRoute).toContain(".in('email', emails)");
  });

  it('runs onboarding and training operational side effects for native bookings', () => {
    expect(route).toContain('runNativeAdministrativeWorkflow');
    expect(route).toContain('ensureOnboardingTask');
    expect(route).toContain('onboardingPreparationEmail');
    expect(route).toContain('getAdminNotificationEmails');
  });

  it('waits for Meet creation before reporting success', () => {
    expect(calendar).toContain('cal.events.get');
    expect(calendar).toContain('Google Meet conference creation did not complete in time');
  });

  it('keeps admin moves and deletes synchronized with native Calendar events', () => {
    expect(adminRoute).toContain('appointment_end');
    expect(adminRoute).toContain('madridLocalToDate');
    expect(adminRoute).toContain('provider_booking_id');
    expect(adminRoute).toContain('La cita se conserva en EXPERT');
  });

  it('honors provider rollback URL in the floating badge', () => {
    expect(badge).toContain('getBookingProvider');
    expect(badge).toContain("window.location.assign(CAL_URL ?? '/cita?tipo=consulta-inicial')");
  });
});
