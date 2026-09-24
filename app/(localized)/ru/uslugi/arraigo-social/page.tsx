import Link from 'next/link';
import type { Metadata } from 'next';
import { AlertCircle, Check, FileText, ShieldCheck } from 'lucide-react';
import { AddToCartButton } from '@/components/services/AddToCartButton';
import { getCatalogService } from '@/lib/utils/catalog';
import { isLocalePubliclyEnabled } from '@/lib/i18n/feature-flags';
import { getLocalizedServicePresentation } from '@/lib/services/service-localized-content';

const SERVICE_SLUG = 'arraigo-social';
const ES_URL = 'https://expertconsulting.es/servicios/extranjeria-nacionalidad/arraigo-social';
const RU_PATH = '/ru/uslugi/arraigo-social';
const RU_URL = `https://expertconsulting.es${RU_PATH}`;
const INDEXABLE = isLocalePubliclyEnabled('ru')
  && getLocalizedServicePresentation(SERVICE_SLUG, 'ru')?.indexable === true;

const service = (() => {
  const canonical = getCatalogService(SERVICE_SLUG);
  if (!canonical?.stripePriceId || !canonical.price) {
    throw new Error('Canonical arraigo social service is not configured for checkout.');
  }
  return {
    ...canonical,
    price: canonical.price,
    stripePriceId: canonical.stripePriceId,
  };
})();

const OFFER_PRICE =
  service.price.match(/[0-9]+(?:[.,][0-9]+)?/)?.[0]?.replace(',', '.') ?? service.price;

const CART_ITEM = {
  priceId: service.stripePriceId!,
  name: service.name,
  displayPrice: service.price!,
  slug: service.slug,
  category: service.categoria,
  locale: 'ru' as const,
};

export const metadata: Metadata = {
  title: 'Arraigo Social в Испании 2026 — оформление вида на жительство | EXPERT',
  description:
    `Arraigo Social в Испании: 2 года непрерывного проживания, семейные связи и средства или informe de integración social. Полное сопровождение — ${service.price}.`,
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
    title: 'Arraigo Social в Испании 2026 | EXPERT',
    description:
      'Актуальные требования: 2 года непрерывного пребывания, максимум 90 дней отсутствия, EX-10, семейные связи и средства или социальная интеграция.',
    url: RU_URL,
    type: 'website',
    locale: 'ru_RU',
    siteName: 'EXPERT',
  },
};

const keyPoints = [
  {
    title: 'Минимум 2 года пребывания',
    text: 'Необходимо подтвердить не менее 2 лет непрерывного пребывания в Испании непосредственно перед подачей заявления. Отсутствие за этот период не должно превышать 90 дней.',
  },
  {
    title: 'Семейная или интеграционная основа',
    text: 'Если есть предусмотренные законом семейные связи с иностранным резидентом, нужно также подтвердить достаточные средства. При отсутствии таких связей используется положительный informe de integración social.',
  },
  {
    title: 'Право на работу после одобрения',
    text: 'Выданное разрешение позволяет работать по найму или как autónomo на всей территории Испании в течение срока действия разрешения.',
  },
];

const documents = [
  {
    title: 'Личность и пребывание',
    items: [
      'Полная копия действующего паспорта, cédula de inscripción или признанного проездного документа.',
      'Документы, подтверждающие не менее 2 лет непрерывного пребывания в Испании.',
      'Справка о несудимости из соответствующей страны или стран предыдущего проживания, когда она требуется.',
    ],
  },
  {
    title: 'Семейная связь или интеграция',
    items: [
      'Документы о семейной связи, если заявление подаётся по семейному основанию.',
      'Документы о достаточных экономических средствах, когда это применимо.',
      'Положительный informe de integración social, если семейное основание не используется.',
    ],
  },
  {
    title: 'Заявление',
    items: [
      'Официальная форма EX-10.',
      'Подтверждение оплаты пошлины Modelo 790 código 052, epígrafe 2.3.1.',
    ],
  },
];

