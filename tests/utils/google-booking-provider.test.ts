import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getBookingFormacionUrl,
  getBookingMeetingUrl,
  getBookingOnboardingUrl,
  getBookingProvider,
} from '@/lib/utils/cal';

describe('Google booking provider migration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses Google Appointment Schedules when native booking is disabled', () => {
    vi.stubEnv('NEXT_PUBLIC_NATIVE_BOOKING_ENABLED', 'false');
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_BOOKING_REUNION_URL', 'https://calendar.app.google/abc123');

    expect(getBookingMeetingUrl()).toBe('https://calendar.app.google/abc123');
    expect(getBookingProvider(getBookingMeetingUrl())).toBe('google');
  });

  it('never generates a new legacy-provider booking URL', () => {
    vi.stubEnv('NEXT_PUBLIC_NATIVE_BOOKING_ENABLED', 'false');
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_BOOKING_REUNION_URL', '');
    vi.stubEnv('NEXT_PUBLIC_CAL_REUNION_LINK', 'legacy/reunion');

    expect(getBookingMeetingUrl()).toBeNull();
  });

  it('rejects non-http external booking URLs when native booking is disabled', () => {
    vi.stubEnv('NEXT_PUBLIC_NATIVE_BOOKING_ENABLED', 'false');
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_BOOKING_REUNION_URL', 'javascript:alert(1)');

    expect(getBookingMeetingUrl()).toBeNull();
  });

  it('uses EXPERT native booking by default', () => {
    vi.stubEnv('NEXT_PUBLIC_NATIVE_BOOKING_ENABLED', '');
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_BOOKING_REUNION_URL', 'https://calendar.app.google/abc123');

    expect(getBookingMeetingUrl()).toBe('/cita?tipo=consulta-inicial');
  });

  it('fails closed for private onboarding if native booking is disabled', () => {
    vi.stubEnv('NEXT_PUBLIC_NATIVE_BOOKING_ENABLED', 'false');
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_BOOKING_ONBOARDING_URL', 'https://calendar.app.google/onboarding');

    expect(getBookingOnboardingUrl()).toBeNull();
  });

  it('fails closed for private training if native booking is disabled', () => {
    vi.stubEnv('NEXT_PUBLIC_NATIVE_BOOKING_ENABLED', 'false');
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_BOOKING_FORMACION_URL', 'https://calendar.app.google/training');

    expect(getBookingFormacionUrl()).toBeNull();
  });
});
