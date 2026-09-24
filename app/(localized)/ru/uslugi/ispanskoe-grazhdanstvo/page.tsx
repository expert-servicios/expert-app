import Link from 'next/link';
import type { Metadata } from 'next';
import { AlertCircle, Check, FileText, ShieldCheck, Users } from 'lucide-react';
import { AddToCartButton } from '@/components/services/AddToCartButton';
import { getCatalogService } from '@/lib/utils/catalog';
import { isLocalePubliclyEnabled } from '@/lib/i18n/feature-flags';
import { getLocalizedServicePresentation } from '@/lib/services/service-localized-content';

const SERVICE_SLUG = 'nacionalidad-espanola';
const ES_URL = 'https://expertconsulting.es/servicios/extranjeria-nacionalidad/nacionalidad-espanola';
const RU_PATH = '/ru/uslugi/ispanskoe-grazhdanstvo';
const RU_URL = `https://expertconsulting.es${RU_PATH}`;
const INDEXABLE = isLocalePubliclyEnabled('ru')
  && getLocalizedServicePresentation(SERVICE_SLUG, 'ru')?.indexable === true;

const service = (() => {
  const canonical = getCatalogService(SERVICE_SLUG);
  if (!canonical?.stripePriceId || !canonical.price) {
    throw new Error('Canonical nacionalidad-espanola service is not configured for checkout.');
  }
  return {
    ...canonical,
    price: canonical.price,
    stripePriceId: canonical.stripePriceId,
  };
})();

const DURATION_RU = '1,5–3 года (в зависимости от дела и пути)';

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
  title: 'Испанское гражданство по резиденции — полное досье | EXPERT',
  description:
    `Оформление дела о гражданстве Испании по резиденции: CCSE, DELE A2, апостилированные документы и подача. ${service.price}.`,
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
    title: 'Испанское гражданство по резиденции | EXPERT',
    description: 'Оценка пути, CCSE, DELE A2, документы и подача дела в Registro Civil или у нотариуса.',
    url: RU_URL,
    type: 'website',
    locale: 'ru_RU',
    siteName: 'EXPERT',
  },
};

const keyPoints = [
  {
    title: 'Сроки проживания зависят от происхождения',
    text: '10 лет (общее правило) / 5 лет (беженцы) / 2 года (граждане ибероамериканских стран, Филиппин, Экваториальной Гвинеи, Португалии, Андорры, сефарды) / 1 год (родившиеся в Испании, состоящие в браке с испанцем/испанкой и т. д.).',
  },
  {
    title: 'CCSE и DELE A2 обязательны',
    text: 'Нужно сдать экзамен CCSE (конституция и культура Испании), а если вы не из испаноязычной страны — ещё и DELE A2. Мы консультируем по подготовке.',
  },
  {
    title: 'Непрерывное и легальное проживание',
    text: 'Проживание должно быть легальным, непрерывным и непосредственно предшествующим подаче заявления. Перерывы более 90 дней могут повлиять на расчёт срока.',
  },
];

const audience = [
  'Легальные резиденты, выполнившие минимальный срок проживания согласно своей стране происхождения',
  'Граждане ибероамериканских стран с 2 годами легального проживания в Испании',
  'Лица, родившиеся в Испании или состоящие в браке с гражданином/гражданкой Испании (1 год)',
  'Беженцы и лица, получившие убежище в Испании (5 лет)',
];

const requirements = [
  'Легальное и непрерывное проживание в Испании в течение срока, установленного ст. 22 Гражданского кодекса (CC)',
  'Сдача экзамена CCSE (Instituto Cervantes)',
  'Сдача экзамена DELE A2 или выше (если вы не из испаноязычной страны)',
  'Отсутствие судимостей в Испании и в стране происхождения',
  'Апостилированное и переведённое на испанский язык свидетельство о рождении',
  'Действующая TIE в течение всего засчитываемого периода проживания',
];

const includes = [
  'Оценка применимого пути и засчитываемого срока проживания',
  'Консультация по получению CCSE и DELE A2',
  'Проверка и организация всей документации',
  'Проверка апостилей и переводов',
  'Подача дела (Registro Civil или нотариус — в зависимости от случая)',
  'Периодическое сопровождение дела',
  'Реагирование на запросы (requerimientos) и устранение недостатков',
];

