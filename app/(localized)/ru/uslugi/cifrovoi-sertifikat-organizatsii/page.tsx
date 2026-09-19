import Link from 'next/link';
import type { Metadata } from 'next';
import { AlertCircle, Building2, Check, FileText, ShieldCheck } from 'lucide-react';
import { AddToCartButton } from '@/components/services/AddToCartButton';
import { getCatalogService } from '@/lib/utils/catalog';
import { shouldIndexLocale } from '@/lib/i18n/feature-flags';

const SERVICE_SLUG = 'certificado-digital-entidad';
const ES_URL = 'https://expertconsulting.es/servicios/certificado-digital/certificado-digital-entidad';
const RU_PATH = '/ru/uslugi/cifrovoi-sertifikat-organizatsii';
const RU_URL = `https://expertconsulting.es${RU_PATH}`;

const service = (() => {
  const canonical = getCatalogService(SERVICE_SLUG);
  if (!canonical?.stripePriceId || !canonical.price) {
    throw new Error('Canonical entity certificate service is not configured for checkout.');
  }
  return {
    ...canonical,
    price: canonical.price,
    stripePriceId: canonical.stripePriceId,
  };
})();

const CART_ITEM = {
  priceId: service.stripePriceId,
  name: service.name,
  displayPrice: service.price,
  slug: service.slug,
  category: service.categoria,
  locale: 'ru' as const,
};

export const metadata: Metadata = {
  title: 'Цифровой сертификат Camerfirma для компании или организации | EXPERT',
  description:
    'Квалифицированный цифровой сертификат Camerfirma для компании, ассоциации или другой организации. Проверка представителя, выпуск и установка. 150 € + IVA.',
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
    title: 'Цифровой сертификат Camerfirma для организации | EXPERT',
    description:
      'Цифровой сертификат для юридического лица: проверка документов, выпуск, установка и проверка работы. 150 € + IVA.',
    url: RU_URL,
    type: 'website',
    locale: 'ru_RU',
    siteName: 'EXPERT',
  },
};

const includedItems = [
  'Проверка документов организации и полномочий законного представителя.',
  'Выпуск цифрового сертификата Camerfirma для организации.',
  'Установка и настройка сертификата на компьютере представителя.',
  'Проверка работы сертификата перед завершением услуги.',
  'Техническая поддержка по вопросам сертификата в течение 30 дней.',
];

const representativeDocuments = [
  'DNI или TIE в силе — копия обеих сторон.',
];

const entityDocuments = [
  'Полный адрес организации.',
  'Учредительные документы или актуальная nota mercantil для SL, SA и других коммерческих организаций.',
  'Устав и действующий протокол/акт о назначении — для ассоциаций и фондов.',
  'Нотариальная доверенность, если заявитель не указан как представитель в основных документах.',
];

const processSteps = [
  {
    title: 'Оформление услуги',
    text: 'Вы добавляете услугу в корзину и выбираете связанную организацию, на которую оформляется и выставляется счёт.',
  },
  {
    title: 'Передача документов',
    text: 'Загружаете документы организации и удостоверение личности представителя.',
  },
  {
    title: 'Проверка представителя',
    text: 'Проверяем личность представителя и его полномочия действовать от имени организации.',
  },
  {
    title: 'Выпуск и установка',
    text: 'Сертификат выпускается после проверки, затем мы помогаем установить его и проверить работу.',
  },
];

const notIncludedItems = [
  'Продление сертификата после окончания срока действия — оформляется отдельно.',
  'Налоговое, бухгалтерское или юридическое сопровождение организации.',
  'Общий ремонт, настройка или обслуживание компьютера и операционной системы.',
];

