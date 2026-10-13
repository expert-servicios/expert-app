import Link from 'next/link';
import { getCatalogService } from '@/lib/utils/catalog';
import { ServicePriceCalculator } from '@/components/services/ServicePriceCalculator';

type RussianServiceKey = 'modelo-151' | 'impuesto-patrimonio' | 'impuesto-sociedades';
export const priorityRussianServices: Record<RussianServiceKey, { path: string; title: string; intro: string; includes: string[]; disclaimer: string }> = {
  'modelo-151': {
    path: '/ru/uslugi/modelo-151-regimen-beckham',
    title: 'Modelo 151 — специальный налоговый режим для переехавших в Испанию',
    intro: 'Проверяем соответствие требованиям специального режима impatriados (статья 93 LIRPF), возможность выбора режима через Modelo 149 и ежегодную декларацию Modelo 151.',
    includes: ['Проверка применимости и условий режима', 'Оформление выбора режима через Modelo 149', 'Подготовка ежегодной декларации Modelo 151', 'Консультация по международному налогообложению', 'Электронная подача и подтверждение'],
    disclaimer: 'Применение специального режима зависит от индивидуальных условий. Необходима предварительная проверка до подачи заявления.',
  },
  'impuesto-patrimonio': {
    path: '/ru/uslugi/impuesto-patrimonio-modelo-714',
    title: 'Impuesto sobre el Patrimonio — декларация Modelo 714',
    intro: 'Проверяем обязанность подачи декларации об имуществе, состав и оценку активов, региональные правила и подготавливаем Modelo 714.',
    includes: ['Проверка обязанности декларирования', 'Проверка состава и оценки активов', 'Учёт применимого необлагаемого минимума и правил автономного сообщества', 'Подготовка и подача Modelo 714', 'Подтверждение подачи'],
    disclaimer: 'Цена определяется калькулятором и подтверждается после проверки имущества; сложные оценки рассматриваются отдельно.',
  },
  'impuesto-sociedades': {
    path: '/ru/uslugi/impuesto-sociedades-modelo-200',
    title: 'Impuesto sobre Sociedades — корпоративный налог Modelo 200',
    intro: 'Сопровождаем закрытие бухгалтерского периода и подготовку декларации Modelo 200 для компаний с учётом налоговых корректировок и применимых вычетов.',
    includes: ['Проверка закрытия бухгалтерского периода', 'Налоговые корректировки и сверка', 'Подготовка Modelo 200', 'Проверка применимых авансовых платежей', 'Электронная подача и подтверждение'],
    disclaimer: 'Срок подачи зависит от даты окончания налогового периода компании; объём работы и цена определяются после проверки документов.',
  },
};

export function PriorityRussianService({ slug }: { slug: RussianServiceKey }) {
  const item = priorityRussianServices[slug];
  const service = getCatalogService(slug);
  if (!service) throw new Error('Missing canonical service: ' + slug);
  const esPath = '/servicios/' + service.categoria + '/' + service.slug;
  return (
    <main className="min-h-screen bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-5xl">
          <Link href="/ru/uslugi" className="text-sm font-semibold text-[#D4A017] hover:underline">← Услуги</Link>
          <h1 className="mt-6 font-serif text-3xl font-bold leading-tight md:text-5xl">{item.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/75">{item.intro}</p>
          <p className="mt-6 text-xl font-semibold text-[#D4A017]">{service.price === 'Consultar' ? 'Стоимость по запросу' : service.price === 'Precio variable' ? 'Цена рассчитывается индивидуально' : service.price ?? 'Стоимость по запросу'}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={'/solicitar-presupuesto?servicio=' + encodeURIComponent(service.slug) + '&origen=service%3A' + encodeURIComponent(service.slug)} className="inline-flex min-h-12 items-center bg-[#D4A017] px-6 py-3 font-bold text-[#0D1B2A]">Запросить расчёт стоимости</Link>
            <Link href={esPath} className="inline-flex min-h-12 items-center border border-[#D4A017] px-6 py-3 font-semibold text-white">Español</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-serif text-2xl font-bold">Что входит в услугу</h2>
        <ul className="mt-7 grid gap-4 sm:grid-cols-2">{item.includes.map(text => <li key={text} className="border border-[#D4A017]/25 bg-white p-5">{text}</li>)}</ul>
        {service.priceCalculator === 'patrimonio' && <div className="mt-10"><ServicePriceCalculator kind="patrimonio" origin={'service:' + service.slug} locale="ru" /></div>}
        <p className="mt-10 border-l-4 border-[#D4A017] bg-white p-5 text-sm leading-7">{item.disclaimer}</p>
      </section>
    </main>
  );
}
