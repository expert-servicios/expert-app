import type { ReactNode } from 'react';
import { isBookingCalendarConfigured } from '@/lib/booking/calendar-provider';

export async function KseniaPersonalBookingGate({
  locale,
  children,
}: {
  locale: 'es' | 'ru';
  children: ReactNode;
}) {
  // Never expose apparently available slots when the dedicated calendar is not connected.
  const ready = await isBookingCalendarConfigured().catch(() => false);
  if (ready) return <>{children}</>;

  const ru = locale === 'ru';
  return (
    <div role="status" className="border border-[#CBB68F] bg-white p-6 text-[#182A32] shadow-sm md:p-8">
      <h2 className="font-serif text-2xl">{ru ? 'Онлайн-запись временно недоступна' : 'La reserva online está pendiente de activación'}</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#536167]">
        {ru
          ? 'Проверка занятости календаря ещё не подключена. Чтобы избежать пересечения встреч, мы пока не предлагаем время для записи.'
          : 'Estamos terminando la conexión segura del calendario. Para evitar reservas duplicadas, todavía no mostramos horarios disponibles.'}
      </p>
      <a href="mailto:soy@kseniailicheva.com" className="mt-5 inline-flex min-h-12 items-center justify-center bg-[#182A32] px-5 py-3 text-sm font-semibold text-white">
        {ru ? 'Написать Ксении' : 'Escribirme por correo'}
      </a>
    </div>
  );
}
