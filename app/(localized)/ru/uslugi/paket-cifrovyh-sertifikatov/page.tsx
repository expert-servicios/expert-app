import Link from 'next/link';
import type { Metadata } from 'next';
import { AlertCircle, Check, FileText, ShieldCheck } from 'lucide-react';
import { AddToCartButton } from '@/components/services/AddToCartButton';
import { getCatalogService } from '@/lib/utils/catalog';
import { isLocalePubliclyEnabled } from '@/lib/i18n/feature-flags';
import { getLocalizedServicePresentation } from '@/lib/services/service-localized-content';
import { ServiceShareActions } from '@/components/services/ServiceShareActions';
import { ServiceRatingSummary } from '@/components/services/ServiceRatingSummary';

export const revalidate = 300;

const SERVICE_SLUG = 'pack-certificados-digitales';
const ES_URL = 'https://expertconsulting.es/servicios/certificado-digital/pack-certificados-digitales';
const RU_PATH = '/ru/uslugi/paket-cifrovyh-sertifikatov';
const RU_URL = `https://expertconsulting.es${RU_PATH}`;
const SHARE_IMAGE_URL = `https://expertconsulting.es/api/services/og?slug=${encodeURIComponent(SERVICE_SLUG)}&variant=square&lang=ru`;
const SHARE_TITLE = 'Пакет цифровых сертификатов — физлицо + компания';
const INDEXABLE = isLocalePubliclyEnabled('ru')
  && getLocalizedServicePresentation(SERVICE_SLUG, 'ru')?.indexable === true;

