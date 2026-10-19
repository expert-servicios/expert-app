import type { KnowledgeDoc } from '@/lib/utils/docs';

// Contenido editorial publico. Fuentes primarias: PAE Virtual y manual SRL 27/05/2026.
// No almacenar datos ni respuestas de usuarios en esta guia.
export const CIRCE_REVIEW_DATE = '19 de octubre de 2026';
export const CIRCE_MANUAL_DATE = '27 de mayo de 2026';
export const CIRCE_GUIDE_PATH = '/herramientas/crear-sociedad-limitada';

export const circeResources = [
  {
    title: 'PAE Virtual: crear tu empresa por ti mismo',
    url: 'https://paeelectronico.es/es-es/CreaEmpresaPorTiMismo/Paginas/Home.aspx',
    detail: 'Entrada oficial al autoservicio para emprendedores, sin necesidad de gestoría.',
  },
  {
    title: 'Manual oficial del DUE para sociedades limitadas (PDF, 44 páginas)',
    url: 'https://paeelectronico.es/Documents/Formacion/SociedadResponsabilidadLimitada/Gu%C3%ADa_cumplimentaci%C3%B3n_DUE_SRL.pdf',
    detail: 'Edición oficial de 27/05/2026. Explica cada pestaña, documentos y firma.',
  },
  {
    title: 'Qué es CIRCE y qué gestiones integra',
    url: 'https://www.paeelectronico.es/es-es/CreaEmpresaPorTiMismo/Paginas/CIRCE.aspx',
    detail: 'Alcance de la ventanilla única, DUE y circuito de administraciones.',
  },
  {
    title: 'Mapa de trámites y advertencias de firma',
    url: 'https://www.paeelectronico.es/es-es/CreaEmpresaPorTiMismo/Paginas/MapaTramitesPae.aspx',
    detail: 'Disponibilidad según comunidad autónoma y revisión del PDF del DUE.',
  },
  {
    title: 'Aula de formación PAE',
    url: 'https://paeelectronico.es/es-es/Formacion/Paginas/Home.aspx',
    detail: 'Vídeos, tutoriales e infografías sobre el sistema oficial.',
  },
  {
    title: 'Registro Mercantil Central',
    url: 'https://www.rmc.es/',
    detail: 'Solicita la certificación negativa de denominación antes de rellenar el DUE.',
  },
  {
    title: 'Puntos de Atención al Emprendimiento (PAE)',
    url: 'https://www.paeelectronico.es/es-es/CreaEmpresaConAyuda/Paginas/ServiciosPae.aspx',
    detail: 'La asistencia obligatoria de constitución por PAE debe prestarse gratuitamente.',
  },
  {
    title: 'Ley de Sociedades de Capital (texto consolidado)',
    url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2010-10544',
    detail: 'Capital, socios, administradores y obligaciones mercantiles.',
  },
] as const;

