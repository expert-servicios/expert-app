'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { captureClientAttribution } from '@/lib/marketing/client-attribution';

export function AcquisitionTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Read window.location.search inside the capture helper. Avoid useSearchParams here
    // because this tracker lives in the shared public layout and must not force every
    // statically generated page behind a Suspense boundary.
    captureClientAttribution();
  }, [pathname]);

  return null;
}