const faqItems = [
  {
    q: 'Сколько стоит сертификат организации?',
    a: `Цена услуги — ${service.price}. Русская и испанская версии используют один и тот же продукт и один checkout.`,
  },
  {
    q: 'Кто может оформить сертификат?',
    a: 'Законный представитель организации, указанный в учредительных или регистрационных документах, либо лицо с достаточными нотариальными полномочиями.',
  },
  {
    q: 'Почему при checkout нужно выбрать организацию?',
    a: 'Этот сертификат относится к юридическому лицу. В EXPERT услуга имеет billing company_only, поэтому оплата и последующий expediente должны быть связаны с конкретной организацией.',
  },
  {
    q: 'Чем он отличается от сертификата физического лица?',
    a: 'Сертификат физического лица идентифицирует человека. Сертификат организации позволяет представителю действовать и подписывать документы от имени юридического лица.',
  },
  {
    q: 'Сколько занимает оформление?',
    a: `Ориентировочный срок — ${service.duration} после проверки документов и личности представителя.`,
  },
];

export default function RuCertificateEntityPage() {
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Цифровой сертификат Camerfirma для организации',
    description:
      'Оформление цифрового сертификата Camerfirma для компании, ассоциации или другой организации с проверкой полномочий представителя, выпуском и установкой.',
    serviceType: 'Certificado digital de entidad',
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
      price: '150',
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
            <Link href="/servicios/certificado-digital/certificado-digital-entidad" className="text-xs font-semibold text-white/55 underline underline-offset-4 hover:text-[#D4A017]">
              Español
            </Link>
          </div>

          <h1 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
            Цифровой сертификат Camerfirma для компании или организации
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
            Оформляем цифровой сертификат для SL, SA, ассоциаций, фондов и других организаций.
            Проверяем документы организации и полномочия представителя, выпускаем сертификат и помогаем с установкой.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="border border-white/12 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Цена</p>
              <p className="mt-2 text-2xl font-bold text-white">{service.price}</p>
              <p className="mt-1 text-xs leading-5 text-white/55">Цена и checkout общие с испанским каталогом.</p>
            </div>
            <div className="border border-[#D4A017]/50 bg-[#D4A017]/10 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Срок</p>
              <p className="mt-2 text-xl font-bold text-white">{service.duration}</p>
              <p className="mt-1 text-xs leading-5 text-white/55">После проверки документов и представителя.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <AddToCartButton
              item={CART_ITEM}
              label={`Оформить — ${service.price}`}
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-8 py-3 text-sm font-bold text-[#0D1B2A] shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <Link
              href="/solicitar-presupuesto?servicio=certificado-digital-entidad&tipo=caso-complejo"
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
              <Building2 className="mt-1 h-5 w-5 shrink-0 text-[#D4A017]" />
              <div>
                <h2 className="font-serif text-2xl font-bold">Услуга привязана к организации</h2>
                <p className="mt-3 text-sm leading-7 text-[#23364D]">
                  В EXPERT эта услуга имеет billing company_only: при оформлении нужно выбрать существующую
                  организацию или создать её профиль. Это предотвращает выставление сертификата юридического лица
                  на личный профиль пользователя.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-[#D4A017]/25 bg-white p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#D4A017]" />
              <div>
                <h2 className="font-serif text-2xl font-bold">Один продукт для ES и RU</h2>
                <p className="mt-3 text-sm leading-7 text-[#23364D]">
                  Русская страница использует тот же продукт Stripe, цену и правила checkout, что и испанская.
                  Отдельный русскоязычный тариф не создаётся.
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
            <h2 className="font-serif text-2xl font-bold">Необходимые документы</h2>
            <div className="mt-5 grid gap-4">
              <div className="border border-[#D4A017]/20 bg-white p-5">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-[#D4A017]" />
                  <h3 className="font-semibold">Представитель</h3>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {representativeDocuments.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                      <span className="text-sm leading-6 text-[#23364D]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border border-[#D4A017]/20 bg-white p-5">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-[#D4A017]" />
                  <h3 className="font-semibold">Организация</h3>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {entityDocuments.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                      <span className="text-sm leading-6 text-[#23364D]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
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
