import { Check, FileCheck, Search, Upload } from 'lucide-react';

const steps = [
  { Icon: Check, es: ['Contratas online', 'Elige el servicio o solicita presupuesto según tu caso.'], ru: ['Заказываете онлайн', 'Выбираете услугу или запрашиваете индивидуальное предложение.'] },
  { Icon: Upload, es: ['Subes documentos', 'Envías la documentación necesaria desde un canal seguro.'], ru: ['Передаёте документы', 'Загружаете необходимые документы через защищённый канал.'] },
  { Icon: Search, es: ['Revisamos tu caso', 'Analizamos la información y gestionamos el trámite completo.'], ru: ['Мы проверяем дело', 'Анализируем документы и сопровождаем процедуру.'] },
  { Icon: FileCheck, es: ['Recibes resultado', 'Te entregamos justificantes, resolución o documentación final.'], ru: ['Получаете результат', 'Передаём подтверждение подачи, официальное решение (resolución) или итоговые документы.'] },
] as const;

export function SharedServiceProcess({ locale = 'es' }: { locale?: 'es' | 'ru' }) {
  const ru = locale === 'ru';
  return (
    <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">{ru ? 'Процесс' : 'Proceso'}</p>
          <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl">
            {ru ? 'Простой процесс без лишних формальностей.' : 'Un flujo pensado para clientes que no quieren perder tiempo.'}
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#9CA3AF] md:text-base">
            {ru ? 'Сложную работу выполняем мы: вы видите статус, передаёте документы и получаете результат.' : 'La parte compleja ocurre detrás: tú ves el estado, entregas documentos y recibes el resultado.'}
          </p>
        </div>
        <div className="mt-11 grid gap-4 md:grid-cols-4">
          {steps.map(({ Icon, es, ru: ruCopy }, index) => {
            const [title, description] = ru ? ruCopy : es;
            return (
              <article key={title} className="border border-[#D4A017]/25 bg-[#23364D]/35 p-6 shadow-[0_20px_45px_rgba(13,27,42,0.32)]">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-4xl font-bold text-[#D4A017]">{String(index + 1).padStart(2, '0')}</span>
                  <Icon className="h-8 w-8 stroke-[#D4A017]" strokeWidth={1.7} />
                </div>
                <h3 className="mt-7 font-serif text-xl font-bold text-[#F8F6F1]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#9CA3AF]">{description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
