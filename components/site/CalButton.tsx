'use client';

import { type ReactNode } from 'react';
import { trackAcademyEvent, type AcademyAnalyticsEvent, type AcademyAnalyticsProps } from '@/lib/utils/analytics';

// Other legacy widgets still use the Cal.com global until their migration is complete.
// The booking link itself does not depend on this script.
declare global {
  interface Window {
    Cal?: (action: string, opts?: Record<string, unknown>) => void;
  }
}

interface Props {
  url: string | null;
  title?: string;
  subtitle?: string;
  className?: string;
  fallbackHref?: string;
  children: ReactNode;
  analyticsEvent?: AcademyAnalyticsEvent;
  analyticsProps?: AcademyAnalyticsProps;
}

/**
 * A real anchor allows public bookings without client hydration or optional
 * Cal.com scripts. Native /cita remains the fallback when URL is missing.
 */
export function CalButton({ url, className, fallbackHref = '/cita?tipo=consulta-inicial', children, analyticsEvent, analyticsProps }: Props) {
  const href = url || fallbackHref;
  return (
    <a
      href={href}
      onClick={() => {
        if (analyticsEvent) trackAcademyEvent(analyticsEvent, analyticsProps);
      }}
      className={className}
    >
      {children}
    </a>
  );
}