export const circeSteps = [
  {
    id: 'decidir',
    title: 'Comprobar si la SL y CIRCE encajan en tu proyecto',
    summary: 'Antes de iniciar el trámite, define cómo participarán los socios, quién administrará y qué actividad realizará la sociedad.',
    actions: [
      'Valora la alternativa de emprender como persona física y las obligaciones permanentes de una sociedad.',
      'Acuerda participaciones, capital, administrador, domicilio, actividad y fecha de inicio prevista.',
      'Si vais a utilizar estatutos tipo, comprobád su encaje; pactos especiales, inversores o actividad regulada pueden requerir revisión.',
    ],
  },
  {
    id: 'preparar',
    title: 'Preparar los documentos previos',
    summary: 'El manual oficial establece qué documentación debe estar lista antes de abrir el DUE.',
    actions: [
      'Solicita al Registro Mercantil Central la certificación negativa de denominación social.',
      'Ten en vigor DNI/NIE de los socios; prepara certificado electrónico de al menos una persona socia para firmar el DUE.',
      'Reúne datos de aportaciones, participaciones, titularidad real, domicilio y, si procede, certificado bancario de aportación dineraria.',
      'La SL admite capital desde 1 €, pero por debajo de 3.000 € hay reglas de reserva y responsabilidad adicionales.',
    ],
  },
  {
    id: 'acceder',
    title: 'Acceder al PAE Virtual y crear el DUE',
    summary: 'Entra por la página oficial, identifícate con certificado electrónico y selecciona «Alta SRL».',
    actions: [
      'Para firmar y enviar el DUE de una SL, la guía oficial de mayo de 2026 exige certificado electrónico: Cl@ve por sí sola no es suficiente.',
      'Guarda primero la pestaña «Empresa» para que el sistema genere el código CIRCE.',
      'Anota el código CIRCE y guarda copias, siempre en un lugar seguro.',
    ],
  },
  {
    id: 'rellenar',
    title: 'Completar los apartados del DUE',
    summary: 'El DUE reúne los datos y los formularios que de otra manera habría que presentar ante varios organismos.',
    actions: [
      'Completa Empresa, Personas Socias, Titulares Reales y Entidades asociadas, si corresponde.',
      'Revisa Centros, Actividades, Declaración censal e ITP según las características de la sociedad.',
      'Añade Personas Trabajadoras cuando corresponda; verifica funciones de administradores y socios y su encuadramiento.',
      'Completa Datos Notaría, Facturación y Documentos. Antes del envío, revisa que las pestañas no tengan errores.',
    ],
  },
  {
    id: 'enviar',
    title: 'Revisar, firmar y enviar sin duplicar trámites',
    summary: 'Revisa el contenido del DUE en PDF antes de firmarlo y remitirlo.',
    actions: [
      'Descarga una copia del DUE-PDF para comprobar nombres, porcentajes, epígrafes, fechas, domicilios y opción de Seguridad Social.',
      'Firma y envía el DUE desde el sistema oficial; conserva el PDF, anexos, número CIRCE y justificantes.',
      'No solicites el NIF provisional por separado en la AEAT ni dupliques altas fiscales o de Seguridad Social mientras CIRCE tramita el expediente.',
    ],
  },
  {
    id: 'notaria',
    title: 'Otorgar la escritura notarial',
    summary: 'CIRCE coordina el procedimiento, pero no elimina la intervención notarial.',
    actions: [
      'Atiende la cita notarial y aporta la documentación que te requieran.',
      'Confirma el coste aplicable a tu caso y distingue los aranceles de otros suplidos o servicios.',
      'No confundas el envío del DUE con la inscripción final de la sociedad.',
    ],
  },
  {
    id: 'verificar',
    title: 'Comprobar la finalización y comenzar correctamente',
    summary: 'El circuito se encarga de los trámites integrados, pero tienes que verificar su resultado y cumplir las obligaciones futuras.',
    actions: [
      'Consulta el estado del expediente y guarda escritura, inscripción, NIF y justificantes fiscales o de Seguridad Social que correspondan.',
      'Si alguna comunicación o alta no se completó, resuélvela a partir del estado real del expediente, sin repetir trámites indiscriminadamente.',
      'Organiza contabilidad, facturación, Impuesto sobre Sociedades, libros y cuentas anuales; revisa licencias, RGPD y otras obligaciones específicas.',
    ],
  },
] as const;

