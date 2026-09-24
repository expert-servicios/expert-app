import Link from 'next/link';
import type { Metadata } from 'next';
import { AlertCircle, Check, FileText, ShieldCheck, Users } from 'lucide-react';
import { AddToCartButton } from '@/components/services/AddToCartButton';
import { getCatalogService } from '@/lib/utils/catalog';
import { isLocalePubliclyEnabled } from '@/lib/i18n/feature-flags';
import { getLocalizedServicePresentation } from '@/lib/services/service-localized-content';

const SERVICE_SLUG = 'arraigo-laboral';
const ES_URL = 'https://expertconsulting.es/servicios/extranjeria-nacionalidad/arraigo-laboral';
const RU_PATH = '/ru/uslugi/trudovoe-ukorenenie';
const RU_URL = `https://expertconsulting.es${RU_PATH}`;
const INDEXABLE = isLocalePubliclyEnabled('ru')
  && getLocalizedServicePresentation(SERVICE_SLUG, 'ru')?.indexable === true;

const service = (() => {
  const canonical = getCatalogService(SERVICE_SLUG);
  if (!canonical?.stripePriceId || !canonical.price) {
    throw new Error('Canonical arraigo-laboral service is not configured for checkout.');
  }
  return {
    ...canonical,
    price: canonical.price,
    stripePriceId: canonical.stripePriceId,
  };
})();

const DURATION_RU = 'Решение по делу: до 3 месяцев';
const CHECKOUT_LEGAL_RU = 'Пошлина Modelo 790 código 052, epígrafe 2.3.1, оплачивается отдельно.';

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
  title: 'Arraigo Sociolaboral 2026 — трудовое укоренение | EXPERT',
  description:
    `Arraigo Sociolaboral по RD 1155/2024: 2 года пребывания и договор(ы), суммарно не менее 20 часов в неделю, по зарплате SMI или convenio. ${service.price}.`,
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
    title: 'Arraigo Sociolaboral 2026 | EXPERT',
    description: '2 года пребывания, 20 часов в неделю суммарно, платёжеспособный работодатель и подача EX-10.',
    url: RU_URL,
    type: 'website',
    locale: 'ru_RU',
    siteName: 'EXPERT',
  },
};

const keyPoints = [
  {
    title: '2 года пребывания',
    text: 'Нужно подтвердить непрерывное пребывание не менее 2 лет, предшествующих подаче заявления, с проверкой периодов, которые не засчитываются.',
  },
  {
    title: '20 часов в неделю суммарно',
    text: 'Может быть один или несколько договоров; суммарная занятость должна достигать не менее 20 часов в неделю при соблюдении применимой зарплаты.',
  },
  {
    title: 'Работодатель должен быть платёжеспособен',
    text: 'Проверяется, что работодатель исполняет свои обязательства и располагает достаточными средствами для условий договора.',
  },
];

const audience = [
  'Иностранцы с не менее чем 2 годами непрерывного пребывания в Испании и трудовым договором',
  'Лица с несколькими договорами на неполную занятость, которые в сумме отвечают требованиям по занятости и зарплате',
  'Случаи с сезонной занятостью или несколькими работодателями, которые нужно проверить на соответствие требованиям',
];

const requirements = [
  'Минимум 2 года непрерывного пребывания в Испании',
  'Ситуация, совместимая с подачей заявления, с проверкой периодов, в течение которых лицо было заявителем на международную защиту',
  'Один или несколько подписанных договоров, суммарно составляющих не менее 20 часов в неделю',
  'Зарплата согласно SMI или применимому коллективному соглашению, пропорционально занятости',
  'Работодатель(и), исполняющий(е) налоговые обязательства и обязательства перед Seguridad Social, с достаточной платёжеспособностью',
  'Отсутствие судимостей в установленных законом пределах',
];

const includes = [
  'Предварительная оценка дела',
  'Проверка периода пребывания',
  'Проверка договора(ов), занятости и зарплаты',
  'Проверка документации работодателя и его платёжеспособности',
  'Подготовка EX-10 и досье',
  'Электронная подача и стандартное сопровождение дела',
];

