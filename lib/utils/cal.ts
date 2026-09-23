// Booking utility.
//
// Google Calendar Appointment Schedules are the preferred provider.
// Cal.com variables are retained temporarily as a legacy fallback while
// historical bookings/webhooks are drained.
//
// New code should use getBooking*Url(). Existing getCal*Url() exports remain
// as compatibility aliases until the Cal.com migration is complete.

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

function legacyCalUrl(envVar: string | undefined): string | null {
  const link = envVar?.trim();
  if (!link) return null;

  // Preserve compatibility if a full Cal.com URL was supplied manually.
  const direct = absoluteUrl(link);
  if (direct) return direct;

  return `https://cal.com/${link}`;
}

function nativeBookingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_NATIVE_BOOKING_ENABLED !== 'false';
}

function bookingUrl(
  nativePath: string,
  googleUrl: string | undefined,
  legacyCalLink: string | undefined,
  options: { allowExternalGoogleFallback?: boolean } = {}
): string | null {
  if (nativeBookingEnabled()) return nativePath;

  const googleFallback =
    options.allowExternalGoogleFallback === false ? null : absoluteUrl(googleUrl);

  return googleFallback ?? legacyCalUrl(legacyCalLink);
}

export function getBookingProvider(url: string | null | undefined): BookingProvider {
  if (!url) return 'none';
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === 'calendar.app.google' || host.endsWith('.calendar.app.google') || host === 'calendar.google.com') {
      return 'google';
    }
    if (host === 'cal.com' || host.endsWith('.cal.com')) return 'cal';
    return 'external';
  } catch {
    return 'external';
  }
}

export function getBookingMeetingUrl(): string | null {
  return bookingUrl(
    '/cita?tipo=consulta-inicial',
    process.env.NEXT_PUBLIC_GOOGLE_BOOKING_REUNION_URL,
    process.env.NEXT_PUBLIC_CAL_REUNION_LINK
  );
}

export function getBookingDemoUrl(): string | null {
  return bookingUrl(
    '/cita?tipo=demo-holded',
    process.env.NEXT_PUBLIC_GOOGLE_BOOKING_DEMO_URL,
    process.env.NEXT_PUBLIC_CAL_DEMO_LINK
  );
}

export function getBookingOnboardingUrl(): string | null {
  return bookingUrl(
    '/cita?tipo=onboarding',
    process.env.NEXT_PUBLIC_GOOGLE_BOOKING_ONBOARDING_URL,
    process.env.NEXT_PUBLIC_CAL_ONBOARDING_LINK,
    {
      // External Google Appointment Schedules do not currently write back to
      // EXPERT appointments. In rollback mode, onboarding must therefore stay
      // on the legacy Cal flow until external Google ingestion exists.
      allowExternalGoogleFallback: false,
    }
  );
}

export function getBookingFormacionUrl(): string | null {
  return bookingUrl(
    '/cita?tipo=formacion-holded',
    process.env.NEXT_PUBLIC_GOOGLE_BOOKING_FORMACION_URL,
    process.env.NEXT_PUBLIC_CAL_FORMACION_LINK,
    {
      // External Google Appointment Schedules are not ingested into EXPERT yet.
      // Training rollback must therefore stay on the legacy Cal webhook path.
      allowExternalGoogleFallback: false,
    }
  );
}

export function getBookingAcademyUrl(): string | null {
  return bookingUrl(
    '/cita?tipo=academy-admision',
    process.env.NEXT_PUBLIC_GOOGLE_BOOKING_ACADEMY_URL,
    process.env.NEXT_PUBLIC_CAL_ACADEMY_LINK
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
