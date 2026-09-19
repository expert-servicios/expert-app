export const categories = [
  {
    slug: 'declaraciones-impuestos',
    name: 'Fiscalidad',
    description: 'Declaraciones fiscales para personas físicas, residentes, no residentes y contribuyentes con patrimonio o rentas internacionales.',
    imageUrl: '/catalog/fiscal.png'
  },
  {
    slug: 'extranjeria-nacionalidad',
    name: 'Extranjería y Nacionalidad',
    description: 'Tramitación y revisión de expedientes de residencia, arraigo, reagrupación familiar y nacionalidad española.',
    imageUrl: '/catalog/extranjeria.png'
  },
  {
    slug: 'empresas-autonomos',
    name: 'Empresas y Autónomos',
    description: 'Alta de actividad, constitución de sociedades, gestión mensual con Holded y trámites mercantiles para mantener tu empresa al día.',
    imageUrl: '/catalog/empresa.png'
  },
  {
    slug: 'holded',
    name: 'Holded',
    description: 'Implantación, migración y formación práctica en Holded para autónomos, pymes y empresas.',
    imageUrl: '/catalog/holded.png'
  },
  {
    slug: 'certificado-digital',
    name: 'Certificado digital',
    description: 'Certificados digitales para personas físicas, entidades mercantiles y entidades sin ánimo de lucro.',
    imageUrl: '/catalog/certificados.png'
  },
  {
    slug: 'trafico-capitania-maritima',
    name: 'Tráfico y Capitanía Marítima',
    description: 'Gestiones administrativas para vehículos y embarcaciones, incluyendo transferencias, matriculaciones, duplicados y trámites marítimos.',
    imageUrl: '/catalog/trafico.png'
  },
  {
    slug: 'notaria-propiedades',
    name: 'Notaría y Propiedades',
    description: 'Acompañamiento en operaciones inmobiliarias, herencias, donaciones y cancelaciones hipotecarias.',
    imageUrl: '/catalog/notaria.png'
  }
] as const;

export type PublicCategorySlug = (typeof categories)[number]['slug'];
export type HiddenCategorySlug = 'formacion';
export type CategorySlug = PublicCategorySlug | HiddenCategorySlug;

export type ServiceDeliveryMode = 'full_service' | 'guided';

export type ServiceDeliveryOption = {
  mode: ServiceDeliveryMode;
  label: string;
  description: string;
  price: string;
  duration?: string;
  stripePriceId?: string;
  checkoutLabel?: string;
  includes: string[];
  notIncluded?: string[];
};

export type Service = {
  slug: string;
  categoria: CategorySlug;
  name: string;
  shortDescription: string;
  description: string;
  metaTitle?: string;
  metaDescription?: string;
  price?: string;
  duration?: string;
  officialFee?: string;
  servicePriceDetail?: string;
  stripePriceId?: string;
  checkoutLabel?: string;
  checkoutLegal?: string;
  deliveryOptions?: ServiceDeliveryOption[];
  audience?: string[];
  requirements?: string[];
  keyPoints?: { title: string; text: string }[];
  documents?: { title: string; items: string[] }[];
  process?: { title: string; text: string }[];
  notIncluded?: string[];
  reviewBeforeHiring?: string[];
  finalCta?: { title: string; text: string };
  includes: string[];
  requiredDocs?: string[];
  faqs: { q: string; a: string }[];
};

