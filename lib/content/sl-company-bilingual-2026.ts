import type { Article } from '@/lib/utils/blog';
import type { KnowledgeDoc } from '@/lib/utils/docs';
import type { RuResource } from '@/lib/i18n/ru-nationality-resources';

/** Matriz editorial ES/RU: contenido jurídico versionado y fuentes oficiales. */
const SOURCE_URLS = {
  "lsc": "https://www.boe.es/buscar/act.php?id=BOE-A-2010-10544",
  "lgss": "https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724",
  "aeat": "https://sede.agenciatributaria.gob.es/Sede/impuesto-sobre-sociedades/que-base-imponible-se-determina-sociedades/tipo-impositivo.html",
  "censal": "https://sede.agenciatributaria.gob.es/Sede/ayuda/calendario-contribuyente/calendario-contribuyente-2026/informacion-sobre-presentacion-modelos-no-periodicos/modelo-036.html",
  "aeatActivities": "https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/guia-practica-cumplimentacion-modelo-censal-036/capitulo-04-actividades-economicas-locales/aspectos-generales-modelo-presentacion-declaracion/obligados-declarar-actividades-economicas-modelo-036.html",
  "cnae": "https://www.boe.es/buscar/act.php?id=BOE-A-2025-587",
  "circe": "https://paeelectronico.es/es-es/CreaEmpresaPorTiMismo/Paginas/CIRCE.aspx",
  "rata": "https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/folletos/requisitos-empresa-nueva.html",
  "aeatGuide": "https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/folleto-actividades-economicas/introduccion.html",
  "rgpd": "https://eur-lex.europa.eu/eli/reg/2016/679/oj/spa",
  "iae": "https://sede.agenciatributaria.gob.es/Sede/censos-nif-domicilio-fiscal/tramites-censales-relacionados-empresarios-profesionales-retenedores/impuesto-sobre-actividades-economicas.html"
} as const;
type SourceId = keyof typeof SOURCE_URLS;
type Section = [title: string, paragraphs: string[]];
type Pair = {
  kind: 'blog' | 'docs'; old?: boolean; es: string; ru: string;
  te: string; tr: string; de: string; dr: string;
  sources: SourceId[]; esSections: Section[]; ruSections: Section[];
};
export const sl2026Pairs: Pair[] = [
  {
    "kind": "blog",
    "old": true,
    "es": "constitucion-sociedad-limitada-espana",
    "ru": "sozdanie-sl-v-ispanii-shagi-2026",
    "te": "Cómo constituir una SL en España: trámites y obligaciones 2026",
    "tr": "Как открыть Sociedad Limitada (SL) в Испании: этапы и обязанности",
    "de": "Constituir una sociedad limitada: denominación, capital desde 1 €, estatutos, CIRCE, notaría, Registro Mercantil, NIF y primeros trámites.",
    "dr": "Учреждение SL: название, капитал от 1 €, устав, CIRCE, нотариус, Registro Mercantil, NIF и первые обязанности.",
    "sources": [
      "lsc",
      "circe",
      "censal"
    ],
    "esSections": [
      [
        "Antes de constituir",
        [
          "Confirmar las personas socias, sus porcentajes, quién administrará la sociedad, el objeto social real y si conviene estatuto tipo por CIRCE o estatutos a medida. Una SL puede tener un único socio (SLU).",
          "El capital mínimo legal es 1 €. Mientras capital y reserva no sumen 3.000 €, el artículo 4 LSC exige destinar al menos el 20 % del beneficio a reserva legal y establece una regla de responsabilidad en liquidación si el patrimonio no basta. El capital no es un honorario ni sustituye el dinero necesario para operar."
        ]
      ],
      [
        "Pasos",
        [
          "Solicitar certificación negativa de denominación, preparar aportaciones y estatutos; firmar escritura ante notario; tramitar inscripción mercantil, NIF y alta fiscal. CIRCE permite coordinar parte de trámites mediante el Documento Único Electrónico (DUE), pero no elimina la firma notarial.",
          "En determinados supuestos la acreditación de aportaciones dinerarias admite alternativas previstas en la ley; no es correcto afirmar que siempre sea imprescindible ingresar el capital en una cuenta nueva antes de la escritura."
        ]
      ],
      [
        "Después de registrar",
        [
          "Verificar censos y epígrafes IAE, CNAE, Seguridad Social de socios/administradores, obligaciones contables, libros, cuentas anuales, facturación, IVA, IS y contratos de privacidad si se recaban datos.",
          "Antes de una propuesta económica concreta, comprobar exclusiones, aranceles notariales y registrales y si hay socios extranjeros, pactos de socios o estructura compleja."
        ]
      ]
    ],
    "ruSections": [
      [
        "Перед учреждением",
        [
          "Определите доли участников, администратора, фактическую деятельность и необходимость индивидуального устава. SL может принадлежать одному человеку (SLU).",
          "Минимальный капитал — 1 €. До достижения 3 000 € капиталом и резервом действует правило резерва не менее 20 % прибыли и специальная ответственность при ликвидации согласно статье 4 LSC. Капитал не является оплатой услуг и не заменяет оборотные средства."
        ]
      ],
      [
        "Этапы",
        [
          "Проверка уникальности названия, устав и вклады, нотариальное оформление escritura, регистрация Registro Mercantil, получение NIF, налоговая регистрация. CIRCE объединяет часть действий через Documento Único Electrónico (DUE), но не отменяет визит к нотариусу.",
          "Закон предусматривает способы подтверждения денежных вкладов, отличные от обязательного открытия отдельного банковского счёта во всех случаях."
        ]
      ],
      [
        "После регистрации",
        [
          "Уточните IAE, CNAE, Seguridad Social для участников и администратора, бухучёт, годовую отчётность, налоги, выставление счетов и защиту данных.",
          "До заказа уточняются нотариальные и регистрационные расходы, статус иностранных участников и необходимость индивидуального устава."
        ]
      ]
    ]
  },
  {
    "kind": "blog",
    "es": "autonomo-empresario-individual-o-sl-diferencias-2026",
    "ru": "autonomo-ili-sl-raznitsa-2026",
    "te": "Autónomo, empresario individual o SL: diferencias y cuándo conviene cada opción",
    "tr": "Autónomo, индивидуальный предприниматель или SL: что выбрать в Испании",
    "de": "Comparativa 2026 de responsabilidad, impuestos, cotización, costes fijos y socios al elegir autónomo o Sociedad Limitada.",
    "dr": "Сравнение индивидуальной деятельности и Sociedad Limitada в 2026 году: ответственность, налоги, взносы и расходы.",
    "sources": [
      "lsc",
      "lgss",
      "aeatGuide",
      "aeat"
    ],
    "esSections": [
      [
        "Primero: no son tres formas jurídicas",
        [
          "El empresario individual es una persona física que organiza una actividad por cuenta propia. Se suele llamar autónomo a esa persona por su actividad y/o encuadramiento en RETA. Una SL es una persona jurídica distinta que puede tener uno o varios socios; el socio o administrador también puede estar obligado a cotizar en RETA.",
          "No se elige entre «empresario individual» y «autónomo» como si fueran entidades distintas: se diferencia la forma jurídica de la relación con Seguridad Social."
        ]
      ],
      [
        "Responsabilidad y recursos",
        [
          "Como regla general, el empresario individual responde con su patrimonio conforme al régimen aplicable; la SL separa patrimonio social y personal, pero no protege automáticamente de avales personales, actuaciones ilícitas ni responsabilidades del administrador. Las reglas del capital desde 1 € también tienen cautelas específicas.",
          "Comparar inversión inicial, riesgo contractual, socios, necesidad de financiarse, posible entrada de inversores y costes recurrentes de contabilidad, libros, cuentas y órganos sociales."
        ]
      ],
      [
        "Fiscalidad y remuneración",
        [
          "Los rendimientos de actividades económicas de la persona física se integran en IRPF según su régimen; la SL tributa por Impuesto sobre Sociedades por su base imponible. Cuando la sociedad paga nóminas, honorarios o dividendos pueden aparecer impuestos adicionales en el socio. Un tipo bajo de IS no equivale al impuesto efectivo conjunto.",
          "La decisión exige simular beneficios, retiradas de dinero, sueldo, dividendos y obligaciones formales en ambos escenarios. No recomendamos constituir una SL solo por superar una cifra de facturación."
        ]
      ],
      [
        "¿Cuándo suele interesar cada vía?",
        [
          "La actividad individual puede resultar más sencilla para una prueba limitada, con una sola persona y pocos contratos, siempre que cumpla sus obligaciones. La SL puede ordenar participaciones, acuerdos de socios y riesgos de un proyecto compartido, aunque tiene gastos fijos y formalidades.",
          "Para plataformas de profesionales, además de elegir forma jurídica, revisar responsable de datos, términos de uso, contratos y actividad realmente realizada."
        ]
      ]
    ],
    "ruSections": [
      [
        "Это не три разных юридических формы",
        [
          "Empresario individual — физическое лицо, ведущее деятельность. Autónomo — распространённое обозначение самостоятельного предпринимателя или его статуса в RETA. Sociedad Limitada (SL) — отдельное юридическое лицо с одним или несколькими участниками.",
          "Учредитель или директор SL тоже может быть обязан состоять в RETA. Юридическую форму и систему социального страхования следует различать."
        ]
      ],
      [
        "Ответственность",
        [
          "Предприниматель-физлицо обычно отвечает своим имуществом в предусмотренных законом пределах. В SL имущество общества отделено, но личные гарантии, нарушения и ответственность администратора не исчезают.",
          "До решения сравните риски договоров, инвестиции, совместное владение, привлечение инвесторов и постоянные расходы."
        ]
      ],
      [
        "Налоги",
        [
          "Доход предпринимателя-физлица облагается IRPF по соответствующим правилам. Прибыль SL облагается Impuesto sobre Sociedades; выплаты учредителям зарплатой или дивидендами могут облагаться отдельно.",
          "Нельзя сравнивать лишь одну ставку IS со ставкой IRPF: нужен расчёт суммарной налоговой нагрузки и реальных выплат."
        ]
      ],
      [
        "Выбор модели",
        [
          "Индивидуальная деятельность может быть проще при небольшом тестовом проекте. SL помогает разграничить доли партнёров и управление, но добавляет бухгалтерские и корпоративные обязанности.",
          "Для цифровой платформы одновременно оценивают обработку персональных данных, условия использования и организацию контрактов."
        ]
      ]
    ]
  },
  {
    "kind": "blog",
    "es": "irpf-vs-impuesto-sociedades-sl-tipos-2026",
    "ru": "irpf-vs-impuesto-sociedades-sl-2026",
    "te": "IRPF o Impuesto sobre Sociedades en 2026: qué tributa un autónomo y una SL",
    "tr": "IRPF или Impuesto sobre Sociedades в 2026 году: налоги autónomo и SL",
    "de": "Tipos del Impuesto sobre Sociedades 2026, 15 % de entidades nuevas, microempresas, IRPF y por qué repartir dividendos cambia la comparación.",
    "dr": "Ставки Impuesto sobre Sociedades в 2026 году, особый режим новых компаний, IRPF и налогообложение выплат участникам.",
    "sources": [
      "aeat",
      "aeatGuide",
      "lsc"
    ],
    "esSections": [
      [
        "La comparación correcta",
        [
          "El IRPF del empresario individual se calcula sobre sus rendimientos y circunstancias personales conforme al régimen aplicable. Una SL calcula Impuesto sobre Sociedades sobre su base imponible; después hay que analizar cómo se remunera al socio que trabaja y si se distribuyen dividendos.",
          "La facturación no equivale a beneficio ni a base imponible. Un ingreso de 100.000 € no significa que se tribute por 100.000 € de beneficio."
        ]
      ],
      [
        "Tipos del IS para períodos iniciados en 2026",
        [
          "Según el cuadro oficial de la AEAT: tipo general 25 %; microempresas con INCN anterior inferior a 1 millón (si no corresponde tipo distinto), 19 % sobre los primeros 50.000 € de base imponible y 21 % sobre el resto; entidades de reducida dimensión del artículo 101 LIS, 23 % bajo sus condiciones.",
          "Las entidades de nueva creación que realicen actividades económicas pueden aplicar el 15 % en el primer período con base imponible positiva y el siguiente, si cumplen los requisitos legales. No basta crear una SL nueva ni procede asumir que cualquier traslado de actividad ya existente disfruta de ese 15 %."
        ]
      ],
      [
        "Pagos a socios y administradores",
        [
          "Hay que distinguir retribución laboral, servicios profesionales, remuneración del administrador y dividendos según su naturaleza real y normativa aplicable. El IVA y retenciones se analizan separadamente cuando proceda.",
          "La planificación correcta calcula beneficio retenido frente a beneficio distribuido, cotizaciones, IRPF personal y costes de cumplimiento contable y societario."
        ]
      ],
      [
        "Errores que hay que evitar",
        [
          "Elegir SL por una «barrera» universal de facturación, confundir los tipos transitorios 2026 con los definitivos futuros, olvidar la tributación de dividendos o confundir ingresos con base imponible.",
          "Solicita una comparación personalizada antes de tomar una decisión o aprobar nóminas y reparto de dividendos."
        ]
      ]
    ],
    "ruSections": [
      [
        "Что сравнивать",
        [
          "У физического лица предпринимательская прибыль включается в IRPF по применимым правилам. SL уплачивает Impuesto sobre Sociedades (IS) с налоговой базы.",
          "Оборот не равен прибыли и налогооблагаемой базе; выплаты учредителям требуют дополнительного анализа."
        ]
      ],
      [
        "Ставки IS для налоговых периодов, начатых в 2026 году",
        [
          "Общая ставка — 25 %. Для определённых микроорганизаций с выручкой прошлого периода ниже 1 млн евро: 19 % на первые 50 000 € налоговой базы и 21 % на оставшуюся часть. Для соответствующих требованиям малых компаний по статье 101 LIS — 23 %.",
          "Новые организации, ведущие реальную экономическую деятельность, могут иметь 15 % в первом прибыльном налоговом периоде и следующем, только при соблюдении условий. Регистрация новой SL сама по себе этого не гарантирует."
        ]
      ],
      [
        "Зарплата и дивиденды",
        [
          "Зарплата, вознаграждение директора, профессиональные услуги и дивиденды — юридически разные выплаты. Они могут влиять на IRPF получателя, социальное страхование и удержания.",
          "При принятии решения рассчитываются удержанная и распределённая прибыль, взносы и постоянные расходы общества."
        ]
      ],
      [
        "Типичные ошибки",
        [
          "Нельзя ориентироваться только на одну ставку налога или условный порог оборота. Нужно проверять применимость режима и период действия ставок."
        ]
      ]
    ]
  },
  {
    "kind": "blog",
    "es": "iae-cnae-2025-objeto-social-actividades-sl-2026",
    "ru": "iae-cnae2025-vid-deyatelnosti-sl",
    "te": "Cómo elegir IAE, CNAE-2025 y objeto social al constituir una SL",
    "tr": "Как выбрать IAE, CNAE-2025 и objeto social при открытии SL",
    "de": "Guía para clasificar las actividades de una sociedad: objeto social, epígrafes IAE, CNAE-2025, modelo 036 y licencias.",
    "dr": "Виды деятельности SL: objeto social, налоговые коды IAE, CNAE-2025, modelo 036 и лицензии.",
    "sources": [
      "cnae",
      "aeatActivities",
      "censal",
      "iae"
    ],
    "esSections": [
      [
        "Tres elementos con funciones diferentes",
        [
          "El objeto social describe en estatutos qué actividades puede realizar la sociedad. El epígrafe IAE es la clasificación fiscal de las actividades efectivamente desarrolladas. CNAE-2025 es la clasificación nacional de actividades económicas usada para fines estadísticos y en registros administrativos.",
          "No deben copiarse unos códigos en otros por intuición; las actividades reales determinan las categorías aplicables."
        ]
      ],
      [
        "Nuevo marco CNAE-2025",
        [
          "El Real Decreto 10/2025 aprobó CNAE-2025, publicada en enero de 2025. Para registros administrativos existen reglas transitorias de adaptación; hay que comprobar qué código y clasificación requiere cada organismo en el momento de presentar el trámite.",
          "La CNAE no es por sí sola una licencia municipal ni sustituye la clasificación fiscal del IAE."
        ]
      ],
      [
        "Alta censal y actividad de plataformas",
        [
          "La AEAT pide declarar las actividades efectivamente ejercidas en el modelo 036. El modelo 037 quedó suprimido a partir del 3 de febrero de 2025. La exención del pago de IAE no implica que pueda omitirse el alta censal.",
          "Una plataforma puede prestar tecnología, publicidad, servicios de intermediación o varias actividades. Sus tarifas y funcionamiento real importan más que el nombre comercial al elegir epígrafes y verificar autorización o normativa sectorial."
        ]
      ],
      [
        "Checklist para el alta",
        [
          "Describir contratos y fuentes de ingresos previstos; separar la actividad principal de las accesorias; consultar la clasificación de la AEAT y CNAE-2025; reflejar el objeto social coherentemente y verificar permisos de industria, municipio o Comunidad Autónoma.",
          "No asignar un CNAE único ni epígrafe IAE sin conocer funcionalidades y operaciones efectivas."
        ]
      ]
    ],
    "ruSections": [
      [
        "Три разные понятия",
        [
          "Objeto social — перечень разрешённых видов деятельности в уставе SL. IAE — налоговая классификация реально выполняемых операций. CNAE-2025 — государственная классификация видов экономической деятельности для статистики и административных реестров.",
          "Они не взаимозаменяемы. Коды выбираются по фактическим услугам и договорам."
        ]
      ],
      [
        "Классификация CNAE-2025",
        [
          "Real Decreto 10/2025 утвердил CNAE-2025; для государственных реестров есть переходные правила внедрения. Код проверяется по требованиям соответствующего органа на дату подачи.",
          "CNAE не заменяет налоговую регистрацию IAE или необходимые разрешения и лицензии."
        ]
      ],
      [
        "Modelo 036 и работа платформ",
        [
          "Hacienda требует декларировать реальные виды деятельности через modelo 036. Упрощённая форма 037 отменена с 3 февраля 2025 года.",
          "Цифровая платформа может одновременно оказывать IT-услуги, рекламу или посреднические услуги; точный состав определяется договором, монетизацией и функционалом, а не названием приложения."
        ]
      ],
      [
        "Проверка до подачи",
        [
          "Описать тарифы и договоры, основную и дополнительную деятельность, подобрать IAE и CNAE-2025 по официальным классификаторам, согласовать устав и проверить местные/отраслевые лицензии."
        ]
      ]
    ]
  },
  {
    "kind": "blog",
    "es": "socio-administrador-sl-reta-control-efectivo-2026",
    "ru": "uchreditel-direktor-sl-reta-2026",
    "te": "Socios y administradores de una SL: RETA, control efectivo y obligaciones",
    "tr": "Учредитель и директор SL: RETA, контроль долей и обязанности",
    "de": "Cuándo un socio-administrador puede cotizar en RETA según control efectivo, funciones de dirección y participación familiar.",
    "dr": "Когда учредитель и администратор SL должен оформляться в RETA по доле, функциям руководства и семейному контролю.",
    "sources": [
      "lgss",
      "lsc"
    ],
    "esSections": [
      [
        "Socio no equivale a autónomo societario",
        [
          "Ser socio de una SL sin prestar servicios no determina por sí mismo una obligación de alta en RETA. Importan el trabajo habitual y personal, las funciones del administrador, el carácter lucrativo y el control efectivo directo o indirecto de la sociedad.",
          "Hay supuestos de Régimen General o asimilado, otros de RETA y situaciones sin alta laboral por la mera condición de socio; el encuadramiento exige revisar hechos y contratos."
        ]
      ],
      [
        "Presunciones del artículo 305.2.b LGSS",
        [
          "Se entiende control efectivo cuando el trabajador posee al menos la mitad del capital. La ley presume control, salvo prueba en contrario, si tiene al menos un tercio; o al menos un cuarto y funciones de dirección/gerencia; o si la mitad del capital pertenece a familiares convivientes hasta segundo grado en los términos legales.",
          "No son umbrales universales de cotización: deben verificarse trabajo, control, parentesco, retribución y funciones. La Administración puede acreditar control efectivo por otros medios."
        ]
      ],
      [
        "Responsabilidad y gobernanza",
        [
          "El cargo de administrador implica deberes mercantiles y determinadas responsabilidades; la limitación de responsabilidad de los socios no borra las del administrador. La forma de remuneración y los estatutos deben revisarse según el caso.",
          "En proyectos con varios fundadores conviene concretar representación, facultades de firma, reparto de participaciones, decisiones relevantes y qué pasa si uno deja el proyecto."
        ]
      ],
      [
        "Antes de incorporar personas",
        [
          "Separar socios capitalistas, socios trabajadores, administradores y empleados; planificar altas y cotizaciones, acuerdos y protección de datos del personal."
        ]
      ]
    ],
    "ruSections": [
      [
        "Доля в SL не означает автоматический RETA",
        [
          "Пассивный участник, который не работает в обществе, не обязан входить в RETA только из-за доли. Учитываются регулярный личный труд, функции директора, вознаграждение и фактический контроль.",
          "Иногда применяется Régimen General или asimilado, иногда RETA, иногда нет основания для регистрации по одной лишь доле."
        ]
      ],
      [
        "Критерии статьи 305.2.b LGSS",
        [
          "Контроль признаётся при владении не менее 50 % капитала. Предполагается, если имеется не менее 1/3; либо не менее 1/4 при руководящих функциях; либо как минимум половина капитала принадлежит совместно проживающим членам семьи в предусмотренных законом случаях.",
          "Эти числа сами по себе не определяют всю систему взносов: важны фактическая работа и обстоятельства."
        ]
      ],
      [
        "Обязанности директора",
        [
          "Управляющий (administrador) несёт корпоративные обязанности и в определённых обстоятельствах личную ответственность. Нужно проверить полномочия, оплату и положения устава.",
          "С несколькими учредителями важно согласовать принятие решений, подписи, доли и выход партнёра."
        ]
      ],
      [
        "До найма и выплат",
        [
          "Разделить роли участников-инвесторов, участников-работников, директоров и обычных сотрудников; заранее проверить требования Seguridad Social."
        ]
      ]
    ]
  },
  {
    "kind": "docs",
    "es": "checklist-constitucion-sl-2026",
    "ru": "checklist-sozdanie-sl-2026",
    "te": "Checklist para constituir una SL en España (2026)",
    "tr": "Чек-лист открытия Sociedad Limitada в Испании (2026)",
    "de": "Lista de documentos y decisiones: socios, capital, objeto, notaría, DUE, modelo 036 y obligaciones posteriores.",
    "dr": "Документы и решения для создания SL: участники, капитал, устав, нотариус, DUE, modelo 036 и обязанности.",
    "sources": [
      "lsc",
      "circe",
      "censal",
      "lgss"
    ],
    "esSections": [
      [
        "Decisiones de socios",
        [
          "Identidad y NIF/NIE de promotores, porcentajes, unipersonalidad, representante y órgano de administración, domicilio, objeto real, capital inicial y posible pacto de socios.",
          "Comprobar viabilidad de CIRCE/estatutos tipo; si hay inversores, pactos de salida o aportaciones no dinerarias, valorar escritura y estatutos a medida."
        ]
      ],
      [
        "Documentación de constitución",
        [
          "Certificación negativa de denominación del Registro Mercantil Central, identificación de socios y administrador, datos del domicilio, estructura del capital, estatutos, poderes si procede y acreditación legal de aportaciones.",
          "La firma notarial y la inscripción mercantil forman parte del procedimiento. CIRCE usa el DUE para coordinar gestiones."
        ]
      ],
      [
        "Altas y verificación",
        [
          "NIF y modelo 036, epígrafes IAE de las actividades efectivamente ejercidas, CNAE-2025 aplicable, Seguridad Social, certificados, facturación, libros contables y calendario de impuestos.",
          "Verificar aranceles de notaría y Registro, honorarios, suplidos y qué opciones se están contratando, por separado."
        ]
      ],
      [
        "Errores de control",
        [
          "No declarar como constituida una SL antes de su inscripción; no atribuir automáticamente el 15 % IS; no dar por hecho que todo administrador estará en el mismo régimen de cotización."
        ]
      ]
    ],
    "ruSections": [
      [
        "Участники и решения",
        [
          "Собрать данные DNI/NIE/NIF учредителей, доли, полномочия директора, юридический адрес, objeto social, капитал и, при необходимости, pacto de socios.",
          "Проверить, подходит ли CIRCE и типовой устав; при инвестициях и сложных договорённостях может понадобиться индивидуальный устав."
        ]
      ],
      [
        "Документы",
        [
          "Certificación negativa de denominación, данные учредителей, устав, сведения о вкладе, нотариальные документы и доверенности при необходимости.",
          "CIRCE объединяет действия через DUE, но нотариальный этап сохраняется."
        ]
      ],
      [
        "После оформления",
        [
          "NIF, modelo 036, фактические эпиграфы IAE и CNAE-2025, Seguridad Social, сертификаты, счета, бухгалтерские книги и налоги.",
          "Проверить отдельно стоимость специалиста, нотариуса и Registro Mercantil."
        ]
      ],
      [
        "Распространённые ошибки",
        [
          "Не объявлять SL зарегистрированной до завершения надлежащих действий; не обещать автоматическую ставку 15 % IS или одинаковую схему RETA каждому директору."
        ]
      ]
    ]
  },
  {
    "kind": "docs",
    "es": "circe-o-notaria-constitucion-sl-modalidades",
    "ru": "circe-ili-obychnaya-registratsiya-sl",
    "te": "Constitución SL por CIRCE o vía ordinaria: elegir modalidad",
    "tr": "Открытие SL через CIRCE или обычным способом: сравнение",
    "de": "Cuándo encaja CIRCE, para qué sirve el DUE y qué diferencia hay entre gestión profesional y formación guiada.",
    "dr": "Когда подходит CIRCE, как работает DUE и что включает профессиональное сопровождение или обучение.",
    "sources": [
      "circe",
      "lsc"
    ],
    "esSections": [
      [
        "CIRCE y Documento Único Electrónico",
        [
          "CIRCE permite coordinar telemáticamente gestiones para crear empresas mediante DUE, con identificación digital y posterior intervención notarial. Se requiere, entre otras comprobaciones, denominación social y datos correctos de socios.",
          "No todas las estructuras y cláusulas se resuelven con estatutos tipo; evaluar aportaciones especiales, socios extranjeros, pactos y operaciones reguladas."
        ]
      ],
      [
        "Modalidades de EXPERT verificadas en catálogo",
        [
          "Constitución de SL ordinaria: 490,00 € + IVA de honorarios. Servicio completo por CIRCE: 499,00 € + IVA. Formación guiada de CIRCE: 180,00 € + IVA por sesión de 2 horas; el cliente realiza por su cuenta el DUE y las gestiones.",
          "No confundir los 180 € de formación con la tramitación completa de la sociedad. Los aranceles notariales y registrales, certificados personales y documentos complejos se confirman como conceptos diferenciados."
        ]
      ],
      [
        "Elección operativa",
        [
          "Si se necesitan estatutos a medida, acuerdos complejos entre socios o controles previos adicionales, pedir revisión antes de optar por el DUE estándar. El plazo estimado no es una garantía de inscripción ni de autorización sectorial."
        ]
      ]
    ],
    "ruSections": [
      [
        "Система CIRCE",
        [
          "CIRCE позволяет объединить часть процедур в Documento Único Electrónico (DUE); требуется электронная идентификация и нотариальный этап.",
          "Типовые уставы подходят не каждой компании: проверьте вклад имущества, иностранные документы, инвесторов и партнёрские договоры."
        ]
      ],
      [
        "Тарифы EXPERT согласно каталогу",
        [
          "Обычная регистрация SL — 490,00 € + IVA; полное оформление через CIRCE — 499,00 € + IVA; самостоятельное оформление с персональным обучением — 180,00 € + IVA за 2 часа.",
          "180 € — цена обучения, а не оформления SL под ключ. Уточняются расходы нотариуса/реестра и дополнительные документы."
        ]
      ],
      [
        "Как выбрать",
        [
          "Если нужен индивидуальный устав, сложные права участников или предварительная проверка регуляторных требований, согласуйте процедуру заранее. Сроки ориентировочные."
        ]
      ]
    ]
  },
  {
    "kind": "docs",
    "es": "primeros-90-dias-tras-constituir-sl",
    "ru": "pervye-90-dney-posle-sl",
    "te": "Primeros 90 días de una SL: obligaciones fiscales, contables y de socios",
    "tr": "Первые 90 дней SL: налоги, учёт, участники и проверки",
    "de": "Guía de arranque con alta censal, facturación, libros, Seguridad Social, privacidad y obligaciones de la SL.",
    "dr": "Налоговая регистрация, счета, бухгалтерия, Seguridad Social, RGPD и обязанности новой SL.",
    "sources": [
      "censal",
      "aeatGuide",
      "lgss",
      "rgpd"
    ],
    "esSections": [
      [
        "Antes de emitir facturas",
        [
          "Asegurar NIF y situación censal, actividades IAE, régimen de IVA, medios de facturación y cuenta operativa. El alta censal se realiza mediante modelo 036. Revisar fechas de inicio y posibles retenciones.",
          "Verificar la política de privacidad, contratos y cookies cuando la empresa vaya a captar usuarios o candidatos."
        ]
      ],
      [
        "Administración y contabilidad",
        [
          "Revisar régimen de Seguridad Social de administradores y socios que trabajan, contratos y nóminas cuando procedan. Preparar contabilidad conforme a obligaciones mercantiles, libros oficiales, conservación de justificantes y calendario fiscal.",
          "La SL tiene personalidad jurídica separada y sus fondos no son una cuenta personal de los socios: documentar retribuciones, préstamos y dividendos correctamente."
        ]
      ],
      [
        "Fiscalidad del primer ejercicio",
        [
          "Verificar el tipo de Impuesto sobre Sociedades aplicable; el 15 % de nueva creación tiene requisitos, y no depende simplemente del día de constitución. Controlar IVA, retenciones y pagos fraccionados según el caso.",
          "La preparación de cuentas anuales y acuerdos societarios sigue sus propios plazos, aunque el proyecto aún no facture."
        ]
      ],
      [
        "Checklist final",
        [
          "Verificar documentación societaria, titularidad real, permisos sectoriales, confidencialidad y autorizaciones de acceso; documentar quién supervisa cada vencimiento."
        ]
      ]
    ],
    "ruSections": [
      [
        "Перед первой фактурой",
        [
          "Проверить NIF, регистрацию modelo 036, коды IAE, IVA, фактическую дату начала и выбранную систему выставления счетов.",
          "Если собираются персональные данные клиентов или кандидатов, нужны корректные политика конфиденциальности, договоры с провайдерами и настройки cookies."
        ]
      ],
      [
        "Управление и бухгалтерия",
        [
          "Проверить Seguridad Social директора и работающих участников, договоры, бухгалтерский учёт, хранение первичных документов и налоговый календарь.",
          "Деньги SL не равны личным деньгам учредителей; выплаты надо оформлять юридически правильно."
        ]
      ],
      [
        "Первый налоговый период",
        [
          "Проверить применимость налога IS и особой ставки 15 %; подготовить IVA, удержания и другие обязательства по реальным операциям.",
          "Обязанности по годовой отчётности сохраняются и при отсутствии выручки, если применимы."
        ]
      ],
      [
        "Контроль",
        [
          "Определить ответственных за подачу, корпоративные документы, titularidad real и необходимые разрешения."
        ]
      ]
    ]
  },
  {
    "kind": "docs",
    "es": "seleccionar-objeto-social-iae-cnae-empresa",
    "ru": "objeto-social-iae-cnae-kompanii",
    "te": "Checklist: objeto social, IAE y CNAE-2025 antes del alta de empresa",
    "tr": "Объект деятельности, IAE и CNAE-2025: чек-лист перед открытием компании",
    "de": "Cómo describir actividad real, seleccionar epígrafes y comprobar licencias sin confundir objeto social, IAE y CNAE.",
    "dr": "Как описать фактические услуги, подобрать IAE и CNAE-2025 и проверить лицензии.",
    "sources": [
      "aeatActivities",
      "cnae",
      "censal",
      "iae"
    ],
    "esSections": [
      [
        "Describir operaciones, no etiquetas de marketing",
        [
          "Anotar qué vende la empresa, a quién factura, qué plataforma o canal utiliza, qué servicios prestan terceros y qué ingresos espera obtener. Separar actividades accesorias y servicios regulados.",
          "El nombre «marketplace» no basta para asignar IAE ni CNAE. Consultar el buscador oficial de actividades de la AEAT y, para CNAE, el Real Decreto 10/2025."
        ]
      ],
      [
        "Alinear textos legales y formularios",
        [
          "Objeto social de estatutos: descripción jurídica de actividades. IAE: clasificación fiscal de actividad efectivamente desarrollada. CNAE: clasificación estadística y administrativa distinta.",
          "La declaración censal modelo 036 debe reflejar el inicio de las actividades y circunstancias fiscales; el modelo 037 dejó de estar disponible en febrero de 2025."
        ]
      ],
      [
        "Permisos y cambios futuros",
        [
          "Comprobar licencias municipales, habilitación profesional, empleo, servicios digitales, formación o publicidad cuando proceda. Actualizar actividad censal y, si hace falta, estatutos si cambia realmente el negocio.",
          "Registrar fuente, fecha, autor de la clasificación y por qué se eligió. No atribuir un código concreto a una empresa sin conocer los hechos."
        ]
      ]
    ],
    "ruSections": [
      [
        "Фактическая деятельность",
        [
          "Перечислить, за что компания получает деньги, кому оказывает услуги и что предоставляют третьи лица. Выделить основную и дополнительную деятельность.",
          "Слова «marketplace» или «платформа» не определяют IAE/CNAE. Используются официальные классификаторы."
        ]
      ],
      [
        "Три слоя",
        [
          "Objeto social — разрешённые виды деятельности в уставе; IAE — налоговая классификация реально выполняемых операций; CNAE-2025 — статистическая и административная классификация.",
          "В modelo 036 декларируют фактическую деятельность; modelo 037 отменён с февраля 2025 года."
        ]
      ],
      [
        "Разрешения и изменения",
        [
          "Проверить местные и отраслевые разрешения, правила труда, рекламы и цифровых услуг по модели бизнеса.",
          "Если деятельность меняется, актуализировать налоговую регистрацию и при необходимости устав. Фиксировать дату и основание классификации."
        ]
      ]
    ]
  }
];

