import Link from 'next/link';
import type { Metadata } from 'next';
import { AlertCircle, Check, FileText, ShieldCheck } from 'lucide-react';
import { AddToCartButton } from '@/components/services/AddToCartButton';
import { NATIONALITY_MINOR_SERVICE } from '@/lib/services/nationality-minor';

const ES_URL = 'https://expertconsulting.es/servicios/extranjeria-nacionalidad/nacionalidad-espanola-menor-nacido-en-espana';
const RU_URL = 'https://expertconsulting.es/ru/uslugi/grazhdanstvo-ispanii-rebenok-rozhdennyy-v-ispanii';

const CART_ITEM = {
  priceId: NATIONALITY_MINOR_SERVICE.stripePriceId,
  name: 'Испанское гражданство для ребёнка, родившегося в Испании',
  displayPrice: '302,50 € услуги + 104,05 € пошлина',
  slug: NATIONALITY_MINOR_SERVICE.slug,
  category: 'extranjeria-nacionalidad',
  disbursements: [NATIONALITY_MINOR_SERVICE.disbursementKey],
  disbursementNotice:
    'Включает обязательную государственную пошлину Ministerio de Justicia 790-026: 104,05 € как suplido отдельно от профессиональных услуг.',
};

export const metadata: Metadata = {
  title: 'Испанское гражданство для ребёнка, родившегося в Испании | EXPERT',
  description:
    'Подготовка и подача заявления на испанское гражданство по резиденции для несовершеннолетнего ребёнка, родившегося в Испании. Услуги 302,50 € с IVA + государственная пошлина 790-026 104,05 € как suplido.',
  alternates: {
    canonical: RU_URL,
    languages: {
      'es-ES': ES_URL,
      'ru-RU': RU_URL,
      'x-default': ES_URL,
    },
  },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    title: 'Испанское гражданство для ребёнка, родившегося в Испании | EXPERT',
    description:
      'Услуги 302,50 € с IVA + государственная пошлина 790-026 104,05 € как suplido.',
    url: RU_URL,
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Испанское гражданство для ребёнка, родившегося в Испании | EXPERT',
    description: '302,50 € с IVA + пошлина 790-026 104,05 € как suplido. Итого 406,55 €.',
  },
};

const includedItems = [
  'Предварительная проверка жизнеспособности дела.',
  'Проверка срока 1 года легальной резиденции ребёнка.',
  'Проверка NIE/TIE, паспортов, свидетельства о рождении, empadronamiento и семейной документации.',
  'Подготовка пакета документов и официальных форм.',
  'Подготовка mandato de representación voluntaria, чтобы EXPERT мог телематически подать заявление от имени заявителя.',
  'Организация подписания mandato обоими родителями, если оба осуществляют patria potestad, и сохранение подписанного документа в expediente.',
  'Оплата государственной пошлины 790-026 как suplido, с подтверждением оплаты на имя несовершеннолетнего заявителя.',
  'Телематическая подача заявления в Ministerio de Justicia, если это применимо.',
  'Передача подтверждения подачи и номера expediente.',
  'Базовое первичное сопровождение expediente и ориентация по обычным requerimientos.',
];

const documentGroups = [
  {
    title: 'Документы ребёнка',
    items: [
      'Дословное свидетельство о рождении, выданное испанским Registro Civil.',
      'Действующий полный паспорт, копии всех страниц.',
      'NIE/TIE или другой документ, подтверждающий легальную резиденцию в Испании.',
      'Предыдущая карта резидента, если имеется.',
      'Первичное решение о предоставлении резиденции или временной защиты, если имеется.',
      'Актуальный certificado de empadronamiento familiar/colectivo.',
      'Справка из школы или учебного центра, когда она требуется с учётом возраста и фактического обучения ребёнка.',
    ],
  },
  {
    title: 'Документы родителей',
    items: [
      'Действующие полные паспорта обоих родителей.',
      'NIE/TIE обоих родителей с обеих сторон.',
      'Семейный certificado de empadronamiento, если он не предоставляется отдельно.',
      'Контактные данные: телефон, электронная почта и актуальный адрес.',
      'Подписи обоих родителей, если оба осуществляют patria potestad и согласны с подачей заявления.',
      'Mandato de representación voluntaria в пользу представителя EXPERT, который будет выполнять телематическую подачу.',
      'Дополнительные документы, подтверждающие законное представительство, если подписать заявление может только один из родителей.'
    ],
  },
];

