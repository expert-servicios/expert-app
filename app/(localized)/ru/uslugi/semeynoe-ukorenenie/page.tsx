import Link from 'next/link';
import type { Metadata } from 'next';
import { AlertCircle, Check, FileText, ShieldCheck, Users } from 'lucide-react';
import { AddToCartButton } from '@/components/services/AddToCartButton';
import { getCatalogService } from '@/lib/utils/catalog';
import { isLocalePubliclyEnabled } from '@/lib/i18n/feature-flags';
import { getLocalizedServicePresentation } from '@/lib/services/service-localized-content';

const SERVICE_SLUG = 'arraigo-familiar';
const ES_URL = 'https://expertconsulting.es/servicios/extranjeria-nacionalidad/arraigo-familiar';
const RU_PATH = '/ru/uslugi/semeynoe-ukorenenie';
const RU_URL = `https://expertconsulting.es${RU_PATH}`;
const INDEXABLE = isLocalePubliclyEnabled('ru')
  && getLocalizedServicePresentation(SERVICE_SLUG, 'ru')?.indexable === true;

const service = (() => {
  const canonical = getCatalogService(SERVICE_SLUG);
  if (!canonical?.stripePriceId || !canonical.price) {
    throw new Error('Canonical arraigo-familiar service is not configured for checkout.');
  }
  return {
    ...canonical,
    price: canonical.price,
    stripePriceId: canonical.stripePriceId,
  };
})();

const DURATION_RU = 'Решение по делу: до 3 месяцев';

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
  title: 'Arraigo Familiar 2026 — семейное укоренение в Испании | EXPERT',
  description:
    `Arraigo Familiar (семейное укоренение) по действующим случаям RD 1155/2024: родитель/опекун несовершеннолетнего гражданина ЕС/ЕЭЗ/Швейцарии или поддержка лица с инвалидностью. ${service.price}.`,
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
    title: 'Arraigo Familiar 2026 | EXPERT',
    description: 'Классификация семейной связи, проверка действующего основания, документы и подача EX-10.',
    url: RU_URL,
    type: 'website',
    locale: 'ru_RU',
    siteName: 'EXPERT',
  },
};

const keyPoints = [
  {
    title: 'Сначала нужно классифицировать связь',
    text: 'Не любая связь с испанцем или резидентом подпадает под arraigo familiar. Правильный путь зависит от гражданства и ситуации родственника, о котором идёт речь.',
  },
  {
    title: 'Закрытый перечень случаев',
    text: 'Действующий arraigo familiar предусматривает конкретные, ограниченные случаи; EXPERT сначала проверяет, действительно ли дело относится к этой категории.',
  },
  {
    title: 'Обязательный человеческий контроль',
    text: 'Если связь соответствует другому виду семейного разрешения, дело перенаправляется до подачи заявления.',
  },
];

const audience = [
  'Родители или опекуны несовершеннолетних — граждан другого государства ЕС/ЕЭЗ/Швейцарии, отвечающих законным условиям',
  'Родственники, оказывающие поддержку лицу с инвалидностью — гражданину ЕС/ЕЭЗ/Швейцарии, при соблюдении установленных требований',
  'Лица, которым нужно определить, относится ли их семейная связь к arraigo familiar или к другому виду разрешения',
];

const requirements = [
  'Соответствие одному из действующих законных случаев arraigo familiar',
  'Подтверждение семейной связи, а также гражданства/ситуации родственника, о котором идёт речь',
  'Подтверждение совместного проживания, опеки, родительских обязанностей или поддержки — в зависимости от конкретного случая',
  'Соблюдение общих требований, применимых к разрешениям на основании arraigo',
  'Уплата соответствующей административной пошлины',
];

const includes = [
  'Предварительная классификация правильного миграционного пути',
  'Оценка действующего случая arraigo familiar',
  'Проверка и организация документации',
  'Подготовка формы EX-10, когда это применимо',
  'Электронная подача после профессиональной проверки',
  'Стандартное сопровождение дела',
];

const requiredDocs = [
  'Полный действующий паспорт или признанный проездной документ',
  'Документ, удостоверяющий личность/гражданство родственника, о котором идёт речь',
  'Документ, подтверждающий семейную связь',
  'Доказательства совместного проживания, опеки, попечительства, поддержки или родительских обязанностей — в зависимости от случая',
  'Справка о несудимости, когда это применимо',
  'Дополнительная документация, требуемая для конкретного случая',
];