const SERVICE_ES = '/servicios/empresas-autonomos/constitucion-sl';
const SERVICE_RU = '/ru/uslugi/sozdanie-sl';
const COPYRIGHT_FOOT = 'Contenido orientativo revisado el 14/10/2026; los requisitos y el encuadramiento deben verificarse para cada situación.';
function spanishBody(pair: Pair): string {
  const sections = pair.esSections.map(([heading, paragraphs]) => '## '+heading+'\n\n'+paragraphs.join('\n\n')).join('\n\n');
  const sources = pair.sources.map(key => '- [Fuente oficial: '+key+']('+SOURCE_URLS[key]+')').join('\n');
  const links = '- [Constitución de SL]('+SERVICE_ES+')\n- [Constitución por CIRCE](/servicios/empresas-autonomos/constitucion-sl-circe)\n- [Protección de datos y RGPD](/servicios/proteccion-datos)';
  return sections+'\n\n## Fuentes oficiales y consultas relacionadas\n\n'+sources+'\n\n'+links+'\n\n'+COPYRIGHT_FOOT;
}
export const sl2026BlogArticles: Article[] = sl2026Pairs
 .filter(p=>p.kind==='blog'&&!p.old)
 .map(p=>({
   slug:p.es, category:'Empresas', title:p.te, excerpt:p.de, date:'14 oct 2026', readTime:'8 min',
   tags:['Sociedad Limitada','autónomos','empresas','España 2026','CIRCE','fiscalidad'],
   relatedServiceSlugs:['constitucion-sl','constitucion-sl-circe'],
   body:spanishBody(p),
 }));
