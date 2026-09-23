import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getBookingMeetingUrl,
  getBookingOnboardingUrl,
  getBookingProvider,
} from '@/lib/utils/cal';

describe('Google booking provider migration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers Google Appointment Schedules over legacy Cal.com when native booking is disabled', () => {
    vi.stubEnv('NEXT_PUBLIC_NATIVE_BOOKING_ENABLED', 'false');
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_BOOKING_REUNION_URL', 'https://calendar.app.google/abc123');
    vi.stubEnv('NEXT_PUBLIC_CAL_REUNION_LINK', 'expert/reunion');

    expect(getBookingMeetingUrl()).toBe('https://calendar.app.google/abc123');
    expect(getBookingProvider(getBookingMeetingUrl())).toBe('google');
  });

  it('keeps Cal.com as a temporary fallback when native booking is disabled', () => {
    vi.stubEnv('NEXT_PUBLIC_NATIVE_BOOKING_ENABLED', 'false');
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_BOOKING_REUNION_URL', '');
    vi.stubEnv('NEXT_PUBLIC_CAL_REUNION_LINK', 'expert/reunion');

    expect(getBookingMeetingUrl()).toBe('https://cal.com/expert/reunion');
    expect(getBookingProvider(getBookingMeetingUrl())).toBe('cal');
  });

  it('rejects non-http external booking URLs when native booking is disabled', () => {
    vi.stubEnv('NEXT_PUBLIC_NATIVE_BOOKING_ENABLED', 'false');
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_BOOKING_REUNION_URL', 'javascript:alert(1)');
    vi.stubEnv('NEXT_PUBLIC_CAL_REUNION_LINK', '');

    expect(getBookingMeetingUrl()).toBeNull();
  });
  it('uses EXPERT native booking by default', () => {
    vi.stubEnv('NEXT_PUBLIC_NATIVE_BOOKING_ENABLED', '');
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_BOOKING_REUNION_URL', 'https://calendar.app.google/abc123');
    vi.stubEnv('NEXT_PUBLIC_CAL_REUNION_LINK', 'expert/reunion');

    expect(getBookingMeetingUrl()).toBe('/cita?tipo=consulta-inicial');
  });

  it('keeps onboarding on Cal in rollback mode until external Google bookings are ingested', () => {
    vi.stubEnv('NEXT_PUBLIC_NATIVE_BOOKING_ENABLED', 'false');
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_BOOKING_ONBOARDING_URL', 'https://calendar.app.google/onboarding');
    vi.stubEnv('NEXT_PUBLIC_CAL_ONBOARDING_LINK', 'expert/onboarding');

    expect(getBookingOnboardingUrl()).toBe('https://cal.com/expert/onboarding');
    expect(getBookingProvider(getBookingOnboardingUrl())).toBe('cal');
  });

});
