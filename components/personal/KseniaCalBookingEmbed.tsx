'use client';

import { useState } from 'react';

interface Props {
  url: string;
  locale: 'es' | 'ru';
}

/**
 * Cal.com is not loaded until the visitor explicitly chooses to open it.
 * The remote event type must be configured with the owner's Outlook calendar
 * (and any other conflict calendars) within the existing Cal.com account.
 */
export function KseniaCalBookingEmbed({ url, locale }: Props) {
  const [loaded, setLoaded] = useState(false);
  const ru = locale === 'ru';
  const iframeUrl = new URL(url);
  iframeUrl.searchParams.set('embed', 'true');
  iframeUrl.searchParams.set('layout', 'month_view');
  iframeUrl.searchParams.set('lang', locale);

  return (
    <section aria-label={ru ? 'Запись через Cal.com' : 'Reservas con Cal.com'} className="border border-[#CBB68F] bg-white p-5 shadow-sm md:p-8">
      <p className="font-serif text-2xl text-[#182A32]">
        {ru ? 'Выберите время через Cal.com' : 'Elige tu horario con Cal.com'}
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#536167]">
        {ru
          ? 'Расписание откроется после вашего согласия загрузить внешний сервис Cal.com. Доступность определяется подключёнными в Cal.com календарями.'
          : 'La agenda se cargará cuando decidas abrir el servicio externo Cal.com. Los horarios dependen de los calendarios conectados a esa cuenta.'}
      </p>
      {!loaded ? (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="mt-6 inline-flex min-h-12 items-center justify-center bg-[#182A32] px-6 py-3 text-sm font-semibold text-white hover:bg-[#30454B]"
        >
          {ru ? 'Показать свободное время' : 'Mostrar horarios disponibles'}
        </button>
      ) : (
        <iframe
          title={ru ? 'Календарь Ксении в Cal.com' : 'Agenda de Ksenia en Cal.com'}
          src={iframeUrl.toString()}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="fullscreen"
          className="mt-6 h-[700px] min-h-[600px] w-full rounded-md border border-[#CBB68F]/40"
        />
      )}
      <div className="mt-5">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[#765322] underline underline-offset-4"
        >
          {ru ? 'Открыть Cal.com в отдельной вкладке' : 'Abrir Cal.com en otra pestaña'}
        </a>
      </div>
    </section>
  );
}
