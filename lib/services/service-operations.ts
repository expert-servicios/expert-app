export type ServiceRequirement = {
  key: string;
  label: string;
  required: boolean;
  humanReviewIfMissing?: boolean;
};

export type ServiceDocumentRequirement = {
  key: string;
  label: string;
  required: boolean;
  condition?: string;
};

export type ServiceTaskTemplate = {
  key: string;
  title: string;
  description: string;
  priority: 'baja' | 'media' | 'alta' | 'critica';
  dueBusinessDays?: number;
  requiresHumanApproval?: boolean;
};

export type ServiceOperationProfile = {
  slug: string;
  displayName: string;
  category: string;
  version: string;
  officialSources: string[];
  requirements: ServiceRequirement[];
  documents: ServiceDocumentRequirement[];
  process: Array<{ key: string; title: string; description: string; humanGate?: boolean }>;
  initialTasks: ServiceTaskTemplate[];
  initialState: 'pendiente_documentacion' | 'nuevo';
  initialStatus: 'nuevo';
  initialPriority: 'baja' | 'media' | 'alta' | 'critica';
  nextAction: string;
  humanApprovalBeforeSubmission: true;
  clientSummary: string;
  kiaAdminInstruction: string;
};

const COMMON_FOREIGNER_REQUIREMENTS: ServiceRequirement[] = [
  { key: 'identity', label: 'Identidad y pasaporte/documento de viaje válidos', required: true, humanReviewIfMissing: true },
  { key: 'criminal_record', label: 'Antecedentes penales revisados cuando legalmente proceda', required: true, humanReviewIfMissing: true },
  { key: 'status_compatible', label: 'Situación migratoria compatible con la vía solicitada', required: true, humanReviewIfMissing: true },
];

const COMMON_FOREIGNER_DOCS: ServiceDocumentRequirement[] = [
  { key: 'passport', label: 'Copia completa del pasaporte/documento de viaje', required: true },
  { key: 'criminal_record_foreign', label: 'Certificado de antecedentes penales extranjero, legalizado/apostillado y traducido cuando proceda', required: true },
];

const EXTRANJERIA_TASKS = (service: string): ServiceTaskTemplate[] => [
  {
    key: 'review_viability',
    title: `Revisar viabilidad — ${service}`,
    description: 'Contrastar requisitos, situación migratoria y documentación con la normativa vigente antes de preparar la solicitud.',
    priority: 'alta',
    dueBusinessDays: 1,
    requiresHumanApproval: true,
  },
  {
    key: 'review_documents',
    title: `Validar documentación — ${service}`,
    description: 'Comprobar checklist documental, vigencia, traducciones, apostillas/legalizaciones y coherencia de datos.',
    priority: 'alta',
    dueBusinessDays: 2,
    requiresHumanApproval: true,
  },
  {
    key: 'prepare_application',
    title: `Preparar solicitud — ${service}`,
    description: 'Preparar formulario, tasa y expediente telemático. No presentar sin aprobación humana.',
    priority: 'media',
    requiresHumanApproval: true,
  },
];