const requiredDocs = [
  'Полный паспорт',
  'Доказательства непрерывного пребывания не менее 2 лет',
  'Справка о несудимости за рубежом, когда это применимо',
  'Подписанный договор или договоры',
  'NIF и документация компании/представительства работодателя, когда это применимо',
  'Документы о платёжеспособности работодателя (IRPF, IVA, налог на прибыль организаций или VILE — в зависимости от случая)',
  'Диплом, признание квалификации или разрешение на профессию, если профессия регулируемая',
];

const processSteps = [
  {
    title: 'Проверка пребывания',
    text: 'Восстанавливаем хронологию за 2 года и проверяем периоды, которые не засчитываются.',
  },
  {
    title: 'Проверка договора(ов)',
    text: 'Проверяем суммарную занятость, зарплату, подписи и условия.',
  },
  {
    title: 'Проверка работодателя',
    text: 'Проверяем исполнение обязательств и достаточную платёжеспособность.',
  },
  {
    title: 'Подготовка и подача',
    text: 'Готовим EX-10, пошлину и подачу через систему Mercurio после человеческого одобрения.',
  },
];

const notIncluded = [
  'Административная пошлина Modelo 790 código 052',
  'Присяжные переводы, апостили или легализации',
  'Административные или судебные обжалования',
];

const reviewBeforeHiring = [
  'Если у вас пока нет договора(ов), нужно рассмотреть другой вид arraigo',
  'Если договоры не достигают 20 часов в неделю или есть сомнения по зарплате, мы проверяем это до подачи заявления',
];

const finalCta = {
  title: 'У вас 2 года в Испании и трудовой договор?',
  text: 'Проверяем занятость, зарплату, работодателя и документацию перед подготовкой arraigo sociolaboral.',
};

const faqs = [
  {
    q: 'Существует ли ещё старый arraigo laboral?',
    a: 'Действующая рабочая модальность — arraigo sociolaboral, регулируемая RD 1155/2024. Старая логика, основанная на нелегальных трудовых отношениях, не должна использоваться как актуальное требование.',
  },
  {
    q: 'Можно ли подать несколько договоров?',
    a: 'Да, в допустимых случаях; их сумма должна отвечать минимальной суммарной занятости и остальным нормативным условиям.',
  },
  {
    q: 'Сколько часов мне нужно?',
    a: 'Сумма договоров должна составлять не менее 20 часов в неделю в суммарном исчислении.',
  },
  {
    q: 'Какая форма подаётся?',
    a: 'Для этого разрешения по чрезвычайным обстоятельствам используется форма EX-10.',
  },
];

export default function RuArraigoLaboralPage() {
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Arraigo Sociolaboral в Испании',
    description:
      'Проверка требований arraigo sociolaboral по RD 1155/2024: 2 года пребывания, договор(ы) не менее 20 часов в неделю, работодатель и подача EX-10.',
    serviceType: 'Arraigo Sociolaboral',
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
            Arraigo Sociolaboral — трудовое укоренение
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
            Arraigo sociolaboral — действующая модальность, регулируемая Real Decreto (RD) 1155/2024. Как
            правило, требует не менее 2 лет непрерывного пребывания в Испании и наличия одного или нескольких
            трудовых договоров, обеспечивающих зарплату не ниже SMI или зарплаты по коллективному соглашению
            пропорционально занятости, при суммарной занятости не менее 20 часов в неделю. Также проверяются
            положение и платёжеспособность работодателя (или работодателей). Прежняя схема arraigo laboral,
            основанная на подтверждении нелегальных трудовых отношений через акт или судебное решение, не
            должна использоваться как актуальное правило.
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
              href="/solicitar-presupuesto?servicio=arraigo-laboral&tipo=caso-complejo"
              className="inline-flex min-h-12 items-center justify-center border border-[#D4A017] px-8 py-3 text-sm font-semibold text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Сложный случай
            </Link>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/55">{CHECKOUT_LEGAL_RU}</p>
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
              <p className="mt-2 text-xs leading-5 text-[#23364D]/65">{CHECKOUT_LEGAL_RU}</p>
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