export const circeFaqs = [
  {
    question: '¿Puedo constituir la SL por mi cuenta y sin pagar una gestoría?',
    answer: 'Sí. El PAE Virtual permite a la persona emprendedora cumplimentar y remitir el DUE. Aunque no contrates asesoría, siguen existiendo los costes externos que correspondan (denominación, notaría y Registro).',
  },
  {
    question: '¿CIRCE se encarga del modelo 036 y de Seguridad Social?',
    answer: 'Integra la declaración censal y los trámites iniciales de Seguridad Social que procedan, siempre que la información necesaria se incluya y el expediente finalice correctamente. No hay que duplicarlos por sistema tras constituir la SL.',
  },
  {
    question: '¿Debo solicitar el NIF provisional antes de abrir el DUE?',
    answer: 'No. El manual del PAE Virtual advierte expresamente de no solicitarlo por separado durante la tramitación CIRCE, porque puede causar errores o cancelación del expediente.',
  },
  {
    question: '¿Es suficiente utilizar Cl@ve para firmar el DUE?',
    answer: 'No para el DUE de constitución de una SL en el PAE Virtual, según la guía oficial de 27/05/2026: para firmar y enviar exige certificado electrónico. Revisa cualquier cambio en el portal oficial antes de empezar.',
  },
  {
    question: '¿Necesitan todos los socios un certificado digital?',
    answer: 'El manual oficial pide certificado electrónico de al menos una de las personas socias para el procedimiento de PAE Virtual. La documentación de identidad y las firmas o comparecencias de otras personas dependerán de su intervención.',
  },
  {
    question: '¿Puedo constituir una SL con 1 € de capital?',
    answer: 'Sí, legalmente desde 1 €. Hasta alcanzar 3.000 € de capital se aplican obligaciones específicas relativas a reserva legal y responsabilidad por diferencia en caso de liquidación con patrimonio insuficiente.',
  },
  {
    question: '¿Tengo que ir al notario?',
    answer: 'Sí: CIRCE coordina la constitución, pero se requiere el otorgamiento de escritura pública ante notario por el cauce que corresponda.',
  },
  {
    question: '¿Cuánto cuesta notaría y Registro?',
    answer: 'Hay aranceles reducidos para supuestos que cumplen condiciones específicas. La guía oficial cita 60 € de notaría y 40 € de Registro (más IVA) cuando capital y estatutos tipo encajan en el supuesto especial; no es una tarifa universal ni incluye todos los conceptos.',
  },
  {
    question: '¿Después de la inscripción puedo desentenderme de la sociedad si aún no facturo?',
    answer: 'No. Aunque no emita facturas, una sociedad puede tener obligaciones contables, mercantiles, censales y fiscales. CIRCE simplifica el alta inicial, no sustituye su mantenimiento posterior.',
  },
  {
    question: '¿La SL sustituye las políticas de privacidad de mi aplicación?',
    answer: 'No. La personalidad jurídica y el cumplimiento del RGPD son planos distintos. Hay que revisar quién trata datos, con qué finalidad, qué proveedores intervienen y qué obligaciones corresponden.',
  },
] as const;

