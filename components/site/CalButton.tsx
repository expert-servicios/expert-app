'use client';

import { type ReactNode } from 'react';
import { trackAcademyEvent, type AcademyAnalyticsEvent, type AcademyAnalyticsProps } from '@/lib/utils/analytics';

declare global {
  interface Window {
    Cal?: (action: string, opts?: Record<string, unknown>) => void;
  }
}

interface Props {
  url         : string | null;
  title?      : string;
  subtitle?   : string;
  className?  : string;
  fallbackHref?: string;
  children    : ReactNode;
  analyticsEvent?: AcademyAnalyticsEvent;
  analyticsProps?: AcademyAnalyticsProps;
}

function isCalUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'cal.com' || host.endsWith('.cal.com');
  } catch {
    return false;
  }
}

function toCalLink(url: string): string {
  try { return new URL(url).pathname.slice(1); } catch { return url; }
}

export function CalButton({ url, className, fallbackHref = '/cita?tipo=consulta-inicial', children, analyticsEvent, analyticsProps }: Props) {
  return (
    <button
      type="button"
      onClick={() => {
        if (analyticsEvent) trackAcademyEvent(analyticsEvent, analyticsProps);

        if (url) {
          if (isCalUrl(url) && window.Cal) {
            window.Cal('modal', { calLink: toCalLink(url), config: { layout: 'month_view' } });
            return;
          }
          window.location.assign(url);
          return;
        }

        window.location.assign(fallbackHref);
      }}
      className={className}
    >
      {children}
    </button>
  );
}
