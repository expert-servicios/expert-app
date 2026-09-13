'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureClientAttribution } from '@/lib/marketing/client-attribution';

export function AcquisitionTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    captureClientAttribution();
  }, [pathname, search]);

  return null;
}
