// Booking utility.
//
// Google Calendar / Meet is the active booking stack.
// Historical external-provider records and webhooks are handled separately as
// legacy compatibility and must never be selected for a new booking.
//
// New code should use getBooking*Url(). Existing getCal*Url() exports remain
// as deprecated compatibility aliases until their callers are renamed.

export type BookingProvider = 'google' | 'cal' | 'external' | 'none';

function absoluteUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function nativeBookingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_NATIVE_BOOKING_ENABLED !== 'false';
}

function bookingUrl(
  nativePath: string,
  googleUrl: string | undefined,
  options: { allowExternalGoogleFallback?: boolean } = {}
): string | null {
  if (nativeBookingEnabled()) return nativePath;

  return options.allowExternalGoogleFallback === false
    ? null
    : absoluteUrl(googleUrl);
}

export function getBookingProvider(url: string | null | undefined): BookingProvider {
  if (!url) return 'none';
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === 'calendar.app.google' || host.endsWith('.calendar.app.google') || host === 'calendar.google.com') {
      return 'google';
    }
    // Historical provider recognition only. No current booking URL generator
    // returns this provider.
    if (host === 'cal.com' || host.endsWith('.cal.com')) return 'cal';
    return 'external';
  } catch {
    return 'external';
  }
}

export function getBookingMeetingUrl(): string | null {
  return bookingUrl(
    '/cita?tipo=consulta-inicial',
    process.env.NEXT_PUBLIC_GOOGLE_BOOKING_REUNION_URL
  );
}

export function getBookingDemoUrl(): string | null {
  return bookingUrl(
    '/cita?tipo=demo-holded',
    process.env.NEXT_PUBLIC_GOOGLE_BOOKING_DEMO_URL
  );
}

export function getBookingOnboardingUrl(): string | null {
  return bookingUrl(
    '/cita?tipo=onboarding',
    process.env.NEXT_PUBLIC_GOOGLE_BOOKING_ONBOARDING_URL,
    {
      // External Google Appointment Schedules do not write back to EXPERT yet.
      // Private onboarding therefore fails closed instead of switching provider.
      allowExternalGoogleFallback: false,
    }
  );
}

export function getBookingFormacionUrl(): string | null {
  return bookingUrl(
    '/cita?tipo=formacion-holded',
    process.env.NEXT_PUBLIC_GOOGLE_BOOKING_FORMACION_URL,
    {
      // External Google Appointment Schedules do not write back to EXPERT yet.
      // Private training therefore fails closed instead of switching provider.
      allowExternalGoogleFallback: false,
    }
  );
}

export function getBookingAcademyUrl(): string | null {
  return bookingUrl(
    '/cita?tipo=academy-admision',
    process.env.NEXT_PUBLIC_GOOGLE_BOOKING_ACADEMY_URL
  );
}

/** @deprecated Use getBookingMeetingUrl(). */
export function getCalMeetingUrl(): string | null {
  return getBookingMeetingUrl();
}

/** @deprecated Use getBookingDemoUrl(). */
export function getCalDemoUrl(): string | null {
  return getBookingDemoUrl();
}

/** @deprecated Use getBookingOnboardingUrl(). */
export function getCalOnboardingUrl(): string | null {
  return getBookingOnboardingUrl();
}

/** @deprecated Use getBookingFormacionUrl(). */
export function getCalFormacionUrl(): string | null {
  return getBookingFormacionUrl();
}

/** @deprecated Use getBookingAcademyUrl(). */
export function getCalAcademyUrl(): string | null {
  return getBookingAcademyUrl();
}
