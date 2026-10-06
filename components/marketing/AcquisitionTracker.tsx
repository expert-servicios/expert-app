'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { captureClientAttribution, clearClientAttribution } from '@/lib/marketing/client-attribution';
import {
  COOKIE_CONSENT_EVENT,
  readCookieConsent,
  type StoredCookieConsent,
} from '@/lib/privacy/cookie-consent';

export function AcquisitionTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const captureIfAllowed = () => {
      if (readCookieConsent()?.value === 'accepted') captureClientAttribution();
    };
    captureIfAllowed();

    const onConsent = (event: Event) => {
      const detail = (event as CustomEvent<StoredCookieConsent>).detail;
      if (detail?.value === 'accepted') captureClientAttribution();
      else if (detail?.value === 'rejected') clearClientAttribution();
    };
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsent as EventListener);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent as EventListener);
  }, [pathname]);

  return null;
}
