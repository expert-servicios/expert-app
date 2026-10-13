/** EXPERT legal content — paired ES/RU, verified against official sources 2026-10-13.
 * Future regulatory edits MUST update legal-source-registry.json and both locales.
 */
export const IMMIGRATION_REVIEWED_SOURCES = [
  {
    "id": "boe-reglamento-extranjeria",
    "name": "RD 1155/2024 · texto consolidado",
    "url": "https://www.boe.es/buscar/act.php?id=BOE-A-2024-24099",
    "kind": "law",
    "published": "2024-11-20",
    "effective": "2025-05-20",
    "lastVersionPublished": "2026-09-22"
  },
  {
    "id": "boe-rd-316-2026",
    "name": "RD 316/2026 · modificación del reglamento",
    "url": "https://www.boe.es/buscar/doc.php?id=BOE-A-2026-8284",
    "kind": "amendment",
    "published": "2026-04-15",
    "effective": "2026-04-16"
  },
  {
    "id": "boe-ts-19632",
    "name": "TS · sentencia 8 julio 2026, BOE-A-2026-19632",
    "url": "https://www.boe.es/buscar/doc.php?id=BOE-A-2026-19632",
    "kind": "judgment",
    "published": "2026-09-22",
    "effective": null
  },
  {
    "id": "boe-ts-19633",
    "name": "TS · sentencia 29 julio 2026, BOE-A-2026-19633",
    "url": "https://www.boe.es/buscar/doc.php?id=BOE-A-2026-19633",
    "kind": "judgment",
    "published": "2026-09-22",
    "effective": null
  },
  {
    "id": "hoja-28",
    "name": "Hoja 28 · Arraigo social",
    "url": "https://www.inclusion.gob.es/web/migraciones/w/autorizacion-residencia-temporal-por-circunstancias-excepcionales.-arraigo-social",
    "kind": "guidance",
    "published": null,
    "effective": null,
    "lastEditorialRevision": "2026-04"
  },
  {
    "id": "hoja-29",
    "name": "Hoja 29 · Arraigo sociolaboral",
    "url": "https://www.inclusion.gob.es/es/web/migraciones/w/29.-autorizacion-de-residencia-temporal-por-circunstancias-excepcionales.-arraigo-sociolaboral.",
    "kind": "guidance",
    "published": null,
    "effective": null,
    "lastEditorialRevision": "2026-04"
  },
  {
    "id": "hoja-31",
    "name": "Hoja 31 · Arraigo familiar",
    "url": "https://bibliovirtual.inclusion.gob.es/web/migraciones/w/autorizacion-residencia-temporal-por-circunstancias-excepcionales.-arraigo-familiar",
    "kind": "guidance",
    "published": null,
    "effective": null,
    "lastEditorialRevision": "2026-04"
  },
  {
    "id": "hoja-18",
    "name": "Hoja 18 · Familiares de españoles",
    "url": "https://www.inclusion.gob.es/es/web/migraciones/w/18.-autorizacion-de-residencia-temporal-de-familiares-de-personas-con-nacionalidad-espanola",
    "kind": "guidance",
    "published": null,
    "effective": null,
    "lastEditorialRevision": "2026-04"
  },
  {
    "id": "hoja-28-ter",
    "name": "Hoja 28 Ter · Arraigo extraordinario",
    "url": "https://bibliovirtual.inclusion.gob.es/web/migraciones/w/28-ter.-autorizacion-de-residencia-por-circunstancias-excepcionales-por-razon-de-arraigo-extraordinario",
    "kind": "guidance",
    "published": null,
    "effective": null,
    "lastEditorialRevision": "2026-04-26"
  },
  {
    "id": "hoja-13",
    "name": "Hoja 13 · Renovación residencia y trabajo por cuenta ajena",
    "url": "https://www.inclusion.gob.es/web/migraciones/w/renovacion-de-la-autorizacion-de-residencia-temporal-y-trabajo-por-cuenta-ajena",
    "kind": "guidance",
    "published": null,
    "effective": null,
    "lastEditorialRevision": null
  },
  {
    "id": "hoja-49",
    "name": "Hoja 49 · Larga duración nacional",
    "url": "https://bibliovirtual.inclusion.gob.es/web/migraciones/w/49.-autorizacion-de-residencia-de-larga-duracion-nacional",
    "kind": "guidance",
    "published": null,
    "effective": null,
    "lastEditorialRevision": "2025-05"
  }
] as const;
export const IMMIGRATION_REVIEWED_GUIDES = [
  {
    "id": "initial",
    "esSlug": "permiso-residencia-inicial-vias-y-documentos",
    "ruSlug": "pervichnoe-razreshenie-na-prozhivanie-ispaniya",
    "revised": "2026-10-13",
    "sourceIds": [
      "boe-reglamento-extranjeria",
      "boe-rd-316-2026",
      "boe-ts-19632",
      "boe-ts-19633",
      "hoja-28",
      "hoja-29",
      "hoja-31",
      "hoja-18",
      "hoja-28-ter"
    ],
    "title": {
      "es": "Primera autorización de residencia en España: modalidades y documentos",
      "ru": "Первое разрешение на проживание в Испании (autorización inicial de residencia)"
    },
    "intro": {
      "es": "Las vías de residencia, arraigo y familiares de españoles siguen procedimientos diferentes. Guía revisada el 13 de octubre de 2026; comprueba siempre la hoja oficial aplicable al caso.",
      "ru": "Основания проживания (residencia), укоренение (arraigo) и разрешения для членов семьи испанцев регулируются разными процедурами. Материал проверен 13 октября 2026 года."
    },
    "sections": [
      {
        "id": "classify",
        "es": "Identificar la autorización antes de pedir documentos",
        "ru": "Сначала определите подходящий тип разрешения (autorización)",
        "pEs": "No existe un permiso inicial único ni un expediente válido para cualquier solicitante. Hay vías de residencia y trabajo, reagrupación familiar, familiares de personas con nacionalidad española y circunstancias excepcionales. El modelo, requisitos y forma de presentación dependen del supuesto.",
        "pRu": "Единого разрешения для всех случаев нет. Существуют процедуры для проживания и работы (residencia y trabajo), воссоединения семьи (reagrupación familiar), членов семьи испанских граждан (familiares de personas con nacionalidad española) и исключительных обстоятельств (circunstancias excepcionales). Документы и форма заявления зависят от основания."
      },
      {
        "id": "social",
        "es": "Arraigo social: permanencia, vínculos e integración",
        "ru": "Социальное укоренение (arraigo social): проживание и интеграция",
        "pEs": "La Hoja 28, revisada en abril de 2026, describe un mínimo general de dos años de permanencia continuada, con requisitos adicionales. Según el caso deben acreditarse vínculos familiares y medios económicos suficientes, o integración social mediante informe. Las ausencias, la situación de protección internacional y otras condiciones requieren revisión individual.",
        "pRu": "Согласно памятке Hoja 28 (обновлена в апреле 2026), обычно требуется не менее двух лет непрерывного пребывания (permanencia continuada) и выполнение дополнительных требований. В зависимости от ситуации подтверждают семейные связи (vínculos familiares), достаточные средства (medios económicos) либо интеграцию (informe de integración social). Отсутствия и статус международной защиты требуют отдельной проверки."
      },
      {
        "id": "sociolaboral",
        "es": "Arraigo sociolaboral: no confundir con el antiguo arraigo laboral",
        "ru": "Социально-трудовое укоренение (arraigo sociolaboral) — не прежний arraigo laboral",
        "pEs": "La Hoja 29, revisada en abril de 2026, contempla con carácter general dos años de permanencia y uno o varios contratos de trabajo que cumplan las condiciones previstas. La formulación antigua de «relación laboral no declarada de seis meses» no describe por sí sola el procedimiento vigente y se retira de esta guía.",
        "pRu": "Памятка Hoja 29 (апрель 2026) предусматривает, как правило, два года пребывания (permanencia) и один или несколько трудовых договоров (contratos de trabajo), соответствующих условиям закона. Старое объяснение через «шесть месяцев незадекларированной работы» не следует применять как описание действующей процедуры."
      },
      {
        "id": "family",
        "es": "Arraigo familiar y residencia de familiares de españoles",
        "ru": "Семейное укоренение и разрешения для родственников испанцев",
        "pEs": "No deben confundirse el arraigo familiar de la Hoja 31 y la autorización de residencia de familiares de personas con nacionalidad española de la Hoja 18. La relación de parentesco no garantiza por sí sola la concesión: deben comprobarse el supuesto legal, la documentación y la regulación aplicable, incluidas las modificaciones de abril y resoluciones judiciales publicadas en septiembre de 2026.",
        "pRu": "Не путайте семейное укоренение (arraigo familiar, Hoja 31) с разрешением на проживание для членов семьи испанского гражданина (residencia de familiares de personas con nacionalidad española, Hoja 18). Само родство не гарантирует разрешение (concesión). Проверяются конкретное основание и изменения апреля, а также судебные решения, опубликованные в сентябре 2026 года."
      },
      {
        "id": "extraordinary",
        "es": "Arraigo extraordinario: vía incorporada en 2026",
        "ru": "Особое укоренение 2026 года (arraigo extraordinario)",
        "pEs": "El RD 316/2026 estableció vías extraordinarias con condiciones propias, distintas del arraigo social y sociolaboral. Sus disposiciones adicionales vigésima y vigesimoprimera fijaron el 30 de junio de 2026 como último día para presentar solicitudes. A fecha de revisión (13 de octubre de 2026), no debe ofrecerse la presentación de una solicitud nueva por esas vías sin acreditar una prórroga o nueva habilitación normativa posterior. Para expedientes presentados dentro de plazo, comprobar el procedimiento y sus efectos en la fuente oficial y en el caso concreto.",
        "pRu": "RD 316/2026 предусмотрел особые процедуры (arraigo extraordinario), отличные от arraigo social и arraigo sociolaboral. Дополнительные положения 20 и 21 установили последний день подачи заявления (presentación de solicitud) — 30 июня 2026 года. На дату проверки (13 октября 2026 года) нельзя предлагать новую подачу по этим основаниям без подтверждённого продления срока или нового нормативного основания. По заявлениям, поданным вовремя, следует проверить процессуальный статус (estado del expediente) и действующие правила в официальном источнике."
      },
      {
        "id": "documents",
        "es": "Documentos, formulario, tasas y sede de presentación",
        "ru": "Документы, заявление, госпошлины и подача",
        "pEs": "Comprueba la hoja informativa de la vía concreta: pasaporte, acreditación del supuesto, antecedentes, documentos familiares o laborales, formularios y tasas. El EX-10 corresponde a procedimientos determinados, no a todas las autorizaciones iniciales. Los documentos extranjeros pueden requerir traducción jurada o legalización según su naturaleza. Conserva el justificante y responde a los requerimientos.",
        "pRu": "Проверяйте официальную памятку именно по выбранному основанию (hoja informativa): паспорт, доказательства обстоятельств, справки о несудимости (antecedentes penales), документы о семье или работе, форму заявления (modelo de solicitud) и госпошлину (tasa). Форма EX-10 подходит не для всех процедур. Иностранные документы при необходимости переводятся присяжным переводчиком (traducción jurada) или легализуются (legalización). Сохраните подтверждение подачи (justificante) и отвечайте на запросы (requerimientos)."
      }
    ]
  },
  {
    "id": "renewal",
    "esSlug": "renovacion-residencia-temporal-y-larga-duracion",
    "ruSlug": "prodlenie-rezidencii-dolgosrochnaya",
    "revised": "2026-10-13",
    "sourceIds": [
      "boe-reglamento-extranjeria",
      "boe-rd-316-2026",
      "boe-ts-19632",
      "boe-ts-19633",
      "hoja-13",
      "hoja-49"
    ],
    "title": {
      "es": "Renovación de residencia y larga duración: autorizaciones, plazos y TIE",
      "ru": "Продление проживания (renovación de residencia), долгосрочный статус и карта TIE"
    },
    "intro": {
      "es": "Renovar una autorización temporal, obtener residencia de larga duración y renovar la tarjeta TIE son trámites diferentes. Revisión jurídica: 13 de octubre de 2026.",
      "ru": "Продление временного разрешения (autorización temporal), получение долгосрочного статуса (residencia de larga duración) и замена карты иностранца (TIE) — разные процедуры. Проверено 13 октября 2026 года."
    },
    "sections": [
      {
        "id": "separate",
        "es": "Diferenciar autorización y tarjeta TIE",
        "ru": "Отличайте разрешение на проживание от карты TIE",
        "pEs": "La autorización determina el derecho de residencia según sus condiciones. La TIE es la tarjeta física acreditativa. Renovar una tarjeta TIE de larga duración no equivale a renovar una autorización temporal de residencia y trabajo. El NIE es un número identificativo, no una tarjeta ni un permiso.",
        "pRu": "Разрешение на проживание (autorización de residencia) определяет правовой статус. Физическая карта иностранца (TIE, Tarjeta de Identidad de Extranjero) подтверждает статус, а идентификационный номер иностранца (NIE) не является самостоятельным разрешением. Обновление карты TIE долгосрочного резидента не равно продлению временного разрешения (renovación de autorización temporal)."
      },
      {
        "id": "deadline",
        "es": "Plazos de renovación: comprobar el tipo concreto",
        "ru": "Сроки продления зависят от конкретного основания",
        "pEs": "La Hoja 13 para residencia temporal y trabajo por cuenta ajena contempla presentación en los dos meses anteriores al vencimiento y hasta los tres posteriores, con los efectos y eventuales sanciones previstos. No traslades automáticamente esos plazos a autorizaciones de estudios, familiares, circunstancias excepcionales u otros regímenes.",
        "pRu": "Памятка Hoja 13 для временного разрешения на проживание и работу по найму (residencia temporal y trabajo por cuenta ajena) предусматривает подачу в течение двух месяцев до истечения разрешения и трёх месяцев после, с предусмотренными правовыми последствиями и возможными санкциями. Эти сроки нельзя автоматически переносить на учебу, семейные разрешения и другие режимы."
      },
      {
        "id": "status",
        "es": "Presentación en plazo y vigencia de la autorización",
        "ru": "Своевременная подача и действие разрешения",
        "pEs": "Para la renovación por cuenta ajena, la presentación en plazo prorroga la validez de la autorización previa hasta la resolución. Una presentación tardía puede estar admitida en determinados casos sin eliminar una posible sanción. Conserva el resguardo, revisa notificaciones y aplica la regla propia del trámite elegido.",
        "pRu": "При продлении разрешения по найму (renovación por cuenta ajena) своевременная подача (presentación en plazo) продлевает действие предыдущего разрешения до решения ведомства (resolución). Поздняя подача может допускаться, но повлечь санкции. Сохраните подтверждение подачи (justificante) и проверяйте уведомления (notificaciones)."
      },
      {
        "id": "docs",
        "es": "Documentación de ingresos y actividad",
        "ru": "Документы о работе и доходах",
        "pEs": "El contrato, la vida laboral, nóminas, pruebas de actividad por cuenta propia o recursos económicos se solicitan según el tipo de renovación. No existe una lista universal de tres a seis nóminas para todos los permisos. Determina los documentos a partir de la hoja informativa actual y del expediente individual.",
        "pRu": "Трудовой договор (contrato de trabajo), выписка о трудовой деятельности (vida laboral), расчётные листы по зарплате (nóminas), документы по предпринимательству (actividad por cuenta propia) и доходам требуются в зависимости от процедуры. Общего требования «три–шесть nóminas для всех» не существует: ориентируйтесь на конкретную официальную памятку (hoja informativa)."
      },
      {
        "id": "long",
        "es": "Residencia de larga duración nacional",
        "ru": "Национальный долгосрочный вид на жительство (residencia de larga duración nacional)",
        "pEs": "La Hoja 49 describe como supuesto general cinco años de residencia legal y continuada, junto con reglas de cómputo y otras vías específicas. Esta autorización permite residir y trabajar indefinidamente mientras se mantengan las condiciones legales. Se deben examinar las ausencias y particularidades antes de determinar la fecha de solicitud.",
        "pRu": "Hoja 49 предусматривает как общее основание пять лет законного непрерывного проживания (residencia legal y continuada) с правилами учёта отсутствий и другими предусмотренными случаями. Разрешение позволяет проживать и работать бессрочно (residencia de larga duración), но нужно проверить индивидуальные условия и периоды отсутствия."
      },
      {
        "id": "tie",
        "es": "Renovación de tarjeta TIE de larga duración",
        "ru": "Обновление карты долгосрочного резидента (renovación de TIE)",
        "pEs": "Según Hoja 49, la primera renovación de la TIE de larga duración nacional se solicita a los cinco años. Las renovaciones posteriores tienen períodos específicos según la edad del titular (hasta los 30 años y después), por lo que es incorrecto afirmar sin matices que toda TIE se renueva siempre cada cinco años.",
        "pRu": "По Hoja 49 первую замену карты долгосрочного резидента (renovación de TIE de larga duración nacional) запрашивают через пять лет. Последующие сроки зависят в том числе от возраста владельца; утверждение «любая TIE всегда меняется каждые пять лет» неверно."
      }
    ]
  }
] as const;
export type ImmigrationGuideId=(typeof IMMIGRATION_REVIEWED_GUIDES)[number]['id'];
export type ImmigrationLocale='es'|'ru';
export function getReviewedImmigrationGuide(id:ImmigrationGuideId){
 return IMMIGRATION_REVIEWED_GUIDES.find(guide=>guide.id===id)!;
}
export function toImmigrationGuideBody(id:ImmigrationGuideId,locale:ImmigrationLocale){
 const article=getReviewedImmigrationGuide(id);
 const sections=article.sections.map(section=>'## '+(locale==='es'?section.es:section.ru)+'\n\n'+(locale==='es'?section.pEs:section.pRu)).join('\n\n');
 const sources=article.sourceIds.map(sourceId=>IMMIGRATION_REVIEWED_SOURCES.find(s=>s.id===sourceId)!).filter(Boolean);
 const sourceTitle=locale==='es'?'Fuentes oficiales y fecha de revisión':'Официальные источники и дата проверки';
 const sourceText=sources.map(s=>'- ['+s.name+']('+s.url+')').join('\n');
 const dateAndLegalWarning = locale === 'es'
   ? 'Revisado: '+article.revised+'. La norma aplicable es la vigente en la fecha de presentación.'
   : 'Проверено: '+article.revised+'. Применимые требования определяются законодательством, действующим на дату подачи заявления.';
 return sections+'\n\n## '+sourceTitle+'\n\n'+sourceText+'\n\n'+dateAndLegalWarning;
}
