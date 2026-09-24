'use client';

import { type ReactNode } from 'react';
import { CalButton } from '@/components/site/CalButton';
import { getCalDemoUrl } from '@/lib/utils/cal';

const CAL_DEMO_URL = getCalDemoUrl();

interface Props {
  className?: string;
  children  : ReactNode;
}

export function HoldedCalButton({ className, children }: Props) {
  return (
    <CalButton
      url={CAL_DEMO_URL}
      fallbackHref="/cita?tipo=demo-holded"
      className={className}
    >
      {children}
    </CalButton>
  );
}
