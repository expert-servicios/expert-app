import type { Article } from '@/lib/utils/blog';
export type LaborRuArticle = {slug:string;esSlug:string;title:string;description:string;sections:Array<{heading:string;body:string}>};
export const laborRuArticles: LaborRuArticle[] = [
  {
    "slug": "holded-nominy-ogranicheniya-seguridad-social-2026",
    "esSlug": "holded-nominas-limites-seguridad-social-2026",
    "title": "Расчёт зарплаты в Holded: что проверять и что остаётся за пределами программы",
    "description": "Как отличать расчётный лист (nómina), страховые взносы (cotizaciones) и обязательные отправки данных в TGSS и SEPE.",
    "sections": [
      {
        "heading": "Holded не заменяет обязанности перед TGSS и SEPE",
        "body": "Рассчитанный или проведённый расчётный лист (nómina) сам по себе не подтверждает постановку сотрудника на учёт (alta) и принятие расчёта страховых взносов (cotizaciones) казначейством TGSS. Holded может создавать файлы для SILTRA, однако создание файла не равнозначно подтверждению его принятия TGSS. Проверяйте подтверждение в официальном канале."
      },
      {
        "heading": "Что проверять в nómina и convenio colectivo",
        "body": "Перед закрытием расчётного листа (nómina) проверьте коллективный договор (convenio colectivo), профессиональную группу (grupo profesional), рабочее время (jornada), дополнительные выплаты (pagas extra), надбавки (pluses), базу страховых взносов (base de cotización), налоговые удержания (retenciones IRPF) и взносы в систему социального страхования (Seguridad Social). Зарплата до удержаний (salario bruto), выплата на руки (salario neto) и полные затраты работодателя (coste empresa) различаются."
      },
      {
        "heading": "Разделяйте работу в Holded и официальную подачу",
        "body": "Используйте Holded для расчёта и учёта в рамках подключённого тарифа и разрешённых функций. Постановку и снятие сотрудников с учёта (altas y bajas), изменение данных (variaciones) проверяйте в системе социального страхования (Sistema RED / TGSS). Для передачи сведений о договорах (Contrat@) и сертификатов работодателя (Certific@2) используются соответствующие сервисы SEPE, когда они применимы. По документации Holded модуль расчёта зарплат (gema Nóminas) может формировать файлы баз (fichero de bases) и CRA для SILTRA. Создание файла, его отправка, приём и подтверждение TGSS — разные действия. Проверьте подписку, настройки и полномочия."
      },
      {
        "heading": "Контрольный список перед закрытием месяца",
        "body": "1. Проверить договор (contrato), коллективный договор (convenio colectivo) и график (jornada). 2. Проверить отпуска и временную нетрудоспособность (incapacidad temporal, IT). 3. Сверить начисления, удержания (deducciones), IRPF и базы взносов. 4. Сверить бухгалтерскую запись по зарплате (asiento de nómina). 5. Отдельно проверить официальные подтверждения (justificantes) подачи."
      },
      {
        "heading": "Источники и проверка возможностей",
        "body": "Официальные источники: [Seguridad Social — Empresarios](https://www.seg-social.es/wps/portal/wss/internet/Empresarios/), [SEPE — Servicios para empresas](https://www.sepe.es/HomeSepe/empresas/servicios-para-empresas), [Holded — Glosario de nóminas](https://help.holded.com/es/articles/10575954-glosario-de-nominas); [Holded — SILTRA](https://help.holded.com/es/articles/14321260-como-gestionar-los-ficheros-siltra-desde-holded); [Holded — Nóminas](https://help.holded.com/es/articles/15262251-descubre-la-funcionalidad-de-nominas). Возможности интеграции Holded нужно проверять в конкретном аккаунте и тарифе."
      }
    ]
  },
  {
    "slug": "seguridad-social-sepe-kontrakty-vznosy-2026",
    "esSlug": "seguridad-social-sepe-contratos-altas-cotizaciones-2026",
    "title": "Seguridad Social и SEPE: приём сотрудников, договоры, страховые взносы и справки",
    "description": "Какие сведения направляются в TGSS (Sistema RED), какие в SEPE (Contrat@ и Certific@2), и что проверять отдельно от nómina.",
    "sections": [
      {
        "heading": "Что делает TGSS (Seguridad Social)",
        "body": "Главное казначейство системы социального страхования (Tesorería General de la Seguridad Social, TGSS) ведёт регистрацию работодателя (inscripción), присвоение номера страхования (afiliación), оформление приёма и увольнения (altas y bajas), изменение данных (variaciones) и страховые взносы (cotizaciones). Электронный канал для работодателей — Sistema RED."
      },
      {
        "heading": "Какие действия относятся к SEPE",
        "body": "Государственная служба занятости (Servicio Público de Empleo Estatal, SEPE) принимает сообщения о трудовых договорах через Contrat@ и сертификаты работодателя (certificados de empresa) через Certific@2, когда применимо. Передача данных в TGSS не равна автоматической передаче в SEPE."
      },
      {
        "heading": "Как понимать nómina, base de cotización и взносы",
        "body": "Расчётный лист по зарплате (nómina) показывает начисления (devengos) и удержания (deducciones). База для расчёта страховых взносов (base de cotización) определяется по особым правилам и ограничениям. Разделяйте долю взносов работодателя (cotizaciones empresariales), долю работника (cotizaciones del trabajador), удержания подоходного налога (retenciones de IRPF) и сумму к выплате (salario neto)."
      },
      {
        "heading": "Ежемесячный контроль работодателя",
        "body": "Храните отдельно: расчётный лист (nómina) и подтверждение выплаты, подтверждения приёма/увольнения (altas/bajas), расчёт и оплату страховых взносов (liquidación y pago de cotizaciones), сообщения о договорах (Contrat@) и сертификаты (Certific@2), когда требуются. Сверяйте период, код счёта работодателя (CCC) и работника."
      },
      {
        "heading": "Официальные источники",
        "body": "[Seguridad Social — Empresarios](https://www.seg-social.es/wps/portal/wss/internet/Empresarios/); [alta, baja y variaciones](https://www.seg-social.es/wps/portal/wss/internet/InformacionUtil/44539/44113/44136); [SEPE — Servicios para empresas](https://www.sepe.es/HomeSepe/empresas/servicios-para-empresas). Сроки и правила нужно уточнять для каждого конкретного действия."
      }
    ]
  }
];
export const laborEsBlogArticles: Article[] = [
  {
    "slug": "holded-nominas-limites-seguridad-social-2026",
    "category": "Holded",
    "title": "Nóminas en Holded en 2026: qué comprobar y qué trámites siguen fuera del programa",
    "excerpt": "Guía para distinguir cálculo de nómina, asientos contables, bases de cotización y comunicaciones oficiales TGSS/SEPE.",
    "date": "13 oct 2026",
    "readTime": "6 min",
    "tags": [
      "nóminas",
      "Seguridad Social",
      "SEPE",
      "gestión laboral",
      "Holded"
    ],
    "relatedServiceSlugs": [],
    "body": "## Holded no sustituye las obligaciones ante TGSS y SEPE\n\nUna nómina calculada o contabilizada no acredita por sí sola un alta de trabajador ni una liquidación aceptada por TGSS. Holded documenta generación de ficheros de bases y CRA para SILTRA, pero generar ficheros no equivale a obtener su aceptación oficial. La empresa debe comprobar cada trámite en el canal correspondiente.\n\n## Qué revisar en la nómina y el convenio\n\nAntes de cerrar una nómina verifica convenio colectivo, categoría/grupo profesional, jornada, pagas extra, pluses, base de cotización, retenciones IRPF y costes de Seguridad Social. El salario bruto, el líquido y el coste total empresarial son cifras diferentes.\n\n## Separar trabajo en Holded de presentación oficial\n\nUsa Holded para la parte de cálculo y registro que tengas contratada y habilitada, pero verifica las afiliaciones, altas, bajas y variaciones con Sistema RED/TGSS; los procedimientos contractuales y certificados corresponden a los sistemas del SEPE cuando aplican. Holded documenta la generación de ficheros de bases y CRA para SILTRA con la gema Nóminas; comprobar que se han enviado, validado y aceptado por TGSS sigue siendo un control distinto. No presupongas disponibilidad para tu cuenta sin comprobar plan y permisos.\n\n## Checklist antes del cierre\n\n1. Contrastar contrato, convenio y jornada. 2. Revisar incidencias, vacaciones e IT. 3. Comprobar devengos, deducciones, IRPF y bases. 4. Conciliar el asiento de nómina. 5. Revisar justificantes de liquidación y comunicaciones oficiales por separado.\n\n## Fuentes y comprobación del alcance\n\nFuentes: [Seguridad Social — Empresas](https://www.seg-social.es/wps/portal/wss/internet/Empresarios/); [SEPE — Servicios para empresas](https://www.sepe.es/HomeSepe/empresas/servicios-para-empresas); [Holded — Glosario de nóminas](https://help.holded.com/es/articles/10575954-glosario-de-nominas); [Holded — SILTRA](https://help.holded.com/es/articles/14321260-como-gestionar-los-ficheros-siltra-desde-holded). La disponibilidad concreta de integraciones y operaciones de Holded debe verificarse en la cuenta real."
  },
  {
    "slug": "seguridad-social-sepe-contratos-altas-cotizaciones-2026",
    "category": "Laboral",
    "title": "Seguridad Social y SEPE: altas, contratos, cotizaciones y certificados de empresa",
    "excerpt": "Mapa de organismos y comunicaciones laborales para empresas: TGSS, Sistema RED, Contrat@ y Certific@2.",
    "date": "13 oct 2026",
    "readTime": "6 min",
    "tags": [
      "nóminas",
      "Seguridad Social",
      "SEPE",
      "gestión laboral",
      "Holded"
    ],
    "relatedServiceSlugs": [],
    "body": "## Qué hace la Tesorería General de la Seguridad Social\n\nLa Tesorería General de la Seguridad Social (TGSS) gestiona la inscripción de empresas, afiliación, altas, bajas, variaciones y cotización/recaudación. Sistema RED es un canal para intercambiar información y efectuar trámites de empresa autorizados.\n\n## Qué trámites corresponden al SEPE\n\nEl Servicio Público de Empleo Estatal (SEPE) dispone de canales para comunicar contratación (Contrat@) y transmitir certificados de empresa y otras comunicaciones (Certific@2). Una comunicación a la TGSS no sustituye automáticamente las comunicaciones exigidas al SEPE.\n\n## Cómo interpretar nómina, bases y cuotas\n\nLa nómina documenta los devengos y descuentos. La base de cotización determina la referencia de ciertas cuotas, con reglas y topes aplicables. Se distinguen aportaciones de empresa y trabajador, retenciones de IRPF y el total neto que recibe la persona.\n\n## Control mensual para la empresa\n\nConserva cuatro evidencias separadas: documento de nómina y transferencia, justificantes de altas/bajas y variaciones, liquidación y pago de cuotas, y comunicaciones contractuales/SEPE cuando procedan. Comprueba el período, el CCC y la identidad del trabajador.\n\n## Fuentes oficiales\n\n[Seguridad Social — Empresarios](https://www.seg-social.es/wps/portal/wss/internet/Empresarios/); [Alta, baja y variación de datos](https://www.seg-social.es/wps/portal/wss/internet/InformacionUtil/44539/44113/44136); [SEPE — Servicios para empresas](https://www.sepe.es/HomeSepe/empresas/servicios-para-empresas). Plazos, canales y particularidades deben comprobarse en la fecha de cada operación."
  }
];
export function getLaborRuArticle(slug:string){return laborRuArticles.find(a=>a.slug===slug);}
