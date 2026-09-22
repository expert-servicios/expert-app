import Link from 'next/link';
import type { Metadata } from 'next';
import { AlertCircle, Check, FileText, ShieldCheck, Users } from 'lucide-react';
import { AddToCartButton } from '@/components/services/AddToCartButton';
import { getCatalogService } from '@/lib/utils/catalog';
import { isLocalePubliclyEnabled } from '@/lib/i18n/feature-flags';
import { getLocalizedServicePresentation } from '@/lib/services/service-localized-content';

const SERVICE_SLUG = 'reagrupacion-familiar';
const ES_URL = 'https://expertconsulting.es/servicios/extranjeria-nacionalidad/reagrupacion-familiar';
const RU_PATH = '/ru/uslugi/vossoedinenie-semi';
const RU_URL = `https://expertconsulting.es${RU_PATH}`;
const INDEXABLE = isLocalePubliclyEnabled('ru')
  && getLocalizedServicePresentation(SERVICE_SLUG, 'ru')?.indexable === true;

const service = (() => {
  const canonical = getCatalogService(SERVICE_SLUG);
  if (!canonical?.stripePriceId || !canonical.price) {
    throw new Error('Canonical reagrupacion-familiar service is not configured for checkout.');
  }
  return {
    ...canonical,
    price: canonical.price,
    stripePriceId: canonical.stripePriceId,
  };
})();

const DURATION_RU = '3–6 месяцев';

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
  title: 'Воссоединение семьи в Испании | EXPERT',
  description:
    `Оформление воссоединения семьи в Испании: супруг(а), дети и родители. Проверка доходов, жилья и документов. ${service.price}.`,
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
    title: 'Воссоединение семьи в Испании | EXPERT',
    description: 'Проверка доходов, жилья и родства, подготовка досье и подача заявления.',
    url: RU_URL,
    type: 'website',
    locale: 'ru_RU',
    siteName: 'EXPERT',
  },
};

const keyPoints = [
  {
    title: 'Требуется минимум 1 год легального проживания',
    text: 'У воссоединяющего должно быть действующее разрешение на проживание не менее 1 года, а также он должен продлить его — или иметь возможность продлить — ещё как минимум на 1 год.',
  },
  {
    title: 'Подтверждаемые доходы и жильё',
    text: 'Воссоединяющий должен подтвердить достаточные доходы (минимум 150 % от IPREM на первого члена семьи) и располагать жильём, отвечающим условиям для проживания.',
  },
  {
    title: 'Родственник въезжает по визе воссоединения',
    text: 'Родственник, которого нужно воссоединить (если он ещё не находится в Испании с разрешением на проживание), должен получить визу воссоединения в консульстве Испании в своей стране.',
  },
];

const audience = [
  'Легальные резиденты Испании, которые хотят привезти супруга/супругу или сожителя/сожительницу',
  'Легальные резиденты, которые хотят воссоединиться с несовершеннолетними детьми',
  'Легальные резиденты с родителями на иждивении в стране происхождения',
];

const requirements = [
  'Действующее разрешение на проживание воссоединяющего (не менее 1 года предыдущего проживания)',
  'Достаточные доходы: общий ориентир — 150 % от IPREM для семьи из двух человек и дополнительно 50 % за каждого следующего члена семьи, с возможным снижением в случаях с несовершеннолетними',
  'Жильё, отвечающее условиям для проживания (заключение муниципалитета — Ayuntamiento)',
  'Подтверждаемое родство: брак, происхождение (filiación) или экономическая зависимость',
  'Отсутствие судимостей у родственника',
];

const includes = [
  'Оценка требований: доходы, жильё и родство',
  'Консультация по получению заключения о жилье в Ayuntamiento',
  'Подготовка полного досье',
  'Подача в Oficina de Extranjería',
  'Сопровождение дела и реагирование на запросы (requerimientos)',
  'Консультация по процедуре получения визы в консульстве',
];

const requiredDocs = [
  'Действующие TIE и паспорт воссоединяющего',
  'Актуальная справка о регистрации по месту жительства (empadronamiento) воссоединяющего',
  'Последние расчётные листки или подтверждения дохода воссоединяющего (за 3–6 месяцев)',
  'Заключение о пригодности жилья для проживания (Ayuntamiento)',
  'Документ, подтверждающий родство (свидетельство о браке, семейная книга и т. д.) — апостилированный и переведённый, если он иностранный',
  'Паспорт воссоединяемого родственника',
  'Справка о несудимости родственника (апостилированная и переведённая)',
];

const notIncluded = [
  'Административная пошлина (оплачивается клиентом)',
  'Присяжные переводы иностранных документов',
  'Апостилирование документов из страны происхождения',
  'Оформление визы в консульстве страны происхождения (мы консультируем по процедуре)',
  'Обжалование в случае отказа',
];

const finalCta = {
  title: 'Хотите воссоединиться с семьёй в Испании?',
  text: 'Ведём ваше дело о воссоединении семьи от начала до конца. Бесплатно оцениваем ваши доходы и жильё.',
};

const faqs = [
  {
    q: 'Каких родственников я могу воссоединить?',
    a: 'Супруга/супругу или зарегистрированного сожителя/сожительницу, несовершеннолетних детей до 18 лет (или старше, если они находятся на иждивении), а также восходящих родственников (родителей), находящихся на экономическом иждивении.',
  },
  {
    q: 'Сколько мне нужно зарабатывать?',
    a: 'Как общее правило, для семьи из двух человек требуется ежемесячный доход, эквивалентный 150 % от IPREM, плюс 50 % за каждого дополнительного члена семьи. В отдельных случаях с несовершеннолетними сумма может быть снижена, поэтому мы рассматриваем каждый конкретный случай.',
  },
  {
    q: 'Нужна ли мне большая квартира?',
    a: 'Это зависит от числа людей. Ayuntamiento выдаёт заключение о пригодности жилья исходя из площади в квадратных метрах и числа проживающих.',
  },
  {
    q: 'Может ли мой супруг/супруга работать по приезде?',
    a: 'При воссоединении с супругом/супругой предоставляемое разрешение на проживание, как правило, включает разрешение на работу.',
  },
];

export default function RuReagrupacionFamiliarPage() {
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Воссоединение семьи в Испании',
    description:
      'Оформление воссоединения семьи по LO 4/2000 и RD 1155/2024: проверка доходов, жилья, родства, подготовка досье и подача в Oficina de Extranjería.',
    serviceType: 'Reagrupación Familiar',
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
            Воссоединение семьи в Испании
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
            Воссоединение семьи оформляется по Ley Orgánica (LO) 4/2000 и Reglamento, утверждённому Real
            Decreto (RD) 1155/2024. Проверяем, кого из родственников можно воссоединить, оцениваем
            фиксированные и регулярные доходы, пригодное жильё и требуемую документацию перед подачей дела.
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
              href="/solicitar-presupuesto?servicio=reagrupacion-familiar&tipo=caso-complejo"
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
