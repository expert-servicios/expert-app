import Link from 'next/link';

type Locale = 'es' | 'ru';
type Kind = 'service' | 'overview' | 'guide';
type Section = { title: string; paragraphs?: string[]; bullets?: string[] };

const paths = {
  es: {
    service: '/servicios/extranjeria-nacionalidad/residencia-larga-duracion-nacional-ucrania',
    overview: '/blog/proteccion-temporal-ucrania-larga-duracion-2026',
    guide: '/blog/guia-ex11-larga-duracion-nacional',
  },
  ru: {
    service: '/ru/uslugi/residencia-larga-duracion-nacional-ucrania',
    overview: '/ru/blog/ukraina-proteccion-temporal-larga-duracion-2026',
    guide: '/ru/blog/instruktsiya-ex11-larga-duracion',
  },
} as const;

const sourceLinks = [
  { label: 'Instrucciones SEM 2/2026 — Ministerio de Inclusión', url: 'https://www.inclusion.gob.es/es/web/migraciones/instrucciones' },
  { label: 'Hoja informativa 49 — residencia de larga duración nacional', url: 'https://www.inclusion.gob.es/web/migraciones/w/49.-autorizacion-de-residencia-de-larga-duracion-nacional' },
  { label: 'Decisión (UE) 2026/1912 — prórroga protección temporal', url: 'https://www.boe.es/buscar/doc.php?id=DOUE-L-2026-81261' },
];