export const SERVICE_OPERATION_PROFILES: Record<string, ServiceOperationProfile> = {
  'certificado-digital-persona-fisica': {
    slug: 'certificado-digital-persona-fisica',
    displayName: 'Certificado Digital Persona Física',
    category: 'certificado-digital',
    version: '2026-09-19',
    officialSources: [],
    requirements: [
      { key: 'holder_identity', label: 'Identidad del titular validada', required: true, humanReviewIfMissing: true },
      { key: 'contact_data', label: 'Datos de contacto y domicilio completos', required: true },
    ],
    documents: [
      { key: 'identity_doc', label: 'DNI/TIE/NIE y documento identificativo admitido', required: true },
      { key: 'contact_address', label: 'Domicilio y datos de contacto', required: true },
    ],
    process: [
      { key: 'identity', title: 'Validación de identidad', description: 'Verificar identidad del titular y documentación aportada.', humanGate: true },
      { key: 'issue', title: 'Emisión', description: 'Tramitar emisión del certificado.' },
      { key: 'install', title: 'Instalación y prueba', description: 'Instalar y comprobar funcionamiento con el cliente.' },
    ],
    initialTasks: [
      { key: 'identity', title: 'Validar identidad para certificado digital', description: 'Revisar identificación y datos del titular.', priority: 'alta', dueBusinessDays: 1, requiresHumanApproval: true },
      { key: 'issue', title: 'Emitir certificado digital persona física', description: 'Tramitación online tras identidad validada.', priority: 'alta', dueBusinessDays: 1 },
      { key: 'install', title: 'Instalar y probar certificado persona física', description: 'Completar instalación y prueba con el cliente.', priority: 'media', dueBusinessDays: 1 },
    ],
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    nextAction: 'Validar identidad y documentación para emisión online',
    humanApprovalBeforeSubmission: true,
    clientSummary: 'Aporta identificación y datos de contacto. EXPERT valida, tramita, instala y prueba el certificado.',
    kiaAdminInstruction: 'Prioriza identidad, documentación completa y SLA. No marques emitido sin confirmación operativa.',
  },
  'certificado-digital-entidad': {
    slug: 'certificado-digital-entidad',
    displayName: 'Certificado Digital de Entidad',
    category: 'certificado-digital',
    version: '2026-09-19',
    officialSources: [],
    requirements: [
      { key: 'representative_identity', label: 'Identidad del representante validada', required: true, humanReviewIfMissing: true },
      { key: 'entity_identity', label: 'Entidad y NIF/CIF identificados', required: true, humanReviewIfMissing: true },
      { key: 'representation', label: 'Facultades de representación comprobadas', required: true, humanReviewIfMissing: true },
    ],
    documents: [
      { key: 'representative_id', label: 'DNI/TIE/NIE del representante', required: true },
      { key: 'entity_tax_id', label: 'Razón social y NIF/CIF', required: true },
      { key: 'registry_docs', label: 'Escritura, nota mercantil o documentación registral', required: true },
      { key: 'powers', label: 'Poderes o nombramiento cuando proceda', required: false, condition: 'Cuando la representación no resulte directamente de la documentación registral' },
    ],
    process: [
      { key: 'identity', title: 'Validar identidad y entidad', description: 'Comprobar representante, entidad y documentación.', humanGate: true },
      { key: 'powers', title: 'Validar facultades', description: 'Comprobar facultades de representación.', humanGate: true },
      { key: 'issue', title: 'Emisión', description: 'Tramitar emisión del certificado.' },
      { key: 'install', title: 'Instalación y prueba', description: 'Instalar y comprobar funcionamiento.' },
    ],
    initialTasks: [
      { key: 'review_entity', title: 'Validar entidad y representación', description: 'Revisar NIF/CIF, documentación registral y facultades.', priority: 'alta', dueBusinessDays: 1, requiresHumanApproval: true },
      { key: 'issue', title: 'Emitir certificado digital de entidad', description: 'Tramitación online tras documentación y facultades validadas.', priority: 'alta', dueBusinessDays: 1 },
      { key: 'install', title: 'Instalar y probar certificado de entidad', description: 'Completar instalación y prueba.', priority: 'media', dueBusinessDays: 1 },
    ],
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    nextAction: 'Validar entidad, representación e identidad para emisión',
    humanApprovalBeforeSubmission: true,
    clientSummary: 'Aporta identificación del representante y documentación de la entidad. EXPERT valida facultades antes de emitir.',
    kiaAdminInstruction: 'Nunca asumas representación. Exige evidencia suficiente antes de avanzar a emisión.',
  },
  'pack-certificados-digitales': {
    slug: 'pack-certificados-digitales',
    displayName: 'Pack Certificados Digitales — Persona Física + Entidad',
    category: 'certificado-digital',
    version: '2026-09-19',
    officialSources: [],
    requirements: [
      { key: 'holder_identity', label: 'Identidad del titular validada', required: true, humanReviewIfMissing: true },
      { key: 'entity_identity', label: 'Entidad identificada', required: true, humanReviewIfMissing: true },
      { key: 'representation', label: 'Facultades de representación comprobadas', required: true, humanReviewIfMissing: true },
    ],
    documents: [
      { key: 'identity_doc', label: 'DNI/TIE/NIE del titular/representante', required: true },
      { key: 'contact_address', label: 'Domicilio y datos de contacto', required: true },
      { key: 'entity_tax_id', label: 'Razón social y NIF/CIF', required: true },
      { key: 'registry_docs', label: 'Escritura, nota mercantil o documentación registral', required: true },
      { key: 'powers', label: 'Poderes o nombramiento cuando proceda', required: false },
    ],
    process: [
      { key: 'review', title: 'Validación conjunta', description: 'Validar titular, entidad y representación.', humanGate: true },
      { key: 'personal', title: 'Certificado personal', description: 'Emitir e instalar certificado de persona física.' },
      { key: 'entity', title: 'Certificado de entidad', description: 'Emitir e instalar certificado de entidad.' },
    ],
    initialTasks: [
      { key: 'review', title: 'Validar documentación del pack de certificados', description: 'Revisar titular, entidad y facultades.', priority: 'alta', dueBusinessDays: 1, requiresHumanApproval: true },
      { key: 'personal', title: 'Emitir certificado digital persona física', description: 'Emitir la parte personal del pack.', priority: 'alta', dueBusinessDays: 1 },
      { key: 'entity', title: 'Emitir certificado digital de entidad', description: 'Emitir la parte de entidad del pack.', priority: 'alta', dueBusinessDays: 1 },
      { key: 'install', title: 'Instalar y probar ambos certificados', description: 'Cerrar instalación y prueba de ambos certificados.', priority: 'media', dueBusinessDays: 1 },
    ],
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    nextAction: 'Validar titular, entidad y facultades antes de emitir ambos certificados',
    humanApprovalBeforeSubmission: true,
    clientSummary: 'Un único expediente coordina los dos certificados y sus comprobaciones de identidad/representación.',
    kiaAdminInstruction: 'Mantén una sola vista del expediente pero tareas separadas para certificado personal y de entidad.',
  },
  'nacionalidad-espanola-menor-nacido-en-espana': {
    slug: 'nacionalidad-espanola-menor-nacido-en-espana',
    displayName: 'Nacionalidad española para menor nacido en España',
    category: 'extranjeria-nacionalidad',
    version: '2026-09-19',
    officialSources: ['https://sede.mjusticia.gob.es/es/tramites/nacionalidad-espanola'],
    requirements: [
      { key: 'born_spain', label: 'Nacimiento en España acreditado', required: true, humanReviewIfMissing: true },
      { key: 'legal_residence_one_year', label: 'Un año de residencia legal, continuada e inmediatamente anterior revisado', required: true, humanReviewIfMissing: true },
      { key: 'representation', label: 'Representación/firma del menor correctamente determinada según edad y patria potestad', required: true, humanReviewIfMissing: true },
    ],
    documents: [
      { key: 'birth_certificate', label: 'Certificación literal de nacimiento española', required: true },
      { key: 'minor_passport', label: 'Pasaporte completo y vigente del menor', required: true },
      { key: 'minor_residence', label: 'NIE/TIE y resolución que permita acreditar fecha de inicio de residencia legal', required: true },
      { key: 'empadronamiento', label: 'Empadronamiento familiar/colectivo actualizado', required: true },
      { key: 'parents_ids', label: 'Pasaportes y NIE/TIE de progenitores/representantes', required: true },
      { key: 'school', label: 'Documentación escolar cuando corresponda', required: false },
    ],
    process: [
      { key: 'viability', title: 'Comprobar plazo y representación', description: 'Verificar año de residencia legal y representación.', humanGate: true },
      { key: 'documents', title: 'Revisar expediente documental', description: 'Validar documentos del menor y representantes.', humanGate: true },
      { key: 'fee', title: 'Gestionar tasa 790-026', description: 'Gestionar suplido/tasa cuando corresponda.' },
      { key: 'submit', title: 'Presentación', description: 'Presentar telemáticamente solo tras aprobación humana.', humanGate: true },
    ],
    initialTasks: EXTRANJERIA_TASKS('Nacionalidad menor nacido en España'),
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    nextAction: 'Validar un año de residencia legal y documentación del menor',
    humanApprovalBeforeSubmission: true,
    clientSummary: 'Primero comprobamos el año de residencia legal del menor y la representación; después cerramos documentación y presentación.',
    kiaAdminInstruction: 'No confundas fecha de nacimiento, fecha de TIE y fecha efectiva de residencia legal. Escala cualquier duda de patria potestad.',
  },
  'arraigo-social': {
    slug: 'arraigo-social',
    displayName: 'Arraigo Social',
    category: 'extranjeria-nacionalidad',
    version: '2026-04',
    officialSources: ['https://www.inclusion.gob.es/web/migraciones/w/autorizacion-residencia-temporal-por-circunstancias-excepcionales.-arraigo-social'],
    requirements: [
      ...COMMON_FOREIGNER_REQUIREMENTS,
      { key: 'two_years', label: 'Permanencia continuada mínima de 2 años acreditada', required: true, humanReviewIfMissing: true },
      { key: 'route', label: 'Vía familiar + medios o informe favorable de integración social determinada', required: true, humanReviewIfMissing: true },
      { key: 'means', label: 'Medios económicos revisados cuando se utiliza vía familiar', required: false },
    ],
    documents: [
      ...COMMON_FOREIGNER_DOCS,
      { key: 'continuity', label: 'Pruebas de permanencia continuada durante al menos 2 años', required: true },
      { key: 'family_link', label: 'Documentación de vínculos familiares cuando se use esa vía', required: false },
      { key: 'means', label: 'Documentación de medios económicos cuando proceda', required: false },
      { key: 'integration_report', label: 'Informe favorable de integración social cuando proceda', required: false },
      { key: 'ex10', label: 'Formulario EX-10', required: true },
    ],
    process: [
      { key: 'timeline', title: 'Reconstruir permanencia', description: 'Comprobar 2 años y periodos no computables.', humanGate: true },
      { key: 'route', title: 'Determinar vía', description: 'Vínculos familiares + medios o integración social.', humanGate: true },
      { key: 'documents', title: 'Cerrar documentación', description: 'Revisar antecedentes, permanencia y documentos específicos.', humanGate: true },
      { key: 'submit', title: 'Preparar y presentar', description: 'EX-10, tasa y Mercurio; presentación requiere aprobación humana.', humanGate: true },
    ],
    initialTasks: EXTRANJERIA_TASKS('Arraigo Social'),
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    nextAction: 'Comprobar 2 años de permanencia y determinar vía familiar/integración',
    humanApprovalBeforeSubmission: true,
    clientSummary: 'KIA te ayuda a ordenar permanencia, vínculos/medios o informe de integración y documentos antes de revisión profesional.',
    kiaAdminInstruction: 'Aplica RD 1155/2024 y hoja 28 actualizada en abril de 2026. No pedir contrato de trabajo como requisito específico de arraigo social.',
  },
  'arraigo-familiar': {
    slug: 'arraigo-familiar',
    displayName: 'Arraigo Familiar',
    category: 'extranjeria-nacionalidad',
    version: '2026-04',
    officialSources: ['https://www.inclusion.gob.es/web/migraciones/w/autorizacion-residencia-temporal-por-circunstancias-excepcionales.-arraigo-familiar'],
    requirements: [
      ...COMMON_FOREIGNER_REQUIREMENTS,
      { key: 'qualifying_family_case', label: 'Supuesto legal de arraigo familiar vigente identificado', required: true, humanReviewIfMissing: true },
      { key: 'care_or_support', label: 'Convivencia/cargo/obligaciones familiares acreditadas según el supuesto', required: true, humanReviewIfMissing: true },
    ],
    documents: [
      ...COMMON_FOREIGNER_DOCS,
      { key: 'family_identity', label: 'Documento de identidad/nacionalidad del familiar de referencia', required: true },
      { key: 'family_link', label: 'Documento acreditativo del vínculo familiar', required: true },
      { key: 'care_evidence', label: 'Prueba de convivencia, cargo, tutela, apoyo u obligaciones paternofiliales según el supuesto', required: true },
      { key: 'ex10', label: 'Formulario EX-10', required: true },
    ],
    process: [
      { key: 'route', title: 'Identificar supuesto legal', description: 'No asumir que cualquier vínculo con español/residente encaja en arraigo familiar.', humanGate: true },
      { key: 'family', title: 'Acreditar vínculo y situación', description: 'Revisar vínculo, convivencia/cargo/apoyo según el supuesto.', humanGate: true },
      { key: 'submit', title: 'Preparar y presentar', description: 'Preparación de EX-10 y tasa; presentación con aprobación humana.', humanGate: true },
    ],
    initialTasks: EXTRANJERIA_TASKS('Arraigo Familiar'),
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    nextAction: 'Identificar el supuesto vigente de arraigo familiar y acreditar vínculo/cargo',
    humanApprovalBeforeSubmission: true,
    clientSummary: 'Primero identificamos si tu vínculo encaja en uno de los supuestos vigentes; después pedimos la documentación exacta.',
    kiaAdminInstruction: 'Usa la hoja 31 vigente de abril de 2026. No reutilices los supuestos amplios del RD 557/2011 como si siguieran iguales.',
  },
  'arraigo-laboral': {
    slug: 'arraigo-laboral',
    displayName: 'Arraigo Sociolaboral',
    category: 'extranjeria-nacionalidad',
    version: '2026-04',
    officialSources: ['https://www.inclusion.gob.es/web/migraciones/w/29.-autorizacion-de-residencia-temporal-por-circunstancias-excepcionales.-arraigo-sociolaboral.'],
    requirements: [
      ...COMMON_FOREIGNER_REQUIREMENTS,
      { key: 'two_years', label: 'Permanencia continuada mínima de 2 años acreditada', required: true, humanReviewIfMissing: true },
      { key: 'contracts', label: 'Uno o varios contratos válidos con jornada global mínima de 20 horas semanales', required: true, humanReviewIfMissing: true },
      { key: 'salary', label: 'Salario conforme SMI/convenio en proporción a jornada', required: true, humanReviewIfMissing: true },
      { key: 'employer', label: 'Empleador/es al corriente y con solvencia suficiente', required: true, humanReviewIfMissing: true },
    ],
    documents: [
      ...COMMON_FOREIGNER_DOCS,
      { key: 'continuity', label: 'Pruebas de permanencia continuada durante al menos 2 años', required: true },
      { key: 'contracts', label: 'Contrato/s firmado/s por empleador/es y trabajador', required: true },
      { key: 'employer_tax_id', label: 'NIF y documentación societaria/representación del empleador cuando proceda', required: true },
      { key: 'employer_solvency', label: 'Documentación de solvencia del empleador (IRPF/IVA/IS/VILE, según proceda)', required: true },
      { key: 'qualification', label: 'Titulación/homologación cuando la profesión lo exija', required: false },
      { key: 'ex10', label: 'Formulario EX-10', required: true },
    ],
    process: [
      { key: 'timeline', title: 'Comprobar permanencia', description: 'Revisar 2 años y periodos de protección internacional.', humanGate: true },
      { key: 'contracts', title: 'Validar contratos', description: 'Comprobar jornada global, salario y firmas.', humanGate: true },
      { key: 'employer', title: 'Validar empleador', description: 'Revisar obligaciones y solvencia.', humanGate: true },
      { key: 'submit', title: 'Preparar y presentar', description: 'EX-10, tasa y Mercurio; no presentar sin aprobación humana.', humanGate: true },
    ],
    initialTasks: EXTRANJERIA_TASKS('Arraigo Sociolaboral'),
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    nextAction: 'Validar permanencia, contrato/s, jornada, salario y solvencia del empleador',
    humanApprovalBeforeSubmission: true,
    clientSummary: 'La vía vigente es arraigo sociolaboral: revisamos 2 años de permanencia y contrato/s antes de preparar el expediente.',
    kiaAdminInstruction: 'No usar la antigua lógica de acta ITSS/sentencia como requisito central. Aplicar hoja 29 vigente y RD 1155/2024.',
  },
  'renovacion-residencia': {
    slug: 'renovacion-residencia',
    displayName: 'Renovación de Residencia',
    category: 'extranjeria-nacionalidad',
    version: '2026-09-19',
    officialSources: ['https://www.inclusion.gob.es/web/migraciones/vivir-en-espana'],
    requirements: [
      { key: 'permit_type', label: 'Tipo exacto de autorización actual identificado', required: true, humanReviewIfMissing: true },
      { key: 'deadline', label: 'Fecha de caducidad y ventana de presentación verificadas', required: true, humanReviewIfMissing: true },
      { key: 'renewal_conditions', label: 'Requisitos específicos de renovación de esa autorización comprobados', required: true, humanReviewIfMissing: true },
    ],
    documents: [
      { key: 'tie', label: 'TIE actual', required: true },
      { key: 'passport', label: 'Pasaporte completo y vigente', required: true },
      { key: 'resolution', label: 'Resolución de la autorización vigente/anterior', required: true },
      { key: 'specific_evidence', label: 'Documentación específica según tipo de autorización', required: true },
    ],
    process: [
      { key: 'classify', title: 'Clasificar autorización', description: 'Identificar la autorización exacta; no usar checklist genérico para presentar.', humanGate: true },
      { key: 'deadline', title: 'Comprobar plazo', description: 'Revisar caducidad y ventana legal.', humanGate: true },
      { key: 'specific', title: 'Aplicar requisitos específicos', description: 'Cargar checklist de la autorización concreta.', humanGate: true },
      { key: 'submit', title: 'Presentación', description: 'Presentar solo tras revisión profesional.', humanGate: true },
    ],
    initialTasks: EXTRANJERIA_TASKS('Renovación de Residencia'),
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    nextAction: 'Identificar autorización exacta y plazo antes de solicitar documentos específicos',
    humanApprovalBeforeSubmission: true,
    clientSummary: 'KIA primero identifica qué autorización renuevas; después carga los requisitos específicos y el equipo valida el expediente.',
    kiaAdminInstruction: 'Servicio paraguas: nunca presentes usando una checklist genérica. Clasifica la autorización antes de automatizar siguientes pasos.',
  },
  'nacionalidad-espanola': {
    slug: 'nacionalidad-espanola',
    displayName: 'Nacionalidad Española por Residencia',
    category: 'extranjeria-nacionalidad',
    version: '2026-09-19',
    officialSources: ['https://sede.mjusticia.gob.es/es/tramites/nacionalidad-espanola'],
    requirements: [
      { key: 'route', label: 'Plazo de residencia aplicable identificado', required: true, humanReviewIfMissing: true },
      { key: 'legal_continuous_residence', label: 'Residencia legal, continuada e inmediatamente anterior verificada', required: true, humanReviewIfMissing: true },
      { key: 'good_conduct_integration', label: 'Buena conducta cívica e integración revisadas', required: true, humanReviewIfMissing: true },
      { key: 'tests', label: 'CCSE/DELE o exención/dispensa revisados', required: true, humanReviewIfMissing: true },
    ],
    documents: [
      { key: 'passport', label: 'Pasaporte completo y vigente', required: true },
      { key: 'tie', label: 'TIE/NIE y resoluciones relevantes', required: true },
      { key: 'birth_certificate', label: 'Certificado de nacimiento del país de origen, legalizado/apostillado y traducido cuando proceda', required: true },
      { key: 'criminal_record', label: 'Antecedentes penales del país de origen, cuando proceda', required: true },
      { key: 'tests', label: 'Certificados CCSE/DELE o documentación de exención/dispensa', required: false },
      { key: 'special_route', label: 'Documentación adicional de la vía reducida cuando proceda', required: false },
    ],
    process: [
      { key: 'route', title: 'Determinar plazo aplicable', description: '10/5/2/1 años u otro supuesto legal.', humanGate: true },
      { key: 'timeline', title: 'Auditar residencia', description: 'Comprobar continuidad y ausencias.', humanGate: true },
      { key: 'documents', title: 'Cerrar documentación y pruebas', description: 'Revisar certificados, exámenes/exenciones y coherencia documental.', humanGate: true },
      { key: 'submit', title: 'Presentar en Justicia', description: 'Presentación telemática tras aprobación humana.', humanGate: true },
    ],
    initialTasks: EXTRANJERIA_TASKS('Nacionalidad Española'),
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    nextAction: 'Determinar plazo aplicable y auditar residencia legal continuada',
    humanApprovalBeforeSubmission: true,
    clientSummary: 'Primero determinamos tu plazo legal y revisamos continuidad de residencia; después cerramos documentos y pruebas.',
    kiaAdminInstruction: 'No deduzcas el plazo solo por nacionalidad declarada; valida vía, residencia y documentos antes de presentar.',
  },
  'reagrupacion-familiar': {
    slug: 'reagrupacion-familiar',
    displayName: 'Reagrupación Familiar',
    category: 'extranjeria-nacionalidad',
    version: '2025-05',
    officialSources: ['https://www.inclusion.gob.es/web/migraciones/w/autorizacion-de-residencia-temporal-por-reagrupacion-familiar'],
    requirements: [
      { key: 'sponsor_status', label: 'Residencia/situación del reagrupante apta para reagrupar', required: true, humanReviewIfMissing: true },
      { key: 'family_member', label: 'Familiar incluido en los supuestos reagrupables', required: true, humanReviewIfMissing: true },
      { key: 'means', label: 'Medios económicos suficientes acreditados', required: true, humanReviewIfMissing: true },
      { key: 'housing', label: 'Vivienda adecuada/informe cuando proceda', required: true, humanReviewIfMissing: true },
      { key: 'healthcare', label: 'Asistencia sanitaria garantizada cuando proceda', required: true, humanReviewIfMissing: true },
    ],
    documents: [
      { key: 'ex02', label: 'Formulario EX-02', required: true },
      { key: 'sponsor_passport', label: 'Pasaporte/documento del reagrupante', required: true },
      { key: 'sponsor_residence', label: 'TIE/resolución de residencia del reagrupante', required: true },
      { key: 'means', label: 'Documentación de empleo/recursos económicos', required: true },
      { key: 'housing', label: 'Informe/documentación de vivienda adecuada', required: true },
      { key: 'family_link', label: 'Documentación de parentesco legalizada/apostillada y traducida cuando proceda', required: true },
      { key: 'family_passport', label: 'Pasaporte del familiar a reagrupar', required: true },
      { key: 'healthcare', label: 'Cobertura sanitaria cuando proceda', required: false },
    ],
    process: [
      { key: 'sponsor', title: 'Validar reagrupante', description: 'Revisar residencia y derecho a reagrupar.', humanGate: true },
      { key: 'family', title: 'Validar familiar', description: 'Comprobar parentesco y supuesto reagrupable.', humanGate: true },
      { key: 'means_housing', title: 'Medios y vivienda', description: 'Revisar recursos, vivienda y sanidad.', humanGate: true },
      { key: 'submit', title: 'Preparar EX-02 y presentar', description: 'Presentar tras revisión profesional.', humanGate: true },
    ],
    initialTasks: EXTRANJERIA_TASKS('Reagrupación Familiar'),
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    nextAction: 'Validar derecho del reagrupante, familiar, medios y vivienda',
    humanApprovalBeforeSubmission: true,
    clientSummary: 'KIA ordena la situación del reagrupante, parentesco, medios, vivienda y documentos antes de revisión profesional.',
    kiaAdminInstruction: 'Distingue claramente persona reagrupante y familiar reagrupado. Escala ascendientes y supuestos especiales.',
  },
};

export const BATCH1_OPERATION_SLUGS = Object.keys(SERVICE_OPERATION_PROFILES);

export function getServiceOperationProfile(slug: string): ServiceOperationProfile | null {
  return SERVICE_OPERATION_PROFILES[slug] ?? null;
}

export function getServiceDocumentChecklist(slug: string): string[] {
  return getServiceOperationProfile(slug)?.documents.map((item) => item.label) ?? [];
}

export function getServiceRequirementChecklist(slug: string): string[] {
  return getServiceOperationProfile(slug)?.requirements.map((item) => item.label) ?? [];
}

export function getServiceInitialTasks(slug: string): ServiceTaskTemplate[] {
  return getServiceOperationProfile(slug)?.initialTasks ?? [];
}