export const sl2026KnowledgeDocs: KnowledgeDoc[] = sl2026Pairs
 .filter(p=>p.kind==='docs')
 .map(p=>({
  slug:p.es, category:'empresas', title:p.te, excerpt:p.de, tags:['SL','CIRCE','autónomos','empresas','2026'],
  readTime:'7 min', updatedAt:'14 oct 2026',
  relatedServiceSlugs:['constitucion-sl','constitucion-sl-circe'],
  relatedServiceCategories:['empresas-autonomos'],
  seoTitle:p.te+' | EXPERT Docs', seoDescription:p.de, body:spanishBody(p),
 }));
export const sl2026RuResources: RuResource[] = sl2026Pairs.map(p=>({
 kind:p.kind,
 slug:p.ru,
 esPath:(p.kind==='blog'?'/blog/':'/docs/')+p.es,
 title:p.tr, description:p.dr, readTime:'8 мин', showInNationalityRelated:false,
 cta:{eyebrow:'Услуги EXPERT',title:'Регистрация Sociedad Limitada',description:'Проверьте формы регистрации и обязанности до оформления заказа.',href:SERVICE_RU,label:'Услуга по открытию SL'},
 disclaimer:'Общая информация. Не заменяет проверку конкретной деятельности. Обновлено 14.10.2026.',
 sections:[
   ...p.ruSections.map(([heading, paragraphs])=>({title:heading,paragraphs})),
   {title:'Официальные источники',links:p.sources.map(key=>({label:'Официальный источник: '+key,href:SOURCE_URLS[key]}))},
   {title:'Связанные услуги',links:[
    {label:'Регистрация SL в Испании',href:SERVICE_RU},
    {label:'Регистрация SL через CIRCE',href:'/ru/uslugi/sozdanie-sl-cherez-circe'},
    {label:'Защита персональных данных / RGPD',href:'/ru/uslugi/rgpd-dokumenty-platformy'},
   ]},
 ],
}));
export function getSl2026Pair(kind:'blog'|'docs',esSlug:string): Pair|undefined {
 return sl2026Pairs.find(p=>p.kind===kind&&p.es===esSlug);
}
export function isSl2026RuSlug(kind:'blog'|'docs',slug:string):boolean {
 return sl2026Pairs.some(p=>p.kind===kind&&p.ru===slug);
}
