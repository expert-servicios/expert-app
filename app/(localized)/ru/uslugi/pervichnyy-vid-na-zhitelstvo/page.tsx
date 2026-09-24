import Link from 'next/link';
import type { Metadata } from 'next';
import { Check, Clock, FileText } from 'lucide-react';
import { AddToCartButton } from '@/components/services/AddToCartButton';
import { getCatalogService } from '@/lib/utils/catalog';
import { isLocalePubliclyEnabled } from '@/lib/i18n/feature-flags';
import { getLocalizedServicePresentation } from '@/lib/services/service-localized-content';

const SERVICE_SLUG = 'permiso-residencia-inicial';
const ES_URL = 'https://expertconsulting.es/servicios/extranjeria-nacionalidad/permiso-residencia-inicial';
const RU_PATH = '/ru/uslugi/pervichnyy-vid-na-zhitelstvo';
const RU_URL = `https://expertconsulting.es${RU_PATH}`;
const INDEXABLE = isLocalePubliclyEnabled('ru')
  && getLocalizedServicePresentation(SERVICE_SLUG, 'ru')?.indexable === true;

const service = (() => {
  const canonical = getCatalogService(SERVICE_SLUG);
  if (!canonical?.stripePriceId || !canonical.price) {
    throw new Error('Canonical permiso-residencia-inicial service is not configured for checkout.');
  }
  return {
    ...canonical,
    price: canonical.price,
    stripePriceId: canonical.stripePriceId,
  };
})();

const DURATION_RU = '2–4 месяца';

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
  title: 'Первичный вид на жительство в Испании | EXPERT',
  description:
    `Первое разрешение на проживание в Испании: оценка пути (arraigo, чрезвычайные обстоятельства, воссоединение, работа), документы и подача. ${service.price}.`,
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
    title: 'Первичный вид на жительство | EXPERT',
    description: 'Оценка подходящего пути, подготовка документов и подача заявления в Oficina de Extranjería.',
    url: RU_URL,
    type: 'website',
    locale: 'ru_RU',
    siteName: 'EXPERT',
  },
};

const includes = [
  'Бесплатная оценка наиболее подходящего пути для вашей ситуации',
  'Проверка документации и рекомендации по её подготовке',
  'Заполнение формы EX-01 или EX-02 — в зависимости от случая',
  'Электронная или очная подача в Oficina de Extranjería',
  'Активное сопровождение дела и реагирование на запросы (requerimientos)',
  'Уведомление о решении и порядок получения TIE',
];

const requiredDocs = [
  'Действующий паспорт (с копией всех страниц)',
  'Заполненная форма заявления (EX-01 или EX-02)',
  'Свежая цветная фотография размера как на удостоверение',
  'Подтверждение оплаты пошлины (Modelo 790 código 052)',
  'Доказательства непрерывного пребывания — согласно применимому виду arraigo',
  'Специфическая документация в зависимости от вида разрешения на проживание или arraigo',
  'Достаточные экономические средства (расчётные листки, банковские выписки и т. п.)',
  'Частная медицинская страховка без доплат и без периода ожидания (если нет взносов в Seguridad Social)',
  'Справка о несудимости из страны происхождения — апостилированная и переведённая',
  'Справка о несудимости в Испании',
];

const faqs = [
  {
    q: 'Сколько времени занимает первичный вид на жительство?',
    a: 'Установленный законом срок решения — 3 месяца с момента подачи. На практике в большинстве отделений Extranjería срок составляет от 2 до 4 месяцев, но в провинциях с большей нагрузкой может увеличиваться.',
  },
  {
    q: 'Что будет, если решение не вынесут в установленный срок?',
    a: 'Если администрация не вынесет решение за 3 месяца, действует правило административного молчания с отрицательным результатом (silencio administrativo negativo). Однако это открывает путь для обжалования. Мы консультируем, как действовать в этом случае.',
  },
  {
    q: 'Могу ли я работать во время оформления первичного разрешения?',
    a: 'Зависит от пути. При arraigo laboral при подаче заявления можно запросить временное разрешение на работу. По другим путям работать во время оформления не разрешается.',
  },
  {
    q: 'Что такое TIE?',
    a: 'Tarjeta de Identidad de Extranjero (TIE) — это физический документ, удостоверяющий ваше разрешение на проживание. Его запрашивают в комиссариате после получения положительного решения, и выдают в течение примерно 30–45 дней.',
  },
  {
    q: 'Нужно ли приезжать лично в ваш офис?',
    a: 'Нет. Всё оформление происходит онлайн. Вы присылаете нам отсканированные документы, а мы готовим и подаём дело. Личное присутствие в Oficina de Extranjería потребуется только если это обязательно для вашего конкретного пути.',
  },
];

export default function RuPermisoResidenciaInicialPage() {
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Первичный вид на жительство в Испании',
    description:
      'Первое разрешение на проживание в Испании: оценка наиболее подходящего пути (arraigo laboral, чрезвычайные обстоятельства, воссоединение, работа), подготовка документов и подача в Oficina de Extranjería.',
    serviceType: 'Permiso Inicial de Residencia',
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
            Первичный вид на жительство
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
            Первичное разрешение на проживание — первый шаг к легализации вашего положения в Испании. Ведём
            дело полностью: оцениваем вашу личную ситуацию, определяем наиболее подходящий путь (arraigo
            laboral, чрезвычайные обстоятельства, воссоединение, работа…), готовим всю документацию и подаём
            её в Oficina de Extranjería. Сопровождаем вас на каждом этапе до получения положительного решения
            и оформления TIE.
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
              href="/solicitar-presupuesto?servicio=permiso-residencia-inicial&tipo=caso-complejo"
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
