import Link from 'next/link';
import type { Metadata } from 'next';
import { Check, Clock, ListChecks } from 'lucide-react';
import { getCatalogService } from '@/lib/utils/catalog';
import { isLocalePubliclyEnabled } from '@/lib/i18n/feature-flags';
import { getLocalizedServicePresentation } from '@/lib/services/service-localized-content';

const SERVICE_SLUG = 'nif-socio-extranjero';
const ES_URL = 'https://expertconsulting.es/servicios/empresas-autonomos/nif-socio-extranjero';
const RU_PATH = '/ru/uslugi/nif-dlya-inostrannogo-partnera';
const RU_URL = `https://expertconsulting.es${RU_PATH}`;
const INDEXABLE = isLocalePubliclyEnabled('ru')
  && getLocalizedServicePresentation(SERVICE_SLUG, 'ru')?.indexable === true;

if (!getCatalogService(SERVICE_SLUG)) {
  throw new Error('Canonical nif-socio-extranjero service is missing from the catalog.');
}

const budgetHref = `/solicitar-presupuesto?servicio=${SERVICE_SLUG}`;
const complexBudgetHref = `${budgetHref}&tipo=caso-complejo`;

const PRICE_RU = '60 € + IVA / человек';
const DURATION_RU = '5–10 рабочих дней';

const includes = [
  'Заполнение Modelo 030 / EX-15',
  'Координация с налоговым представителем в Испании',
  'Подача в компетентный орган',
  'Сопровождение дела до получения NIF',
];

const requirements = [
  'Действующий паспорт партнёра или администратора',
  'Доверенность на представительство, если оформление не производится лично',
];

const faqs = [
  {
    q: 'Сколько NIF нужно оформить?',
    a: 'По одному на каждого иностранного партнёра или администратора без NIE, который будет указан в учредительном акте. Смета рассчитывается по количеству нужных NIF.',
  },
  {
    q: 'Заменяет ли NIF собой NIE?',
    a: 'Нет. NIF нужен исключительно в налоговых целях для учреждения компании; если партнёр планирует проживать в Испании, ему дополнительно потребуется оформить NIE/TIE.',
  },
];

export const metadata: Metadata = {
  title: 'NIF для иностранного партнёра компании в Испании | EXPERT',
  description:
    `Получение NIF для иностранных партнёров и администраторов без NIE, которые войдут в состав испанской компании. ${PRICE_RU}.`,
  alternates: {
    canonical: RU_URL,
    languages: {
      'es-ES': ES_URL,
      'ru-RU': RU_URL,
      'x-default': ES_URL,
    },
  },
  robots: {
    index: INDEXABLE,
    follow: INDEXABLE,
  },
  openGraph: {
    title: 'NIF для иностранного партнёра компании | EXPERT',
    description: 'Modelo 030/EX-15 и сопровождение до получения NIF для учредителей и администраторов без NIE.',
    url: RU_URL,
    type: 'website',
    locale: 'ru_RU',
    siteName: 'EXPERT',
  },
};

export default function RuNifSocioExtranjeroPage() {
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'NIF для иностранного партнёра компании',
    description:
      'Оформление Номера налогоплательщика (NIF) для иностранных партнёров, администраторов или представителей, которые войдут в состав испанской компании и не имеют NIE. Необходим для учреждения компании, подписания документов у нотариуса и внесения в Registro Mercantil.',
    serviceType: 'Empresas y Autónomos',
    provider: {
      '@type': 'Organization',
      name: 'EXPERT',
    },
    areaServed: {
      '@type': 'Country',
      name: 'España',
    },
    url: RU_URL,
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <section className="bg-[#0D1B2A] px-6 py-12 text-[#F8F6F1] md:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/ru/uslugi" className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017] hover:text-[#F2C14E]">
              ← Услуги
            </Link>
            <Link href={ES_URL.replace('https://expertconsulting.es', '')} className="text-xs font-semibold text-white/55 underline underline-offset-4 hover:text-[#D4A017]">
              Español
            </Link>
          </div>

          <h1 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
            NIF для иностранного партнёра компании
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
            Оформляем NIF для иностранных партнёров, администраторов или представителей, которые войдут
            в состав испанской компании и не имеют NIE. NIF необходим, чтобы учредить компанию, подписать
            документы у нотариуса и фигурировать в Registro Mercantil.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="border border-white/12 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Услуга</p>
              <p className="mt-2 text-2xl font-bold text-white">{PRICE_RU}</p>
              <p className="mt-2 text-xs leading-5 text-white/55">
                Цена за каждого партнёра или администратора, которому нужен NIF.
              </p>
            </div>
            <div className="border border-white/12 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Срок
              </p>
              <p className="mt-2 text-xl font-bold text-white">{DURATION_RU}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={budgetHref}
              className="inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-8 py-3 text-sm font-bold text-[#0D1B2A] shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#F2C14E]"
            >
              Запросить смету
            </Link>
            <Link
              href={complexBudgetHref}
              className="inline-flex min-h-12 items-center justify-center border border-[#D4A017] px-8 py-3 text-sm font-semibold text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Сложный случай
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-12 md:py-16 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-10">
          <div>
            <h2 className="font-serif text-2xl font-bold">Что входит в услугу</h2>
            <ul className="mt-5 space-y-3">
              {includes.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                  <span className="text-[15px] leading-6 text-[#23364D]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold">Требования</h2>
            <ul className="mt-5 space-y-3">
              {requirements.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                  <span className="text-[15px] leading-6 text-[#23364D]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold">Частые вопросы</h2>
            <div className="mt-6 space-y-5">
              {faqs.map(({ q, a }) => (
                <div key={q} className="border-l-2 border-[#D4A017] pl-5">
                  <p className="font-semibold">{q}</p>
                  <p className="mt-2 text-sm leading-6 text-[#23364D]">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <div className="overflow-hidden border border-[#D4A017]/30 bg-white">
            <div className="border-b border-[#D4A017]/20 bg-[#D4A017]/8 px-6 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4A017]">Стоимость</p>
              <p className="mt-1 text-2xl font-bold">{PRICE_RU}</p>
              <p className="mt-1 text-xs leading-5 text-[#23364D]/65">
                Цена за каждого партнёра/администратора, которому нужен NIF.
              </p>
              <p className="mt-2 text-xs leading-5 text-[#23364D]/65">Срок: {DURATION_RU}.</p>
            </div>
            <div className="space-y-3 px-6 py-5">
              <div className="mb-1 flex items-center gap-2.5 text-[#23364D]/70">
                <ListChecks className="h-4 w-4 text-[#D4A017]" />
                <p className="text-[10px] font-bold uppercase tracking-wider">Расчёт по числу партнёров</p>
              </div>
              <Link
                href={budgetHref}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[#D4A017] px-4 py-2.5 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 transition hover:bg-[#F2C14E]"
              >
                Оставить заявку
              </Link>
              <a
                href="https://wa.me/34669045528"
                className="block w-full border border-[#D4A017]/30 px-4 py-2.5 text-center text-sm font-semibold text-[#23364D] transition hover:border-[#D4A017] hover:bg-[#D4A017]/5"
              >
                Задать вопрос в WhatsApp
              </a>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
