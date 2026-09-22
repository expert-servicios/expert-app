import Link from 'next/link';
import type { Metadata } from 'next';
import { AlertCircle, Check, Clock } from 'lucide-react';
import { getCatalogService } from '@/lib/utils/catalog';
import { isLocalePubliclyEnabled } from '@/lib/i18n/feature-flags';
import { getLocalizedServicePresentation } from '@/lib/services/service-localized-content';

const SERVICE_SLUG = 'holded-migracion-laboral';
const ES_URL = 'https://expertconsulting.es/servicios/holded/holded-migracion-laboral';
const RU_PATH = '/ru/uslugi/kadrovaya-migratsiya-v-holded';
const RU_URL = `https://expertconsulting.es${RU_PATH}`;
const INDEXABLE = isLocalePubliclyEnabled('ru')
  && getLocalizedServicePresentation(SERVICE_SLUG, 'ru')?.indexable === true;

const service = (() => {
  const canonical = getCatalogService(SERVICE_SLUG);
  if (!canonical) {
    throw new Error('Canonical holded-migracion-laboral service is missing from the catalog.');
  }
  return canonical;
})();

const budgetHref = `/solicitar-presupuesto?servicio=${SERVICE_SLUG}`;

export const metadata: Metadata = {
  title: 'Кадровая миграция в Holded от 50 € за сотрудника | EXPERT',
  description:
    `Переносим и проверяем кадровые данные сотрудников в Holded: договор, график, зарплата и IRPF, с тестовым расчётом. ${service.price}.`,
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
    title: 'Кадровая миграция в Holded | EXPERT',
    description: 'Договоры, зарплата и IRPF по каждому сотруднику, с тестовым расчётом зарплаты.',
    url: RU_URL,
    type: 'website',
    locale: 'ru_RU',
    siteName: 'EXPERT',
  },
};

const includes = [
  'Предварительная проверка документов',
  'Настроенный кадровый профиль по каждому сотруднику',
  'Трудовой договор, график работы, категория и структура зарплаты',
  'Указаны IRPF и дополнительные выплаты (pagas extra)',
  'Тестовый расчёт зарплаты (nómina de prueba) по каждому сотруднику',
  'Итоговый отчёт по несоответствиям',
];

const notIncluded = [
  'Перерасчёты и исторические корректировки',
  'Уведомления в TGSS или SEPE',
  'Отправка через SILTRA',
  'Ежемесячное ведение зарплат',
  'Лицензия Holded',
];

const reviewBeforeHiring = [
  'Количество сотрудников для миграции',
  'Текущее состояние кадровой настройки Holded',
  'Наличие трудовых договоров, актуальной зарплатной ведомости и IDC',
  'Необходимость исторических перерасчётов',
];

const faqs = [
  {
    q: 'Какой минимальный заказ?',
    a: 'Минимальный заказ — 5 сотрудников, что соответствует 250 € + IVA.',
  },
  {
    q: 'Включено ли ежемесячное ведение?',
    a: 'Нет. Это разовое внедрение; ежемесячное ведение зарплат оформляется отдельно.',
  },
  {
    q: 'Как оформить заказ?',
    a: 'Сначала мы уточняем количество сотрудников для миграции. Затем выставляем структурированную смету с корректным количеством (минимум 5 сотрудников), а оплата производится из личного кабинета.',
  },
];

export default function RuHoldedMigracionLaboralPage() {
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Кадровая миграция в Holded',
    description:
      'Перенос актуальных кадровых данных каждого сотрудника в Holded: трудовой договор, график работы, категория, зарплата, дополнительные выплаты и IRPF, с проверкой тестовым расчётом зарплаты.',
    serviceType: 'Holded',
    provider: {
      '@type': 'Organization',
      name: 'EXPERT',
    },
    areaServed: {
      '@type': 'Country',
      name: 'España',
    },
    url: RU_URL,
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
            Кадровая миграция в Holded
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
            Переносим актуальные кадровые данные каждого сотрудника в Holded: настраиваем трудовой
            договор, график работы, категорию, зарплату, дополнительные выплаты (pagas extra) и IRPF,
            а результат проверяем тестовым расчётом зарплаты (nómina de prueba). В комплект входит
            отчёт по выявленным несоответствиям и документированная передача результата.
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
              <p className="mt-2 text-xl font-bold text-white">{service.duration}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={budgetHref}
              className="inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-8 py-3 text-sm font-bold text-[#0D1B2A] shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#F2C14E]"
            >
              Запросить смету
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
              <p className="mt-2 text-xs leading-5 text-[#23364D]/65">Срок: {service.duration}.</p>
            </div>
            <div className="space-y-3 px-6 py-5">
              <Link
                href={budgetHref}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[#D4A017] px-4 py-2.5 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 transition hover:bg-[#F2C14E]"
              >
                Оставить заявку
              </Link>
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
