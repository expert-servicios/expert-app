import type { ReactNode } from 'react';
import { isBookingCalendarConfigured } from '@/lib/booking/calendar-provider';

function microsoftBookingsUrl(): string | null {
  const configured = process.env.PERSONAL_MICROSOFT_BOOKINGS_URL?.trim();
  if (!configured) return null;
  try {
    const url = new URL(configured);
    return url.protocol === 'https:' &&
      url.hostname === 'bookings.cloud.microsoft' &&
      url.pathname.startsWith('/bookwithme/user/')
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

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
  const bookingsUrl = microsoftBookingsUrl();
  return (
    <div role="status" className="border border-[#CBB68F] bg-white p-6 text-[#182A32] shadow-sm md:p-8">
      <h2 className="font-serif text-2xl">{ru ? 'Онлайн-запись временно недоступна' : 'La reserva online está pendiente de activación'}</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#536167]">
        {bookingsUrl
          ? (ru
              ? 'Запись доступна через личную страницу Microsoft Bookings, связанную с моим календарём Outlook. Выберите удобное время там; эта страница пока не показывает слоты автоматически.'
              : 'Puedes consultar los horarios directamente en mi página de Microsoft Bookings, vinculada a mi calendario de Outlook. Esta web aún no muestra los huecos automáticamente.')
          : (ru
              ? 'Проверка занятости календаря ещё не подключена. Чтобы избежать пересечения встреч, мы пока не предлагаем время для записи.'
              : 'Estamos terminando la conexión segura del calendario. Para evitar reservas duplicadas, todavía no mostramos horarios disponibles.')}
      </p>
      {bookingsUrl && (
        <a href={bookingsUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-12 items-center justify-center bg-[#182A32] px-5 py-3 text-sm font-semibold text-white">
          {ru ? 'Открыть Microsoft Bookings' : 'Consultar horarios en Microsoft Bookings'}
        </a>
      )}
      <a href="mailto:soy@kseniailicheva.com" className="mt-4 inline-flex min-h-12 items-center justify-center border border-[#182A32] px-5 py-3 text-sm font-semibold text-[#182A32]">
        {ru ? 'Написать Ксении' : 'Escribirme por correo'}
      </a>
    </div>
  );
}
