import Link from 'next/link';
import type { Metadata } from 'next';
import { Check, CheckCircle2, Clock, GraduationCap, ListChecks } from 'lucide-react';
import { getCatalogService } from '@/lib/utils/catalog';
import { isLocalePubliclyEnabled } from '@/lib/i18n/feature-flags';
import { getLocalizedServicePresentation } from '@/lib/services/service-localized-content';

const SERVICE_SLUG = 'constitucion-sl-circe';
const ES_URL = 'https://expertconsulting.es/servicios/empresas-autonomos/constitucion-sl-circe';
const RU_PATH = '/ru/uslugi/sozdanie-sl-cherez-circe';
const RU_URL = `https://expertconsulting.es${RU_PATH}`;
const INDEXABLE = isLocalePubliclyEnabled('ru')
  && getLocalizedServicePresentation(SERVICE_SLUG, 'ru')?.indexable === true;

if (!getCatalogService(SERVICE_SLUG)?.deliveryOptions?.length) {
  throw new Error('Canonical constitucion-sl-circe service is missing its delivery options.');
}

const budgetHref = `/solicitar-presupuesto?servicio=${SERVICE_SLUG}`;

const MODALITY_LABELS: Record<string, string> = {
  full_service: 'Заказать полное сопровождение',
  guided: 'Заказать guided-обучение',
};

const PRICE_RU = 'От 180 € + IVA';
const DURATION_RU = 'Полное сопровождение: 3–7 рабочих дней · Guided-обучение: 2 часа';

const requirements = [
  'Все партнёры должны предоставить действующий DNI/NIE',
  'Формат CIRCE с типовыми уставами не подходит для сложных корпоративных структур',
];

const deliveryOptions = [
  {
    mode: 'full_service' as const,
    label: 'Полное сопровождение',
    price: '499 € + IVA',
    duration: '3–7 рабочих дней',
    description: 'EXPERT берёт на себя учреждение SL через CIRCE от начала до конца.',
    includes: [
      'Проверка применимости CIRCE и типовых уставов',
      'Сертификат о названии компании (denominación social)',
      'Единый электронный документ (DUE)',
      'Координация с нотариусом, подключённым к CIRCE',
      'Регистрация в Registro Mercantil (торговом реестре)',
      'Постановка на налоговый учёт и получение окончательного NIF',
    ],
    notIncluded: [
      'Нотариальные и регистрационные пошлины',
      'Личные справки или трамиты иностранных партнёров',
      'Партнёрские соглашения или уставы, составленные по индивидуальному заказу',
    ],
  },
  {
    mode: 'guided' as const,
    label: 'Guided-обучение',
    price: '180 € + IVA',
    duration: '2 часа',
    description: 'Практическая индивидуальная сессия, чтобы подготовить трамит CIRCE самостоятельно, с профессиональной поддержкой.',
    includes: [
      'Индивидуальная сессия 2 часа',
      'Персональный чек-лист',
      'Разбор данных и документации под руководством специалиста',
      'Пошаговое объяснение процедуры CIRCE',
      'Ответы на вопросы во время сессии',
    ],
    notIncluded: [
      'Подача DUE силами EXPERT',
      'Ведение дел с нотариусом или Registro Mercantil',
      'Дальнейшее сопровождение дела',
    ],
  },
];

const faqs = [
  {
    q: 'В чём разница между двумя форматами?',
    a: 'При полном сопровождении EXPERT выполняет и координирует весь трамит. При guided-обучении мы учим вас подготовить и провести его самостоятельно; мы не подаём документы от вашего имени.',
  },
  {
    q: 'Можно ли использовать CIRCE, если среди партнёров есть иностранцы?',
    a: 'Да, при условии что у них есть необходимая налоговая идентификация. Если у кого-то из партнёров нет NIF/NIE, этот вопрос нужно решить заранее.',
  },
];

export const metadata: Metadata = {
  title: 'Создание SL через CIRCE | EXPERT',
  description:
    'Телематическое учреждение Sociedad Limitada через систему CIRCE: полное сопровождение под ключ (499 € + IVA) или guided-обучение для самостоятельной подачи (180 € + IVA).',
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
    title: 'Создание SL через CIRCE | EXPERT',
    description: 'Выберите формат: полное сопровождение EXPERT или guided-обучение по системе CIRCE.',
    url: RU_URL,
    type: 'website',
    locale: 'ru_RU',
    siteName: 'EXPERT',
  },
};

export default function RuConstitucionSlCircePage() {
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Создание SL через CIRCE',
    description:
      'Учреждение Sociedad Limitada через телематическую систему CIRCE: полное сопровождение (DUE, нотариус, Registro Mercantil, налоговый учёт) или guided-обучение для самостоятельной подачи.',
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
            Создание SL через CIRCE
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
            Учреждение Sociedad Limitada через телематическую систему CIRCE. Можно заказать полное
            сопровождение под ключ или выбрать guided-сессию, чтобы подготовить и провести трамит
            самостоятельно с профессиональной поддержкой.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="border border-white/12 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Стоимость</p>
              <p className="mt-2 text-2xl font-bold text-white">{PRICE_RU}</p>
            </div>
            <div className="border border-white/12 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Срок
              </p>
              <p className="mt-2 text-base font-bold text-white">{DURATION_RU}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-12 md:py-16 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A017]">Модальности</p>
            <h2 className="mt-3 font-serif text-2xl font-bold">Выберите формат работы</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {deliveryOptions.map((option) => {
                const optionHref = `${budgetHref}&modalidad=${option.mode}`;
                return (
                  <div key={option.mode} className="border border-[#D4A017]/25 bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">{option.label}</p>
                        <h3 className="mt-2 font-serif text-xl font-bold text-[#0D1B2A]">{option.price}</h3>
                      </div>
                      {option.mode === 'guided'
                        ? <GraduationCap className="h-6 w-6 shrink-0 text-[#D4A017]" />
                        : <CheckCircle2 className="h-6 w-6 shrink-0 text-[#D4A017]" />}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#23364D]">{option.description}</p>
                    <p className="mt-2 text-xs font-semibold text-[#23364D]/70">{option.duration}</p>
                    <ul className="mt-4 space-y-2">
                      {option.includes.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm leading-5 text-[#23364D]">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 border-t border-[#D4A017]/20 pt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Не входит</p>
                      <ul className="mt-2 space-y-1.5">
                        {option.notIncluded.map((item) => (
                          <li key={item} className="text-xs leading-5 text-[#6B7280]">• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      href={optionHref}
                      className="mt-5 inline-flex min-h-11 items-center justify-center bg-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#F2C14E]"
                    >
                      {MODALITY_LABELS[option.mode] ?? 'Запросить смету'}
                    </Link>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs leading-5 text-[#6B7280]">
              Обе модальности сначала оформляются как запрос сметы.
            </p>
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
          {requirements.length > 0 && (
            <div className="border border-[#D4A017]/20 bg-white p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <ListChecks className="h-4 w-4 text-[#D4A017]" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#23364D]">Требования</p>
              </div>
              <ul className="space-y-2.5">
                {requirements.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                    <span className="text-sm leading-5 text-[#23364D]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-hidden border border-[#D4A017]/30 bg-white">
            <div className="border-b border-[#D4A017]/20 bg-[#D4A017]/8 px-6 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4A017]">Есть вопросы?</p>
              <p className="mt-2 text-xs leading-5 text-[#23364D]/65">
                Подскажем, какая модальность подойдёт именно вам.
              </p>
            </div>
            <div className="space-y-3 px-6 py-5">
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