const content: Record<Locale, Record<Kind, { title: string; intro: string; sections: Section[] }>> = {
  ru: {
    service: {
      title: 'Долгосрочный вид на жительство в Испании (residencia de larga duración nacional) после временной защиты (protección temporal)',
      intro: 'Оформление заявления EX-11 в Испании для обладателей временной защиты (protección temporal) из Украины. Профессиональные услуги EXPERT: 290,00 € + IVA (350,90 €). Государственные tasas оплачиваются отдельно.',
      sections: [
        { title: 'Кому подходит', paragraphs: ['Обычно требуется пять лет законного непрерывного проживания (residencia legal y continuada). Согласно Instrucciones SEM 2/2026 (SEXTA) в срок для residencia de larga duración nacional учитывается период владения autorización de residencia по protección temporal. Другие условия рассматриваются индивидуально.'], bullets: ['Проверяем первоначальное решение о предоставлении разрешения (resolución de concesión), а не только дату NIE или TIE.', 'Проверяем непрерывность проживания и возможные выезды.', 'Не обещаем автоматического одобрения административного дела (expediente).'] },
        { title: 'Что входит в стоимость', bullets: ['Первичная проверка права и даты подачи.', 'Перечень и проверка документов.', 'Заполнение EX-11 и электронная подача через допустимый канал.', 'Отслеживание официальных запросов документов (requerimientos) и решений (resolución); разъяснение дальнейших шагов по TIE.'] },
        { title: 'Что оплачивается отдельно', paragraphs: ['Государственные пошлины (tasas) 790-052 и 790-012/TIE, присяжные переводы (traducciones juradas), легализация документов (legalización) и обжалования (recursos), получение документов третьих лиц и нестандартные дополнительные процедуры.'] },
        { title: 'Когда отказаться от временной защиты (protección temporal)', paragraphs: ['Не отказывайтесь от неё заранее. Пункт SÉPTIMA Instrucciones SEM 2/2026 предусматривает официальный отказ (renuncia expresa) после получения нового разрешения (autorización).'] },
        { title: 'Как начать', paragraphs: ['Перейдите к запросу услуги и укажите «Residencia de larga duración nacional — protección temporal». После предварительной проверки мы подтвердим перечень документов и порядок оформления.'] },
      ],
    },
    overview: {
      title: 'Protección temporal и residencia de larga duración nacional: правила 2026 года',
      intro: 'Время, проведённое в Испании с protección temporal, может быть засчитано для residencia de larga duración nacional. Главное — правильно установить исходную дату autorización de residencia.',
      sections: [
        { title: 'Что предусматривает SEM 2/2026', paragraphs: ['В пункте SEXTA закреплено, что период владения autorización de residencia по protección temporal учитывается в необходимом сроке для residencia de larga duración nacional. Это не автоматическое получение статуса и не правило, которое можно без проверки переносить на larga duración-UE или nacionalidad española.'] },
        { title: 'От какой даты считать пять лет', paragraphs: ['Нужны первоначальная resolución de concesión и подтверждение непрерывности. NIE, дата въезда, empadronamiento и дата изготовления пластиковой TIE сами по себе не устанавливают момент начала срока.'] },
        { title: 'Нужно ли менять статус прямо сейчас', paragraphs: ['Важны уже накопленный срок, действительность autorización, непрерывность и цели заявителя. Protección temporal для подпадающих под условия лиц продлена в ЕС до 4 марта 2028 года. Поэтому решение о ранней modificación нужно принимать после сравнения рисков и выгод.'] },
        { title: 'Когда оформляется renuncia', paragraphs: ['Согласно пункту SÉPTIMA renuncia a protección temporal следует после получения новой autorización; не оформляйте её до решения.'] },
        { title: 'Как поможет EXPERT', paragraphs: ['Мы проверим применимость процедуры, подготовим EX-11 и сопроводим expediente. Стоимость 290,00 € + IVA за одного заявителя, государственные tasas отдельно.'] },
      ],
    },
    guide: {
      title: 'Инструкция EX-11: подача на residencia de larga duración nacional',
      intro: 'Пять шагов: проверка requisitos, подготовка документов, подача, контроль expediente и оформление TIE после положительной resolución.',
      sections: [
        { title: '1. Проверить requisitos', paragraphs: ['Определите, подходит ли residencia de larga duración nacional; проверьте пять лет законного непрерывного проживания (residencia legal y continuada), начальную autorización и выезды. Для защиты украинцев учитывается SEM 2/2026.'] },
        { title: '2. Подготовить документы', bullets: ['EX-11, паспорт в полном объёме.', 'Первоначальная resolución de concesión и текущая TIE.', 'Документы о непрерывности residencia и иные доказательства по конкретному делу.', 'Дополнительные документы только по реальной необходимости.'] },
        { title: '3. Подать expediente', paragraphs: ['Подача возможна через Oficina de Extranjería или систему Mercurio в предусмотренных случаях. Сохраните justificante и номер expediente.'] },
        { title: '4. Tasas и seguimiento', paragraphs: ['Проверьте актуальный размер tasa 790-052 на официальном портале при оплате; дальнейшая TIE имеет отдельную tasa. Hoja 49 указывает общий срок решения три месяца и правовые последствия silencio administrativo, которые следует проверять для конкретного expediente.'] },
        { title: '5. После положительного решения', paragraphs: ['Оформите новую TIE в установленном порядке. Для обладателей protección temporal renuncia expresa производится после выдачи новой autorización, согласно SEM 2/2026 SÉPTIMA.'] },
      ],
    },
  },
  es: {
    service: {
      title: 'Residencia de larga duración nacional desde protección temporal de Ucrania',
      intro: 'Tramitación individual EX-11 en España para titulares de protección temporal. Honorarios profesionales de EXPERT: 290,00 € + IVA (350,90 €). Tasas oficiales aparte.',
      sections: [
        { title: 'Requisitos y viabilidad', paragraphs: ['La regla general exige cinco años de residencia legal y continuada. Según el punto SEXTO de las Instrucciones SEM 2/2026 se computa el período como titular de autorización de residencia por protección temporal para la larga duración nacional. Las demás condiciones se revisan individualmente.'], bullets: ['Verificamos la resolución inicial de concesión y sus fechas, no solo la expedición del NIE o la TIE.', 'Comprobamos continuidad de residencia y eventuales ausencias.', 'La concesión no es automática y depende de la resolución del expediente.'] },
        { title: 'Qué incluye', bullets: ['Comprobación inicial de viabilidad y momento de presentación.', 'Revisión y listado individualizado de documentación.', 'Preparación del formulario EX-11 y presentación electrónica por el canal habilitado.', 'Seguimiento ordinario de requerimientos y resolución; instrucciones sobre la posterior TIE.'] },
        { title: 'Qué se abona aparte', paragraphs: ['Tasas oficiales 790-052 y 790-012/TIE, traducciones juradas, legalizaciones o apostillas, recursos, obtención de documentos de terceros y actuaciones extraordinarias.'] },
        { title: 'Cuándo renunciar a protección temporal', paragraphs: ['No formalices la renuncia de forma anticipada. El punto SÉPTIMO de las Instrucciones SEM 2/2026 sitúa la renuncia expresa después de obtener la nueva autorización.'] },
        { title: 'Cómo solicitarlo', paragraphs: ['Indica «residencia de larga duración nacional desde protección temporal». Tras la revisión inicial confirmaremos los documentos necesarios y el canal de presentación.'] },
      ],
    },
    overview: {
      title: 'Protección temporal de Ucrania y larga duración nacional en 2026',
      intro: 'El tiempo en España con protección temporal puede contar para la residencia de larga duración nacional; es importante acreditar la fecha inicial de la autorización de residencia.',
      sections: [
        { title: 'Qué establece SEM 2/2026', paragraphs: ['Su punto SEXTO contempla el cómputo de los períodos como titular de autorización de residencia por protección temporal para larga duración nacional. No implica concesión automática ni puede extrapolarse sin comprobar requisitos a larga duración-UE o nacionalidad española.'] },
        { title: 'Desde qué fecha se computa', paragraphs: ['Comprueba la resolución de concesión inicial, las fechas de vigencia y la continuidad de residencia. El NIE, la fecha de entrada en España, el empadronamiento y la emisión de la tarjeta TIE no bastan por sí solos para fijar el inicio del período.'] },
        { title: '¿Conviene cambiar de estatus ahora?', paragraphs: ['Depende del período acumulado, de la vigencia de la autorización, de la continuidad y de las necesidades individuales. Para las personas que cumplen sus condiciones, la protección temporal está prorrogada en la UE hasta el 4 de marzo de 2028. Conviene comparar los riesgos y ventajas antes de tramitar una modificación.'] },
        { title: 'Renuncia posterior, nunca anticipada', paragraphs: ['El punto SÉPTIMO de SEM 2/2026 prevé la renuncia expresa a protección temporal una vez obtenida la nueva autorización; no la formalices antes de la resolución correspondiente.'] },
        { title: 'Cómo ayuda EXPERT', paragraphs: ['Revisamos la viabilidad, preparamos EX-11 y acompañamos el expediente. Honorarios: 290,00 € + IVA por solicitante, con tasas oficiales aparte.'] },
      ],
    },
    guide: {
      title: 'Guía EX-11: residencia de larga duración nacional paso a paso',
      intro: 'Cinco pasos: comprobar requisitos, reunir documentos, presentar EX-11, seguir expediente y tasas, y obtener la nueva TIE tras la concesión.',
      sections: [
        { title: '1. Comprobar requisitos', paragraphs: ['Comprueba que proceda la residencia de larga duración nacional, el período general de cinco años de residencia legal y continuada, la autorización inicial y las ausencias. Para titulares de protección temporal de Ucrania, comprueba las Instrucciones SEM 2/2026.'] },
        { title: '2. Preparar los documentos', bullets: ['Formulario EX-11 y pasaporte completo.', 'Resolución inicial de concesión y tarjeta TIE actual.', 'Documentación acreditativa de continuidad de residencia y demás pruebas pertinentes.', 'Solo documentos adicionales que realmente requiera el caso.'] },
        { title: '3. Presentar la solicitud', paragraphs: ['La presentación puede realizarse ante la Oficina de Extranjería o mediante Mercurio en los casos habilitados. Conserva el justificante y el número de expediente.'] },
        { title: '4. Tasas y seguimiento', paragraphs: ['Consulta la cuantía vigente de la tasa 790-052 en la sede oficial al realizar el pago; la expedición de TIE lleva su propia tasa. La Hoja 49 informa sobre un plazo general de resolución de tres meses y los efectos legales del silencio administrativo, que deben comprobarse para el expediente concreto.'] },
        { title: '5. Después de una resolución favorable', paragraphs: ['Tramita la nueva tarjeta TIE en el procedimiento correspondiente. Para titulares de protección temporal, la renuncia expresa se formaliza después de obtener la nueva autorización, conforme al punto SÉPTIMO de SEM 2/2026.'] },
      ],
    },
  },
};

