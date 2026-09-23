import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('native booking public flow', () => {
  const route = read('app/api/booking/route.ts');
  const availability = read('app/api/booking/availability/route.ts');
  const migration = read('supabase/migrations/20260923130500_native_google_booking.sql');

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

  it('uses both Google and local pending/confirmed occupancy', () => {
    expect(availability).toContain('listCalendarBusyWindowsSA');
    expect(availability).toContain("['pending_calendar', 'confirmed']");
  });
});