const requiredDocs = [
  'Действующий паспорт (все страницы)',
  'Действующая TIE',
  'Историческая справка о регистрации по месту жительства (empadronamiento histórico) с начала засчитываемого периода проживания',
  'Справка о несудимости в Испании (Registro Central de Penados)',
  'Справка о несудимости в стране происхождения (апостилированная и переведённая на испанский)',
  'Свидетельство о рождении (апостилированное, с присяжным переводом на испанский)',
  'Диплом DELE A2 или выше (если применимо)',
  'Сертификат CCSE (Instituto Cervantes)',
];

const notIncluded = [
  'Административная пошлина за оформление',
  'Подготовка к экзаменам CCSE/DELE (можно организовать отдельно)',
  'Присяжные переводы документов (можно добавить как дополнительную услугу)',
  'Апостилирование документов из страны происхождения',
  'Обжалование в случае отказа',
];

const reviewBeforeHiring = [
  'Если вы ещё не сдали CCSE или DELE, мы можем готовить досье, пока вы их получаете',
  'Если у вас были периоды с истёкшей TIE или отсутствия более 90 дней, проконсультируйтесь заранее — это может повлиять на расчёт срока',
  'Если у вас есть судимости, обязательно проконсультируйтесь до начала оформления дела',
];

const finalCta = {
  title: 'Вы уже выполнили требуемый срок проживания?',
  text: 'Начинаем оформление вашего дела на испанское гражданство и сопровождаем вас на всех этапах — от экзаменов до решения.',
};

const faqs = [
  {
    q: 'Сколько лет легального проживания мне нужно?',
    a: '10 лет (общее правило). 5 лет, если вы беженец или получили убежище. 2 года, если вы гражданин ибероамериканской страны, Филиппин, Экваториальной Гвинеи, Португалии, Андорры или сефард. 1 год, если вы родились в Испании, состоите в браке с испанцем/испанкой, являетесь вдовцом/вдовой гражданина Испании или имеете второй степень родства с испанцем/испанкой по происхождению.',
  },
  {
    q: 'Нужно ли сдавать экзамены?',
    a: 'Да. CCSE (знания конституции и социокультурных особенностей) обязателен для всех. DELE A2 по испанскому языку обязателен, если вы не гражданин испаноязычной страны.',
  },
  {
    q: 'Проживание должно быть непрерывным?',
    a: 'Да, оно должно быть непрерывным и непосредственно предшествующим подаче заявления. Отсутствия более 90 дней подряд могут прервать расчёт срока. Оценивается индивидуально по каждому случаю.',
  },
  {
    q: 'Сколько времени занимает рассмотрение дела?',
    a: 'Установленный законом срок решения — 1 год, но на практике может занимать от 1,5 до 3 лет. Мы ведём периодическое сопровождение, чтобы как можно раньше выявлять возможные запросы (requerimientos).',
  },
  {
    q: 'Можно ли начать оформление до получения CCSE или DELE?',
    a: 'Рекомендуется подавать документы с обоими сертификатами. Тем не менее мы можем подготовить всю документацию, пока вы сдаёте экзамены, чтобы не терять время.',
  },
];

export default function RuNacionalidadEspanolaPage() {
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Испанское гражданство по резиденции',
    description:
      'Полное оформление дела о гражданстве Испании по резиденции (ст. 21–22 Гражданского кодекса): оценка пути, CCSE, DELE A2, документы и подача.',
    serviceType: 'Nacionalidad Española',
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
            Испанское гражданство по резиденции
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
            Гражданство Испании по резиденции (ст. 21–22 Гражданского кодекса) — самый распространённый путь
            для иностранцев, проживающих в Испании, получить испанское гражданство. Мы ведём дело полностью:
            оценка применимого пути (10, 5, 2 или 1 год), проверка документации, консультация по экзаменам
            CCSE и DELE A2, а также подача дела в Registro Civil или у нотариуса. Постоянное сопровождение до
            вынесения решения.
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
              href="/solicitar-presupuesto?servicio=nacionalidad-espanola&tipo=caso-complejo"
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
