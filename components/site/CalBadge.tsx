'use client';

import { usePathname } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { getCalMeetingUrl } from '@/lib/utils/cal';

const BOOKING_URL = getCalMeetingUrl();

/** Real navigation for public bookings, even if client JS does not hydrate. */
export function CalBadge() {
  const pathname = usePathname();
  if (pathname === '/cita') return null;

  return (
    <a
      href={BOOKING_URL ?? '/cita?tipo=consulta-inicial'}
      aria-label="Reservar cita gratuita"
      className="flex items-center gap-2 rounded-full bg-[#F2C14E] px-4 py-2.5 text-sm font-bold text-[#0D1B2A] shadow-[0_4px_18px_rgba(242,193,78,0.45)] transition hover:bg-[#D4A017] hover:shadow-[0_4px_22px_rgba(212,160,23,0.5)] active:scale-95"
    >
      <Calendar className="h-4 w-4 shrink-0" />
      Reservar cita
    </a>
  );
}