const processSteps = [
  {
    title: 'Классификация случая',
    text: 'Определяем, относится ли дело действительно к arraigo familiar или к другому виду семейного разрешения.',
  },
  {
    title: 'Проверка связи',
    text: 'Проверяем родство, гражданство и особые условия родственника, о котором идёт речь.',
  },
  {
    title: 'Подготовка документов',
    text: 'Формируем точный checklist и проверяем иностранные документы, переводы и легализации.',
  },
  {
    title: 'Подача и сопровождение',
    text: 'Подаём заявление только после профессионального одобрения и ведём стандартное сопровождение дела.',
  },
];

const notIncluded = [
  'Присяжные переводы, апостили или легализации',
  'Административные или судебные обжалования',
  'Оформление другого миграционного вида, если дело не относится к arraigo familiar',
];

const reviewBeforeHiring = [
  'Если ваш родственник — гражданин Испании, мы сначала проверим, не применяется ли отдельное специальное разрешение для родственников испанцев',
  'Если законный случай не очевиден, заявление не подаётся автоматически',
];

const finalCta = {
  title: 'Не знаете, какой семейный путь вам подходит?',
  text: 'Сначала классифицируем ваше дело, чтобы не оформлять неправильный вид разрешения.',
};

const faqs = [
  {
    q: 'Может ли любой родственник испанца получить arraigo familiar?',
    a: 'Нет. Действующее законодательство разделяет разные режимы и разрешения. Сначала нужно классифицировать связь и ситуацию родственника, о котором идёт речь.',
  },
  {
    q: 'Какая форма используется?',
    a: 'Когда случай относится к arraigo familiar, используется применимая форма по чрезвычайным обстоятельствам; EXPERT проверяет путь перед подготовкой заявления.',
  },
  {
    q: 'Заявление подаётся автоматически при оформлении услуги?',
    a: 'Нет. Подача требует профессиональной проверки случая и документации.',
  },
];

export default function RuArraigoFamiliarPage() {
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Arraigo Familiar в Испании',
    description:
      'Проверка действующих оснований arraigo familiar по RD 1155/2024, классификация семейной связи, подготовка документов и подача EX-10.',
    serviceType: 'Arraigo Familiar',
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
            Arraigo Familiar — семейное укоренение
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
            Arraigo Familiar нужно анализировать по правилам Real Decreto (RD) 1155/2024. Это не универсальный
            путь для любого родственника испанца или резидента. Среди действующих случаев — отец, мать или
            опекун несовершеннолетнего гражданина другого государства ЕС, ЕЭЗ или Швейцарии при соблюдении
            установленных условий, а также отдельные родственники, оказывающие поддержку лицу с инвалидностью —
            гражданину этих государств. Родственники граждан Испании могут подпадать под отдельное специальное
            разрешение, и путь нужно правильно классифицировать до заключения договора.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="border border-white/12 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Услуга</p>
              <p className="mt-2 text-2xl font-bold text-white">{service.price}</p>
            </div>
            <div className="border border-[#D4A017]/50 bg-[#D4A017]/10 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Срок</p>
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
              href="/solicitar-presupuesto?servicio=arraigo-familiar&tipo=caso-complejo"
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

          <div className="grid gap-5 md:grid-cols-2">
            <div className="border border-[#D4A017]/20 bg-white p-5">
              <div className="flex items-center gap-2.5">
                <Users className="h-4 w-4 text-[#D4A017]" />
                <h2 className="font-semibold">Кому подходит</h2>
              </div>
              <ul className="mt-4 space-y-2.5">
                {audience.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                    <span className="text-sm leading-6 text-[#23364D]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-[#D4A017]/20 bg-white p-5">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-[#D4A017]" />
                <h2 className="font-semibold">Требования</h2>
              </div>
              <ul className="mt-4 space-y-2.5">
                {requirements.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                    <span className="text-sm leading-6 text-[#23364D]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

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
                <h3 className="font-semibold">Для оценки и подачи дела</h3>
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

          <div className="border border-[#D4A017] bg-[#0D1B2A] p-8 text-center">
            <h2 className="font-serif text-2xl font-bold text-white">{finalCta.title}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/70">{finalCta.text}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <AddToCartButton
                item={CART_ITEM}
                label={`Оформить — ${service.price}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-8 py-3 text-sm font-bold text-[#0D1B2A] shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:cursor-not-allowed disabled:opacity-60"
              />
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
              <p className="mt-2 text-xs leading-5 text-[#23364D]/65">{DURATION_RU}.</p>
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
