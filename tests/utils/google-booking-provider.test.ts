import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getBookingMeetingUrl,
  getBookingProvider,
} from '@/lib/utils/cal';

describe('Google booking provider migration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers Google Appointment Schedules over legacy Cal.com', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_BOOKING_REUNION_URL', 'https://calendar.app.google/abc123');
    vi.stubEnv('NEXT_PUBLIC_CAL_REUNION_LINK', 'expert/reunion');

    expect(getBookingMeetingUrl()).toBe('https://calendar.app.google/abc123');
    expect(getBookingProvider(getBookingMeetingUrl())).toBe('google');
  });

  it('keeps Cal.com as a temporary fallback', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_BOOKING_REUNION_URL', '');
    vi.stubEnv('NEXT_PUBLIC_CAL_REUNION_LINK', 'expert/reunion');

    expect(getBookingMeetingUrl()).toBe('https://cal.com/expert/reunion');
    expect(getBookingProvider(getBookingMeetingUrl())).toBe('cal');
  });

  it('rejects non-http booking URLs', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_BOOKING_REUNION_URL', 'javascript:alert(1)');
    vi.stubEnv('NEXT_PUBLIC_CAL_REUNION_LINK', '');

    expect(getBookingMeetingUrl()).toBeNull();
  });
});