const processSteps = [
  {
    title: 'Оформление услуги и mandato de suplido',
    text:
      'При оформлении услуги оплачиваются профессиональные услуги и обязательная государственная пошлина. Пошлина 790-026 взимается как suplido, чтобы EXPERT оплатил её от имени и за счёт клиента.',
  },
  {
    title: 'Отправка документов',
    text: 'После оплаты EXPERT автоматически открывает expediente. Клиент загружает необходимые документы через защищённый кабинет EXPERT; WhatsApp используется для вопросов и оперативной связи.',
  },
  {
    title: 'Проверка viabilidad',
    text: 'Мы проверяем требование 1 года легальной резиденции, непрерывность проживания и полноту документов.',
  },
  {
    title: 'Mandato de representación и подписи',
    text: 'Если EXPERT подаёт заявление как representante voluntario, мы готовим mandato с данными expediente и запрашиваем подписи обоих родителей, когда оба осуществляют patria potestad. Подписанный документ сохраняется в expediente до подачи.',
  },
  {
    title: 'Подготовка и подача',
    text: 'Мы готовим заявление, формы и цифровой пакет документов. Телематическая подача выполняется с сертификатом представителя EXPERT после подтверждения полномочий и полной проверки expediente.',
  },
  {
    title: 'Justificante и первичное сопровождение',
    text: 'Мы передаём подтверждение подачи, номер expediente и первичную инструкцию по дальнейшему отслеживанию.',
  },
];

const notIncludedItems = [
  'Присяжные переводы, если они потребуются.',
  'Апостили или легализации, если они потребуются.',
  'Дополнительные официальные сертификаты, которые необходимо запрашивать отдельно.',
  'Дополнительные действия при сложных requerimientos.',
  'Административные или судебные обжалования в случае отказа.',
  'Последующие процедуры, прямо не включённые в услугу.',
];

const faqItems = [
  {
    q: 'Включена ли государственная пошлина в цену?',
    a:
      'Да. При оформлении этой услуги оплачиваются профессиональные услуги и дополнительно государственная пошлина 790-026 в размере 104,05 € как suplido. Пошлина не является частью наших профессиональных услуг и не входит в налоговую базу гонорара. Она оплачивается от имени и за счёт клиента.',
  },
  {
    q: 'Ребёнок автоматически получает гражданство, если родился в Испании?',
    a:
      'Нет. Рождение в Испании может сократить срок, необходимый для подачи заявления на гражданство по резиденции, до 1 года, но само по себе не всегда автоматически даёт испанское гражданство.',
  },
  {
    q: 'Когда можно подать заявление?',
    a:
      'Когда у ребёнка есть 1 год легальной, непрерывной резиденции в Испании непосредственно перед подачей заявления.',
  },
  {
    q: 'Можете ли вы оплатить пошлину за меня?',
    a:
      'Да. В этой услуге пошлина оформляется как обязательный suplido: EXPERT может оплатить modelo 790-026 от имени и за счёт клиента, указав данные несовершеннолетнего заявителя и сохранив соответствующий justificante.',
  },
  {
    q: 'Должны ли подписывать заявление оба родителя?',
    a:
      'Для ребёнка младше 14 лет заявление подают законные представители. Если patria potestad осуществляют оба родителя и есть согласие, они участвуют в подаче в соответствии с применимой формой; при разногласии мы проверяем необходимость решения по expediente de jurisdicción voluntaria. В возрасте 14–17 лет заявление подаёт сам несовершеннолетний при содействии своих законных представителей.',
  },
  {
    q: 'Может ли EXPERT подать заявление от нашего имени?',
    a:
      'Да. Ministerio de Justicia допускает подачу через добровольного представителя (representante voluntario), если полномочия подтверждены mandato или poder. Когда подачу выполняет EXPERT, мы готовим mandato, собираем необходимые подписи и включаем подписанный документ в expediente до телематической подачи.',
  },
  {
    q: 'Нужно ли ребёнку сдавать CCSE или DELE?',
    a:
      'Нет. Несовершеннолетние освобождены от CCSE, а лица младше 18 лет — от DELE A2 для процедуры гражданства по резиденции. Мы проверяем, какие документы из школы или учебного центра нужно приложить для подтверждения интеграции.',
  },
];