export default function UkraineLongTermPage({ locale, kind }: { locale: Locale; kind: Kind }) {
  const page = content[locale][kind];
  const isRu = locale === 'ru';
  const links = paths[locale];
  const quoteHref = '/solicitar-presupuesto?servicio=residencia-larga-duracion-nacional-ucrania&origen=ukraine-longterm';
  return (
    <main className="min-h-screen bg-[#F8F6F1] px-5 py-12 text-[#0D1B2A]">
      <article className="mx-auto max-w-3xl space-y-8">
        <nav className="flex flex-wrap gap-3 text-sm">
          <Link className="font-semibold underline" href={paths[isRu ? 'es' : 'ru'][kind]}>{isRu ? 'Español' : 'Русский'}</Link>
          <Link className="underline" href={links.service}>{isRu ? 'Оформить услугу' : 'Servicio'}</Link>
          <Link className="underline" href={links.overview}>{isRu ? 'Правила 2026' : 'Requisitos 2026'}</Link>
          <Link className="underline" href={links.guide}>{isRu ? 'Инструкция EX-11' : 'Guía EX-11'}</Link>
        </nav>
        <header className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">EXPERT · {isRu ? 'ВНЖ Испания' : 'Extranjería'}</p>
          <h1 className="font-serif text-3xl font-bold md:text-4xl">{page.title}</h1>
          <p className="text-lg leading-8">{page.intro}</p>
        </header>
        {page.sections.map((section) => (
          <section key={section.title} className="space-y-3 rounded-md bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-semibold">{section.title}</h2>
            {section.paragraphs?.map((p) => <p key={p} className="leading-7">{p}</p>)}
            {section.bullets && <ul className="list-disc space-y-2 pl-6">{section.bullets.map((p) => <li key={p}>{p}</li>)}</ul>}
          </section>
        ))}
        <section className="rounded-md bg-[#0D1B2A] p-6 text-white">
          <h2 className="text-xl font-semibold">{isRu ? 'Услуги EXPERT: 290,00 € + IVA' : 'Honorarios EXPERT: 290,00 € + IVA'}</h2>
          <p className="mt-2 text-sm text-white/80">{isRu ? 'Итого 350,90 € с IVA. Государственные tasas отдельно.' : 'Total 350,90 € IVA incluido. Tasas aparte.'}</p>
          <Link href={quoteHref} className="mt-5 inline-block rounded bg-amber-400 px-6 py-3 font-semibold text-[#0D1B2A]">{isRu ? 'Запросить оформление' : 'Solicitar tramitación'}</Link>
        </section>
        <section className="space-y-3">
          <h2 className="font-semibold">{isRu ? 'Официальные источники' : 'Fuentes oficiales'}</h2>
          <ul className="space-y-2">{sourceLinks.map(x => <li key={x.url}><a href={x.url} target="_blank" rel="noopener noreferrer" className="underline">{x.label}</a></li>)}</ul>
          <p className="text-sm text-gray-600">{isRu ? 'Проверено 13.10.2026. Материал информационный; условия конкретного expediente требуют проверки.' : 'Revisado el 13/10/2026. Información general sujeta a la situación individual y normativa vigente.'}</p>
        </section>
      </article>
    </main>
  );
}
