import Link from 'next/link';
import type { Metadata } from 'next';
import { Check, Clock, FileText } from 'lucide-react';
import { AddToCartButton } from '@/components/services/AddToCartButton';
import { getCatalogService } from '@/lib/utils/catalog';
import { isLocalePubliclyEnabled } from '@/lib/i18n/feature-flags';
import { getLocalizedServicePresentation } from '@/lib/services/service-localized-content';

const SERVICE_SLUG = 'modelo-720';
const ES_URL = 'https://expertconsulting.es/servicios/declaraciones-impuestos/modelo-720';
const RU_PATH = '/ru/uslugi/deklaratsiya-imushchestva-za-rubezhom-modelo-720';
const RU_URL = `https://expertconsulting.es${RU_PATH}`;
const INDEXABLE = isLocalePubliclyEnabled('ru')
  && getLocalizedServicePresentation(SERVICE_SLUG, 'ru')?.indexable === true;

const service = (() => {
  const canonical = getCatalogService(SERVICE_SLUG);
  if (!canonical?.stripePriceId || !canonical.price) {
    throw new Error('Canonical modelo-720 service is not configured for checkout.');
  }
  return {
    ...canonical,
    price: canonical.price,
    stripePriceId: canonical.stripePriceId,
  };
})();

const DURATION_RU = '3–5 рабочих дней';

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
  title: 'Modelo 720 — декларация об имуществе за рубежом | EXPERT',
  description:
    `Modelo 720: анализ обязанности декларировать имущество и права за рубежом, подготовка и подача декларации в AEAT. ${service.price}.`,
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
    title: 'Modelo 720 — декларация об имуществе за рубежом | EXPERT',
    description: 'Анализ обязанности, подготовка и подача декларации об имуществе и правах за рубежом.',
    url: RU_URL,
    type: 'website',
    locale: 'ru_RU',
    siteName: 'EXPERT',
  },
};

const includes = [
  'Анализ обязанности подавать декларацию',
  'Проверка имущества и прав за рубежом',
  'Подготовка Modelo 720 / 721',
  'Электронная подача в AEAT',
  'Подтверждение подачи декларации',
];

const requiredDocs = [
  'Действующий DNI/NIE',
  'Банковские выписки по зарубежным счетам (остаток на 31 декабря)',
  'Справки по ценным бумагам, фондам или страховым полисам (стоимость на 31 декабря)',
  'Документы о праве собственности на недвижимость за рубежом',
  'Иностранный налоговый идентификационный номер (если применимо)',
];

const faqs = [
  {
    q: 'Кто обязан подавать Modelo 720?',
    a: 'Обязанность может возникать при превышении установленных законом порогов по одной из трёх категорий сведений, но перед этим нужно применить правила оценки и соответствующие исключения.',
  },
  {
    q: 'Когда нужно подавать декларацию?',
    a: 'С 1 января по 31 марта года, следующего за отчётным периодом.',
  },
  {
    q: 'Что будет, если не подать декларацию?',
    a: 'Непредставление декларации может повлечь налоговые последствия и санкции. Перед тем как сделать вывод об обязанности подавать декларацию, мы проверяем категорию, порог, исключения и отчётный период.',
  },
  {
    q: 'Нужно ли подавать декларацию каждый год?',
    a: 'Не обязательно. После первой подачи нужно проверять увеличение стоимости имущества по сравнению с последней поданной декларацией, а также другие случаи, которые могут потребовать подачи — например, определённую утрату права собственности.',
  },
];

export default function RuModelo720Page() {
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Modelo 720 — декларация об имуществе за рубежом',
    description:
      'Анализ обязанности декларировать имущество и права за рубежом, подготовка и подача Modelo 720 в AEAT.',
    serviceType: 'Declaraciones e Impuestos',
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
            Modelo 720 — декларация об имуществе за рубежом
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
            Modelo 720 — информационная декларация об определённых категориях имущества и прав за рубежом.
            Обязанность подавать её зависит от категории, установленных порогов, правил оценки и применимых
            исключений. Сначала мы анализируем, возникает ли у вас такая обязанность, а затем готовим
            и подаём декларацию.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="border border-white/12 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Услуга</p>
              <p className="mt-2 text-2xl font-bold text-white">{service.price}</p>
            </div>
            <div className="border border-white/12 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Срок
              </p>
              <p className="mt-2 text-xl font-bold text-white">{DURATION_RU}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <AddToCartButton
              item={CART_ITEM}
              label={`Оформить — ${service.price}`}
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-8 py-3 text-sm font-bold text-[#0D1B2A] shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <Link
              href="/solicitar-presupuesto?servicio=modelo-720&tipo=caso-complejo"
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
            <h2 className="font-serif text-2xl font-bold">Необходимые документы</h2>
            <div className="mt-5 border border-[#D4A017]/20 bg-white p-5">
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-[#D4A017]" />
                <h3 className="font-semibold">Для анализа и подготовки декларации</h3>
              </div>
              <ul className="mt-4 space-y-2.5">
                {requiredDocs.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                    <span className="text-sm leading-6 text-[#23364D]">{item}</span>
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
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <div className="overflow-hidden border border-[#D4A017]/30 bg-white">
            <div className="border-b border-[#D4A017]/20 bg-[#D4A017]/8 px-6 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4A017]">Стоимость</p>
              <p className="mt-1 text-2xl font-bold">{service.price}</p>
              <p className="mt-2 text-xs leading-5 text-[#23364D]/65">Срок: {DURATION_RU}.</p>
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
