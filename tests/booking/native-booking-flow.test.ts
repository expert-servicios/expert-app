import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('native booking public flow', () => {
  const route = read('app/api/booking/route.ts');
  const availability = read('app/api/booking/availability/route.ts');
  const migration = read('supabase/migrations/20260923132714_native_google_booking.sql');
  const calendar = read('lib/integrations/google-calendar.ts');
  const calendarProvider = read('lib/booking/calendar-provider.ts');
  const microsoft = read('lib/integrations/microsoft365.ts');
  const adminRoute = read('app/api/admin/citas/route.ts');
  const dashboardRoute = read('app/api/dashboard/citas/route.ts');
  const badge = read('components/site/CalBadge.tsx');
  const privateAuth = read('lib/booking/private-booking-authorization.ts');
  const stripeWebhook = read('app/api/stripe/webhook/route.ts');
  const holdedDemoAdmin = read('app/api/admin/holded-demos/route.ts');
  const legacyCalWebhook = read('app/api/webhooks/cal/route.ts');

  it('protects public booking creation', () => {
    expect(route).toContain("action: 'booking_create'");
    expect(route).toContain('checkRateLimit(ip)');
    expect(route).toContain('checkSpam(');
    expect(route).toContain("status: 'pending_calendar'");
  });

  it('creates the provider meeting only after acquiring the local lock', () => {
    expect(route.indexOf(".from('appointments')")).toBeLessThan(route.indexOf('createBookingCalendarMeeting({'));
    expect(route).toContain("calendarProvider === 'ms365' ? 'ms365_native' : 'google_native'");
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

  it('uses both the configured calendar provider and local pending/confirmed occupancy', () => {
    expect(availability).toContain('listBookingCalendarBusyWindows');
    expect(availability).toContain("['pending_calendar', 'confirmed']");
    expect(calendarProvider).toContain("BOOKING_CALENDAR_PROVIDER");
  });

  it('enforces the same maximum booking horizon on POST', () => {
    expect(route).toContain('BOOKING_MAX_DAYS');
    expect(route).toContain('start.getTime() > now + BOOKING_MAX_DAYS');
  });

  it('binds private bookings to a real entitlement and authorized email', () => {
    expect(route).toContain('verifyPrivateBookingAuthorization');
    expect(route).toContain('listOpenOnboardingCompanyIds');
    expect(route).toContain('getAuthorizedBookingEmails');
    expect(route).toContain('bookingEmail');
    expect(route).toContain("source: 'auth_email'");
    expect(route).toContain('una suscripción activa');
    expect(dashboardRoute).toContain('getAuthorizedBookingEmails');
    expect(dashboardRoute).toContain(".in('email', emails)");
    expect(privateAuth).toContain("purpose: 'private_booking'");
    expect(stripeWebhook).toContain('createPrivateBookingAuthorization');
    expect(holdedDemoAdmin).toContain("source: 'holded_demo'");
  });

  it('runs onboarding and training operational side effects for native bookings', () => {
    expect(route).toContain('runNativeAdministrativeWorkflow');
    expect(route).toContain('ensureOnboardingTask');
    expect(route).toContain('onboardingPreparationEmail');
    expect(route).toContain('getAdminNotificationEmails');
    expect(route).toContain('identity: BookingIdentity | null');
    expect(route).toContain('Onboarding booking requires a resolved EXPERT client identity');
    expect(route).toContain("company_id: identity?.companyId ?? null");
  });

  it('waits for Meet creation and compensates orphan events before reporting failure', () => {
    expect(calendar).toContain('cal.events.get');
    expect(calendar).toContain('Google Meet conference creation did not complete in time');
    expect(calendar).toContain('CalendarMeetingCreationError');
    expect(calendar).toContain('cleanup after Meet creation failure');
    expect(route).toContain('error instanceof BookingCalendarCreationError');
    expect(route).toContain('provider_booking_id: providerEventId');
  });

  it('keeps admin moves and deletes synchronized with native Calendar events', () => {
    expect(adminRoute).toContain('appointment_end');
    expect(adminRoute).toContain('madridLocalToDate');
    expect(adminRoute).toContain('provider_booking_id');
    expect(adminRoute).toContain('updateBookingCalendarMeeting');
    expect(adminRoute).toContain("(appt.google_event_id ? 'google' : getConfiguredBookingCalendarProvider())");
    expect(adminRoute).toContain('requiresRemoteSync');
    expect(adminRoute).toContain('El proveedor de calendario de esta cita no está conectado');
    expect(adminRoute).toContain('EXPERT ha restaurado la cita al estado anterior');
    expect(adminRoute).toContain('metadataSyncError');
    expect(adminRoute).toContain('Only advertise fresh values after the metadata write succeeded');
    expect(adminRoute).toContain('appt.meeting_url = meetingUrl');
    expect(adminRoute).toContain('appt.provider_booking_id = syncedEventId');
    expect(adminRoute).toContain("creationError?.cleanupFailed === true");
    expect(adminRoute).toContain('existingRemoteEventUpdated');
    expect(adminRoute).toContain('keepSynchronizedSchedule');
    expect(adminRoute).toContain('reconciliationMeetingUrl');
    expect(adminRoute).toContain('creationError?.cleanupFailed === true && creationError.meetingUrl');
    expect(adminRoute).toContain('provider_booking_id: reconciliationEventId ?? current.provider_booking_id');
    expect(adminRoute).toContain("[current.admin_notes?.trim(), reconciliationNotice]");
    expect(adminRoute).toContain("error: 'No se pudo persistir el estado de reconciliación de Calendar.'");
    expect(adminRoute).toContain('recovery: {');
    expect(adminRoute).toContain('if (!keepSynchronizedSchedule)');
    expect(adminRoute).toContain('Existing remote event and local schedule now agree');
    expect(adminRoute).toContain('requiere reconciliación tras fallo de sincronización');
    expect(adminRoute).toContain('La cita se conserva en EXPERT');
    expect(calendar).toContain('cal.events.patch');
    expect(calendar).toContain('status === 404 || status === 410');
    expect(calendarProvider).toContain('deleteBookingCalendarEvent');
    expect(legacyCalWebhook).toContain('appointment_end: payload.endTime');
  });

  it('supports Microsoft Calendar + Teams without changing the Google default', () => {
    expect(calendarProvider).toContain("return process.env.BOOKING_CALENDAR_PROVIDER?.trim().toLowerCase() === 'ms365'");
    expect(calendarProvider).toContain("bookingProvider: 'ms365_native'");
    expect(microsoft).toContain("'Calendars.ReadWrite'");
    expect(microsoft).toContain("isOnlineMeeting: true");
    expect(microsoft).toContain("onlineMeetingProvider: 'teamsForBusiness'");
    expect(microsoft).toContain("data?.onlineMeeting?.joinUrl");
    expect(microsoft).toContain("?$select=id,onlineMeeting");
    expect(microsoft).toContain('removing the online-meeting blob from body content can disable');
    expect(microsoft).toContain('readOptionalGraphJson');
    expect(microsoft).toContain("if (!text.trim()) return null");
    expect(calendarProvider).toContain('cleanupTokens = result.refreshed');
    expect(calendarProvider).toContain('Microsoft token persistence failed after event creation and cleanup failed');
    expect(calendarProvider).toContain('result.meetingUrl');
    expect(calendarProvider).toContain('BookingCalendarDeletionError');
    expect(calendarProvider).toContain('remoteDeleted');
    expect(route).toContain('cleanupError instanceof BookingCalendarDeletionError');
    expect(route).toContain('cleanupError.remoteDeleted');
    expect(adminRoute).toContain('calendarError instanceof BookingCalendarDeletionError');
    expect(adminRoute).toContain('calendarError.remoteDeleted');
    expect(adminRoute).toContain('deleteError.remoteDeleted');
    expect(adminRoute).toContain("calendar deleted; token persistence failed");
    expect(calendarProvider).toContain('result.eventId');
    expect(calendarProvider).toContain('remote event was compensated');
  });

  it('persists administrative workflow failures for reconciliation', () => {
    expect(route).toContain('Administrative booking workflow failed');
    expect(route).toContain(".update({");
    expect(route).toContain('admin_notes');
  });

  it('honors provider rollback URL in the floating badge', () => {
    expect(badge).toContain('getBookingProvider');
    expect(badge).toContain("window.location.assign(CAL_URL ?? '/cita?tipo=consulta-inicial')");
  });
});