const processSteps = [
  {
    title: 'Проверка ситуации',
    text: 'Проверяем срок пребывания, выезды, миграционный статус, семейные связи, средства и возможные ограничения.',
  },
  {
    title: 'Определение основания',
    text: 'Определяем, подаётся ли заявление через семейные связи + средства или через informe de integración social.',
  },
  {
    title: 'Подготовка документов',
    text: 'Формируем точный checklist, проверяем доказательства 2 лет проживания и готовим EX-10.',
  },
  {
    title: 'Подача заявления',
    text: 'Подаём expediente в Oficina de Extranjería и контролируем оплату соответствующей tasa 790-052.',
  },
  {
    title: 'Сопровождение и TIE',
    text: 'Отслеживаем обычный ход дела и после положительного решения объясняем порядок получения TIE.',
  },
];

const notIncluded = [
  'Пошлина Modelo 790 código 052, epígrafe 2.3.1.',
  'Получение официального informe de integración social вместо клиента.',
  'Присяжные переводы.',
  'Apostilla или легализация иностранных документов.',
  'Получение иностранных справок.',
  'Административные или судебные обжалования при отказе.',
  'Сложные дополнительные действия по нестандартным requerimientos.',
];

const reviewBeforeHiring = [
  'Если вы не можете подтвердить 2 года непрерывного пребывания, этот вид arraigo может вам не подходить.',
  'Если вы были заявителем на международную защиту, период нужно пересчитать отдельно.',
  'Если вы отсутствовали в Испании более 90 дней за требуемый период, нужна предварительная проверка.',
  'При наличии судимостей, запрета на въезд или другого миграционного процесса нужна индивидуальная оценка.',
];

const faqs = [
  {
    q: 'Сколько нужно прожить в Испании для Arraigo Social?',
    a: 'По действующим правилам — не менее 2 лет непрерывного пребывания непосредственно перед подачей. За этот период отсутствие в Испании не должно превышать 90 дней.',
  },
  {
    q: 'Нужен ли трудовой договор?',
    a: 'Нет, трудовой договор не является специальным требованием Arraigo Social. Трудовой контракт относится к логике arraigo sociolaboral.',
  },
  {
    q: 'Какая форма подаётся?',
    a: 'Для Arraigo Social используется официальная форма EX-10.',
  },
  {
    q: 'Какая государственная пошлина?',
    a: 'Применяется Modelo 790 código 052, epígrafe 2.3.1. Актуальная сумма — 38,28 €, она оплачивается отдельно от профессиональных услуг EXPERT.',
  },
  {
    q: 'Сколько рассматривают заявление?',
    a: 'Официальный срок решения — 3 месяца со дня, следующего за регистрацией заявления компетентным органом.',
  },
  {
    q: 'Можно ли работать после одобрения?',
    a: 'Да. Положительное решение даёт право работать по найму или как autónomo в Испании в течение срока действия разрешения.',
  },
];

