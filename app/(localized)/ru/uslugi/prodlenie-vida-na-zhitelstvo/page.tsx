import Link from 'next/link';
import type { Metadata } from 'next';
import { AlertCircle, Check, FileText, ShieldCheck, Users } from 'lucide-react';
import { AddToCartButton } from '@/components/services/AddToCartButton';
import { getCatalogService } from '@/lib/utils/catalog';
import { isLocalePubliclyEnabled } from '@/lib/i18n/feature-flags';
import { getLocalizedServicePresentation } from '@/lib/services/service-localized-content';

const SERVICE_SLUG = 'renovacion-residencia';
const ES_URL = 'https://expertconsulting.es/servicios/extranjeria-nacionalidad/renovacion-residencia';
const RU_PATH = '/ru/uslugi/prodlenie-vida-na-zhitelstvo';
const RU_URL = `https://expertconsulting.es${RU_PATH}`;
const INDEXABLE = isLocalePubliclyEnabled('ru')
  && getLocalizedServicePresentation(SERVICE_SLUG, 'ru')?.indexable === true;

const service = (() => {
  const canonical = getCatalogService(SERVICE_SLUG);
  if (!canonical?.stripePriceId || !canonical.price) {
    throw new Error('Canonical renovacion-residencia service is not configured for checkout.');
  }
  return {
    ...canonical,
    price: canonical.price,
    stripePriceId: canonical.stripePriceId,
  };
})();

const DURATION_RU = '1–3 месяца';

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
  title: 'Продление вида на жительство в Испании | EXPERT',
  description:
    `Продление временного разрешения на жительство в Испании: arraigo, воссоединение семьи, работа. Проверка сроков, документов и подача. ${service.price}.`,
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
    title: 'Продление вида на жительство | EXPERT',
    description: 'Проверка сроков и требований, подготовка документов и электронная подача продления.',
    url: RU_URL,
    type: 'website',
    locale: 'ru_RU',
    siteName: 'EXPERT',
  },
};

const keyPoints = [
  {
    title: 'Подавайте в правильный срок',
    text: 'Заявление на продление можно подать за 60 дней до истечения срока действия. Если срок истёк менее 90 дней назад, заявление также можно подать, хотя возможна доплата (recargo).',
  },
  {
    title: 'Разрешение сохраняется на время рассмотрения',
    text: 'Если вы подаёте заявление в срок, действие вашего разрешения автоматически продлевается до вынесения решения по делу.',
  },
  {
    title: 'Полностью онлайн-оформление',
    text: 'Не нужно приезжать в наш офис. Вы присылаете отсканированные документы, а мы готовим и подаём всё в электронном виде.',
  },
];

const audience = [
  'Резиденты с временным разрешением на жительство, срок действия которого истекает в ближайшие 60 дней',
  'Резиденты, у которых разрешение истекло менее 90 дней назад',
  'Резиденты, которые хотят убедиться, что продление подано правильно и в срок',
];

const requirements = [
  'Действующее временное разрешение на жительство или истёкшее менее 90 дней назад',
  'Сохранение требований, на основании которых было предоставлено первоначальное разрешение',
  'Действующий паспорт',
  'Отсутствие новых судимостей',
];

const includes = [
  'Проверка требований и срока подачи на продление',
  'Подготовка и проверка всей документации',
  'Заполнение формы на продление',
  'Электронная подача в Oficina de Extranjería',
  'Сопровождение дела и реагирование на запросы (requerimientos)',
  'Консультация по получению новой TIE после решения',
];

const requiredDocs = [
  'Действующая или истёкшая TIE (обе стороны)',
  'Действующий паспорт',
  'Актуальная справка о регистрации по месту жительства (empadronamiento)',
  'Документы, подтверждающие сохранение требований (договор, расчётные листки, финансовые средства…)',
  'Свежая цветная фотография (размер как на удостоверение)',
  'Подтверждение оплаты пошлины Modelo 790 código 052',
];

const notIncluded = [
  'Административная пошлина Modelo 790 código 052 (оплачивается клиентом)',
  'Присяжные переводы или апостили при новых иностранных документах',
  'Обжалование в случае отказа',
];

const finalCta = {
  title: 'Ваш вид на жительство скоро истекает?',
  text: 'Не откладывайте до последнего момента. Подача продления в срок защищает ваш правовой статус на время рассмотрения дела.',
};

const faqs = [
  {
    q: 'Когда нужно подавать заявление на продление?',
    a: 'В период от 60 дней до истечения срока действия и до самой даты истечения. Если срок уже истёк, у вас есть 90 дней после этого, чтобы подать заявление, возможно с доплатой.',
  },
  {
    q: 'Могу ли я работать во время продления?',
    a: 'Если вы подаёте заявление в срок, действие вашего разрешения автоматически продлевается, включая разрешение на работу, если оно у вас было.',
  },
  {
    q: 'Что будет, если я не продлю вовремя?',
    a: 'Если с момента истечения срока прошло более 90 дней без продления, вы можете оказаться в нелегальном положении. В этом случае нужно рассмотреть другие пути урегулирования статуса.',
  },
  {
    q: 'Сколько времени занимает рассмотрение?',
    a: 'Установленный законом срок — 3 месяца. На практике решение обычно выносится в течение 1–3 месяцев, в зависимости от Delegación.',
  },
];

export default function RuRenovacionResidenciaPage() {
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Продление вида на жительство в Испании',
    description:
      'Продление разрешения на временное проживание в Испании в правильный срок: проверка требований, документов и подача заявления.',
    serviceType: 'Renovación de Residencia',
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
            Продление вида на жительство
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
            Продление разрешения на временное проживание нужно подавать в правильные сроки, чтобы избежать
            непреднамеренного попадания в нелегальное положение. Ведём продление вида на жительство по
            обстоятельствам исключительного характера (arraigos), воссоединению семьи и работе. Проверяем
            ваши требования, готовим документацию и подаём заявление в Oficina de Extranjería или Unidad de
            Grandes Empresas — в зависимости от случая.
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
              href="/solicitar-presupuesto?servicio=renovacion-residencia&tipo=caso-complejo"
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
                <h3 className="font-semibold">Для подачи продления</h3>
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