export const services: Service[] = [
  // ── Fiscalidad ───────────────────────────────────────────────────────────
  {
    slug: 'irpf',
    categoria: 'declaraciones-impuestos',
    name: 'Declaración de la Renta (IRPF)',
    shortDescription: 'Preparación y presentación del IRPF con revisión fiscal completa.',
    description:
      'Gestionamos tu declaración de la renta de principio a fin: revisamos tu situación fiscal, identificamos deducciones aplicables, preparamos el borrador, lo validamos contigo y lo presentamos ante la AEAT. Servicio para residentes, trabajadores por cuenta ajena, autónomos y propietarios de inmuebles.',
    price: '150 € + IVA',
    stripePriceId: 'price_1TXMmGLeYwwgvux4wIhcfhEF',
    duration: '3–5 días hábiles',
    includes: [
      'Revisión completa de datos fiscales',
      'Identificación de deducciones y bonificaciones',
      'Preparación y validación del borrador',
      'Presentación telemática ante la AEAT',
      'Justificante de presentación'
    ],
    faqs: [
      { q: '¿Necesito ir a ningún sitio?', a: 'No. Todo el proceso se realiza de forma online. Tú envías la documentación y nosotros gestionamos la presentación.' },
      { q: '¿Qué documentos necesito aportar?', a: 'DNI/NIE, número de referencia AEAT o Cl@ve, certificados de retenciones, datos de inmuebles, préstamos e inversiones si los hay.' },
      { q: '¿Cuándo empieza la campaña de renta?', a: 'La campaña de IRPF arranca en abril y cierra a finales de junio. Te recomendamos no esperar al último momento para evitar saturación.' }
    ]
  },
  {
    slug: 'modelo-151',
    categoria: 'declaraciones-impuestos',
    name: 'Modelo 151 — Régimen Beckham',
    shortDescription: 'Tributación especial para expatriados desplazados a España.',
    description:
      'El régimen especial de impatriados (popularmente conocido como Ley Beckham) permite tributar al tipo fijo del 24% sobre rentas obtenidas en España durante los primeros años de residencia. Gestionamos la solicitud de activación del régimen y la declaración anual del Modelo 151.',
    price: 'Consultar',
    duration: '5–10 días hábiles',
    includes: [
      'Evaluación de elegibilidad y requisitos',
      'Tramitación del Modelo 149 (opción al régimen)',
      'Declaración anual Modelo 151',
      'Asesoramiento fiscal internacional',
      'Presentación telemática y justificante'
    ],
    faqs: [
      { q: '¿Quién puede acogerse al régimen Beckham?', a: 'Trabajadores y directivos desplazados a España que no hayan sido residentes los 5 años anteriores, bajo determinadas condiciones.' },
      { q: '¿Cuánto tiempo dura el régimen?', a: 'Hasta 5 años desde la activación, renovable en algunas circunstancias.' },
      { q: '¿Cubre también a mi familia?', a: 'El régimen es individual, aunque el cónyuge e hijos pueden acogerse bajo ciertos requisitos.' }
    ]
  },
  {
    slug: 'no-residentes',
    categoria: 'declaraciones-impuestos',
    name: 'IRNR — No Residentes',
    shortDescription: 'Declaraciones fiscales para personas no residentes con bienes o rentas en España.',
    description:
      'Si tienes inmuebles, inversiones o percibes rentas de fuente española sin ser residente fiscal, debes presentar el Impuesto sobre la Renta de No Residentes (IRNR). Gestionamos los modelos 210, 211 y 213 adaptados a tu situación.',
    price: 'Desde 80 € + IVA / modelo',
    duration: '3–5 días hábiles',
    includes: [
      'Análisis de tu situación como no residente',
      'Preparación del Modelo 210 / 211 / 213',
      'Cálculo de cuota y retenciones',
      'Presentación telemática',
      'Asesoramiento sobre convenios de doble imposición'
    ],
    faqs: [
      { q: '¿Cuándo debo presentar el Modelo 210?', a: 'Depende del tipo de renta. Para imputaciones de inmuebles, en enero del año siguiente. Para alquileres, trimestralmente.' },
      { q: '¿Necesito representante fiscal?', a: 'Sí, si eres no residente en la UE con propiedades en España, es obligatorio tener un representante fiscal en España.' }
    ]
  },
  {
    slug: 'iva-trimestral',
    categoria: 'declaraciones-impuestos',
    name: 'IVA Trimestral',
    shortDescription: 'Presentación del Modelo 303 y liquidación trimestral del IVA.',
    description:
      'Preparamos y presentamos tu declaración trimestral de IVA (Modelo 303), el resumen anual (Modelo 390) y cualquier otro modelo relacionado. Incluye revisión de facturas emitidas y recibidas para garantizar la correcta liquidación.',
    price: 'Desde 60 € + IVA / trimestre',
    duration: '2–3 días hábiles',
    includes: [
      'Revisión de facturas emitidas y recibidas',
      'Preparación Modelo 303',
      'Presentación dentro de plazo',
      'Resumen anual Modelo 390',
      'Alerta de plazos y recordatorios'
    ],
    faqs: [
      { q: '¿Cuáles son los plazos trimestrales?', a: 'Del 1 al 20 de los meses de abril, julio, octubre y enero (este último hasta el 30).' },
      { q: '¿Puedo llevar yo las facturas y que solo presentéis?', a: 'Sí, puedes enviarnos el registro de facturas y nos encargamos de la liquidación y presentación.' }
    ]
  },
  {
    slug: 'impuesto-sociedades',
    categoria: 'declaraciones-impuestos',
    name: 'Impuesto de Sociedades',
    shortDescription: 'Declaración anual del IS para sociedades limitadas y anónimas.',
    description:
      'Realizamos el cierre contable del ejercicio y preparamos la declaración del Impuesto sobre Sociedades (Modelo 200), incluyendo ajustes fiscales, deducciones aplicables y conciliación contable-fiscal.',
    price: 'Consultar',
    duration: '7–15 días hábiles',
    includes: [
      'Cierre contable del ejercicio',
      'Ajustes y conciliaciones fiscales',
      'Preparación del Modelo 200',
      'Liquidación y revisión de pagos fraccionados',
      'Presentación telemática y depósito de cuentas'
    ],
    faqs: [
      { q: '¿Cuándo hay que presentarlo?', a: 'En los 25 días naturales siguientes a los 6 meses posteriores al cierre del ejercicio (normalmente en julio para ejercicios que cierran en diciembre).' },
      { q: '¿Necesito también llevar la contabilidad con vosotros?', a: 'No es imprescindible, pero facilita el proceso. Si llevas la contabilidad con nosotros, el precio del IS está incluido en el plan mensual.' }
    ]
  },
  {
    slug: 'modelos-informativos',
    categoria: 'declaraciones-impuestos',
    name: 'Modelos Informativos',
    shortDescription: 'Presentación de modelos 347, 349, 180, 190 y otros declarativos.',
    description:
      'Gestionamos la preparación y presentación de los principales modelos informativos anuales: operaciones con terceros (Modelo 347), operaciones intracomunitarias (Modelo 349), retenciones de alquileres (180), retenciones de trabajo (190), entre otros.',
    price: 'Desde 50 € + IVA / modelo',
    duration: '2–4 días hábiles',
    includes: [
      'Revisión y cruce de datos con contabilidad',
      'Preparación del modelo correspondiente',
      'Presentación en plazo ante la AEAT',
      'Copia de justificante de presentación'
    ],
    faqs: [
      { q: '¿Qué pasa si presento un modelo informativo fuera de plazo?', a: 'Existe un régimen sancionador por presentación extemporánea. Te avisamos con antelación para evitar recargos.' }
    ]
  },
  {
    slug: 'modelo-720',
    categoria: 'declaraciones-impuestos',
    name: 'Modelo 720 — Bienes en el Extranjero',
    shortDescription: 'Declaración de bienes y derechos situados en el extranjero ante la AEAT.',
    description:
      'El Modelo 720 es una declaración informativa obligatoria para residentes fiscales en España que posean bienes o derechos en el extranjero por valor superior a 50.000 € en alguna de sus tres categorías: cuentas bancarias, valores e inmuebles. Analizamos tu obligación de declarar, preparamos el modelo y lo presentamos en plazo para evitar sanciones.',
    price: '190 € + IVA',
    stripePriceId: 'price_1TXMmVLeYwwgvux4e9hXI90o',
    duration: '3–5 días hábiles',
    includes: [
      'Análisis de obligación de declarar',
      'Revisión de bienes y derechos en el extranjero',
      'Preparación del Modelo 720 / 721',
      'Presentación telemática ante la AEAT',
      'Justificante de presentación'
    ],
    requiredDocs: [
      'DNI/NIE en vigor',
      'Extractos bancarios de cuentas en el extranjero (saldo a 31/12)',
      'Certificados de valores, fondos o seguros (valor a 31/12)',
      'Escrituras o documentos de titularidad de inmuebles en el extranjero',
      'Número de identificación fiscal extranjero (si aplica)'
    ],
    faqs: [
      { q: '¿Quién está obligado a presentar el Modelo 720?', a: 'Personas físicas y jurídicas residentes en España que tengan bienes o derechos en el extranjero cuyo valor supere los 50.000 € en alguna de las tres categorías (cuentas, valores o inmuebles).' },
      { q: '¿Cuándo hay que presentarlo?', a: 'Entre el 1 de enero y el 31 de marzo del año siguiente al ejercicio que se declara.' },
      { q: '¿Qué pasa si no lo presento?', a: 'Las sanciones por no presentar o presentar incorrectamente pueden ser muy elevadas. Es imprescindible declarar si se supera el umbral.' },
      { q: '¿Tengo que presentarlo cada año?', a: 'Solo en el año en que se supera el umbral por primera vez, y posteriormente cuando alguna categoría experimente un incremento superior a 20.000 € respecto al último ejercicio declarado.' }
    ]
  },

  // ── Extranjería y Nacionalidad ─────────────────────────────────────────────
  {
    slug: 'arraigo-social',
    categoria: 'extranjeria-nacionalidad',
    name: 'Arraigo Social',
    shortDescription: 'Residencia temporal por circunstancias excepcionales para personas extranjeras con al menos 2 años de permanencia continuada en España y vínculos familiares o integración social acreditable.',
    metaTitle: 'Arraigo Social en España 2026 · 2 años de permanencia | EXPERT Asesoría',
    metaDescription: 'Tramitamos el arraigo social conforme al Reglamento vigente: 2 años de permanencia continuada, vínculos familiares y medios económicos o informe de integración social. 490 € + IVA.',
    description:
      'El arraigo social es una autorización de residencia temporal por circunstancias excepcionales regulada por la Ley Orgánica 4/2000 y el Real Decreto 1155/2024. Con carácter general exige haber permanecido en España de forma continuada durante al menos 2 años y cumplir los requisitos generales del arraigo. Además, debe acreditarse bien la existencia de determinados vínculos familiares con personas extranjeras residentes y medios económicos suficientes, bien un informe favorable de integración social cuando no concurran esos vínculos. EXPERT revisa la vía aplicable, prepara el expediente y lo presenta ante Extranjería.',
    price: '490 € + IVA',
    stripePriceId: 'price_1TXMmQLeYwwgvux4ivP7Uhn8',
    checkoutLabel: 'Contratar — 490 € + IVA',
    checkoutLegal: 'La tasa administrativa Modelo 790 código 052, epígrafe 2.3.1, no está incluida en los honorarios y se abona aparte.',
    officialFee: '38,28 € — Modelo 790 código 052, epígrafe 2.3.1 (a cargo del solicitante)',
    duration: 'Resolución administrativa: hasta 3 meses desde la entrada de la solicitud en el órgano competente',
    keyPoints: [
      { title: '2 años de permanencia continuada', text: 'Debes acreditar al menos 2 años de permanencia continuada en España. Las ausencias durante ese periodo no pueden superar 90 días.' },
      { title: 'Vínculos familiares o integración social', text: 'Si existen determinados vínculos familiares con personas extranjeras residentes, deben acreditarse también medios económicos suficientes. Si no existen esos vínculos, se valora el esfuerzo de integración mediante informe favorable de integración social.' },
      { title: 'Autorización de trabajo asociada', text: 'La concesión lleva aparejada autorización para trabajar por cuenta ajena o propia en España durante su vigencia, sin limitación de ámbito geográfico u ocupación.' },
    ],
    audience: [
      'Personas extranjeras que se encuentran en España y pueden acreditar al menos 2 años de permanencia continuada',
      'Personas con cónyuge o pareja registrada, ascendientes o descendientes de primer grado con residencia legal en España',
      'Personas sin esos vínculos familiares que pueden acreditar integración social mediante el informe correspondiente',
    ],
    requirements: [
      'Encontrarse en España y no ser solicitante de protección internacional durante la solicitud y su tramitación',
      'Acreditar al menos 2 años de permanencia continuada en España',
      'No superar 90 días de ausencia durante ese periodo de 2 años',
      'Carecer de antecedentes penales en España y en los países donde se haya residido durante los cinco años anteriores a la entrada en España',
      'No encontrarse, en su caso, dentro de un compromiso de no retorno',
      'No ser titular de una autorización de estancia o residencia ni estar interesado en un procedimiento de concesión, prórroga, renovación o modificación de estancia o residencia',
      'Acreditar vínculos familiares y medios económicos suficientes o, en su defecto, informe favorable de integración social',
      'Abonar la tasa administrativa correspondiente',
    ],
    includes: [
      'Evaluación previa de la vía de arraigo aplicable',
      'Revisión y organización de la documentación',
      'Comprobación de permanencia continuada y ausencias',
      'Revisión de vínculos familiares, medios económicos o informe de integración social según el caso',
      'Cumplimentación del formulario EX-10',
      'Preparación y presentación telemática ante la Oficina de Extranjería',
      'Seguimiento ordinario del expediente',
      'Orientación para la solicitud del TIE tras resolución favorable',
    ],
    documents: [
      {
        title: 'Identidad y permanencia',
        items: [
          'Copia completa del pasaporte en vigor, cédula de inscripción o título de viaje válido',
          'Documentación que acredite al menos 2 años de permanencia continuada en España',
          'Certificado de antecedentes penales del país o países en los que se haya residido durante los cinco últimos años anteriores a la entrada en España, cuando proceda',
        ],
      },
      {
        title: 'Vía familiar o integración',
        items: [
          'Documentación acreditativa del vínculo familiar, cuando se invoque esta vía',
          'Documentación acreditativa de medios económicos suficientes, cuando corresponda',
          'Informe favorable de integración social emitido por el órgano competente, cuando no se acrediten los vínculos familiares previstos',
        ],
      },
      {
        title: 'Solicitud',
        items: [
          'Formulario oficial EX-10',
          'Justificante del abono de la tasa Modelo 790 código 052, epígrafe 2.3.1',
        ],
      },
    ],
    process: [
      { title: 'Evaluación inicial', text: 'Comprobamos permanencia, situación administrativa, antecedentes, posibles vínculos familiares y la vía concreta por la que debe tramitarse el arraigo social.' },
      { title: 'Checklist documental', text: 'Definimos la documentación exacta según se tramite por vínculos familiares y medios económicos o mediante informe de integración social.' },
      { title: 'Preparación del expediente', text: 'Cumplimentamos el EX-10, ordenamos la documentación y revisamos que el expediente sea coherente antes de presentarlo.' },
      { title: 'Presentación y tasa', text: 'Presentamos el expediente telemáticamente y te indicamos el abono de la tasa 790-052 correspondiente.' },
      { title: 'Seguimiento y TIE', text: 'Hacemos seguimiento ordinario del expediente y, si la resolución es favorable, te orientamos sobre la solicitud de la TIE.' },
    ],
    notIncluded: [
      'Tasa administrativa Modelo 790 código 052, epígrafe 2.3.1',
      'Obtención del informe oficial de integración social por parte de la Administración competente',
      'Traducciones juradas',
      'Apostillas o legalizaciones',
      'Obtención de certificados extranjeros',
      'Recursos administrativos o judiciales en caso de denegación',
      'Actuaciones extraordinarias derivadas de requerimientos complejos',
    ],
    reviewBeforeHiring: [
      'Si no puedes acreditar al menos 2 años de permanencia continuada en España, este servicio puede no ser la vía adecuada',
      'Si eres solicitante de protección internacional o tienes otro procedimiento de estancia/residencia en curso, debe revisarse antes de contratar',
      'Si has tenido ausencias superiores a 90 días durante los 2 años previos, conviene revisar la viabilidad',
      'Si existen antecedentes penales o un compromiso de no retorno, es necesaria una revisión previa',
    ],
    finalCta: {
      title: '¿Llevas al menos 2 años en España y quieres regularizar tu situación?',
      text: 'Revisamos si el arraigo social encaja con tu caso, definimos la vía documental correcta y preparamos el expediente completo para su presentación.',
    },
    faqs: [
      { q: '¿Cuánto tiempo tengo que llevar en España?', a: 'Con carácter general debes acreditar al menos 2 años de permanencia continuada en España inmediatamente anteriores a la solicitud. Durante ese periodo, las ausencias no pueden superar 90 días.' },
      { q: '¿Necesito contrato de trabajo para el arraigo social?', a: 'No como requisito específico del arraigo social vigente. El contrato de trabajo es propio del arraigo sociolaboral. En arraigo social se valoran los vínculos familiares y medios económicos o, en su defecto, la integración social acreditada mediante informe favorable.' },
      { q: '¿Qué formulario se presenta?', a: 'El formulario oficial es el EX-10 para autorizaciones de residencia temporal por circunstancias excepcionales.' },
      { q: '¿Cuál es la tasa?', a: 'La tasa vigente es el Modelo 790 código 052, epígrafe 2.3.1. Actualmente asciende a 38,28 € y se abona por la persona solicitante.' },
      { q: '¿Cuánto tarda Extranjería en resolver?', a: 'El plazo administrativo de resolución es de 3 meses desde el día siguiente a la entrada de la solicitud en el registro del órgano competente.' },
      { q: '¿Podré trabajar si me conceden el arraigo social?', a: 'Sí. La concesión lleva aparejada autorización para trabajar por cuenta propia o ajena en España durante la vigencia de la autorización, sin limitación de ámbito geográfico u ocupación.' },
      { q: '¿EXPERT emite el informe de integración social?', a: 'No. El informe lo emite el órgano competente de la Comunidad Autónoma o, cuando proceda, el Ayuntamiento. EXPERT puede indicarte cuándo es necesario y revisar que se incorpore correctamente al expediente.' },
    ],
  },
  {
    slug: 'arraigo-familiar',
    categoria: 'extranjeria-nacionalidad',
    name: 'Arraigo Familiar',
    shortDescription: 'Residencia por vínculo familiar con ciudadano español o residente legal en España.',
    metaTitle: 'Arraigo Familiar en España — Residencia Legal · EXPERT Asesoría',
    metaDescription: 'Tramitamos tu arraigo familiar en España desde 390 € + IVA. Padre/madre de menor español, cónyuge de español o residente legal. Evaluación previa incluida.',
    description:
      'El arraigo familiar (art. 125 del RD 557/2011, modificado por RD 629/2022) permite obtener una autorización de residencia de 2 años cuando existen vínculos familiares con ciudadanos españoles o con residentes legales en España. Los supuestos principales son: ser padre o madre de un menor con nacionalidad española, ser hijo/a de padre o madre originariamente español, o ser cónyuge o pareja de hecho registrada de un residente legal con convivencia acreditada.',
    price: '390 € + IVA',
    stripePriceId: 'price_1TXMmTLeYwwgvux4OvsyKGL2',
    checkoutLabel: 'Contratar — 390 € + IVA',
    duration: '3–5 meses',
    keyPoints: [
      { title: 'No requiere años de permanencia (algunos supuestos)', text: 'A diferencia del arraigo social, el arraigo familiar no exige en todos los casos un período mínimo de permanencia en España — lo fundamental es acreditar el vínculo familiar.' },
      { title: 'Residencia de 2 años renovable', text: 'La autorización concedida es de residencia temporal de 2 años, incluye autorización de trabajo y es renovable.' },
      { title: 'Tres supuestos principales', text: 'Padre/madre de menor español, hijo/a de español de origen, o cónyuge/pareja de hecho de residente legal con convivencia acreditada.' },
    ],
    audience: [
      'Padres o madres de hijos/as con nacionalidad española',
      'Hijos/as de ciudadanos españoles de origen (nacidos españoles, no por adquisición)',
      'Cónyuges o parejas de hecho de residentes legales en España',
      'Extracomunitarios con vínculo familiar acreditable con español o residente legal',
    ],
    requirements: [
      'Acreditar el vínculo familiar según el supuesto: filiación, matrimonio o pareja de hecho registrada',
      'Convivencia acreditada (para el supuesto de cónyuge/pareja de residente legal)',
      'Sin antecedentes penales en España ni en el país de origen',
      'Pasaporte en vigor',
      'Documentación del familiar de referencia (DNI/TIE en vigor)',
    ],
    includes: [
      'Evaluación del supuesto aplicable y viabilidad del expediente',
      'Revisión y organización de la documentación',
      'Cumplimentación del formulario EX-01',
      'Presentación ante la Oficina de Extranjería',
      'Seguimiento del expediente y atención a requerimientos',
    ],
    requiredDocs: [
      'Pasaporte en vigor (todas las páginas)',
      'DNI o TIE del familiar de referencia (español o residente legal)',
      'Documento acreditativo del vínculo: libro de familia, certificado de nacimiento, partida de matrimonio o acta de pareja de hecho',
      'Certificado de empadronamiento actualizado (máx. 3 meses)',
      'Certificado de antecedentes penales de España',
      'Certificado de antecedentes penales del país de origen (apostillado y traducido si aplica)',
      'Fotografía reciente en color (tamaño carné)',
    ],
    process: [
      { title: 'Evaluación del vínculo familiar', text: 'Determinamos qué supuesto de arraigo familiar te corresponde y qué documentos necesitas.' },
      { title: 'Preparación documental', text: 'Revisamos y organizamos toda la documentación. Te indicamos cómo obtener los certificados de antecedentes apostillados.' },
      { title: 'Presentación y seguimiento', text: 'Presentamos el expediente y hacemos seguimiento activo hasta la resolución.' },
      { title: 'Resolución y TIE', text: 'Te informamos de la resolución y te orientamos sobre cómo recoger el TIE en comisaría.' },
    ],
    notIncluded: [
      'Tasa administrativa Modelo 790 cód. 052 (abono por el cliente)',
      'Traducciones juradas de documentos extranjeros',
      'Apostillas o legalizaciones de documentos del país de origen',
      'Recursos en caso de denegación',
    ],
    finalCta: {
      title: '¿Tienes un familiar español o residente legal en España?',
      text: 'El arraigo familiar puede ser tu vía más rápida para obtener la residencia legal. Evaluamos tu caso sin compromiso.',
    },
    faqs: [
      { q: '¿Cómo acredito el vínculo familiar?', a: 'Mediante libro de familia, certificado de nacimiento, sentencia de filiación, certificado de matrimonio o registro de pareja de hecho, según el supuesto.' },
      { q: '¿Necesito llevar años en España para el arraigo familiar?', a: 'Depende del supuesto. El arraigo familiar como padre/madre de menor español no exige tiempo mínimo de permanencia. El supuesto de cónyuge/pareja de residente legal sí requiere acreditar convivencia.' },
      { q: '¿El arraigo familiar incluye autorización de trabajo?', a: 'Sí. Las autorizaciones de residencia por arraigo familiar concedidas desde 2022 incluyen en general autorización para trabajar.' },
    ],
  },
  {
    slug: 'arraigo-laboral',
    categoria: 'extranjeria-nacionalidad',
    name: 'Arraigo Laboral',
    shortDescription: 'Residencia legal por arraigo laboral — 2 años en España con relación laboral irregular acreditable.',
    metaTitle: 'Arraigo Laboral en España — Residencia Legal · EXPERT Asesoría',
    metaDescription: 'Tramitamos tu arraigo laboral en España desde 490 € + IVA. 2 años de permanencia + relación laboral irregular acreditable. Art. 123 RD 557/2011.',
    description:
      'El arraigo laboral (art. 123 del RD 557/2011) permite regularizar la situación de personas extracomunitarias que llevan al menos 2 años en España y han trabajado de forma irregular durante un mínimo de 6 meses. Requiere acreditar la relación laboral mediante sentencia judicial, acta de la Inspección de Trabajo o resolución del SEPE. Es la única vía de arraigo que puede obtenerse con solo 2 años de permanencia, aunque su instrucción es compleja y requiere una documentación específica.',
    price: '490 € + IVA',
    stripePriceId: 'price_1TZYl8LeYwwgvux4EWcyxqwn',
    checkoutLabel: 'Contratar — 490 € + IVA',
    duration: '3–6 meses',
    keyPoints: [
      { title: 'Vía distinta del arraigo social', text: 'No debe confundirse con el arraigo social: cada modalidad exige requisitos y documentación propios.' },
      { title: 'Relación laboral acreditable', text: 'Debes acreditar haber trabajado al menos 6 meses mediante resolución firme de la Inspección de Trabajo, sentencia judicial o resolución del SEPE.' },
      { title: 'Sin oferta de empleo', text: 'No se exige una oferta de empleo para el momento de la solicitud, a diferencia del arraigo social.' },
    ],
    audience: [
      'Extracomunitarios con 2 años de permanencia en España que han trabajado de forma irregular',
      'Personas que cuentan con acta de la Inspección de Trabajo o sentencia judicial que acredita la relación laboral',
      'Trabajadores agrícolas, del hogar u otros sectores con mayor incidencia de trabajo irregular',
    ],
    requirements: [
      '2 años de permanencia continuada en España',
      'Relación laboral irregular de al menos 6 meses acreditada mediante: acta de Inspección de Trabajo, resolución del SEPE o sentencia judicial',
      'Sin antecedentes penales en España ni en el país de origen (últimos 5 años)',
      'Pasaporte en vigor',
    ],
    includes: [
      'Evaluación previa del expediente y la documentación disponible',
      'Revisión de la resolución o acta acreditativa de la relación laboral',
      'Preparación del formulario EX-01 y documentación completa',
      'Presentación ante la Oficina de Extranjería',
      'Seguimiento del expediente y atención a requerimientos',
    ],
    requiredDocs: [
      'Pasaporte en vigor (todas las páginas)',
      'Acta de la Inspección de Trabajo, resolución del SEPE o sentencia judicial acreditativa de la relación laboral (mínimo 6 meses)',
      'Certificado de empadronamiento histórico (2 años)',
      'Certificado de antecedentes penales de España',
      'Certificado de antecedentes penales del país de origen (apostillado y traducido)',
      'Fotografía reciente en color (tamaño carné)',
    ],
    notIncluded: [
      'Procedimiento judicial o inspección para obtener el acta (servicio diferenciado)',
      'Tasa administrativa Modelo 790 cód. 052',
      'Traducciones juradas y apostillas',
      'Recursos en caso de denegación',
    ],
    reviewBeforeHiring: [
      'Sin resolución firme que acredite la relación laboral, el arraigo laboral no es viable — consulta antes de contratar',
      'Si tienes antecedentes penales, consulta previamente',
    ],
    finalCta: {
      title: '¿Llevas 2 años en España y tienes acta de la Inspección de Trabajo?',
      text: 'El arraigo laboral puede ser tu vía. Revisamos tu documentación y gestionamos el expediente completo.',
    },
    faqs: [
      { q: '¿Qué documentos acreditan la relación laboral?', a: 'Los únicos válidos son: resolución firme de la Inspección de Trabajo (ITSS), sentencia judicial o resolución del SEPE. No valen nóminas, contratos o declaraciones del empleador por sí solas.' },
      { q: '¿Cómo puedo obtener el acta de la Inspección de Trabajo?', a: 'Normalmente mediante una denuncia ante la ITSS. Podemos orientarte sobre este proceso o derivarte a profesionales especializados en derecho laboral.' },
      { q: '¿Se exige oferta de empleo para el arraigo laboral?', a: 'No. El arraigo laboral no exige disponer de un contrato o una oferta de empleo en el momento de la solicitud.' },
      { q: '¿Cuánto tiempo tarda?', a: 'Entre 3 y 6 meses desde la presentación, dependiendo de la Oficina de Extranjería. El plazo legal de resolución es de 3 meses.' },
    ],
  },
  {
    slug: 'renovacion-residencia',
    categoria: 'extranjeria-nacionalidad',
    name: 'Renovación de Residencia',
    shortDescription: 'Renovación de autorizaciones de residencia temporal — evita caer en situación irregular.',
    metaTitle: 'Renovación de Residencia en España · EXPERT Asesoría',
    metaDescription: 'Tramitamos la renovación de tu permiso de residencia temporal en España desde 190 € + IVA. Plazos, documentación y presentación incluidos.',
    description:
      'La renovación de la autorización de residencia temporal debe presentarse en los plazos correctos para evitar la irregularidad sobrevenida. Gestionamos la renovación de residencia temporal por circunstancias excepcionales (arraigos), residencia por reagrupación familiar y residencia por trabajo. Revisamos tus requisitos, preparamos la documentación y presentamos la solicitud ante la Oficina de Extranjería o la Unidad de Grandes Empresas según corresponda.',
    price: '190 € + IVA',
    stripePriceId: 'price_1TZYlELeYwwgvux4Et7Loldl',
    checkoutLabel: 'Contratar renovación — 190 € + IVA',
    duration: '1–3 meses',
    keyPoints: [
      { title: 'Presenta en el plazo correcto', text: 'Puedes presentar la renovación desde 60 días antes de la caducidad. Si caducó hace menos de 90 días también cabe presentarla, aunque puede llevar recargo.' },
      { title: 'Mantienes la autorización mientras se resuelve', text: 'Si presentas en plazo, tu autorización queda prorrogada automáticamente hasta que se resuelva el expediente.' },
      { title: 'Gestión online completa', text: 'No necesitas desplazarte a nuestra oficina. Enviamos la documentación escaneada, preparamos y presentamos todo telemáticamente.' },
    ],
    audience: [
      'Residentes con autorización temporal próxima a caducar (en los próximos 60 días)',
      'Residentes cuya autorización ha caducado hace menos de 90 días',
      'Residentes que quieren asegurar que la renovación se presenta correctamente y en plazo',
    ],
    requirements: [
      'Autorización de residencia temporal vigente o caducada hace menos de 90 días',
      'Mantenimiento de los requisitos que motivaron la concesión inicial',
      'Pasaporte en vigor',
      'Sin antecedentes penales sobrevenidos',
    ],
    includes: [
      'Revisión de requisitos y plazo para la renovación',
      'Preparación y revisión de toda la documentación',
      'Cumplimentación del formulario de renovación',
      'Presentación telemática ante la Oficina de Extranjería',
      'Seguimiento y atención a requerimientos',
      'Orientación para la nueva TIE tras la resolución',
    ],
    requiredDocs: [
      'TIE vigente o caducada (por ambas caras)',
      'Pasaporte en vigor',
      'Certificado de empadronamiento actualizado',
      'Documentación acreditativa del mantenimiento de los requisitos (contrato, nóminas, medios económicos…)',
      'Fotografía reciente en color (tamaño carné)',
      'Justificante de pago de tasa Modelo 790 cód. 052',
    ],
    notIncluded: [
      'Tasa administrativa Modelo 790 cód. 052 (abono por el cliente)',
      'Traducciones juradas o apostillas si hubiera nuevos documentos extranjeros',
      'Recursos en caso de denegación',
    ],
    finalCta: {
      title: '¿Tu residencia caduca pronto?',
      text: 'No esperes al último momento. Presentar la renovación en plazo protege tu situación legal mientras se resuelve el expediente.',
    },
    faqs: [
      { q: '¿Cuándo debo presentar la renovación?', a: 'Entre los 60 días antes de la caducidad y la propia fecha de vencimiento. Si ya caducó, tienes hasta 90 días después para presentarla con posible recargo.' },
      { q: '¿Puedo trabajar mientras se renueva?', a: 'Si presentas la renovación en plazo, tu autorización queda prorrogada automáticamente, incluyendo la autorización de trabajo si la tenías.' },
      { q: '¿Qué pasa si no renuevo a tiempo?', a: 'Si han pasado más de 90 días desde la caducidad sin renovar, puedes incurrir en situación irregular. En ese caso, es necesario estudiar otras vías de regularización.' },
      { q: '¿Cuánto tarda la resolución?', a: 'El plazo legal es de 3 meses. En la práctica, suele resolverse entre 1 y 3 meses según la Delegación.' },
    ],
  },
  {
    slug: 'nacionalidad-espanola',
    categoria: 'extranjeria-nacionalidad',
    name: 'Nacionalidad Española',
    shortDescription: 'Expediente completo de nacionalidad española por residencia — DELE, CCSE, documentación y presentación.',
    metaTitle: 'Nacionalidad Española por Residencia — Expediente Completo · EXPERT Asesoría',
    metaDescription: 'Tramitamos tu expediente de nacionalidad española por residencia desde 490 € + IVA. CCSE, DELE A2, documentación apostillada y presentación incluidos.',
    description:
      'La nacionalidad española por residencia (arts. 21-22 del Código Civil) es la vía más habitual para que los extranjeros residentes en España adquieran la nacionalidad española. Gestionamos el expediente completo: evaluación de la vía aplicable (10, 5, 2 o 1 año), revisión de la documentación, orientación para los exámenes CCSE y DELE A2, y presentación del expediente ante el Registro Civil o el Notario. Seguimiento continuado hasta la resolución.',
    price: '490 € + IVA',
    stripePriceId: 'price_1TZYlGLeYwwgvux4Rj6u0Jqk',
    checkoutLabel: 'Contratar — 490 € + IVA',
    duration: '1,5–3 años (según expediente y vía)',
    keyPoints: [
      { title: 'Plazos de residencia según origen', text: '10 años (general) / 5 años (refugiados) / 2 años (iberoamericanos, Filipinas, Guinea Ecuatorial, Portugal, Andorra, sefardíes) / 1 año (nacidos en España, casados con español/a, etc.).' },
      { title: 'CCSE y DELE A2 obligatorios', text: 'Debes superar el examen CCSE (constitución y cultura española) e, si no eres de un país hispanohablante, también el DELE A2. Orientamos sobre la preparación.' },
      { title: 'Residencia continuada y legal', text: 'La residencia debe ser legal, continuada e inmediatamente anterior a la solicitud. Interrupciones superiores a 90 días pueden afectar al cómputo.' },
    ],
    audience: [
      'Residentes legales que han cumplido el tiempo mínimo según su país de origen',
      'Iberoamericanos con 2 años de residencia legal en España',
      'Personas nacidas en España o casadas con ciudadano/a español/a (1 año)',
      'Refugiados y asilados en España (5 años)',
    ],
    requirements: [
      'Residencia legal y continuada en España por el período exigido según el art. 22 CC',
      'Superación del examen CCSE (Instituto Cervantes)',
      'Superación del DELE A2 o superior (si no eres de país hispanohablante)',
      'Sin antecedentes penales en España ni en el país de origen',
      'Certificado de nacimiento apostillado y traducido al español',
      'TIE vigente durante todo el período de residencia computable',
    ],
    includes: [
      'Evaluación de la vía aplicable y del tiempo de residencia computable',
      'Orientación para la obtención de CCSE y DELE A2',
      'Revisión y organización de toda la documentación',
      'Comprobación de apostillas y traducciones',
      'Presentación del expediente (Registro Civil o Notaría según corresponda)',
      'Seguimiento periódico del expediente',
      'Atención a requerimientos y subsanaciones',
    ],
    requiredDocs: [
      'Pasaporte en vigor (todas las páginas)',
      'TIE vigente',
      'Certificado de empadronamiento histórico (desde el inicio de la residencia computable)',
      'Certificado de antecedentes penales de España (Registro Central de Penados)',
      'Certificado de antecedentes penales del país de origen (apostillado y traducido al español)',
      'Certificado de nacimiento (apostillado y con traducción jurada al español)',
      'Diploma DELE A2 o superior (si aplica)',
      'Certificado CCSE (Instituto Cervantes)',
    ],
    notIncluded: [
      'Tasa administrativa de tramitación',
      'Preparación de exámenes CCSE/DELE (pueden gestionarse aparte)',
      'Traducciones juradas de documentos (se pueden añadir como servicio adicional)',
      'Apostillas de documentos del país de origen',
      'Recursos en caso de denegación',
    ],
    reviewBeforeHiring: [
      'Si aún no has superado el CCSE o el DELE, podemos preparar el expediente mientras los obtienes',
      'Si tienes períodos de TIE caducado o ausencias superiores a 90 días, consulta antes — puede afectar al cómputo',
      'Si tienes antecedentes penales, es indispensable consultarlo antes de iniciar el expediente',
    ],
    finalCta: {
      title: '¿Ya cumples el tiempo de residencia exigido?',
      text: 'Iniciamos tu expediente de nacionalidad española y te acompañamos en todo el proceso, desde los exámenes hasta la resolución.',
    },
    faqs: [
      { q: '¿Cuántos años de residencia legal necesito?', a: '10 años (regla general). 5 años si eres refugiado o asilado. 2 años si eres nacional de un país iberoamericano, Filipinas, Guinea Ecuatorial, Portugal, Andorra o sefardí. 1 año si naciste en España, estás casado/a con español/a, eres viudo/a de español/a o tienes un grado de parentesco de segundo grado con un español de origen.' },
      { q: '¿Tengo que hacer exámenes?', a: 'Sí. El CCSE (conocimientos constitucionales y socioculturales) es obligatorio para todos. El DELE A2 de español es obligatorio salvo que seas nacional de un país hispanohablante.' },
      { q: '¿La residencia debe ser ininterrumpida?', a: 'Sí, debe ser continua e inmediatamente anterior a la solicitud. Las ausencias superiores a 90 días seguidos pueden interrumpir el cómputo. Se valoran caso a caso.' },
      { q: '¿Cuánto tiempo tarda el expediente?', a: 'El plazo legal de resolución es de 1 año, pero en la práctica puede tardar entre 1,5 y 3 años. Hacemos seguimiento periódico para detectar posibles requerimientos cuanto antes.' },
      { q: '¿Puedo iniciar el expediente antes de tener el CCSE o el DELE?', a: 'Lo recomendable es presentar con ambos certificados. No obstante, podemos preparar toda la documentación mientras realizas los exámenes para no perder tiempo.' },
    ],
  },
  {
    slug: 'nacionalidad-espanola-menor-nacido-en-espana',
    categoria: 'extranjeria-nacionalidad',
    name: 'Nacionalidad española para menor nacido en España',
    shortDescription:
      'Preparación y presentación de solicitud de nacionalidad española por residencia para menores nacidos en España.',
    description:
      'Si tu hijo o hija ha nacido en España y ya cuenta con residencia legal, puede solicitar la nacionalidad española por residencia con el plazo reducido de 1 año de residencia legal, continuada e inmediatamente anterior a la solicitud. Revisamos la viabilidad del caso, preparamos la documentación y presentamos el expediente ante el Ministerio de Justicia cuando proceda.',
    metaTitle: 'Nacionalidad española para menor nacido en España | Ksenia Ilicheva',
    metaDescription:
      'Servicio de preparación y presentación de solicitud de nacionalidad española por residencia para menores nacidos en España. Honorarios 302,50 € IVA incluido + tasa 790-026 de 104,05 € como suplido; total 406,55 €.',
    price: '250 € + IVA',
    duration: 'Preparación según documentación; resolución legal hasta 1 año',
    officialFee: 'Tasa administrativa 790-026: 104,05 € incluida como suplido obligatorio',
    servicePriceDetail: 'Honorarios: 250 € + IVA 21 % = 302,50 €; tasa 790-026: 104,05 € como suplido; total a pagar: 406,55 €',
    stripePriceId: 'price_1TZXomLeYwwgvux4bTuqVZcU',
    checkoutLabel: 'Contratar — 406,55 € total',
    checkoutLegal:
      'Al contratar se cobran 302,50 € de honorarios con IVA incluido y 104,05 € de tasa 790-026 como suplido obligatorio. La tasa se abona en nombre y por cuenta del cliente y queda separada de la base de honorarios.',
    keyPoints: [
      {
        title: 'Plazo reducido de 1 año',
        text:
          'El artículo 22 del Código Civil permite solicitar la nacionalidad por residencia con 1 año de residencia para quienes han nacido en territorio español. La residencia debe ser legal, continuada e inmediatamente anterior a la solicitud.'
      },
      {
        title: 'Firma de representantes legales',
        text:
          'Para menores de 14 años actúan sus representantes legales; entre 14 y 17 años el menor formula la solicitud asistido por ellos. Si existe desacuerdo entre quienes ejercen la patria potestad o actúa un solo representante, revisamos previamente la documentación y la resolución que corresponda.'
      },
      {
        title: 'Fecha de residencia legal',
        text:
          'Nacer en España no equivale a obtener la nacionalidad automáticamente. Antes de presentar revisamos la concesión de residencia, TIE, tarjetas anteriores y continuidad para evitar solicitudes prematuras.'
      }
    ],
    audience: [
      'Menor nacido en España e inscrito en el Registro Civil español.',
      'Menor con NIE/TIE o autorización de residencia legal en España.',
      'Familias que ya han cumplido, o están próximas a cumplir, 1 año de residencia legal del menor.',
      'La representación y asistencia del menor están claras según su edad, patria potestad y situación familiar.',
      'Familias que quieren evitar errores documentales, requerimientos y retrasos innecesarios.'
    ],
    requirements: [
      'Nacimiento en España inscrito en el Registro Civil español.',
      'Residencia legal del menor en España.',
      'Al menos 1 año de residencia legal, continuada e inmediatamente anterior a la solicitud.',
      'Solicitud formulada o asistida por quienes correspondan según la edad del menor y su representación legal.',
      'Pago de la tasa administrativa del Ministerio de Justicia mediante modelo 790 código 026.',
      'Documentación exigida por el Ministerio de Justicia digitalizada y revisada.'
    ],
    includes: [
      'Revisión previa de viabilidad del caso',
      'Comprobación del plazo de 1 año de residencia legal del menor',
      'Revisión de NIE/TIE, pasaportes, certificado de nacimiento, empadronamiento y documentación familiar',
      'Preparación del expediente documental',
      'Cumplimentación de formularios oficiales',
      'Gestión del pago de la tasa administrativa 790-026 como suplido, con justificante a nombre del menor solicitante',
      'Presentación telemática ante el Ministerio de Justicia, cuando proceda',
      'Entrega del justificante de presentación y número de expediente',
      'Seguimiento básico inicial del expediente',
      'Orientación sobre requerimientos ordinarios'
    ],
    documents: [
      {
        title: 'Documentación del menor',
        items: [
          'Certificación literal de nacimiento española expedida por el Registro Civil',
          'Pasaporte completo y en vigor, con copia de todas las páginas',
          'NIE/TIE o documento acreditativo de residencia legal en España',
          'Tarjeta de residencia anterior, si existe',
          'Resolución inicial de concesión de residencia o protección temporal, si existe',
          'Certificado de empadronamiento familiar o colectivo actualizado',
          'Certificado del centro escolar o educativo cuando corresponda por la edad y escolarización del menor'
        ]
      },
      {
        title: 'Documentación de los progenitores',
        items: [
          'Pasaporte completo y en vigor de ambos progenitores',
          'NIE/TIE de ambos progenitores por ambas caras',
          'Certificado de empadronamiento familiar, si no se aporta por separado',
          'Datos de contacto: teléfono, correo electrónico y domicilio actual',
          'Intervención, firma o asistencia de los representantes legales según la edad del menor, la patria potestad y la situación familiar',
          'Documentación adicional si solo uno de los progenitores puede firmar'
        ]
      }
    ],
    process: [
      {
        title: 'Pago del servicio y mandato de suplido',
        text: 'El cliente abona online los honorarios y la tasa 790-026 como suplido separado, aceptando expresamente que EXPERT la pague en su nombre y por su cuenta.'
      },
      {
        title: 'Apertura y documentación',
        text: 'Después del pago, EXPERT abre el expediente y el cliente carga la documentación en su área privada segura; WhatsApp queda para consultas y coordinación.'
      },
      {
        title: 'Revisión de viabilidad',
        text: 'Comprobamos el requisito de 1 año de residencia legal y revisamos si el expediente está completo.'
      },
      {
        title: 'Preparación del expediente',
        text: 'Preparamos la solicitud, formularios y documentación digitalizada.'
      },
      {
        title: 'Abono de la tasa como suplido',
        text: 'Cuando el expediente está validado y listo para presentar, EXPERT abona la tasa 790-026 ya cobrada como suplido en nombre y por cuenta del solicitante.'
      },
      {
        title: 'Presentación de la solicitud',
        text: 'Presentamos la solicitud ante el Ministerio de Justicia o dejamos el expediente preparado para su presentación, según el caso contratado.'
      },
      {
        title: 'Justificante y seguimiento inicial',
        text: 'Entregamos el justificante de presentación, el número de expediente y una primera orientación de seguimiento.'
      }
    ],
    notIncluded: [
      'Traducciones juradas, si fueran necesarias',
      'Apostillas o legalizaciones, si fueran necesarias',
      'Certificados oficiales que deban solicitarse aparte',
      'Actuaciones extraordinarias por requerimientos complejos',
      'Recursos administrativos o judiciales en caso de denegación',
      'Trámites posteriores no incluidos expresamente'
    ],
    reviewBeforeHiring: [
      'El menor aún no tiene clara la fecha de inicio de residencia legal.',
      'Solo uno de los progenitores puede firmar.',
      'Existen diferencias en nombres, apellidos o transliteraciones entre documentos.',
      'El pasaporte está caducado.',
      'No existe certificado literal de nacimiento español.',
      'La residencia se ha concedido recientemente.',
      'Hay cambios de domicilio no reflejados en el empadronamiento.',
      'Hay documentación extranjera sin traducir o sin legalizar.'
    ],
    finalCta: {
      title: '¿Tu hijo nació en España y ya tiene residencia legal?',
      text:
        'Podemos ayudarte a preparar y presentar su solicitud de nacionalidad española por residencia, revisando previamente si cumple el plazo legal de 1 año y si la documentación está completa.'
    },
    faqs: [
      {
        q: '¿Mi hijo obtiene la nacionalidad automáticamente por haber nacido en España?',
        a:
          'No. Nacer en España puede reducir el plazo exigido para solicitar la nacionalidad por residencia a 1 año, pero no concede automáticamente la nacionalidad española en todos los casos.'
      },
      {
        q: '¿Cuándo se puede presentar la solicitud?',
        a:
          'Cuando el menor haya cumplido 1 año de residencia legal, continuada e inmediatamente anterior a la solicitud.'
      },
      {
        q: '¿Sirve la residencia de los padres?',
        a:
          'No basta con la residencia legal de los padres. Hay que verificar la residencia legal del menor.'
      },
      {
        q: '¿La tasa está incluida en el precio?',
        a:
          'Sí. La tasa 790-026 de 104,05 € se cobra junto con el servicio como suplido obligatorio, separada de los honorarios y de su base imponible.'
      },
      {
        q: '¿Pueden pagar ustedes la tasa por mí?',
        a:
          'Sí. EXPERT gestiona el pago de la tasa 790-026 por su importe exacto como suplido, en nombre y por cuenta del cliente, con justificante vinculado al menor solicitante.'
      },
      {
        q: '¿Tienen que firmar los dos progenitores?',
        a:
          'En menores de 14 años actúan los representantes legales; entre 14 y 17 años el menor formula la solicitud asistido por ellos. Si existe desacuerdo o solo actúa un representante, revisamos la documentación y la resolución que corresponda antes de presentar.'
      },
      {
        q: '¿Hace falta autorización previa del Registro Civil?',
        a:
          'Si ambos progenitores están de acuerdo y firman la solicitud, conforme a la nota informativa del Ministerio de Justicia tras la Ley 8/2021, no debería exigirse autorización previa del Encargado del Registro Civil. Si hay discrepancia, debe estudiarse el caso concreto.'
      },
      {
        q: '¿El menor tiene que hacer examen CCSE o DELE?',
        a:
          'En menores de edad no se exige realizar las pruebas de adultos en los términos ordinarios. La integración se valora conforme a la edad y circunstancias del menor.'
      },
      {
        q: '¿Qué pasa si falta algún documento?',
        a:
          'Te indicaremos qué documento falta y cómo obtenerlo. No recomendamos presentar expedientes incompletos salvo estrategia justificada, porque suele terminar en requerimientos.'
      }
    ]
  },
  {
    slug: 'nie-pasaporte',
    categoria: 'extranjeria-nacionalidad',
    name: 'NIE y Gestiones Consulares',
    shortDescription: 'Obtención del Número de Identificación de Extranjero (NIE) y gestiones consulares.',
    description:
      'Tramitamos la obtención del NIE (para ciudadanos de la UE o no UE), así como gestiones relacionadas con el Consulado: citas, documentación para visados, certificados de registro y otras diligencias consulares en España.',
    price: 'Desde 60 € + IVA',
    duration: '1–4 semanas',
    includes: [
      'Gestión de cita previa',
      'Preparación de formularios y documentación',
      'Tramitación del Modelo EX-15',
      'Acompañamiento si es necesario'
    ],
    faqs: [
      { q: '¿Para qué necesito el NIE?', a: 'Para firmar contratos, abrir cuentas bancarias, comprar un inmueble, trabajar o iniciar cualquier actividad económica en España.' }
    ]
  },
  {
    slug: 'reagrupacion-familiar',
    categoria: 'extranjeria-nacionalidad',
    name: 'Reagrupación Familiar',
    shortDescription: 'Trae a tu familia a España — autorización de residencia para familiares de residentes legales.',
    metaTitle: 'Reagrupación Familiar en España · EXPERT Asesoría',
    metaDescription: 'Tramitamos la reagrupación familiar en España desde 390 € + IVA. Cónyuge, hijos y ascendientes. Evaluación de ingresos, vivienda y documentación incluida.',
    description:
      'La reagrupación familiar (arts. 52-60 de la LO 4/2000 y arts. 52-60 del RD 557/2011) permite que los residentes legales en España traigan a vivir con ellos a sus familiares más cercanos: cónyuge o pareja de hecho, hijos menores de 18 años y ascendientes dependientes. Gestionamos el expediente completo: evaluación de los requisitos económicos y de vivienda, preparación de toda la documentación y presentación ante la Oficina de Extranjería o en el Consulado español del país de origen del familiar.',
    price: '390 € + IVA',
    stripePriceId: 'price_1TZYlBLeYwwgvux4c3bW4zwF',
    checkoutLabel: 'Contratar — 390 € + IVA',
    duration: '3–6 meses',
    keyPoints: [
      { title: 'Requiere al menos 1 año de residencia legal', text: 'El reagrupante debe tener una autorización de residencia vigente de al menos 1 año y haber renovado o estar en condiciones de renovar por al menos otro año.' },
      { title: 'Ingresos y vivienda acreditables', text: 'El reagrupante debe demostrar ingresos suficientes (mínimo el 150 % del IPREM por el primer familiar) y contar con una vivienda en condiciones de habitabilidad.' },
      { title: 'El familiar entra con visado de reagrupación', text: 'El familiar a reagrupar (si no está ya en España con residencia) debe solicitar el visado de reagrupación en el Consulado español de su país.' },
    ],
    audience: [
      'Residentes legales en España que quieren traer a su cónyuge o pareja de hecho',
      'Residentes legales que quieren reagrupar a sus hijos menores',
      'Residentes legales con padres a cargo en su país de origen',
    ],
    requirements: [
      'Autorización de residencia del reagrupante vigente (al menos 1 año de residencia previa)',
      'Ingresos suficientes: al menos 150 % del IPREM mensual para el primer familiar reagrupado',
      'Vivienda en condiciones de habitabilidad suficiente (informe del Ayuntamiento)',
      'Parentesco acreditable: matrimonio, filiación o dependencia económica',
      'Familiar sin antecedentes penales',
    ],
    includes: [
      'Evaluación de requisitos: ingresos, vivienda y parentesco',
      'Orientación para obtener el informe de vivienda en el Ayuntamiento',
      'Preparación del expediente completo',
      'Presentación ante la Oficina de Extranjería',
      'Seguimiento y atención a requerimientos',
      'Orientación sobre el procedimiento de visado en el Consulado',
    ],
    requiredDocs: [
      'TIE y pasaporte del reagrupante en vigor',
      'Certificado de empadronamiento actualizado del reagrupante',
      'Últimas nóminas o justificantes de ingresos del reagrupante (3–6 meses)',
      'Informe de habitabilidad de la vivienda (Ayuntamiento)',
      'Documento acreditativo del parentesco (certificado de matrimonio, libro de familia, etc.) — apostillado y traducido si es extranjero',
      'Pasaporte del familiar a reagrupar',
      'Certificado de antecedentes penales del familiar (apostillado y traducido)',
    ],
    notIncluded: [
      'Tasa administrativa (abono por el cliente)',
      'Traducciones juradas de documentos extranjeros',
      'Apostillas de documentos del país de origen',
      'Trámite de visado en el Consulado del país de origen (orientamos sobre el proceso)',
      'Recursos en caso de denegación',
    ],
    finalCta: {
      title: '¿Quieres reunirte con tu familia en España?',
      text: 'Gestionamos tu expediente de reagrupación familiar de principio a fin. Evaluamos tus ingresos y vivienda sin compromiso.',
    },
    faqs: [
      { q: '¿Qué familiares puedo reagrupar?', a: 'Cónyuge o pareja de hecho inscrita, hijos menores de 18 años (o mayores si son dependientes), y ascendientes (padres) dependientes económicamente.' },
      { q: '¿Cuánto dinero tengo que ganar?', a: 'Al menos el 150 % del IPREM mensual para el primer familiar (aprox. 1.200 € netos/mes en 2025) y un 50 % adicional por cada familiar extra.' },
      { q: '¿Necesito un piso grande?', a: 'Depende del número de personas. El Ayuntamiento emite un informe de habitabilidad según los metros cuadrados y el número de ocupantes.' },
      { q: '¿Mi cónyuge puede trabajar cuando llegue?', a: 'Si reagrupas a tu cónyuge, la autorización de residencia que se le concede incluye en general autorización para trabajar.' },
    ],
  },
  {
    slug: 'permiso-residencia-inicial',
    categoria: 'extranjeria-nacionalidad',
    name: 'Permiso Inicial de Residencia',
    shortDescription: 'Obtención del primer permiso de residencia legal en España para ciudadanos extracomunitarios.',
    description:
      'El permiso inicial de residencia es el primer paso para regularizar tu situación en España de forma legal. Gestionamos el expediente completo: evaluamos tu situación personal, determinamos la vía más adecuada (arraigo laboral, circunstancias excepcionales, reagrupación, trabajo…), preparamos toda la documentación y la presentamos ante la Oficina de Extranjería. Te acompañamos en cada fase hasta recibir la resolución favorable y recoger tu TIE.',
    price: '490 € + IVA',
    duration: '2–4 meses',
    stripePriceId: 'price_1TZXopLeYwwgvux4C1wVQeer',
    includes: [
      'Evaluación gratuita de la vía más adecuada a tu situación',
      'Revisión y guía de aportación de documentación',
      'Cumplimentación del formulario EX-01 o EX-02 según proceda',
      'Presentación telemática o presencial ante la Oficina de Extranjería',
      'Seguimiento activo del expediente y atención a requerimientos',
      'Notificación de resolución y pasos para recoger el TIE'
    ],
    requiredDocs: [
      'Pasaporte en vigor (con copia de todas las páginas)',
      'Formulario de solicitud (EX-01 o EX-02) cumplimentado',
      'Fotografía reciente en color tamaño carné',
      'Justificante de pago de la tasa (Modelo 790 código 052)',
      'Pruebas de permanencia continuada según la modalidad de arraigo aplicable',
      'Documentación específica según la modalidad de residencia o arraigo aplicable',
      'Medios económicos suficientes (nóminas, extractos bancarios o similar)',
      'Seguro médico privado sin copago y sin carencia (si no cotiza a SS)',
      'Antecedentes penales del país de origen apostillados y traducidos',
      'Certificado de antecedentes penales de España'
    ],
    faqs: [
      { q: '¿Cuánto tarda el permiso inicial de residencia?', a: 'El plazo legal de resolución es de 3 meses desde la presentación. En la práctica, en la mayoría de oficinas de extranjería el tiempo oscila entre 2 y 4 meses, aunque puede alargarse en provincias con mayor carga de trabajo.' },
      { q: '¿Qué pasa si no resuelven en el plazo legal?', a: 'Si la Administración no resuelve en 3 meses, opera el silencio administrativo negativo. Sin embargo, esto abre la vía de recurso. Te orientamos sobre cómo actuar en ese caso.' },
      { q: '¿Puedo trabajar mientras tramito el permiso inicial?', a: 'Depende de la vía. Con el arraigo laboral, al presentar la solicitud se puede solicitar un permiso provisional de trabajo. En otras vías no está permitido trabajar durante la tramitación.' },
      { q: '¿Qué es el TIE?', a: 'La Tarjeta de Identidad de Extranjero (TIE) es el documento físico que acredita tu permiso de residencia. Se solicita en comisaría una vez recibida la resolución favorable y se entrega en un plazo aproximado de 30–45 días.' },
      { q: '¿Necesito venir en persona a vuestras oficinas?', a: 'No. Toda la gestión se realiza de forma online. Tú nos envías la documentación escaneada y nosotros preparamos y presentamos el expediente. Solo necesitarás acudir presencialmente a la Oficina de Extranjería si es obligatorio para tu vía concreta.' }
    ]
  },

  // ── Empresas y Autónomos ───────────────────────────────────────────────────
  {
    slug: 'alta-autonomo',
    categoria: 'empresas-autonomos',
    name: 'Alta de Autónomo',
    shortDescription: 'Tramitación del alta en el RETA y gestión de la actividad económica.',
    description:
      'Gestionamos tu alta como autónomo en la Agencia Tributaria (Modelo 036/037) y en la Seguridad Social (RETA), con asesoramiento sobre el epígrafe de actividad más adecuado, cuota de autónomos, tarifa plana y obligaciones fiscales desde el inicio.',
    price: '120 € + IVA',
    stripePriceId: 'price_1TXMmKLeYwwgvux4oXpYh27g',
    duration: '1–3 días hábiles',
    includes: [
      'Modelo 036/037 — Alta en Hacienda',
      'Alta en el RETA (Seguridad Social)',
      'Asesoramiento sobre epígrafe y base de cotización',
      'Información sobre tarifa plana y bonificaciones',
      'Guía de obligaciones fiscales del autónomo'
    ],
    faqs: [
      { q: '¿Cuánto tarda el alta?', a: 'El alta fiscal es inmediata. El alta en el RETA puede tardar 1–3 días.' },
      { q: '¿Cuál es la cuota de autónomos en 2025?', a: 'Con el nuevo sistema de cotización por ingresos reales, la cuota varía entre 200 € y 590 € aproximadamente según el tramo de rendimientos netos.' }
    ]
  },
  {
    slug: 'constitucion-sl',
    categoria: 'empresas-autonomos',
    name: 'Constitución de Sociedad Limitada',
    shortDescription: 'Creación de una SL con capital mínimo, estatutos y alta fiscal.',
    description:
      'Acompañamos todo el proceso de constitución de una Sociedad Limitada: denominación social, redacción de estatutos, elevación a escritura pública, inscripción en el Registro Mercantil y alta fiscal en Hacienda. Incluye asesoramiento sobre estructura societaria y fiscal.',
    price: '490 € + IVA',
    stripePriceId: 'price_1TXMmNLeYwwgvux4hIk84Aug',
    duration: '7–15 días hábiles',
    includes: [
      'Certificado de denominación social (BORME)',
      'Redacción de estatutos y pacto de socios',
      'Escritura pública notarial',
      'Inscripción en Registro Mercantil',
      'Alta en Hacienda (Modelo 036)',
      'Obtención del CIF definitivo'
    ],
    faqs: [
      { q: '¿Cuánto capital mínimo se necesita?', a: 'Desde 1 euro, aunque lo habitual es un capital inicial de 3.000 €.' },
      { q: '¿Puedo constituir una SL yo solo?', a: 'Sí, se puede constituir una SL unipersonal con un único socio.' }
    ]
  },
  {
    slug: 'constitucion-sl-circe',
    categoria: 'empresas-autonomos',
    name: 'Constitución de SL por CIRCE',
    shortDescription: 'Constitución telemática de Sociedad Limitada a través del sistema CIRCE, con opción de gestión completa o acompañamiento guiado.',
    description:
      'Puedes contratar la constitución completa de tu Sociedad Limitada mediante CIRCE o elegir una sesión guiada para preparar el proceso por tu cuenta. En la gestión completa coordinamos el DUE, denominación social, estatutos tipo, notaría, inscripción registral y alta fiscal. La modalidad guiada es formativa y no incluye la presentación ni ejecución del trámite por EXPERT.',
    price: 'Desde 180 € + IVA',
    duration: 'Gestión completa: 3–7 días hábiles · Formación guiada: 2 horas',
    deliveryOptions: [
      {
        mode: 'full_service',
        label: 'Servicio completo',
        description: 'EXPERT gestiona la constitución por CIRCE de principio a fin.',
        price: '499 € + IVA',
        duration: '3–7 días hábiles',
        includes: [
          'Revisión de viabilidad para CIRCE y estatutos tipo',
          'Certificado de denominación social',
          'Documento Único Electrónico (DUE)',
          'Coordinación con notaría adherida a CIRCE',
          'Inscripción en Registro Mercantil',
          'Alta fiscal y obtención del NIF definitivo'
        ],
        notIncluded: [
          'Aranceles notariales y registrales',
          'Certificados o trámites personales de socios extranjeros',
          'Pactos de socios o estatutos a medida'
        ]
      },
      {
        mode: 'guided',
        label: 'Formación guiada',
        description: 'Sesión práctica individual para preparar el trámite CIRCE por tu cuenta con apoyo profesional.',
        price: '180 € + IVA',
        duration: '2 horas',
        includes: [
          'Sesión one to one de 2 horas',
          'Checklist personalizado',
          'Revisión guiada de datos y documentación',
          'Explicación paso a paso del circuito CIRCE',
          'Resolución de dudas durante la sesión'
        ],
        notIncluded: [
          'Presentación del DUE por EXPERT',
          'Gestión de notaría o Registro Mercantil',
          'Seguimiento posterior del expediente'
        ]
      }
    ],
    includes: [
      'Modalidad a elegir: gestión completa o acompañamiento guiado',
      'Revisión previa de requisitos para CIRCE',
      'Orientación sobre documentación y pasos necesarios'
    ],
    requirements: [
      'Todos los socios deben aportar DNI/NIE en vigor',
      'La vía CIRCE con estatutos tipo no es adecuada para estructuras societarias complejas'
    ],
    faqs: [
      { q: '¿Qué diferencia hay entre las dos modalidades?', a: 'En el servicio completo EXPERT realiza y coordina el trámite. En la formación guiada te enseñamos a prepararlo y gestionarlo por tu cuenta; no presentamos el expediente en tu nombre.' },
      { q: '¿Puedo usar CIRCE si hay socios extranjeros?', a: 'Sí, siempre que dispongan de la identificación fiscal necesaria. Si algún socio no dispone de NIF/NIE, ese trámite debe resolverse previamente.' }
    ]
  },
  {
    slug: 'nif-socio-extranjero',
    categoria: 'empresas-autonomos',
    name: 'NIF para Socio Extranjero',
    shortDescription: 'Obtención del NIF para socios o administradores extranjeros sin residencia en España.',
    description:
      'Tramitamos el Número de Identificación Fiscal (NIF) para socios, administradores o apoderados extranjeros que van a participar en una sociedad española y no disponen de NIE. Necesario para poder constituir la sociedad, firmar ante notario y figurar en el Registro Mercantil.',
    price: '60 € + IVA / persona',
    servicePriceDetail: 'Precio por cada socio o administrador que necesite NIF.',
    duration: '5–10 días hábiles',
    includes: [
      'Cumplimentación del Modelo 030 / EX-15',
      'Coordinación con representante fiscal en España',
      'Presentación ante la Administración competente',
      'Seguimiento del expediente hasta la obtención del NIF'
    ],
    requirements: [
      'Pasaporte en vigor del socio o administrador',
      'Poder de representación si no se tramita en persona'
    ],
    faqs: [
      { q: '¿Cuántos NIF necesito tramitar?', a: 'Uno por cada socio o administrador extranjero sin NIE que vaya a figurar en la escritura de constitución. El presupuesto se calcula por persona según la cantidad necesaria.' },
      { q: '¿El NIF sustituye al NIE?', a: 'No. El NIF es exclusivamente a efectos fiscales para poder constituir la sociedad; si el socio va a residir en España necesitará tramitar además su NIE/TIE.' }
    ]
  },
  {
    slug: 'contabilidad-mensual',
    categoria: 'empresas-autonomos',
    name: 'Contabilidad Mensual',
    shortDescription: 'Llevanza de contabilidad y registro contable para autónomos y sociedades.',
    description:
      'Nos encargamos de la contabilidad mensual de tu empresa o actividad: registro de facturas, conciliaciones bancarias, informes mensuales de resultados y balance. Trabajamos con Holded para mayor visibilidad y control.',
    price: 'Desde 80 € + IVA / mes',
    duration: 'Servicio recurrente mensual',
    includes: [
      'Registro de facturas emitidas y recibidas',
      'Conciliación bancaria',
      'Informes de pérdidas y ganancias mensuales',
      'Balance de situación trimestral',
      'Acceso a Holded con datos actualizados'
    ],
    faqs: [
      { q: '¿Necesito Holded para contratar este servicio?', a: 'No es obligatorio, pero trabajamos preferentemente con Holded. Si no lo tienes, podemos ayudarte a migrarlo.' },
      { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí, con un preaviso de 30 días.' }
    ]
  },
  {
    slug: 'impuestos-trimestrales',
    categoria: 'empresas-autonomos',
    name: 'Impuestos Trimestrales',
    shortDescription: 'Presentación trimestral de IVA, IRPF y otros modelos recurrentes.',
    description:
      'Gestionamos la presentación trimestral de tus impuestos: IVA (Modelo 303), retenciones a trabajadores (Modelo 111), retenciones de alquileres (Modelo 115) y pagos fraccionados del IRPF (Modelo 130/131). Todo en plazo y con revisión previa.',
    price: 'Desde 120 € + IVA / trimestre',
    duration: 'Servicio recurrente trimestral',
    includes: [
      'Revisión de datos contables del trimestre',
      'Modelos 303, 111, 115 y 130/131 según aplique',
      'Presentación telemática en plazo',
      'Informe de liquidación'
    ],
    faqs: [
      { q: '¿Qué pasa si no presento los impuestos a tiempo?', a: 'Hacienda aplica recargos e intereses de demora. Con nuestro servicio recibes aviso previo para evitarlo.' }
    ]
  },
  {
    slug: 'baja-cese-actividad',
    categoria: 'empresas-autonomos',
    name: 'Baja y Cese de Actividad',
    shortDescription: 'Tramitación de la baja de autónomo o disolución de sociedad.',
    description:
      'Gestionamos la baja fiscal y en la Seguridad Social del autónomo, o el proceso completo de disolución y liquidación de una sociedad: acuerdos de socios, escritura, liquidación de impuestos pendientes e inscripción registral del cierre.',
    price: 'Consultar',
    duration: 'Variable',
    includes: [
      'Baja en Hacienda (Modelo 036/037)',
      'Baja en el RETA',
      'Liquidación de impuestos pendientes',
      'Para sociedades: acta de disolución, escritura e inscripción registral'
    ],
    faqs: [
      { q: '¿Cuándo conviene darse de baja como autónomo?', a: 'Cuando cesan de forma definitiva los ingresos de la actividad. La baja en el RETA se puede hacer hasta el último día del mes para no pagar ese mes.' }
    ]
  },
  {
    slug: 'cuentas-anuales',
    categoria: 'empresas-autonomos',
    name: 'Cuentas Anuales',
    shortDescription: 'Formulación, aprobación y depósito de cuentas anuales en el Registro Mercantil.',
    description:
      'Preparamos las cuentas anuales de tu sociedad (balance, cuenta de pérdidas y ganancias, memoria y, si aplica, estado de cambios en el patrimonio neto y flujos de efectivo), coordinamos su aprobación en Junta General y las depositamos en el Registro Mercantil dentro del plazo legal.',
    price: 'Consultar',
    duration: '5–10 días hábiles',
    includes: [
      'Formulación del balance y cuenta de resultados',
      'Redacción de la memoria anual',
      'Coordinación de la Junta General de aprobación',
      'Depósito en el Registro Mercantil',
      'Justificante de presentación'
    ],
    faqs: [
      { q: '¿Cuándo hay que depositar las cuentas anuales?', a: 'Dentro del mes siguiente a la aprobación en Junta (normalmente hasta el 30 de julio para ejercicios cerrados a 31 de diciembre).' },
      { q: '¿Qué pasa si no deposito las cuentas?', a: 'La sociedad puede quedar en situación de cierre registral y el ICAC puede imponer multas de hasta 300.000 €.' }
    ]
  },
  {
    slug: 'apoderamientos-mercantiles',
    categoria: 'empresas-autonomos',
    name: 'Apoderamientos y Modificaciones Mercantiles',
    shortDescription: 'Cambio de administrador, modificación de estatutos, poderes notariales y compraventa de participaciones.',
    description:
      'Gestionamos todo tipo de modificaciones societarias: cambio o nombramiento de administrador, modificación de estatutos sociales, otorgamiento y revocación de poderes notariales, ampliaciones y reducciones de capital, compraventa de participaciones sociales y otras operaciones registrales.',
    price: 'Consultar',
    duration: '7–20 días hábiles',
    includes: [
      'Preparación del acuerdo de Junta o del administrador',
      'Elevación a escritura pública notarial',
      'Inscripción en el Registro Mercantil',
      'Notificación a Hacienda si aplica',
      'Justificante de inscripción registral'
    ],
    faqs: [
      { q: '¿Cómo cambio al administrador de mi empresa?', a: 'Se acuerda en Junta General o por el propio órgano de administración, se eleva a escritura notarial y se inscribe en el Registro Mercantil.' },
      { q: '¿Qué es un poder notarial y para qué sirve?', a: 'Es un documento que otorga a una persona la facultad de actuar en nombre de otra o de la empresa. Puede ser general o especial (para actos concretos).' }
    ]
  },

  // ── Tráfico y Capitanía Marítima ───────────────────────────────────────────
  {
    slug: 'transferencia-vehiculo',
    categoria: 'trafico-capitania-maritima',
    name: 'Transferencia de Vehículo',
    shortDescription: 'Gestión del cambio de titular en la DGT para compraventas de vehículos.',
    description:
      'Tramitamos la transferencia de titularidad de vehículos de segunda mano ante la DGT: verificamos documentación, liquidamos el impuesto de transmisiones (ITP), presentamos la solicitud y obtenemos el nuevo permiso de circulación a nombre del comprador.',
    price: 'Desde 80 € + IVA',
    duration: '3–7 días hábiles',
    includes: [
      'Verificación del contrato de compraventa',
      'Liquidación del ITP (Impuesto de Transmisiones)',
      'Presentación de la transferencia en DGT',
      'Obtención del permiso de circulación'
    ],
    faqs: [
      { q: '¿Qué documentos necesito para la transferencia?', a: 'Contrato de compraventa firmado, ficha técnica del vehículo, permisos de circulación, DNI/NIE de ambas partes.' },
      { q: '¿Tengo que pagar impuestos al comprar un coche de segunda mano?', a: 'Sí, el Impuesto de Transmisiones Patrimoniales (ITP), cuyo porcentaje varía según la comunidad autónoma.' }
    ]
  },
  {
    slug: 'matriculacion',
    categoria: 'trafico-capitania-maritima',
    name: 'Matriculación de Vehículos',
    shortDescription: 'Primera matriculación de vehículos nuevos e importados.',
    description:
      'Gestionamos la primera matriculación de vehículos nuevos o importados: liquidación del IEDMT (impuesto de matriculación), presentación de documentación ante la DGT, obtención de placas y entrega del permiso de circulación definitivo.',
    price: 'Consultar',
    duration: '5–10 días hábiles',
    includes: [
      'Verificación de documentación técnica',
      'Liquidación del IEDMT',
      'Tramitación de matrícula ante la DGT',
      'Obtención de placas y permiso de circulación'
    ],
    faqs: [
      { q: '¿Cuándo debo pagar el impuesto de matriculación?', a: 'En la primera matriculación en España o cuando el vehículo supera ciertos límites de emisiones de CO₂.' }
    ]
  },
  {
    slug: 'duplicado-permiso',
    categoria: 'trafico-capitania-maritima',
    name: 'Duplicado de Documentos de Tráfico',
    shortDescription: 'Obtención de duplicados del permiso de conducir, de circulación o ficha técnica.',
    description:
      'Tramitamos duplicados de permiso de conducir, permiso de circulación o ficha técnica del vehículo por pérdida, robo o deterioro ante la DGT o la prefectura correspondiente.',
    price: 'Desde 50 € + IVA',
    duration: '2–5 días hábiles',
    includes: [
      'Gestión de la solicitud ante la DGT',
      'Obtención del duplicado correspondiente'
    ],
    faqs: [
      { q: '¿Puedo conducir mientras espero el duplicado del carnet?', a: 'No, necesitas tener el permiso físico o el resguardo provisional en vigor para circular legalmente.' }
    ]
  },
  {
    slug: 'tramites-embarcaciones',
    categoria: 'trafico-capitania-maritima',
    name: 'Trámites de Embarcaciones',
    shortDescription: 'Matriculación, transferencias y gestiones ante Capitanía Marítima.',
    description:
      'Gestionamos los trámites de embarcaciones de recreo ante Capitanía Marítima: matriculación, cambio de titularidad, despachos, abanderamiento y documentación para titulaciones náuticas. También tramitamos bajas y transferencias de motos de agua.',
    price: 'Consultar',
    duration: '5–15 días hábiles',
    includes: [
      'Matriculación de embarcaciones',
      'Transferencia de titularidad',
      'Abanderamiento y despachos',
      'Tramitación de bajas'
    ],
    faqs: [
      { q: '¿Dónde se tramitan los permisos de embarcaciones en España?', a: 'Ante la Capitanía Marítima de la provincia correspondiente, dependiente de la Dirección General de la Marina Mercante.' }
    ]
  },

  // ── Notaría y Propiedades ──────────────────────────────────────────────────
  {
    slug: 'compraventa-inmueble',
    categoria: 'notaria-propiedades',
    name: 'Compraventa de Inmueble',
    shortDescription: 'Soporte fiscal y documental en la compraventa de viviendas y locales.',
    description:
      'Ofrecemos acompañamiento fiscal y documental en operaciones de compraventa inmobiliaria: revisión del contrato de arras, cálculo de impuestos (ITP o IVA+AJD), representación ante notaría y liquidación de impuestos ante la Hacienda autonómica.',
    price: 'Consultar',
    duration: 'Variable según operación',
    includes: [
      'Revisión del contrato de arras o promesa de compraventa',
      'Cálculo de ITP o IVA+AJD según tipología',
      'Soporte en firma ante notaría',
      'Liquidación de impuestos ante la Hacienda autonómica',
      'Inscripción en el Registro de la Propiedad'
    ],
    faqs: [
      { q: '¿Qué impuestos paga el comprador de un piso de segunda mano?', a: 'El Impuesto de Transmisiones Patrimoniales (ITP), cuyo tipo varía según la comunidad autónoma (entre el 6% y el 10% del precio).' },
      { q: '¿Y si compro una vivienda nueva?', a: 'En vivienda nueva pagas IVA (10%) más Actos Jurídicos Documentados (AJD, entre el 0,5% y el 1,5% según CCAA).' }
    ]
  },
  {
    slug: 'herencia',
    categoria: 'notaria-propiedades',
    name: 'Herencia y Sucesión',
    shortDescription: 'Tramitación de herencias: declaración, liquidación y adjudicación.',
    description:
      'Acompañamos el proceso de aceptación y adjudicación de herencias: obtención del certificado de defunción y últimas voluntades, liquidación del Impuesto de Sucesiones y Donaciones, adjudicación notarial de bienes e inscripción registral.',
    price: 'Consultar',
    duration: '1–6 meses',
    includes: [
      'Certificado de últimas voluntades y seguro de vida',
      'Inventario del caudal hereditario',
      'Liquidación del Impuesto de Sucesiones y Donaciones',
      'Escritura de adjudicación de herencia',
      'Inscripción en Registro de la Propiedad y otras gestiones'
    ],
    faqs: [
      { q: '¿Cuánto tiempo tengo para aceptar la herencia?', a: 'No hay plazo para aceptar, pero el Impuesto de Sucesiones debe liquidarse en 6 meses (prorrogable otros 6).' },
      { q: '¿Puedo renunciar a la herencia?', a: 'Sí, la renuncia es pura y simple, y puede hacerse ante notario.' }
    ]
  },
  {
    slug: 'donacion',
    categoria: 'notaria-propiedades',
    name: 'Donación de Bienes',
    shortDescription: 'Tramitación fiscal y documental de donaciones de inmuebles, dinero o bienes.',
    description:
      'Gestionamos la fiscalidad de las donaciones: cálculo del Impuesto sobre Sucesiones y Donaciones (a cargo del donatario), escritura pública de donación y liquidación ante la Hacienda autonómica. Asesoramos sobre optimización fiscal según el grado de parentesco.',
    price: 'Consultar',
    duration: '2–4 semanas',
    includes: [
      'Cálculo del Impuesto de Donaciones',
      'Escritura pública de donación',
      'Liquidación ante Hacienda',
      'Inscripción registral si hay inmuebles'
    ],
    faqs: [
      { q: '¿Cuánto se paga por una donación entre padres e hijos?', a: 'Depende de la comunidad autónoma. Algunas tienen reducciones muy significativas (hasta el 99% en Madrid o Andalucía para ciertas donaciones).' }
    ]
  },
  {
    slug: 'hipoteca-cancelacion',
    categoria: 'notaria-propiedades',
    name: 'Cancelación de Hipoteca',
    shortDescription: 'Cancelación registral de la hipoteca una vez pagado el préstamo.',
    description:
      'Cuando terminas de pagar la hipoteca, el banco no cancela automáticamente la carga en el Registro de la Propiedad. Gestionamos la obtención del certificado de deuda cero, la firma notarial de la escritura de cancelación y la inscripción registral.',
    price: 'Desde 150 € + IVA',
    duration: '2–4 semanas',
    includes: [
      'Obtención del certificado de saldo cero del banco',
      'Escritura notarial de cancelación',
      'Presentación en el Registro de la Propiedad',
      'Nota simple registral actualizada'
    ],
    faqs: [
      { q: '¿Por qué el banco no cancela la hipoteca por su cuenta?', a: 'El banco solo emite el certificado de deuda cero. La cancelación registral debe tramitarla el titular del préstamo.' }
    ]
  },

  // ── Certificado digital ───────────────────────────────────────────────────
  {
    slug: 'certificado-digital-persona-fisica',
    categoria: 'certificado-digital',
    name: 'Certificado Digital Persona Física — Camerfirma',
    shortDescription: 'Certificado digital cualificado Camerfirma 100 % online, sin presencia física. Identificación con EXPERT y tramitación en un máximo de 24 horas laborables desde documentación e identidad validadas.',
    description:
      'EXPERT tramita a través del canal PVP de Creative Quality dentro del proceso Camerfirma y realiza la identificación y validación necesarias para la emisión del certificado. La tramitación es 100 % online, sin desplazamientos ni presencia física. Una vez recibida la documentación completa y validada la identidad, EXPERT tramita el certificado en un plazo máximo de 24 horas laborables e incluye asistencia para su instalación y prueba de funcionamiento.',
    price: '90 € + IVA',
    duration: 'Máximo 24 horas laborables desde documentación completa e identidad validada',
    stripePriceId: 'price_1TZYiBLeYwwgvux4EO07gS0W',
    checkoutLabel: 'Solicitar certificado digital',
    checkoutLegal: 'Certificado personal: la contratación y la factura se vinculan al perfil de la persona titular.',
    metaTitle: 'Certificado Digital Persona Física Camerfirma · 90 € + IVA | EXPERT Asesoría',
    metaDescription: 'Certificado digital Camerfirma para persona física por 90 € + IVA. 100 % online, sin presencia física. Identificación con EXPERT y tramitación máxima de 24 horas laborables.',
    keyPoints: [
      { title: 'Reconocido oficialmente', text: 'Válido ante AEAT, Seguridad Social, Notarías y todos los organismos públicos y privados.' },
      { title: '100 % online', text: 'Identificación y tramitación remotas con EXPERT a través del canal PVP de Creative Quality dentro del proceso Camerfirma, sin presencia física.' },
      { title: 'Vigencia 5 años', text: 'La modalidad de persona física comercializada por EXPERT tiene una vigencia de 5 años.' },
      { title: 'Instalación incluida', text: 'Te ayudamos a instalarlo y probarlo en tu equipo para que funcione desde el primer minuto.' },
    ],
    audience: [
      'Personas físicas que gestionan trámites con la AEAT o la Seguridad Social',
      'Autónomos que necesitan firmar electrónicamente',
      'Particulares que realizan trámites online frecuentes con organismos públicos',
      'Ciudadanos que quieren evitar desplazamientos a oficinas presenciales',
    ],
    requirements: [
      'Copia de tarjeta DNI o TIE en vigor (foto o escáner de ambas caras)',
      'Domicilio completo (calle, número, piso, código postal, localidad)',
      'Ordenador con Windows o macOS para la instalación',
    ],
    includes: [
      'Identificación y validación online por EXPERT dentro del proceso Camerfirma',
      'Emisión del certificado digital cualificado Camerfirma',
      'Instalación y configuración en tu equipo',
      'Prueba de funcionamiento antes de finalizar',
      'Soporte técnico ante incidencias durante 30 días',
    ],
    documents: [
      {
        title: 'Documentación necesaria',
        items: [
          'Copia de tarjeta DNI o TIE en vigor (foto o escáner de ambas caras)',
          'Domicilio completo (calle, número, piso, código postal, localidad)',
        ],
      },
    ],
    process: [
      { title: 'Solicita y paga online', text: 'Completa el formulario y realiza el pago. Recibirás confirmación inmediata.' },
      { title: 'Validación online', text: 'Revisamos la documentación y realizamos la identificación remota necesaria, sin desplazamientos.' },
      { title: 'Documentación e identidad validadas', text: 'Cuando la documentación está completa y la identidad ha quedado validada, comienza el SLA de tramitación.' },
      { title: 'Tramitación en máximo 24 h laborables', text: 'Tramitamos la emisión y te ayudamos a instalar y comprobar el certificado en tu equipo.' },
    ],
    notIncluded: [
      'Renovación al vencer el certificado (se tramita aparte, mismo precio)',
      'Soporte técnico general del equipo o sistema operativo',
    ],
    reviewBeforeHiring: [
      'Ten preparada una copia legible de tu DNI/TIE antes de iniciar la identificación online',
      'Ten disponible el equipo habitual en el que quieres instalar el certificado para completar la asistencia remota'
    ],
    finalCta: {
      title: '¿Listo para tener tu certificado digital hoy?',
      text: 'Solicítalo online. En cuanto la documentación esté completa y la identidad validada, EXPERT tramita la emisión en un máximo de 24 horas laborables y te ayuda con la instalación.',
    },
    faqs: [
      { q: '¿Qué documentos necesito para el certificado de persona física?', a: 'Solo la copia de tu tarjeta DNI o TIE (foto o escáner de ambas caras) y tu domicilio completo. Nada más.' },
      { q: '¿Tengo que acudir presencialmente?', a: 'No. La tramitación con EXPERT es 100 % online. Realizamos la identificación y validación remotas dentro del proceso Camerfirma, sin necesidad de acudir físicamente a una oficina.' },
      { q: '¿Qué diferencia hay entre el certificado de persona física y el de entidad?', a: 'El de persona física te identifica a ti como individuo. El de entidad identifica a tu empresa o sociedad y permite actuar en su nombre.' },
      { q: '¿Cuánto dura el certificado Camerfirma?', a: 'La modalidad de persona física comercializada por EXPERT tiene una vigencia de 5 años. Antes de contratar revisamos que esta sea la modalidad adecuada para tu uso.' },
      { q: '¿Es válido para todos los organismos?', a: 'Sí. Camerfirma es una Autoridad de Certificación reconocida y su certificado es válido en AEAT, Seguridad Social, DGT, Notarías y cualquier organismo público o privado.' },
      { q: '¿Cuál es el plazo de tramitación?', a: 'Máximo 24 horas laborables desde que EXPERT dispone de la documentación completa y la identidad ha quedado validada. Si falta documentación, el plazo comienza cuando el expediente está completo.' },
      { q: '¿Qué pasa si ya tengo uno caducado?', a: 'Sin problema. Lo renovamos con el mismo proceso online. El precio es el mismo: 90 € + IVA.' },
    ],
  },
  {
    slug: 'certificado-digital-entidad',
    categoria: 'certificado-digital',
    name: 'Certificado Digital de Entidad — Camerfirma',
    shortDescription: 'Certificado digital Camerfirma para entidad mercantil, 100 % online y sin presencia física. EXPERT valida al representante y tramita la emisión en máximo 24 horas laborables desde expediente completo.',
    description:
      'EXPERT tramita a través del canal PVP de Creative Quality dentro del proceso Camerfirma. Revisamos la documentación de la entidad y las facultades del representante, realizamos la identificación y validación online y tramitamos la emisión sin presencia física. Una vez recibida la documentación completa y validado el representante, el plazo máximo de tramitación es de 24 horas laborables. Incluye asistencia para instalación y prueba de funcionamiento.',
    price: '150 € + IVA',
    duration: 'Máximo 24 horas laborables desde documentación completa y representante validado',
    stripePriceId: 'price_1TZYiDLeYwwgvux4ovAjIxrz',
    checkoutLabel: 'Solicitar certificado de entidad',
    checkoutLegal: 'Certificado de entidad: la contratación y la factura deben vincularse a la organización para la que se emite.',
    metaTitle: 'Certificado Digital de Entidad Camerfirma · 150 € + IVA | EXPERT Asesoría',
    metaDescription: 'Certificado digital Camerfirma para entidad mercantil por 150 € + IVA. 100 % online, sin presencia física. Tramitación máxima de 24 horas laborables con EXPERT.',
    keyPoints: [
      { title: 'Para cualquier entidad', text: 'Válido para SL, SA, asociaciones, fundaciones, comunidades de propietarios y cualquier persona jurídica.' },
      { title: 'Firma en nombre de la empresa', text: 'Permite actuar y firmar electrónicamente en nombre de tu organización ante cualquier organismo.' },
      { title: 'Vigencia 2 años', text: 'La modalidad de entidad comercializada por EXPERT tiene una vigencia de 2 años.' },
      { title: 'Instalación incluida', text: 'Configuramos el certificado en el equipo del representante y verificamos su correcto funcionamiento.' },
    ],
    audience: [
      'Sociedades limitadas (SL) y anónimas (SA)',
      'Asociaciones, fundaciones y ONG',
      'Comunidades de propietarios',
      'Cualquier persona jurídica con obligaciones digitales ante organismos públicos',
    ],
    requirements: [
      'Copia de tarjeta DNI o TIE en vigor del representante legal (foto o escáner de ambas caras)',
      'Dirección completa de la entidad',
      'Documentos de constitución: escrituras, nota mercantil o acta de nombramiento según el tipo de entidad',
      'Ordenador con Windows o macOS para la instalación',
    ],
    includes: [
      'Verificación documental de la entidad y validación online del representante por EXPERT',
      'Emisión del certificado digital de entidad Camerfirma',
      'Instalación y configuración en el equipo del representante',
      'Prueba de funcionamiento antes de finalizar',
      'Soporte técnico ante incidencias durante 30 días',
    ],
    documents: [
      {
        title: 'Documentación del representante legal',
        items: [
          'Copia de tarjeta DNI o TIE en vigor (foto o escáner de ambas caras)',
        ],
      },
      {
        title: 'Documentación de la entidad',
        items: [
          'Dirección completa de la entidad (calle, número, código postal, localidad)',
          'Escrituras de constitución o nota mercantil (para SL, SA y otras mercantiles)',
          'Estatutos y acta de nombramiento del cargo en vigor (para asociaciones y fundaciones)',
          'Poderes notariales (si el solicitante no figura como representante en los documentos anteriores)',
        ],
      },
    ],
    process: [
      { title: 'Solicita y paga online', text: 'Completa el formulario con los datos de la entidad y realiza el pago. Recibirás confirmación inmediata.' },
      { title: 'Nos envías la documentación', text: 'Copia del DNI/TIE del representante y los documentos de la entidad (escrituras, nota mercantil o estatutos).' },
      { title: 'Identificación online del representante', text: 'EXPERT realiza la identificación y validación remotas dentro del proceso Camerfirma, sin presencia física.' },
      { title: 'Tramitación en máximo 24 h laborables', text: 'Desde documentación completa y representante validado, tramitamos la emisión y te ayudamos a instalar y probar el certificado.' },
    ],
    notIncluded: [
      'Renovación al vencer (se tramita aparte, mismo precio)',
      'Gestión de obligaciones tributarias o contables de la entidad',
      'Soporte técnico general del equipo o sistema operativo',
    ],
    reviewBeforeHiring: [
      'Ten preparada la copia del DNI/TIE del representante antes de iniciar el proceso',
      'Necesitarás las escrituras o nota mercantil actualizadas (o estatutos y acta si es asociación)',
    ],
    finalCta: {
      title: '¿Tu empresa necesita certificado digital?',
      text: 'Solicítalo online. Con documentación completa y representante validado, EXPERT tramita la emisión en un máximo de 24 horas laborables, sin desplazamientos.'
    },
    faqs: [
      { q: '¿Qué documentos necesita la empresa para el certificado digital?', a: 'La copia del DNI/TIE del representante, la dirección de la entidad, y los documentos de constitución: escrituras o nota mercantil para sociedades, o estatutos y acta de nombramiento para asociaciones y fundaciones.' },
      { q: '¿Quién puede solicitar el certificado de entidad?', a: 'El representante legal que figure en las escrituras o nota mercantil (administrador único, solidario, etc.). Si no figura directamente, se necesitan poderes notariales.' },
      { q: '¿Cuánto tiempo tarda?', a: 'Máximo 24 horas laborables desde que EXPERT dispone de la documentación completa de la entidad y la identidad/facultades del representante han quedado validadas.' },
      { q: '¿Es necesario acudir presencialmente?', a: 'No. La identificación del representante y la tramitación se realizan online con EXPERT dentro del proceso Camerfirma, sin presencia física.' },
      { q: '¿Qué diferencia hay con el certificado de persona física?', a: 'El de entidad identifica a la organización y permite actuar y firmar en su nombre. El de persona física solo identifica al individuo.' },
      { q: '¿Cuánto dura el certificado?', a: 'La modalidad de entidad comercializada por EXPERT tiene una vigencia de 2 años. La renovación se tramita como una nueva gestión cuando se aproxima el vencimiento.' },
      { q: '¿Es válido para todos los organismos?', a: 'Sí. Camerfirma es reconocida por AEAT, Seguridad Social, Registros Mercantiles, Notarías y cualquier organismo público o privado.' },
    ],
  },
  {
    slug: 'pack-certificados-digitales',
    categoria: 'certificado-digital',
    name: 'Pack Certificados Digitales — Persona Física + Entidad',
    shortDescription: 'Oferta conjunta: certificado digital Camerfirma de persona física + certificado de entidad mercantil por 200 € + IVA. 100 % online y sin presencia física.',
    description:
      'Pack de lanzamiento EXPERT para obtener en un único pedido el certificado digital Camerfirma de la persona física representante y el certificado digital de su entidad mercantil. EXPERT tramita a través del canal PVP de Creative Quality dentro del proceso Camerfirma, realiza la identificación y validación online y revisa tanto la documentación personal como la societaria. El proceso es 100 % online, sin desplazamientos. Una vez recibida toda la documentación y validadas la identidad y las facultades de representación, ambos certificados se tramitan en un plazo máximo de 24 horas laborables.',
    price: '200 € + IVA',
    duration: 'Máximo 24 horas laborables desde expediente completo e identidades/facultades validadas',
    stripePriceId: 'price_1S2X6ZLeYwwgvux4sPrfxFD7',
    checkoutLabel: 'Contratar pack — 200 € + IVA',
    checkoutLegal: 'El pack incluye un certificado personal para el usuario titular y un certificado para la entidad mercantil seleccionada. Para contratar debes vincular una entidad a tu cuenta EXPERT.',
    metaTitle: 'Pack Certificados Digitales Camerfirma · Persona + Empresa · 200 € + IVA | EXPERT',
    metaDescription: 'Oferta certificado digital persona física + entidad mercantil por 200 € + IVA. 100 % online, sin presencia física y tramitación máxima de 24 horas laborables con EXPERT.',
    keyPoints: [
      { title: 'Ahorro de 40 €', text: 'Contratados por separado suman 240 € + IVA. Con el pack pagas 200 € + IVA.' },
      { title: '100 % online', text: 'Identificación, validación documental y tramitación remotas con EXPERT a través del canal PVP de Creative Quality dentro del proceso Camerfirma.' },
      { title: 'Dos certificados, un pedido', text: 'Incluye el certificado personal del representante y el certificado de la entidad mercantil seleccionada.' },
      { title: 'Máximo 24 h laborables', text: 'El plazo comienza cuando EXPERT dispone de toda la documentación y ha validado identidad y facultades de representación.' },
    ],
    audience: [
      'Administradores y representantes legales que necesitan certificado personal y de su sociedad',
      'Socios/administradores que están digitalizando la gestión de su empresa',
      'Empresarios que quieren centralizar ambos certificados en una sola contratación',
    ],
    requirements: [
      'Cuenta EXPERT a nombre de la persona física titular del certificado personal',
      'Entidad mercantil creada o vinculada en EXPERT para el certificado de entidad',
      'DNI o TIE en vigor del representante',
      'Documentación actualizada de la entidad y, cuando proceda, poderes o nombramiento',
      'Equipo Windows o macOS para la instalación',
    ],
    includes: [
      'Certificado digital Camerfirma de persona física — modalidad EXPERT con vigencia de 5 años',
      'Certificado digital Camerfirma de entidad — modalidad EXPERT con vigencia de 2 años',
      'Identificación y validación online del titular/representante por EXPERT',
      'Revisión documental de la entidad y de las facultades de representación',
      'Tramitación de ambos certificados',
      'Instalación y configuración asistida',
      'Prueba de funcionamiento',
      'Soporte técnico relacionado con los certificados durante 30 días',
    ],
    documents: [
      {
        title: 'Persona física / representante',
        items: [
          'DNI o TIE en vigor — copia legible de ambas caras',
          'Domicilio completo',
          'Datos de contacto',
        ],
      },
      {
        title: 'Entidad mercantil',
        items: [
          'Razón social y NIF/CIF',
          'Dirección fiscal completa',
          'Escritura, nota mercantil o documentación registral actualizada',
          'Poderes o documento de nombramiento cuando sean necesarios para acreditar la representación',
        ],
      },
    ],
    process: [
      { title: 'Contrata el pack', text: 'Inicia sesión, completa tu perfil personal y selecciona o crea la entidad mercantil a la que corresponde el segundo certificado.' },
      { title: 'Sube la documentación', text: 'Recibimos en un único flujo la documentación personal y societaria.' },
      { title: 'Identificación y validación online', text: 'EXPERT verifica identidad, documentación y facultades dentro del proceso Camerfirma, sin presencia física.' },
      { title: 'Tramitación', text: 'Con el expediente completo y validado, tramitamos ambos certificados en un máximo de 24 horas laborables.' },
      { title: 'Instalación y prueba', text: 'Te ayudamos a instalar los certificados y comprobamos su funcionamiento.' },
    ],
    notIncluded: [
      'Renovaciones futuras al vencer cada certificado',
      'Obtención de escrituras, notas registrales, poderes o documentos que no aporte el cliente',
      'Modificación de cargos o poderes societarios',
      'Soporte técnico general del ordenador o sistema operativo',
    ],
    reviewBeforeHiring: [
      'El titular del certificado personal debe ser la misma persona que realiza la identificación',
      'Para el certificado de entidad deben poder acreditarse las facultades del representante',
      'El plazo máximo de 24 horas laborables comienza cuando la documentación está completa y todas las validaciones necesarias han finalizado',
    ],
    finalCta: {
      title: 'Dos certificados, una sola contratación y 40 € de ahorro',
      text: 'Completa tu perfil, vincula tu sociedad y tramita online el certificado personal y el de tu entidad por 200 € + IVA.',
    },
    faqs: [
      { q: '¿Qué incluye exactamente la oferta?', a: 'Incluye el certificado Camerfirma de persona física del representante y el certificado Camerfirma de la entidad mercantil seleccionada, además de identificación online, revisión documental, instalación y prueba de funcionamiento.' },
      { q: '¿Cuánto ahorro frente a contratarlos por separado?', a: 'El certificado personal cuesta 90 € + IVA y el de entidad 150 € + IVA. Por separado son 240 € + IVA; el pack cuesta 200 € + IVA, por lo que ahorras 40 €.' },
      { q: '¿Tengo que ir presencialmente a una oficina?', a: 'No. El proceso con EXPERT se realiza 100 % online. EXPERT realiza la identificación y validación remotas dentro del proceso Camerfirma.' },
      { q: '¿Cuál es el plazo?', a: 'Máximo 24 horas laborables desde que la documentación personal y societaria está completa y quedan validadas la identidad y las facultades del representante.' },
      { q: '¿Necesito crear la empresa en EXPERT?', a: 'Sí. El checkout del pack necesita vincular la entidad mercantil para que el certificado empresarial, el pedido y el expediente queden asociados correctamente.' },
      { q: '¿Qué vigencia tiene cada certificado?', a: 'La modalidad de persona física comercializada por EXPERT tiene 5 años de vigencia y la modalidad de entidad, 2 años.' },
    ],
  },

  {
    slug: 'certificado-digital-sin-animo-lucro',
    categoria: 'certificado-digital',
    name: 'Certificado Digital Entidad Sin Ánimo de Lucro — Camerfirma',
    shortDescription: 'Certificado digital cualificado Camerfirma para asociaciones, fundaciones y entidades sin ánimo de lucro.',
    description:
      'Las entidades sin ánimo de lucro (asociaciones, fundaciones, ONG, comunidades religiosas…) también tienen obligaciones digitales ante la AEAT, la Seguridad Social y otros organismos. EXPERT tramita el certificado digital de entidad adaptado a estas organizaciones dentro del proceso Camerfirma, con validación online del representante y un plazo máximo de 24 horas laborables desde expediente completo y facultades validadas.',
    price: '150 € + IVA',
    duration: 'Máximo 24 horas laborables desde expediente completo y representante/facultades validados',
    includes: [
      'Verificación documental de la entidad y del representante legal',
      'Emisión del certificado digital de entidad sin ánimo de lucro Camerfirma',
      'Instalación y configuración en el equipo del representante',
      'Prueba de funcionamiento',
      'Soporte técnico ante incidencias durante 30 días',
    ],
    faqs: [
      { q: '¿Qué documentación necesita una asociación para el certificado digital?', a: 'Estatutos de la asociación, acta de nombramiento del representante legal o presidente en vigor, y DNI/NIE de dicha persona.' },
      { q: '¿Cuánto tarda?', a: 'Máximo 24 horas laborables desde que el expediente está completo y la identidad y facultades del representante han quedado validadas.' },
    ],
  },

  // ── Holded — Paquetes de implantación ─────────────────────────────────────
  {
    slug: 'holded-pack-starter',
    categoria: 'holded',
    name: 'Pack Starter Holded',
    shortDescription: 'Onboarding a Holded: configuración inicial de empresa, facturación, bancos y conexión Open Banking.',
    description:
      'Dejamos tu cuenta de Holded lista para operar: configuramos empresa, facturación, bancos y conexión Open Banking. Incluye soporte por email durante 30 días. Ideal para autónomos y pymes que empiezan con Holded.',
    price: '499 € + IVA',
    stripePriceId: 'price_1SxNObLeYwwgvux4fLN9k8YG',
    checkoutLabel: 'Añadir a la cesta — 499 € + IVA',
    duration: '1–2 semanas',
    includes: [
      'Configuración inicial de la cuenta',
      'Setup de empresa, facturación y bancos',
      'Conexión bancaria (Open Banking)',
      'Soporte por email durante 30 días',
    ],
    faqs: [
      { q: '¿Necesito tener Holded contratado?', a: 'No. Como Holded Solution Partner podemos gestionar tu acceso y activar la prueba gratuita de 14 días antes de la implantación.' },
      { q: '¿Cuánto tarda el Pack Starter?', a: 'Entre 1 y 2 semanas desde que nos envías la documentación de tu empresa.' },
    ],
  },
  {
    slug: 'holded-migracion-sin-inventario',
    categoria: 'holded',
    name: 'Migración Holded — Sin Inventario',
    shortDescription: 'Migración completa a Holded sin módulo de inventario: clientes, proveedores, facturas y contabilidad.',
    description:
      'Migramos toda tu actividad a Holded: clientes, proveedores, facturas emitidas y recibidas, configuración contable completa (PGC) y soporte prioritario durante 60 días. No incluye módulo de inventario.',
    price: '899 € + IVA',
    stripePriceId: 'price_1SxNJcLeYwwgvux42XH9HxiJ',
    checkoutLabel: 'Añadir a la cesta — 899 € + IVA',
    duration: '3–5 semanas',
    includes: [
      'Todo lo del Pack Starter',
      'Migración de clientes y proveedores',
      'Migración de facturas emitidas y recibidas',
      'Configuración contable completa (PGC)',
      'Soporte prioritario durante 60 días',
    ],
    faqs: [
      { q: '¿Qué datos se migran?', a: 'Clientes, proveedores, facturas emitidas y recibidas, saldos contables y configuración bancaria. Previamente hacemos un diagnóstico para definir qué se migra y qué se depura.' },
      { q: '¿Cuánto tarda la migración?', a: 'Entre 3 y 5 semanas dependiendo del volumen de datos.' },
    ],
  },
  {
    slug: 'holded-migracion-con-inventario',
    categoria: 'holded',
    name: 'Migración Holded — Con Inventario',
    shortDescription: 'Migración completa a Holded incluyendo módulo de inventario: productos, almacenes y stock inicial.',
    description:
      'Migración completa a Holded con módulo de inventario: clientes, proveedores, facturas, contabilidad, productos, referencias, almacenes y stock inicial. Incluye integración inventario ↔ facturación y soporte prioritario 90 días.',
    price: '1.199 € + IVA',
    stripePriceId: 'price_1SxNLlLeYwwgvux4IjCOgIQl',
    checkoutLabel: 'Añadir a la cesta — 1.199 € + IVA',
    duration: '4–6 semanas',
    includes: [
      'Todo lo de Migración completa',
      'Migración de productos y referencias',
      'Configuración de almacenes y stock inicial',
      'Integración inventario ↔ facturación',
      'Soporte prioritario durante 90 días',
    ],
    faqs: [
      { q: '¿Qué es la integración inventario ↔ facturación?', a: 'Configuramos Holded para que al emitir una factura el stock se descuente automáticamente, y al recibir mercancía el stock se actualice.' },
      { q: '¿Cuánto tarda?', a: 'Entre 4 y 6 semanas. El módulo de inventario requiere más tiempo de carga y validación de datos.' },
    ],
  },

  // ── Holded — Módulos adicionales ───────────────────────────────────────────
  {
    slug: 'holded-migracion-laboral',
    categoria: 'holded',
    name: 'Migración laboral a Holded',
    shortDescription: 'Configuración y validación de la plantilla laboral en Holded por empleado.',
    description:
      'Migramos la información laboral vigente de cada empleado a Holded, configuramos contrato, jornada, categoría, salario, pagas e IRPF y comprobamos el resultado mediante una nómina de prueba. Incluye informe de incidencias y entrega documentada.',
    metaTitle: 'Migración laboral a Holded desde 50 € por empleado | EXPERT',
    metaDescription: 'Migramos y validamos los datos laborales de tu plantilla en Holded por 50 € + IVA por empleado. Revisión previa, configuración y nómina de prueba.',
    price: '50 € + IVA / empleado',
    duration: '3–5 días hábiles para hasta 15 empleados',
    includes: [
      'Revisión documental previa',
      'Perfil laboral configurado por empleado',
      'Contrato, jornada, categoría y estructura salarial',
      'IRPF y pagas extraordinarias informados',
      'Nómina de prueba por empleado',
      'Informe final de incidencias',
    ],
    notIncluded: [
      'Regularizaciones y recálculos históricos',
      'Comunicaciones a TGSS o SEPE',
      'Envíos mediante SILTRA',
      'Gestión mensual de nóminas',
      'Licencia de Holded',
    ],
    reviewBeforeHiring: [
      'Número de empleados a migrar',
      'Estado de la configuración laboral de Holded',
      'Disponibilidad de contratos, nómina vigente e IDC',
      'Necesidad de regularizaciones históricas',
    ],
    faqs: [
      { q: '¿Cuál es el pedido mínimo?', a: 'El pedido mínimo es de 5 empleados, equivalente a 250 € + IVA.' },
      { q: '¿Incluye la gestión mensual?', a: 'No. Es una implantación puntual; la gestión mensual se contrata por separado.' },
      { q: '¿Cómo se contrata?', a: 'Primero confirmamos el número de empleados a migrar. Después emitimos un presupuesto estructurado con la cantidad correcta (mínimo 5 empleados) y el pago se realiza desde el área privada.' },
    ],
  },
  {
    slug: 'holded-modulo-laboral',
    categoria: 'holded',
    name: 'Módulo Laboral Holded',
    shortDescription: 'Activación y configuración del módulo laboral en Holded: nóminas, contratos y gestión de empleados.',
    description:
      'Implantamos el módulo laboral de Holded para que puedas gestionar nóminas, contratos, altas y bajas en la Seguridad Social integradas directamente con tu contabilidad. Incluye configuración inicial, carga de empleados y prueba de funcionamiento.',
    price: '180 € + IVA',
    stripePriceId: 'price_1TZqKbLeYwwgvux4NHtVCmEV',
    duration: '3–5 días hábiles',
    includes: [
      'Configuración inicial del módulo laboral',
      'Carga de empleados y datos de nómina',
      'Integración con contabilidad y tesorería',
      'Prueba de generación de nóminas',
      'Soporte por email durante 15 días',
    ],
    faqs: [
      { q: '¿Incluye la gestión mensual de nóminas?', a: 'No. Este servicio cubre la configuración e implantación del módulo. La gestión mensual de nóminas es un servicio aparte.' },
      { q: '¿Necesito tener ya el resto de Holded configurado?', a: 'Sí, recomendamos tener al menos la empresa y la contabilidad configuradas antes de activar el módulo laboral.' },
    ],
  },
  {
    slug: 'holded-modulo-formacion',
    categoria: 'holded',
    name: 'Módulo Formación Holded',
    shortDescription: 'Sesión de 2 horas de formación práctica en Holded adaptada a tu nivel y flujo de trabajo.',
    description:
      'Como Holded Solution Partner, impartimos formación específica sobre los módulos de Holded que usas: facturación, contabilidad, inventario, proyectos o CRM. Sesión de 2 horas por videollamada, con grabación incluida.',
    price: '180 € + IVA',
    stripePriceId: 'price_1SyB8ULeYwwgvux4sZbYod1B',
    duration: '2 horas por sesión',
    includes: [
      'Sesión práctica de 2 h por videollamada',
      'Adaptada a los módulos que usas',
      'Grabación de la sesión incluida',
      'Soporte post-sesión por email (7 días)',
      'Reserva de horario tras el pago',
    ],
    faqs: [
      { q: '¿Puedo solicitar un tema concreto?', a: 'Sí. Nos dices en qué módulo necesitas formación y adaptamos el contenido.' },
      { q: '¿Cuántas sesiones necesito?', a: 'Depende del módulo. Para facturación básica suele bastar 1. Para contabilidad completa, 3–4 bloques.' },
    ],
  },
  {
    slug: 'holded-integraciones-api',
    categoria: 'holded',
    name: 'Otras Integraciones API Holded',
    shortDescription: 'Integración de Holded con herramientas externas mediante API: ecommerce, CRM y automatizaciones a medida.',
    description:
      'Conectamos Holded con tus herramientas externas mediante la API oficial: tienda online, CRM, plataformas de pago, herramientas de BI o cualquier software que uses. Incluye análisis de viabilidad, desarrollo del conector y pruebas de integración.',
    price: '180 € + IVA',
    stripePriceId: 'price_1TZqKeLeYwwgvux4pkUNsDms',
    duration: 'Variable según alcance',
    includes: [
      'Análisis de viabilidad de la integración',
      'Desarrollo del conector o automatización',
      'Pruebas de funcionamiento en entorno real',
      'Documentación básica de la integración',
      'Soporte técnico durante 15 días',
    ],
    faqs: [
      { q: '¿Qué herramientas se pueden integrar?', a: 'Cualquier herramienta con API REST. Las más habituales: WooCommerce, Shopify, Stripe, HubSpot, Zapier, Google Sheets y herramientas de BI.' },
      { q: '¿El precio es fijo para cualquier integración?', a: 'El precio base es 180 €. Si la integración es especialmente compleja, te presupuestamos el diferencial antes de iniciar.' },
    ],
  },

  // ── Formación ──────────────────────────────────────────────────────────────
  {
    slug: 'formacion-fiscal-contable',
    categoria: 'formacion',
    name: 'Formación Fiscal y Contable',
    shortDescription: 'Sesiones prácticas sobre fiscalidad, contabilidad y obligaciones tributarias.',
    description:
      'Impartimos formación práctica en materia fiscal y contable para autónomos, pymes y equipos de administración: IRPF, IVA, cierre contable, modelos tributarios, declaraciones y planificación fiscal. Bloques de 2 horas desde 180 €.',
    price: 'Desde 180 € + IVA / bloque de 2 h',
    duration: '2 horas por bloque',
    includes: [
      'Sesión online o presencial (según disponibilidad)',
      'Material didáctico y resumen escrito',
      'Ejercicios prácticos sobre casos reales',
      'Resolución de dudas en directo',
      'Grabación de la sesión (si es online)'
    ],
    faqs: [
      { q: '¿Puedo solicitar un tema específico?', a: 'Sí. La formación se adapta a tus necesidades concretas: cierre fiscal, IVA de importaciones, IRPF de expatriados, etc.' },
      { q: '¿Es posible hacer la formación para un equipo?', a: 'Sí, podemos adaptar el contenido y el formato para equipos de hasta 10 personas.' }
    ]
  },
  {
    slug: 'formacion-laboral-rrhh',
    categoria: 'formacion',
    name: 'Formación Laboral y RRHH',
    shortDescription: 'Formación sobre contratos, nóminas, gestión laboral y recursos humanos.',
    description:
      'Formación práctica para responsables de administración, gerentes y equipos de RRHH: tipos de contratos, nóminas, altas y bajas en Seguridad Social, gestión de ausencias, despidos y documentación laboral. Bloques de 2 horas desde 180 €.',
    price: 'Desde 180 € + IVA / bloque de 2 h',
    duration: '2 horas por bloque',
    includes: [
      'Sesión online o presencial',
      'Material didáctico adaptado',
      'Casos prácticos de gestión laboral',
      'Resolución de dudas',
      'Acceso a plantillas y modelos'
    ],
    faqs: [
      { q: '¿Es apta para personas sin formación previa en RRHH?', a: 'Sí, adaptamos el nivel al perfil del participante.' }
    ]
  },
  {
    slug: 'formacion-holded',
    categoria: 'formacion',
    name: 'Formación en Holded',
    shortDescription: 'Aprende a gestionar tu contabilidad, facturación y CRM en Holded.',
    description:
      'Como Holded Solution Partner, impartimos formación específica en el uso de Holded: módulos de facturación, contabilidad, inventario, proyectos y CRM. Sesiones de 2 horas adaptadas a tu nivel y caso de uso real. Precio: 180 € por bloque.',
    price: '180 € + IVA / bloque de 2 h',
    duration: '2 horas por bloque',
    includes: [
      'Sesión práctica sobre tu propio entorno Holded',
      'Recorrido por los módulos que uses',
      'Configuración de automatizaciones básicas',
      'Guía personalizada de uso',
      'Soporte post-sesión por email (7 días)'
    ],
    faqs: [
      { q: '¿Necesito tener Holded contratado para hacer la formación?', a: 'Sí, trabajamos directamente sobre tu cuenta. Si aún no tienes Holded, podemos ayudarte a configurarlo antes.' },
      { q: '¿Cuántos bloques de formación necesito?', a: 'Depende del módulo. Para facturación básica suele ser suficiente con 1–2 bloques. Para contabilidad completa, 3–4 bloques.' }
    ]
  },
  {
    slug: 'formacion-administraciones-publicas',
    categoria: 'formacion',
    name: 'Formación: Administraciones Públicas',
    shortDescription: 'Aprende a relacionarte con la AEAT, la Seguridad Social, Extranjería y otros organismos de forma autónoma.',
    description:
      'Formación práctica para autónomos, pymes y particulares que quieren entender cómo funcionan y comunicarse correctamente con los principales organismos públicos: AEAT (Sede Electrónica, certificados, notificaciones), Seguridad Social (Importass, vida laboral, altas/bajas), DGT, Extranjería y Registro Civil. Bloques de 2 horas desde 180 €.',
    price: 'Desde 180 € + IVA / bloque de 2 h',
    duration: '2 horas por bloque',
    includes: [
      'Sesión online o presencial',
      'Recorrido por la Sede Electrónica de la AEAT e Importass',
      'Cómo ver y gestionar notificaciones electrónicas',
      'Uso del certificado digital en organismos públicos',
      'Material de referencia con guías paso a paso'
    ],
    faqs: [
      { q: '¿Para quién está pensado este curso?', a: 'Para autónomos, pequeños empresarios y particulares que quieren gestionar sus propios trámites con la Administración sin depender siempre de un asesor.' },
      { q: '¿Puedo elegir los organismos que me interesan?', a: 'Sí, la formación se adapta a tus necesidades concretas: AEAT, SS, extranjería, DGT, etc.' }
    ]
  },
  {
    slug: 'formacion-alta-autonomo-sl',
    categoria: 'formacion',
    name: 'Formación: Alta de Autónomo y Constitución de SL',
    shortDescription: 'Todo lo que necesitas saber antes y después de darte de alta o constituir una sociedad.',
    description:
      'Formación práctica orientada a emprendedores y profesionales que van a iniciar su actividad: diferencias entre autónomo y sociedad limitada, obligaciones fiscales desde el día uno, cuotas de la Seguridad Social, facturación, IVA y gestión básica contable. Bloques de 2 horas desde 180 €.',
    price: 'Desde 180 € + IVA / bloque de 2 h',
    duration: '2 horas por bloque',
    includes: [
      'Autónomo vs. SL: cuándo conviene cada opción',
      'Obligaciones fiscales y de SS desde el inicio',
      'Cómo emitir facturas y gestionar el IVA',
      'Cuota de autónomos y cotización mínima',
      'Preguntas frecuentes del primer año de actividad'
    ],
    faqs: [
      { q: '¿Es apta para personas que aún no han empezado?', a: 'Sí, está diseñada para quienes están en la fase previa o acaban de darse de alta y quieren entender todo desde cero.' },
      { q: '¿Incluye asesoramiento personalizado?', a: 'La sesión es formativa, pero puedes plantear tu caso concreto y recibir orientación durante la misma.' }
    ]
  },
  {
    slug: 'formacion-planificacion-fiscal',
    categoria: 'formacion',
    name: 'Formación en Planificación Fiscal',
    shortDescription: 'Estrategias y herramientas para optimizar tu carga fiscal como autónomo, socio o empresa.',
    description:
      'Formación práctica sobre planificación y optimización fiscal para autónomos y pymes: reducción de la base imponible del IRPF, gastos deducibles, retribución óptima del socio-administrador, planes de pensiones, tributación de dividendos y estrategias para el cierre fiscal de fin de año. Bloques de 2 horas desde 180 €.',
    price: 'Desde 180 € + IVA / bloque de 2 h',
    duration: '2 horas por bloque',
    includes: [
      'Gastos deducibles reales vs. riesgo de inspección',
      'Retribución del socio-administrador: nómina vs. dividendo',
      'Aportaciones a planes de pensiones y su impacto fiscal',
      'Cierre fiscal de diciembre: qué puedes hacer antes de año nuevo',
      'Casos prácticos adaptados a tu situación'
    ],
    faqs: [
      { q: '¿Es útil si ya llevo varios años como autónomo?', a: 'Especialmente útil. Muchos autónomos no aprovechan todas las deducciones disponibles o cometen errores que generan inspecciones.' },
      { q: '¿Puedo aplicar lo aprendido de inmediato?', a: 'Sí. La formación es práctica y aplicable desde el primer día.' }
    ]
  }
];

export function getServicesByCategory(categoria: CategorySlug): Service[] {
  return services.filter((s) => s.categoria === categoria);
}

export function getService(categoria: CategorySlug, slug: string): Service | undefined {
  return services.find((s) => s.categoria === categoria && s.slug === slug);
}

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function getCatalogService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