export default function RuArraigoSocialPage() {
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Arraigo Social в Испании',
    description:
      'Полное сопровождение заявления Arraigo Social: проверка 2 лет пребывания, основания, документации, EX-10 и подача в Extranjería.',
    serviceType: 'Arraigo Social',
    provider: {
      '@type': 'Organization',
      name: 'EXPERT',
    },
    areaServed: {
      '@type': 'Country',
      name: 'España',
    },
    url: RU_URL,
    offers: {
      '@type': 'Offer',
      price: OFFER_PRICE,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: RU_URL,
    },
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
            Arraigo Social в Испании
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
            Полное сопровождение по действующим правилам 2026 года: проверка 2 лет пребывания,
            семейного или интеграционного основания, подготовка EX-10 и подача заявления.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="border border-white/12 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Услуга</p>
              <p className="mt-2 text-2xl font-bold text-white">{service.price}</p>
            </div>
            <div className="border border-white/12 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Госпошлина</p>
              <p className="mt-2 text-xl font-bold text-white">38,28 €</p>
              <p className="mt-1 text-xs leading-5 text-white/55">790-052 · epígrafe 2.3.1</p>
            </div>
            <div className="border border-[#D4A017]/50 bg-[#D4A017]/10 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Срок решения</p>
              <p className="mt-2 text-xl font-bold text-white">до 3 месяцев</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <AddToCartButton
              item={CART_ITEM}
              label={`Оформить — ${service.price}`}
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-8 py-3 text-sm font-bold text-[#0D1B2A] shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <Link
              href="/solicitar-presupuesto?servicio=arraigo-social&tipo=caso-complejo"
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
            <h2 className="font-serif text-2xl font-bold">Ключевые условия</h2>
            <div className="mt-5 grid gap-4">
              {keyPoints.map((point) => (
                <div key={point.title} className="border border-[#D4A017]/20 bg-white p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                    <div>
                      <h3 className="font-semibold">{point.title}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-[#23364D]">{point.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold">Что входит в услугу</h2>
            <ul className="mt-5 space-y-3">
              {service.includes.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                  <span className="text-[15px] leading-6 text-[#23364D]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold">Необходимые документы</h2>
            <div className="mt-5 grid gap-4">
              {documents.map((group) => (
                <div key={group.title} className="border border-[#D4A017]/20 bg-white p-5">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-[#D4A017]" />
                    <h3 className="font-semibold">{group.title}</h3>
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                        <span className="text-sm leading-6 text-[#23364D]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold">Как проходит процесс</h2>
            <ol className="mt-6 space-y-4">
              {processSteps.map((step, index) => (
                <li key={step.title} className="grid grid-cols-[40px_1fr] gap-4">
                  <span className="flex h-10 w-10 items-center justify-center bg-[#D4A017] text-sm font-bold text-[#0D1B2A]">
                    {index + 1}
                  </span>
                  <div className="pt-1">
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#23364D]">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="border border-amber-200 bg-amber-50/60 p-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-amber-700">Не входит</p>
              <ul className="space-y-2.5">
                {notIncluded.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <span className="text-sm leading-5 text-[#23364D]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-amber-200 bg-amber-50/60 p-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-amber-700">Проверьте до оплаты</p>
              <ul className="space-y-2.5">
                {reviewBeforeHiring.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <span className="text-sm leading-5 text-[#23364D]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
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

          <div className="border border-[#D4A017]/25 bg-white p-6">
            <h2 className="font-serif text-2xl font-bold">Полезные материалы</h2>
            <div className="mt-4 grid gap-3">
              <Link href="/docs/arraigo-social-requisitos-y-proceso" className="text-sm font-semibold text-[#0D1B2A] underline decoration-[#D4A017] underline-offset-4">
                Полная инструкция Arraigo Social 2026 →
              </Link>
              <Link href="/docs/arraigo-social-acreditar-dos-anos" className="text-sm font-semibold text-[#0D1B2A] underline decoration-[#D4A017] underline-offset-4">
                Как подтвердить 2 года пребывания →
              </Link>
              <Link href="/docs/arraigo-social-vinculos-medios-e-informe-integracion" className="text-sm font-semibold text-[#0D1B2A] underline decoration-[#D4A017] underline-offset-4">
                Семейные связи, средства и informe de integración →
              </Link>
              <Link href="/blog/arraigo-social-vs-sociolaboral-2026" className="text-sm font-semibold text-[#0D1B2A] underline decoration-[#D4A017] underline-offset-4">
                Arraigo Social vs. Sociolaboral →
              </Link>
            </div>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <div className="overflow-hidden border border-[#D4A017]/30 bg-white">
            <div className="border-b border-[#D4A017]/20 bg-[#D4A017]/8 px-6 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4A017]">Стоимость</p>
              <p className="mt-1 text-2xl font-bold">{service.price}</p>
              <p className="mt-2 text-xs leading-5 text-[#23364D]/65">Госпошлина 38,28 € оплачивается отдельно.</p>
            </div>
            <div className="space-y-3 px-6 py-5">
              <AddToCartButton
                item={CART_ITEM}
                label="Добавить в корзину"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[#D4A017] px-4 py-2.5 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:opacity-60"
              />
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
