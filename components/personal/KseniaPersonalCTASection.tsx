import Link from 'next/link';

type Locale = 'es' | 'ru';

/**
 * Reusable editorial CTA: each internal link resolves on the personal domain
 * (and its independent preview), while professional services belong to EXPERT.
 */
export function KseniaPersonalCTASection({
  locale,
  context = 'general',
}: {
  locale: Locale;
  context?: 'general' | 'mentorias';
}) {
  const ru = locale === 'ru';
  const mentoring = context === 'mentorias';
  return (
    <section aria-label={ru ? 'Следующие шаги' : 'Próximos pasos'} className="border-y border-[#182A32]/10 bg-[#EAE2D4] px-6 py-14 md:px-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7B5929]">
          {ru ? 'Следующий шаг' : 'El siguiente paso'}
        </p>
        <h2 className="mt-3 max-w-3xl font-serif text-3xl leading-tight text-[#182A32] md:text-4xl">
          {mentoring
            ? (ru ? 'Обсудим ваш проект и определим приоритеты.' : 'Hablemos de tu proyecto y sus prioridades.')
            : (ru ? 'Есть идея или предложение? Давайте обсудим.' : '¿Tienes una idea o propuesta? Hablemos.')}
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#536167]">
          {ru
            ? 'Выберите подходящий способ связи: ознакомительная встреча, письменное предложение или информация о наставничестве.'
            : 'Elige cómo prefieres continuar: una conversación inicial, una propuesta escrita o información sobre mentoría.'}
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link data-personal-cta="booking" data-personal-placement="content" href={ru ? '/ru/reservar' : '/reservar'} className="inline-flex min-h-12 items-center justify-center bg-[#182A32] px-6 py-3 text-center text-sm font-semibold text-white hover:bg-[#30454B] focus-visible:outline-2 focus-visible:outline-offset-2">
            {ru ? 'Забронировать 15 минут' : 'Reservar 15 minutos'}
          </Link>
          <a data-personal-cta="contact" data-personal-placement="content" href={mentoring ? (ru ? '#obratitsya' : '#colaborar') : (ru ? '#contact' : '#contacto')} className="inline-flex min-h-12 items-center justify-center border border-[#182A32] px-6 py-3 text-center text-sm font-semibold text-[#182A32] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2">
            {ru ? 'Отправить предложение' : 'Enviar una propuesta'}
          </a>
          {!mentoring && <Link data-personal-cta="mentoring" data-personal-placement="content" href={ru ? '/ru/mentorias' : '/mentorias'} className="inline-flex min-h-12 items-center justify-center border border-[#182A32]/30 px-6 py-3 text-center text-sm font-semibold text-[#182A32] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2">
            {ru ? 'Узнать о наставничестве' : 'Conocer mis mentorías'}
          </Link>}
          {mentoring && <a data-personal-cta="expert" data-personal-placement="content" href="https://expertconsulting.es/servicios" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center border border-[#182A32]/30 px-6 py-3 text-center text-sm font-semibold text-[#182A32] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2">
            {ru ? 'Услуги EXPERT' : 'Servicios de EXPERT'}
          </a>}
        </div>
      </div>
    </section>
  );
}