const service = (() => {
  const canonical = getCatalogService(SERVICE_SLUG);
  if (!canonical?.stripePriceId || !canonical.price) {
    throw new Error('Canonical certificate bundle is not configured for checkout.');
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
  priceId: service.stripePriceId,
  name: service.name,
  displayPrice: service.price,
  slug: service.slug,
  category: service.categoria,
  locale: 'ru' as const,
};

export const metadata: Metadata = {
  title: 'Пакет цифровых сертификатов Camerfirma: физлицо + компания | 200 € + IVA',
  description:
    'Два сертификата Camerfirma одним заказом: физическое лицо + юридическое лицо. 200 € + IVA вместо 240 €. Полностью онлайн, без визита. Максимум 24 рабочих часа после полной проверки.',
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
    title: 'Пакет Camerfirma: личный + корпоративный сертификат | EXPERT',
    description: '200 € + IVA · экономия 40 € · полностью онлайн · максимум 24 рабочих часа после полной валидации.',
    url: RU_URL,
    type: 'website',
    locale: 'ru_RU',
    siteName: 'EXPERT',
    images: [{ url: SHARE_IMAGE_URL, width: 1200, height: 1200 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Пакет Camerfirma: физлицо + компания | 200 € + IVA',
    description: 'Экономия 40 € · полностью онлайн · 5 лет + 2 года · максимум 24 рабочих часа после полной проверки.',
    images: [SHARE_IMAGE_URL],
  },
};

const included = [
  'Сертификат Camerfirma для физического лица — модальность EXPERT со сроком действия 5 лет.',
  'Сертификат Camerfirma для выбранного юридического лица — модальность EXPERT со сроком действия 2 года.',
  'Удалённая идентификация и валидация личности EXPERT через канал PVP Creative Quality в рамках процесса Camerfirma.',
  'Проверка документов компании и полномочий представителя.',
  'Оформление обоих сертификатов.',
  'Помощь с установкой и настройкой.',
  'Проверка работы после установки.',
  'Поддержка по сертификатам в течение 30 дней.',
];

const documents = [
  {
    title: 'Физическое лицо / представитель',
    items: [
      'DNI или TIE в силе — читаемая копия обеих сторон.',
      'Полный адрес проживания.',
      'Контактные данные.',
    ],
  },
  {
    title: 'Юридическое лицо',
    items: [
      'Название и NIF/CIF компании.',
      'Полный юридический/фискальный адрес.',
      'Учредительные документы, актуальная nota mercantil или иной регистрационный документ.',
      'Доверенность или документ о назначении, если это необходимо для подтверждения полномочий.',
    ],
  },
];

const process = [
  {
    title: 'Оформление пакета',
    text: 'Вы входите в EXPERT, заполняете личный профиль и выбираете или создаёте компанию, для которой нужен второй сертификат.',
  },
  {
    title: 'Документы',
    text: 'В одном процессе собираем личные документы и документы компании.',
  },
  {
    title: 'Онлайн-идентификация',
    text: 'EXPERT удалённо проверяет личность и полномочия представителя в рамках процесса Camerfirma. Личный визит не требуется.',
  },
  {
    title: 'Максимум 24 рабочих часа',
    text: 'После получения полного комплекта документов и успешной проверки личности/полномочий оформляем оба сертификата максимум за 24 рабочих часа.',
  },
  {
    title: 'Установка и проверка',
    text: 'Помогаем установить оба сертификата и проверяем их работу.',
  },
];

const faq = [
  {
    q: 'Что входит в пакет?',
    a: 'Личный сертификат Camerfirma представителя + сертификат выбранного юридического лица, онлайн-идентификация, проверка документов компании, оформление, установка и проверка работы.',
  },
  {
    q: 'Почему пакет стоит дешевле?',
    a: 'Отдельно услуги стоят 90 € + IVA и 150 € + IVA, всего 240 € + IVA. Пакет стоит 200 € + IVA, экономия — 40 €.',
  },
  {
    q: 'Нужно ли приходить лично?',
    a: 'Нет. Процесс EXPERT полностью онлайн. Идентификация и валидация выполняются удалённо через канал PVP Creative Quality в рамках процесса Camerfirma.',
  },
  {
    q: 'Когда начинается срок 24 часа?',
    a: 'После того как EXPERT получил полный комплект личных и корпоративных документов и успешно подтвердил личность и полномочия представителя.',
  },
  {
    q: 'Зачем выбирать компанию в EXPERT?',
    a: 'Пакет содержит сертификат юридического лица. Выбранная компания нужна для корректной связи заказа, счёта, документов и операционного дела с организацией.',
  },
];

export default function RuCertificateBundlePage() {
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Пакет цифровых сертификатов Camerfirma — физлицо + компания',
    description:
      'Два цифровых сертификата Camerfirma одним заказом: физическое лицо и юридическое лицо. Полностью онлайн, максимум 24 рабочих часа после полного комплекта документов и валидации.',
    serviceType: 'Certificados digitales',
    provider: { '@type': 'Organization', name: 'EXPERT' },
    areaServed: { '@type': 'Country', name: 'España' },
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
    mainEntity: faq.map(({ q, a }) => ({
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
            <Link href="/servicios/certificado-digital/pack-certificados-digitales" className="text-xs font-semibold text-white/55 underline underline-offset-4 hover:text-[#D4A017]">
              Español
            </Link>
          </div>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#D4A017]">Предложение EXPERT</p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
            Личный сертификат + сертификат компании
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
            Два сертификата Camerfirma одним заказом. Полностью онлайн, без личного визита.
            После полного комплекта документов и валидации — максимум 24 рабочих часа.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="border border-[#D4A017]/60 bg-[#D4A017]/10 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Пакет</p>
              <p className="mt-2 text-3xl font-bold text-white">{service.price}</p>
            </div>
            <div className="border border-white/12 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Отдельно</p>
              <p className="mt-2 text-2xl font-bold text-white line-through decoration-[#D4A017]">240 € + IVA</p>
            </div>
            <div className="border border-white/12 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Экономия</p>
              <p className="mt-2 text-2xl font-bold text-white">40 €</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <AddToCartButton
              item={CART_ITEM}
              label={`Оформить пакет — ${service.price}`}
              className="inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-8 py-3 text-sm font-bold text-[#0D1B2A] shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:opacity-60"
            />
            <Link
              href="/solicitar-presupuesto?servicio=pack-certificados-digitales&tipo=caso-complejo"
              className="inline-flex min-h-12 items-center justify-center border border-[#D4A017] px-8 py-3 text-sm font-semibold text-[#D4A017] hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Нестандартный случай
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-12 md:py-16 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-10">
          <div className="border border-[#D4A017]/30 bg-white p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#D4A017]" />
              <div>
                <h2 className="font-serif text-2xl font-bold">Полностью онлайн</h2>
                <p className="mt-3 text-sm leading-7 text-[#23364D]">
                  EXPERT выполняет удалённую идентификацию и валидацию в рамках процесса Camerfirma.
                  Для оформления пакета не требуется физическое посещение офиса.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold">Что входит</h2>
            <ul className="mt-5 space-y-3">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                  <span className="text-[15px] leading-6 text-[#23364D]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold">Документы</h2>
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
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
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
              {process.map((step, index) => (
                <li key={step.title} className="grid grid-cols-[40px_1fr] gap-4">
                  <span className="flex h-10 w-10 items-center justify-center bg-[#D4A017] text-sm font-bold text-[#0D1B2A]">{index + 1}</span>
                  <div className="pt-1">
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#23364D]">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="border border-amber-200 bg-amber-50/60 p-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-amber-700">Важно</p>
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm leading-6 text-[#23364D]">
                24 рабочих часа отсчитываются только после получения полного комплекта документов и успешной проверки личности и полномочий представителя.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold">Частые вопросы</h2>
            <div className="mt-6 space-y-5">
              {faq.map(({ q, a }) => (
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
              <Link href="/docs/certificado-digital-persona-fisica-documentacion-instalacion" className="text-sm font-semibold underline decoration-[#D4A017] underline-offset-4">Документы для личного сертификата →</Link>
              <Link href="/docs/certificado-digital-entidad-documentos-representante" className="text-sm font-semibold underline decoration-[#D4A017] underline-offset-4">Документы компании и представителя →</Link>
              <Link href="/docs/certificado-digital-entidad-tipos-usos-seguridad" className="text-sm font-semibold underline decoration-[#D4A017] underline-offset-4">Типы корпоративных сертификатов →</Link>
            </div>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <div className="overflow-hidden border border-[#D4A017]/30 bg-white">
            <div className="border-b border-[#D4A017]/20 bg-[#D4A017]/8 px-6 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4A017]">Цена пакета</p>
              <p className="mt-1 text-3xl font-bold">{service.price}</p>
              <p className="mt-2 text-xs leading-5 text-[#23364D]/65">Вместо 240 € + IVA · экономия 40 €</p>
            </div>
            <div className="space-y-3 px-6 py-5">
              <AddToCartButton
                item={CART_ITEM}
                label="Добавить пакет в корзину"
                className="inline-flex min-h-11 w-full items-center justify-center bg-[#D4A017] px-4 py-2.5 text-sm font-bold text-[#0D1B2A] hover:bg-[#F2C14E] disabled:opacity-60"
              />
              <a href="https://wa.me/34669045528" className="block w-full border border-[#D4A017]/30 px-4 py-2.5 text-center text-sm font-semibold text-[#23364D] hover:border-[#D4A017]">
                Задать вопрос в WhatsApp
              </a>
            </div>
          </div>
        </aside>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2">
          <ServiceRatingSummary serviceSlug={SERVICE_SLUG} locale="ru" />
          <ServiceShareActions
            url={RU_URL}
            title={SHARE_TITLE}
            text="Пакет цифровых сертификатов Camerfirma: физлицо + компания за 200 € + IVA."
            locale="ru"
          />
        </div>
        <div className="mx-auto mt-5 max-w-5xl border border-[#D4A017]/20 bg-[#F8F6F1] p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#23364D]">Сопутствующие услуги</p>
          <p className="mt-1 text-sm text-[#23364D]/70">Услуги, которые часто дополняют этот процесс.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Link
                href="/ru/uslugi/cifrovoi-sertifikat-fizicheskogo-litsa"
                className="block border border-[#D4A017]/20 bg-white px-4 py-3 text-sm font-semibold text-[#0D1B2A] transition hover:border-[#D4A017] hover:text-[#D4A017]"
              >
                Сертификат для физического лица →
              </Link>
              <Link
                href="/ru/uslugi/cifrovoi-sertifikat-organizatsii"
                className="block border border-[#D4A017]/20 bg-white px-4 py-3 text-sm font-semibold text-[#0D1B2A] transition hover:border-[#D4A017] hover:text-[#D4A017]"
              >
                Сертификат для компании или организации →
              </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
