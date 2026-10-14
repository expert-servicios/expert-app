import Link from 'next/link';

type Locale = 'es' | 'ru';

const SOURCES = [
  { label: 'RGPD · Reglamento (UE) 2016/679', href: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj/spa' },
  { label: 'LOPDGDD · Ley Orgánica 3/2018', href: 'https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673' },
  { label: 'AEPD · Facilita EMPRENDE', href: 'https://www.aepd.es/guias-y-herramientas/herramientas/facilita-emprende' },
  { label: 'AEPD · Guía de cookies', href: 'https://www.aepd.es/guias/guia-cookies.pdf' },
  { label: 'LSSI · Ley 34/2002', href: 'https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758' },
  { label: 'Reglamento de Servicios Digitales · UE 2022/2065', href: 'https://eur-lex.europa.eu/legal-content/ES/ALL/?uri=CELEX:32022R2065' },
  { label: 'CIRCE · Tramitación electrónica', href: 'https://paeelectronico.es/es-es/CreaEmpresaPorTiMismo/Paginas/Home.aspx' },
];

const COPY = {
  es: {
    back: 'Todos los servicios', switch: 'Русский', switchPath: '/ru/uslugi/rgpd-dokumenty-platformy',
    eyebrow: 'EXPERT · Protección de datos y empresa',
    title: 'Política de privacidad, adecuación RGPD y documentación legal para negocios digitales',
    intro: 'La herramienta gratuita permite identificar obligaciones y generar borradores. Si necesitas documentos adaptados a tu actividad, revisar tus flujos reales de datos o preparar el lanzamiento de una plataforma, EXPERT puede presupuestar una intervención profesional con alcance definido.',
    freeTitle: 'Empieza gratuitamente',
    freeText: 'Cuestionario RGPD, inventario de tratamientos, proveedores y conservación. Los documentos son borradores; el resultado no certifica el cumplimiento.',
    freeButton: 'Abrir herramienta RGPD',
    offers: [
      { id: 'politica', title: '1. Política de privacidad y formularios', lead: 'Adaptación profesional de textos informativos a una empresa o web concreta.', items: ['Identificación del responsable, tipos de usuarios, recogida y fuentes de datos.', 'Finalidades, bases jurídicas, conservación, destinatarios y derechos.', 'Textos por canal: registro, contacto, candidatura, newsletter y otras recogidas reales.', 'Revisión de coherencia con las funcionalidades de la web y las cookies.'], excludes: 'No incluye automáticamente auditoría técnica, EIPD ni contratos de todos los proveedores.' },
      { id: 'implantacion', title: '2. Adecuación RGPD y revisión de riesgos', lead: 'No se limita a publicar una política: ordena los tratamientos y las obligaciones de la organización.', items: ['Mapa de tratamientos y roles: responsable, encargado o corresponsable, según hechos.', 'RAT, bases jurídicas, acuerdos con encargados y posible acceso fuera del EEE.', 'Conservación, seguridad, derechos y gestión de brechas.', 'Detección de operaciones que requieren evaluación de riesgos y, si procede, EIPD.'], excludes: 'La EIPD y la revisión especializada de alto riesgo se presupuestan por separado cuando procedan.' },
      { id: 'plataformas', title: '3. Documentación legal de plataformas y marketplaces', lead: 'Para negocios que conectan perfiles profesionales, centros, proveedores, anunciantes o clientes.', items: ['Mapa de relaciones y responsabilidades de operadores y participantes.', 'Condiciones de uso, publicación de anuncios, portafolios y contenidos aportados.', 'Revisión de imágenes, perfiles, candidatos, comunicaciones y controles de acceso.', 'Análisis preliminar de LSSI, Reglamento de Servicios Digitales y normativa sectorial si resultan aplicables.'], excludes: 'No presupone que toda plataforma sea una agencia de colocación ni que tenga las mismas obligaciones.' },
    ],
    quoteTitle: 'Un presupuesto por alcance, no una tarifa genérica',
    quoteText: 'La adaptación jurídica depende del número de tratamientos, funcionalidades, perfiles, proveedores y riesgos. El formulario recoge el objetivo y EXPERT confirma los entregables, exclusiones, honorarios, IVA y, si los hubiera, suplidos antes de contratar.',
    quoteButton: 'Solicitar presupuesto RGPD y documentación',
    companyTitle: '¿Todavía no has constituido tu sociedad?',
    companyText: 'Podemos comparar el inicio de actividad y la constitución de una SL con CIRCE o tramitación ordinaria. No es obligatorio contratar ambas cosas juntas; la decisión exige revisar quién actúa y qué riesgos asume mientras se desarrolla la plataforma.',
    slGeneral: 'Constitución de SL · 490,00 € + IVA (honorarios de catálogo)',
    slCirce: 'SL por CIRCE · desde 180,00 € + IVA (honorarios de catálogo)',
    slNote: 'La vía adecuada, los gastos de notaría/registro y lo incluido se confirman antes de contratar. El capital mínimo legal no equivale a ausencia de obligaciones o costes.',
    relatedTitle: 'Artículos y guías para preparar el proyecto',
    related: [
      ['RGPD para autónomos y pymes', '/blog/rgpd-autonomos-pymes-espana-2026'],
      ['Web, formularios y cookies', '/blog/web-formularios-cookies-rgpd-lssi-espana'],
      ['Cloud, proveedores e IA', '/blog/proveedores-cloud-ia-rgpd-encargados-tratamiento'],
      ['Checklist RGPD', '/docs/checklist-rgpd-autonomos-pymes'],
      ['Registro de Actividades de Tratamiento', '/docs/registro-actividades-tratamiento-rat-pymes'],
      ['Checklist de privacidad web', '/docs/privacidad-formularios-cookies-web'],
      ['Plataformas de profesionales: privacidad y responsabilidades', '/blog/privacidad-plataformas-profesionales-responsables'],
      ['Guía de política de privacidad para plataformas', '/docs/politica-privacidad-plataformas-checklist'],
      ['Constitución de SL: pasos y decisiones', '/blog/constitucion-sociedad-limitada-espana'],
    ],
    faqTitle: 'Preguntas frecuentes',
    faqs: [
      ['¿Es suficiente generar una política de privacidad?', 'No. La información al usuario es solo una parte del cumplimiento: deben revisarse tratamientos, base jurídica, contratos, seguridad, derechos y riesgos.'],
      ['¿La herramienta gratuita certifica el RGPD?', 'No. Ayuda a ordenar la información y produce documentos iniciales que deben adaptarse; tampoco la herramienta Facilita EMPRENDE de la AEPD certifica por sí sola el cumplimiento.'],
      ['¿Una plataforma es responsable o encargada?', 'Depende de quién determina las finalidades y medios de cada tratamiento. El nombre del contrato o de la plataforma no decide el rol por sí solo.'],
      ['¿Necesitamos EIPD?', 'Solo cuando el tratamiento probablemente implique un alto riesgo según el artículo 35 RGPD. Debe evaluarse con hechos concretos; no se presume para todas las startups.'],
      ['¿Podemos trabajar antes de constituir una SL?', 'La estructura y responsabilidad del operador deben analizarse antes de operar con usuarios reales. Constituir una SL no elimina por sí solo las obligaciones RGPD o de información.'],
      ['¿El precio del servicio RGPD es fijo?', 'No. Se prepara un presupuesto según el alcance. Los únicos importes publicados aquí son los honorarios existentes de constitución de SL.'],
    ],
    officialTitle: 'Fuentes normativas y administrativas', updated: 'Fuentes revisadas el 14/10/2026; verificar cambios y criterios aplicables antes de emitir un informe profesional.',
    disclaimer: 'Información general, no dictamen individual ni certificación de cumplimiento. La contratación y publicación de documentos finales requieren verificación profesional de la actividad real.',
  },
  ru: {
    back: 'Все услуги', switch: 'Español', switchPath: '/servicios/proteccion-datos',
    eyebrow: 'EXPERT · Защита персональных данных и бизнес',
    title: 'Политика конфиденциальности, соответствие RGPD и юридические документы для цифрового бизнеса',
    intro: 'Бесплатный инструмент помогает определить обязательства и создать предварительные документы. Если нужна адаптация к конкретной деятельности, проверка реальных потоков данных или подготовка запуска платформы, EXPERT согласует индивидуальный объём профессиональных услуг.',
    freeTitle: 'Бесплатный первый шаг',
    freeText: 'Анкета RGPD, перечень обработок данных, подрядчиков и сроков хранения. Результат — черновики, а не подтверждение юридического соответствия.',
    freeButton: 'Открыть анкету RGPD (ES)',
    offers: [
      { id: 'politica', title: '1. Политика конфиденциальности и формы', lead: 'Адаптация информационных текстов под конкретную компанию, сайт и функционал.', items: ['Ответственный за обработку, категории пользователей и источники данных.', 'Цели, правовые основания, сроки, получатели и права субъектов.', 'Тексты для регистрации, обратной связи, откликов, рассылок и других форм.', 'Проверка соответствия реальным функциям сайта и cookies.'], excludes: 'Технический аудит, EIPD и договоры со всеми подрядчиками не входят автоматически.' },
      { id: 'implantacion', title: '2. Комплексная подготовка по RGPD и рискам', lead: 'Не ограничивается публикацией политики: включает фактические процессы обработки.', items: ['Карта обработок и роли: responsable, encargado, совместная ответственность — по фактам.', 'Реестр RAT, основания обработки, договоры с encargados и международные передачи.', 'Сроки хранения, безопасность, права и реагирование на утечки.', 'Выявление операций, требующих оценки рисков или EIPD.'], excludes: 'Отдельная EIPD и сложные случаи высокого риска согласуются индивидуально.' },
      { id: 'plataformas', title: '3. Юридические тексты для платформ и маркетплейсов', lead: 'Для сервисов, объединяющих профессионалов, компании, исполнителей или клиентов.', items: ['Роли и ответственность оператора и участников.', 'Условия использования, размещения вакансий, портфолио и пользовательского контента.', 'Фото, профили, кандидаты, сообщения и права доступа.', 'Предварительный анализ LSSI, Reglamento de Servicios Digitales (DSA) и отраслевых требований при применимости.'], excludes: 'Не каждая платформа автоматически считается агентством по трудоустройству.' },
    ],
    quoteTitle: 'Стоимость — по согласованному объёму работ',
    quoteText: 'Итог зависит от числа операций с данными, участников, подрядчиков, функционала и рисков. EXPERT укажет результаты, исключения, цену, IVA и дополнительные расходы до оформления заказа.',
    quoteButton: 'Запросить расчёт услуг RGPD',
    companyTitle: 'Компания SL ещё не учреждена?',
    companyText: 'Можно отдельно сравнить оформление Sociedad Limitada (SL) через CIRCE и обычным способом, а также риски работы до регистрации компании. Эти услуги не обязательно заказывать пакетом.',
    slGeneral: 'Регистрация SL · 490,00 € + IVA (действующий каталог)',
    slCirce: 'SL через CIRCE · от 180,00 € + IVA (действующий каталог)',
    slNote: 'Необходимо уточнить объём услуг и дополнительные расходы нотариуса и Registro Mercantil. Минимальный уставный капитал не отменяет обязательств компании.',
    relatedTitle: 'Статьи и инструкции по теме',
    related: [
      ['RGPD для autónomos и малых компаний', '/ru/blog/rgpd-dlya-malogo-biznesa'],
      ['Cookies, формы и персональные данные', '/ru/blog/cookies-formy-rgpd'],
      ['Подрядчики, CRM, облако и ИИ', '/ru/blog/postavshchiki-cloud-ii-rgpd'],
      ['Чек-лист RGPD', '/ru/docs/proverka-rgpd-dlya-biznesa'],
      ['Реестр обработок RAT', '/ru/docs/reestr-obrabotok-rat'],
      ['Требования к сайту и cookies', '/ru/docs/privatnost-formy-cookies'],
      ['Платформы специалистов и ответственность', '/ru/blog/privatnost-platformy-professionalov'],
      ['Политика конфиденциальности для платформ', '/ru/docs/politika-konfidentsialnosti-platformy'],
      ['Как открыть SL в Испании', '/ru/uslugi/sozdanie-sl'],
    ],
    faqTitle: 'Частые вопросы',
    faqs: [
      ['Достаточно ли одного документа «Политика конфиденциальности»?', 'Нет. Нужны реальные правовые основания, описание обработок, работа с подрядчиками, безопасность, соблюдение прав и оценка рисков.'],
      ['Бесплатная анкета подтверждает соответствие RGPD?', 'Нет. Даже инструменты AEPD предоставляют стартовые документы, которые нужно адаптировать.'],
      ['Кто отвечает за обработку данных на платформе?', 'Зависит от того, кто определяет цели и средства конкретной обработки: responsable, encargado или совместные responsables.'],
      ['Всегда ли нужна EIPD?', 'Нет. По статье 35 RGPD она нужна при вероятном высоком риске для прав людей.'],
      ['Можно ли начать до регистрации SL?', 'Нужно заранее определить лицо или организацию-оператора, обязанности и ответственность. Регистрация SL сама по себе не закрывает вопросы RGPD.'],
      ['Цена RGPD фиксированная?', 'Нет, определяется после выяснения объёма. Указанные выше суммы относятся только к существующим услугам по созданию SL.'],
    ],
    officialTitle: 'Официальные источники', updated: 'Проверено 14.10.2026. Перед консультацией учитываются последующие изменения законодательства и практики.',
    disclaimer: 'Общая информация, не индивидуальное юридическое заключение и не подтверждение соответствия. Окончательные документы требуют проверки специалистом.',
  },
} as const;

export function PrivacyAndCompanyServices({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  return (
    <main lang={locale} className="bg-[#F8F6F1] text-[#0D1B2A]">
      <header className="bg-[#0D1B2A] px-6 py-12 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="flex justify-between gap-4 text-sm">
            <Link href="/servicios" className="text-[#D4A017] underline">{t.back}</Link>
            <Link href={t.switchPath} className="text-white underline">{t.switch}</Link>
          </div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#D4A017]">{t.eyebrow}</p>
          <h1 className="mt-3 max-w-4xl font-serif text-3xl font-bold leading-tight md:text-5xl">{t.title}</h1>
          <p className="mt-5 max-w-4xl text-base leading-8 text-white/75">{t.intro}</p>
        </div>
      </header>
      <div className="mx-auto max-w-5xl space-y-12 px-6 py-12">
        <section className="border border-[#D4A017]/30 bg-white p-6">
          <h2 className="font-serif text-2xl font-bold">{t.freeTitle}</h2>
          <p className="mt-3 leading-7">{t.freeText}</p>
          <Link href="/herramientas/rgpd" className="mt-5 inline-block bg-[#0D1B2A] px-5 py-3 font-bold text-white">{t.freeButton}</Link>
        </section>
        <section className="grid gap-6">
          {t.offers.map((offer) => (
            <article id={offer.id} key={offer.id} className="scroll-mt-24 border border-[#D4A017]/25 bg-white p-6">
              <h2 className="font-serif text-2xl font-bold">{offer.title}</h2>
              <p className="mt-3 leading-7">{offer.lead}</p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7">
                {offer.items.map(item => <li key={item}>{item}</li>)}
              </ul>
              <p className="mt-4 border-l-2 border-[#D4A017] pl-4 text-sm">{offer.excludes}</p>
            </article>
          ))}
        </section>
        <section className="bg-[#0D1B2A] p-6 text-white">
          <h2 className="font-serif text-2xl font-bold">{t.quoteTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-white/80">{t.quoteText}</p>
          <Link href="/solicitar-presupuesto?servicio=proteccion-datos-rgpd&origen=landing-rgpd" className="mt-5 inline-block bg-[#D4A017] px-5 py-3 font-bold text-[#0D1B2A]">{t.quoteButton}</Link>
        </section>
        <section className="border border-[#D4A017]/20 bg-white p-6">
          <h2 className="font-serif text-2xl font-bold">{t.companyTitle}</h2>
          <p className="mt-3 leading-7">{t.companyText}</p>
          <div className="mt-5 flex flex-col gap-3 text-sm font-semibold">
            <Link href="/servicios/empresas-autonomos/constitucion-sl" className="underline underline-offset-4">{t.slGeneral}</Link>
            <Link href="/servicios/empresas-autonomos/constitucion-sl-circe" className="underline underline-offset-4">{t.slCirce}</Link>
          </div>
          <p className="mt-4 text-sm">{t.slNote}</p>
        </section>
        <section>
          <h2 className="font-serif text-2xl font-bold">{t.relatedTitle}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {t.related.map(([label, href]) => <Link href={href} key={href} className="border border-[#D4A017]/20 bg-white p-4 text-sm font-semibold underline underline-offset-4">{label}</Link>)}
          </div>
        </section>
        <section>
          <h2 className="font-serif text-2xl font-bold">{t.faqTitle}</h2>
          <div className="mt-5 space-y-4">
            {t.faqs.map(([question, answer]) => (
              <details key={question} className="border border-[#D4A017]/20 bg-white p-5">
                <summary className="cursor-pointer font-semibold">{question}</summary>
                <p className="mt-3 text-sm leading-7">{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section>
          <h2 className="font-serif text-2xl font-bold">{t.officialTitle}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
            {SOURCES.map(s => <li key={s.href}><a href={s.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{s.label}</a></li>)}
          </ul>
          <p className="mt-4 text-xs text-[#526171]">{t.updated}</p>
        </section>
        <p className="border-t border-[#D4A017]/30 pt-6 text-xs leading-6 text-[#526171]">{t.disclaimer}</p>
      </div>
    </main>
  );
}