export const circeKnowledgeDocs: KnowledgeDoc[] = [
  {
    slug: 'constituir-sl-circe-pae-virtual',
    category: 'empresas',
    title: 'Crear tu sociedad limitada por CIRCE y PAE Virtual: guía de autogestión',
    excerpt: 'Guía gratuita, basada en el manual oficial de mayo de 2026, para preparar, rellenar y firmar el DUE y comprobar el resultado sin duplicar trámites.',
    tags: ['CIRCE', 'PAE Virtual', 'DUE', 'sociedad limitada', 'constitución empresa', 'autogestión'],
    updatedAt: '19 oct 2026',
    readTime: '12 min',
    relatedServiceSlugs: ['constitucion-sl', 'constitucion-sl-circe'],
    relatedServiceCategories: ['empresas-autonomos'],
    seoTitle: 'Cómo constituir una SL por CIRCE y PAE Virtual | EXPERT',
    seoDescription: 'Guía gratuita para constituir tu SL personalmente: certificados, denominación, DUE, notaría y trámites integrados de AEAT, TGSS y Registro.',
    body: [
      '## Ruta guiada gratuita de EXPERT',
      'La guía interactiva, el itinerario de siete pasos y sus preguntas frecuentes se encuentran en [Crear tu SL con CIRCE](https://expertconsulting.es/herramientas/crear-sociedad-limitada). No exige registro ni contratar servicios.',
      '',
      '## Qué realiza CIRCE',
      'Mediante el Documento Único Electrónico (DUE) CIRCE unifica las comunicaciones de constitución, declaración censal inicial ante Hacienda, inscripción registral y altas de Seguridad Social que correspondan. No presentes por duplicado modelos o altas si el expediente está tramitándolos.',
      '',
      '## Antes de empezar',
      'Decide socios, aportaciones, porcentajes, administrador, estatutos, domicilio y actividad. Pide la certificación negativa de denominación en [Registro Mercantil Central](https://www.rmc.es/), prepara DNI/NIE y un certificado electrónico de al menos una persona socia. Revisa con el PAE la documentación de capital, incluido justificante bancario si procede.',
      '',
      '## Firma electrónica: certificado y Cl@ve',
      'La guía del PAE Virtual actualizada a 27/05/2026 indica que para firmar y enviar el DUE de SL se necesita **certificado electrónico**; Cl@ve no basta para esa operación.',
      '',
      '## Abrir el expediente',
      'Entra en [PAE Virtual](https://paeelectronico.es/es-es/CreaEmpresaPorTiMismo/Paginas/Home.aspx), selecciona «Alta SRL», cumplimenta y guarda «Empresa» para generar el código CIRCE.',
      '',
      '## Cumplimentación del DUE',
      'Revisa las pestañas: Empresa; Personas Socias; Titulares Reales; Entidades asociadas; Centros; Actividades; Declaración censal; ITP; Personas Trabajadoras; Datos Notaría; Facturación; Documentos. Su exigibilidad depende del caso y del propio sistema.',
      '',
      '## Revisar y enviar',
      'Antes de firmar y remitir, descarga y revisa el DUE-PDF y conserva expediente, justificantes y anexos. El manual recomienda que todas las pestañas queden sin errores. No solicites un NIF provisional separado durante el circuito CIRCE.',
      '',
      '## Notaría, Registro, Hacienda y Seguridad Social',
      'CIRCE coordina la notaría y tramita las comunicaciones a Registro, AEAT y TGSS en los supuestos correspondientes. Una vez tramitado, **verifica el estado real** y la recepción de las comunicaciones; solo actúa por separado si hay incidencias, trámites no cubiertos o requisitos adicionales.',
      '',
      '## Obligaciones futuras',
      'La constitución no dispensa de contabilidad, legalización de libros, cuentas anuales, Impuesto sobre Sociedades ni declaraciones periódicas que correspondan. Dependiendo de la actividad pueden existir autorizaciones, licencias, cumplimiento RGPD u otras obligaciones.',
      '',
      '## Manuales y normativa oficiales',
      '[Guía completa del DUE para SL, edición de mayo 2026](https://paeelectronico.es/Documents/Formacion/SociedadResponsabilidadLimitada/Gu%C3%ADa_cumplimentaci%C3%B3n_DUE_SRL.pdf).',
      '[Qué es CIRCE y qué trámites realiza](https://www.paeelectronico.es/es-es/CreaEmpresaPorTiMismo/Paginas/CIRCE.aspx).',
      '[Aula de formación PAE](https://paeelectronico.es/es-es/Formacion/Paginas/Home.aspx).',
      '[Mapa de trámites y recomendaciones sobre el DUE](https://www.paeelectronico.es/es-es/CreaEmpresaPorTiMismo/Paginas/MapaTramitesPae.aspx).',
      '[Ley de Sociedades de Capital](https://www.boe.es/buscar/act.php?id=BOE-A-2010-10544).',
      '',
      '## Revisión y alcance',
      'Contenido de EXPERT revisado el 19/10/2026 sobre fuentes oficiales, especialmente el manual de 27/05/2026. No sustituye los formularios oficiales ni una revisión específica de supuestos complejos.'
    ].join('\n'),
  },
];
