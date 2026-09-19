import Link from 'next/link';
import type { Metadata } from 'next';
import { AlertCircle, Check, FileText, ShieldCheck } from 'lucide-react';
import { AddToCartButton } from '@/components/services/AddToCartButton';
import { getCatalogService } from '@/lib/utils/catalog';
import { shouldIndexLocale } from '@/lib/i18n/feature-flags';

const SERVICE_SLUG = 'certificado-digital-persona-fisica';
const ES_URL = 'https://expertconsulting.es/servicios/certificado-digital/certificado-digital-persona-fisica';
const RU_PATH = '/ru/uslugi/cifrovoi-sertifikat-fizicheskogo-litsa';
const RU_URL = `https://expertconsulting.es${RU_PATH}`;

const service = (() => {
  const canonical = getCatalogService(SERVICE_SLUG);
  if (!canonical?.stripePriceId || !canonical.price) {
    throw new Error('Canonical certificate service is not configured for checkout.');
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
  title: 'Цифровой сертификат Camerfirma для физического лица | EXPERT',
  description:
    'Квалифицированный цифровой сертификат Camerfirma для физического лица: оформление, проверка личности, установка и проверка работы. 90 € + IVA.',
  alternates: {
    canonical: RU_URL,
    languages: {
      'es-ES': ES_URL,
      'ru-RU': RU_URL,
      'x-default': ES_URL,
    },
  },
  robots: {
    index: shouldIndexLocale('ru'),
    follow: shouldIndexLocale('ru'),
  },
  openGraph: {
    title: 'Цифровой сертификат Camerfirma для физического лица | EXPERT',
    description:
      'Оформление цифрового сертификата Camerfirma с проверкой личности, установкой и поддержкой. 90 € + IVA.',
    url: RU_URL,
    type: 'website',
    locale: 'ru_RU',
    siteName: 'EXPERT',
  },
};

const includedItems = [
  'Проверка личности очно или по видеосвязи.',
  'Выпуск квалифицированного цифрового сертификата Camerfirma.',
  'Установка и настройка сертификата на вашем компьютере.',
  'Проверка работы сертификата перед завершением услуги.',
  'Техническая поддержка по вопросам сертификата в течение 30 дней.',
];

const documentItems = [
  'DNI или TIE в силе — копия обеих сторон.',
  'Полный адрес проживания: улица, номер, квартира, индекс и населённый пункт.',
  'Компьютер с Windows или macOS, на который будет установлен сертификат.',
];

const processSteps = [
  {
    title: 'Оформление услуги',
    text: 'Вы добавляете услугу в корзину, входите в EXPERT и оплачиваете тот же продукт, что используется в испанской версии.',
  },
  {
    title: 'Согласование проверки личности',
    text: 'После оплаты мы связываемся с вами и согласовываем очную проверку или видеосвязь.',
  },
  {
    title: 'Проверка документов и личности',
    text: 'Проверяем DNI/TIE и данные, необходимые для выпуска сертификата.',
  },
  {
    title: 'Выпуск и установка',
    text: 'Сертификат выпускается через Camerfirma, после чего мы помогаем установить его и проверить работу.',
  },
];

const notIncludedItems = [
  'Продление сертификата после окончания срока действия — оформляется отдельно.',
  'Общий ремонт, настройка или обслуживание компьютера и операционной системы.',
  'Иные цифровые сертификаты, не относящиеся к физическому лицу.',
];

const faqItems = [
  {
    q: 'Сколько стоит сертификат?',
    a: `Цена услуги — ${service.price}. Русская и испанская версии используют один и тот же продукт и один checkout.`,
  },
  {
    q: 'Для чего нужен цифровой сертификат?',
    a: 'Он используется для электронной идентификации и подписи документов, а также для работы с AEAT, Seguridad Social и другими государственными и частными сервисами.',
  },
  {
    q: 'Можно ли пройти оформление дистанционно?',
    a: 'Проверка личности может быть организована очно или по видеосвязи в зависимости от применимого процесса Camerfirma.',
  },
  {
    q: 'Поможете ли вы установить сертификат?',
    a: 'Да. Установка, настройка и проверка работы входят в услугу.',
  },
  {
    q: 'Какой срок действия?',
    a: 'Модальность сертификата физического лица, которую предлагает EXPERT, имеет срок действия 5 лет.',
  },
];

export default function RuCertificatePersonPage() {
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Цифровой сертификат Camerfirma для физического лица',
    description:
      'Оформление квалифицированного цифрового сертификата Camerfirma для физического лица с проверкой личности, установкой и проверкой работы.',
    serviceType: 'Certificado digital',
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
    mainEntity: faqItems.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: a,
      },
    })),
  };

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <section className="bg-[#0D1B2A] px-6 py-12 text-[#F8F6F1] md:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/ru/uslugi" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017] hover:text-[#F2C14E]">
              ← Услуги
            </Link>
            <Link href="/servicios/certificado-digital/certificado-digital-persona-fisica" className="text-xs font-semibold text-white/55 underline underline-offset-4 hover:text-[#D4A017]">
              Español
            </Link>
          </div>

          <h1 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
            Цифровой сертификат Camerfirma для физического лица
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
            Оформляем квалифицированный цифровой сертификат Camerfirma для работы с AEAT, Seguridad Social,
            электронными подписями и другими онлайн-процедурами в Испании. Проверка личности, выпуск,
            установка и проверка работы входят в услугу.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="border border-white/12 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Цена</p>
              <p className="mt-2 text-2xl font-bold text-white">{service.price}</p>
              <p className="mt-1 text-xs leading-5 text-white/55">Тот же продукт и цена, что в испанском каталоге.</p>
            </div>
            <div className="border border-[#D4A017]/50 bg-[#D4A017]/10 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Срок</p>
              <p className="mt-2 text-xl font-bold text-white">{service.duration}</p>
              <p className="mt-1 text-xs leading-5 text-white/55">Очно или по видеосвязи.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <AddToCartButton
              item={CART_ITEM}
              label={`Оформить — ${service.price}`}
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-8 py-3 text-sm font-bold text-[#0D1B2A] shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <Link
              href="/solicitar-presupuesto?servicio=certificado-digital-persona-fisica&tipo=caso-complejo"
              className="inline-flex min-h-12 items-center justify-center border border-[#D4A017] px-8 py-3 text-sm font-semibold text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Нестандартный случай
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-12 md:py-16 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-10">
          <div className="border border-[#D4A017]/25 bg-white p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#D4A017]" />
              <div>
                <h2 className="font-serif text-2xl font-bold">Один продукт для ES и RU</h2>
                <p className="mt-3 text-sm leading-7 text-[#23364D]">
                  Русская страница не создаёт отдельный тариф или отдельный продукт Stripe. Цена, идентификатор checkout
                  и правила выставления счёта берутся из общего каталога EXPERT.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold">Что входит в услугу</h2>
            <ul className="mt-5 space-y-3">
              {includedItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                  <span className="text-[15px] leading-6 text-[#23364D]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold">Что понадобится</h2>
            <div className="mt-5 border border-[#D4A017]/20 bg-white p-5">
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-[#D4A017]" />
                <h3 className="font-semibold">Документы и данные</h3>
              </div>
              <ul className="mt-4 space-y-2.5">
                {documentItems.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                    <span className="text-sm leading-6 text-[#23364D]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold">Как проходит оформление</h2>
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

          <div className="border border-amber-200 bg-amber-50/60 p-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-amber-700">Не входит</p>
            <ul className="space-y-2.5">
              {notIncludedItems.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span className="text-sm leading-5 text-[#23364D]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-[#D4A017]/25 bg-white p-6">
            <h2 className="font-serif text-2xl font-bold">Полезные материалы</h2>
            <div className="mt-4 grid gap-3">
              <Link href="/docs/certificado-digital-camerfirma-guia" className="text-sm font-semibold underline decoration-[#D4A017] underline-offset-4">Общая инструкция Camerfirma →</Link>
              <Link href="/docs/certificado-digital-persona-fisica-documentacion-instalacion" className="text-sm font-semibold underline decoration-[#D4A017] underline-offset-4">Документы, установка и использование →</Link>
              <Link href="/docs/certificado-digital-persona-fisica-seguridad-copia-renovacion" className="text-sm font-semibold underline decoration-[#D4A017] underline-offset-4">Безопасность, копия и продление →</Link>
              <Link href="/blog/certificado-digital-persona-fisica-vs-clave-dnie" className="text-sm font-semibold underline decoration-[#D4A017] underline-offset-4">Сертификат vs. Cl@ve vs. DNIe →</Link>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold">Частые вопросы</h2>
            <div className="mt-6 space-y-5">
              {faqItems.map(({ q, a }) => (
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4A017]">Цена</p>
              <p className="mt-1 text-2xl font-bold">{service.price}</p>
              <p className="mt-2 text-xs leading-5 text-[#23364D]/65">{service.duration}</p>
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