export default function RuNacionalidadMenorPage() {
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Испанское гражданство для ребёнка, родившегося в Испании',
    description:
      'Подготовка и подача заявления на испанское гражданство по резиденции для несовершеннолетнего ребёнка, родившегося в Испании. Услуги 302,50 € с IVA + государственная пошлина 790-026 104,05 € как suplido.',
    serviceType: 'Extranjería y Nacionalidad',
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
      price: '406.55',
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
            <Link href="/servicios/extranjeria-nacionalidad/nacionalidad-espanola-menor-nacido-en-espana" className="text-xs font-semibold text-white/55 underline underline-offset-4 hover:text-[#D4A017]">
              Español
            </Link>
          </div>
          <h1 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
            Испанское гражданство для ребёнка, родившегося в Испании
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
            Подготовка и подача заявления на испанское гражданство по резиденции для несовершеннолетнего ребёнка, родившегося в Испании. Мы проверяем срок легальной резиденции, документы ребёнка и родителей, подписи законных представителей и mandato de representación voluntaria, когда подачу выполняет EXPERT.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="border border-white/12 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Профессиональные услуги</p>
              <p className="mt-2 text-2xl font-bold text-white">302,50 €</p>
              <p className="mt-1 text-xs leading-5 text-white/55">250 € + IVA 21 %</p>
            </div>
            <div className="border border-white/12 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Государственная пошлина</p>
              <p className="mt-2 text-2xl font-bold text-white">104,05 €</p>
              <p className="mt-1 text-xs leading-5 text-white/55">Modelo 790-026 как suplido</p>
            </div>
            <div className="border border-[#D4A017]/50 bg-[#D4A017]/10 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Итого к оплате</p>
              <p className="mt-2 text-2xl font-bold text-white">406,55 €</p>
              <p className="mt-1 text-xs leading-5 text-white/55">Безопасная онлайн-оплата</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <AddToCartButton
              item={CART_ITEM}
              label="Оформить — 302,50 € + пошлина 104,05 €"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-8 py-3 text-sm font-bold text-[#0D1B2A] shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <Link
              href="/solicitar-presupuesto?servicio=nacionalidad-espanola-menor-nacido-en-espana&tipo=caso-complejo"
              className="inline-flex min-h-12 items-center justify-center border border-[#D4A017] px-8 py-3 text-sm font-semibold text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Сложный случай
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-[1fr_320px] lg:items-start md:py-16">
        <div className="space-y-10">
          <div className="border border-[#D4A017]/25 bg-white p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#D4A017]" />
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">Пошлина включена как обязательный suplido</h2>
                <p className="mt-3 text-sm leading-7 text-[#23364D]">
                  При оформлении услуги клиент оплачивает профессиональные услуги EXPERT и одновременно разрешает EXPERT оплатить государственную пошлину 790-026 от имени несовершеннолетнего заявителя. Пошлина взимается в точной сумме 104,05 € как suplido, не является частью наших профессиональных услуг и учитывается отдельно от базы гонорара.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">Что включено?</h2>
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
            <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">Необходимые документы</h2>
            <div className="mt-5 grid gap-4">
              {documentGroups.map((group) => (
                <div key={group.title} className="border border-[#D4A017]/20 bg-white p-5">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-[#D4A017]" />
                    <h3 className="font-semibold text-[#0D1B2A]">{group.title}</h3>
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                        <span className="text-sm leading-6 text-[#23364D]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">Как проходит процесс</h2>
            <ol className="mt-6 space-y-4">
              {processSteps.map((step, index) => (
                <li key={step.title} className="grid grid-cols-[40px_1fr] gap-4">
                  <span className="flex h-10 w-10 items-center justify-center bg-[#D4A017] text-sm font-bold text-[#0D1B2A]">
                    {index + 1}
                  </span>
                  <div className="pt-1">
                    <h3 className="font-semibold text-[#0D1B2A]">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#23364D]">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="border border-amber-200 bg-amber-50/60 p-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-amber-700">Не включено</p>
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
            <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">Частые вопросы</h2>
            <div className="mt-6 space-y-5">
              {faqItems.map(({ q, a }) => (
                <div key={q} className="border-l-2 border-[#D4A017] pl-5">
                  <p className="font-semibold text-[#0D1B2A]">{q}</p>
                  <p className="mt-2 text-sm leading-6 text-[#23364D]">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <div className="overflow-hidden border border-[#D4A017]/30 bg-white">
            <div className="border-b border-[#D4A017]/20 bg-[#D4A017]/8 px-6 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4A017]">Итоговая цена</p>
              <p className="mt-1 text-2xl font-bold text-[#0D1B2A]">406,55 €</p>
              <p className="mt-2 text-xs leading-5 text-[#23364D]/65">
                302,50 € профессиональные услуги с IVA + 104,05 € пошлина 790-026 как обязательный suplido.
              </p>
            </div>
            <div className="space-y-3 px-6 py-5">
              <AddToCartButton
                item={CART_ITEM}
                label="Добавить в корзину"
                className="inline-flex w-full min-h-11 items-center justify-center gap-2 bg-[#D4A017] px-4 py-2.5 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:opacity-60"
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
