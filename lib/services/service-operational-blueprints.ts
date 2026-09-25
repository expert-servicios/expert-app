export type ServiceOperationPriority = 'baja' | 'media' | 'alta' | 'critica';

export type ServiceRequirementRule = {
  key: string;
  label: string;
  required: boolean;
  clientCheckable: boolean;
  reviewIf?: string;
};

export type ServiceDocumentRule = {
  key: string;
  label: string;
  required: boolean;
  conditionalWhen?: string;
  notes?: string;
};

export type ServiceReferenceLink = {
  label: string;
  url: string;
};

export type ServiceCaseStep = {
  key: string;
  title: string;
  description: string;
  clientVisible: boolean;
  humanApprovalRequired?: boolean;
  referenceUrls?: ServiceReferenceLink[];
};

export type ServiceTaskTemplate = {
  key: string;
  title: string;
  description: string;
  priority: ServiceOperationPriority;
  phase: string;
  humanApprovalRequired?: boolean;
  dueBusinessDays?: number;
  dependsOn?: string[];
  blocksSubmission?: boolean;
  skipAllowed?: boolean;
  clientActionRequired?: boolean;
  clientAction?: {
    es: string;
    ru: string;
  };
  referenceUrls?: ServiceReferenceLink[];
};

export type ServiceOperationalBlueprint = {
  slug: string;
  canonicalName: string;
  category: string;
  aliases?: string[];
  initialState: string;
  initialStatus: 'nuevo';
  initialPriority: ServiceOperationPriority;
  initialNextAction: string;
  requirements: ServiceRequirementRule[];
  documents: ServiceDocumentRule[];
  steps: ServiceCaseStep[];
  tasks: ServiceTaskTemplate[];
  kia: {
    userSummary: string;
    adminSummary: string;
    escalationRules: string[];
  };
};

function immigrationCommonDocuments(): ServiceDocumentRule[] {
  return [
    { key: 'passport', label: 'Pasaporte completo y en vigor', required: true },
    {
      key: 'criminal_record',
      label: 'Certificado de antecedentes penales del país o países exigibles, legalizado/apostillado y traducido cuando proceda',
      required: true,
    },
  ];
}

function immigrationCaseSteps(applicationLabel: string): ServiceCaseStep[] {
  return [
    {
      key: 'intake',
      title: 'Validación inicial',
      description: 'Comprobar identidad, vía jurídica, requisitos de acceso y posibles bloqueos antes de preparar el expediente.',
      clientVisible: true,
    },
    {
      key: 'documents',
      title: 'Revisión documental',
      description: 'Comprobar que la documentación obligatoria y condicional está completa, vigente y coherente.',
      clientVisible: true,
    },
    {
      key: 'prepare',
      title: 'Preparación del expediente',
      description: `Preparar ${applicationLabel}, anexos y paquete documental para presentación.`,
      clientVisible: true,
    },
    {
      key: 'submit',
      title: 'Presentación',
      description: 'Presentar ante la Administración competente únicamente después de revisión profesional.',
      clientVisible: true,
      humanApprovalRequired: true,
    },
    {
      key: 'follow_up',
      title: 'Seguimiento',
      description: 'Registrar justificante, número de expediente, requerimientos y siguiente acción.',
      clientVisible: true,
    },
  ];
}

function immigrationTasks(serviceName: string, applicationLabel: string): ServiceTaskTemplate[] {
  return [
    {
      key: 'validate',
      title: `Validar requisitos — ${serviceName}`,
      description: 'Revisar encaje jurídico, requisitos, incidencias y documentación mínima antes de continuar.',
      priority: 'alta',
      phase: 'intake',
      dueBusinessDays: 1,
    },
    {
      key: 'review_documents',
      title: `Revisar documentación — ${serviceName}`,
      description: 'Comprobar documentos recibidos contra el checklist canónico y registrar faltantes.',
      priority: 'media',
      phase: 'documents',
    },
    {
      key: 'prepare_application',
      title: `Preparar ${applicationLabel} — ${serviceName}`,
      description: 'Preparar formularios, anexos, tasas y paquete de presentación según la vía validada.',
      priority: 'media',
      phase: 'prepare',
    },
    {
      key: 'submit',
      title: `Presentar expediente — ${serviceName}`,
      description: 'Acción profesional. Confirmar que el expediente está listo antes de presentar.',
      priority: 'alta',
      phase: 'submit',
      humanApprovalRequired: true,
    },
    {
      key: 'follow_up',
      title: `Registrar y seguir expediente — ${serviceName}`,
      description: 'Guardar justificante/número de expediente y controlar requerimientos o resolución.',
      priority: 'media',
      phase: 'follow_up',
    },
  ];
}


const NATIONALITY_SURNAME_GUIDE = '/docs/apellidos-menor-nacionalidad-registro-civil';
const NATIONALITY_SURNAME_BOE = 'https://www.boe.es/buscar/act.php?id=BOE-A-2007-12948';
const NATIONALITY_REGISTRY_ORDER_BOE = 'https://www.boe.es/buscar/act.php?id=BOE-A-2011-12628#a49';
const NATIONALITY_OFFICIAL_PROCEDURE = 'https://sede.mjusticia.gob.es/es/tramites/nacionalidad-espanola';
const NATIONALITY_SIGNATURE_GUIDE = '/docs/firmar-solicitud-nacionalidad-menor-progenitores';

function nationalityMinorSteps(): ServiceCaseStep[] {
  const surnameReferences = [
    { label: 'Guía EXPERT sobre apellidos', url: NATIONALITY_SURNAME_GUIDE },
    { label: 'Instrucción DGRN 23/05/2007', url: NATIONALITY_SURNAME_BOE },
    { label: 'Ley del Registro Civil, art. 49', url: NATIONALITY_REGISTRY_ORDER_BOE },
  ];

  return [
    {
      key: 'intake',
      title: 'Validación inicial y documentación',
      description: 'Comprobar nacimiento en España, identidad, documentación disponible, patria potestad y bloqueos antes de preparar ningún formulario.',
      clientVisible: true,
    },
    {
      key: 'representation_mandate',
      title: 'Representación y mandato',
      description: 'Confirmar quién firma por el menor, formalizar el mandato de representación de EXPERT cuando proceda y conservar tanto el documento firmado como su certificado de finalización.',
      clientVisible: true,
    },
    {
      key: 'legal_residence',
      title: 'Residencia legal del menor',
      description: 'Fijar documentalmente la fecha de inicio de residencia legal del menor y comprobar el año legal, continuado e inmediatamente anterior a la solicitud.',
      clientVisible: true,
    },
    {
      key: 'registry_surnames',
      title: 'Apellidos y futura inscripción registral',
      description: 'Separar la identidad extranjera actual de los apellidos que corresponderán en la inscripción española. Verificar filiación, apellido personal de la madre antes de cambios por matrimonio y orden de apellidos. La duplicación de un apellido no se ofrece como preferencia si la línea materna está determinada y acreditada.',
      clientVisible: true,
      referenceUrls: surnameReferences,
    },
    {
      key: 'official_application',
      title: 'Preparación del modelo oficial',
      description: 'Rellenar la solicitud con los datos actuales de identidad exactamente como constan en la documentación vigente y con los datos registrales previamente validados.',
      clientVisible: true,
    },
    {
      key: 'signatures',
      title: 'Firmas del modelo',
      description: 'Obtener las firmas válidas según edad y patria potestad. En menores de 14 años, los progenitores que ejercen la patria potestad firman como representantes legales; el representante voluntario es la persona mandataria que presenta. No reutilizar versiones retiradas u obsoletas.',
      clientVisible: true,
      referenceUrls: [{ label: 'Guía EXPERT de firmas', url: NATIONALITY_SIGNATURE_GUIDE }],
    },
    {
      key: 'final_review',
      title: 'Validación pre-presentación',
      description: 'KIA ejecuta la validación pre-presentación de documentación, mandato, apellidos, formulario, firmas, tasa y coherencia global hasta dejar el expediente listo para presentar. Solo escala excepciones no resolubles; la presentación final conserva aprobación profesional.',
      clientVisible: true,
      referenceUrls: [{ label: 'Sede del Ministerio de Justicia', url: NATIONALITY_OFFICIAL_PROCEDURE }],
    },
    {
      key: 'fee',
      title: 'Tasa 790-026',
      description: 'Abonar la tasa oficial solo cuando el expediente esté validado, evitando cualquier pago duplicado y archivando el justificante.',
      clientVisible: true,
    },
    {
      key: 'submit',
      title: 'Presentación y justificante',
      description: 'Presentar telemáticamente únicamente tras autorización profesional expresa y archivar el justificante y número de registro.',
      clientVisible: true,
      humanApprovalRequired: true,
      referenceUrls: [{ label: 'Sede del Ministerio de Justicia', url: NATIONALITY_OFFICIAL_PROCEDURE }],
    },
    {
      key: 'follow_up',
      title: 'Seguimiento',
      description: 'Controlar estado, requerimientos, notificaciones, resolución y siguientes actuaciones.',
      clientVisible: true,
    },
  ];
}

function nationalityMinorTasks(): ServiceTaskTemplate[] {
  const surnameReferences = [
    { label: 'Guía EXPERT sobre apellidos', url: NATIONALITY_SURNAME_GUIDE },
    { label: 'Instrucción DGRN 23/05/2007', url: NATIONALITY_SURNAME_BOE },
    { label: 'Ley del Registro Civil, art. 49', url: NATIONALITY_REGISTRY_ORDER_BOE },
  ];

  return [
    {
      key: 'review_documents',
      title: 'Revisar expediente de nacionalidad recién pagado',
      description: 'Revisar documentación recibida, identificar al menor y a ambos progenitores/representantes, registrar faltantes reales y no pedir de nuevo documentos ya disponibles.',
      priority: 'alta',
      phase: 'intake',
      dueBusinessDays: 1,
    },
    {
      key: 'prepare_representation_mandate',
      title: 'Formalizar mandato y representación — Nacionalidad menor',
      description: 'Verificar patria potestad y representación. Si EXPERT presenta telemáticamente, preparar el mandato, obtener las firmas necesarias y conservar el documento firmado.',
      priority: 'alta',
      phase: 'representation_mandate',
      dependsOn: ['review_documents'],
      blocksSubmission: true,
    },
    {
      key: 'verify_legal_residence_start',
      title: 'Verificar inicio de residencia legal — Nacionalidad menor',
      description: 'Determinar con evidencia la fecha de inicio de residencia legal propia del menor y comprobar el año legal, continuado e inmediatamente anterior.',
      priority: 'critica',
      phase: 'legal_residence',
      dependsOn: ['review_documents'],
      blocksSubmission: true,
    },
    {
      key: 'confirm_maternal_birth_surname',
      title: 'Verificar apellido personal de la madre — Nacionalidad menor',
      description: 'Si la madre usa o usó un apellido adquirido por matrimonio, identificar su apellido personal/de nacimiento y revisar primero la documentación familiar ya disponible. Solicitar prueba adicional solo si realmente hace falta.',
      priority: 'alta',
      phase: 'registry_surnames',
      dependsOn: ['review_documents'],
      blocksSubmission: true,
      referenceUrls: surnameReferences,
    },
    {
      key: 'confirm_registry_surname_order',
      title: 'Confirmar apellidos y orden registral — Nacionalidad menor',
      description: 'Determinar los apellidos por filiación y confirmar su orden con ambos progenitores. Comprobar si existe un orden previo para hermanos con la misma filiación. No marcar que se desconoce el apellido materno ni duplicar un apellido para evitar documentación cuando ese dato es conocido o acreditable.',
      priority: 'alta',
      phase: 'registry_surnames',
      dependsOn: ['confirm_maternal_birth_surname'],
      blocksSubmission: true,
      clientActionRequired: true,
      clientAction: {
        es: 'Confirmar con ambos progenitores los apellidos del menor y el orden elegido para la futura inscripción española.',
        ru: 'Подтвердить с обоими родителями фамилии ребёнка и выбранный порядок для будущей испанской регистрации.',
      },
      referenceUrls: surnameReferences,
    },
    {
      key: 'prepare_official_application',
      title: 'Preparar modelo oficial — Nacionalidad menor',
      description: 'Rellenar el modelo oficial distinguiendo la identidad extranjera vigente del menor de los datos previstos para la futura inscripción española. No enviar a firma hasta cerrar residencia, representación y apellidos.',
      priority: 'alta',
      phase: 'official_application',
      dependsOn: ['prepare_representation_mandate', 'verify_legal_residence_start', 'confirm_registry_surname_order'],
      blocksSubmission: true,
      referenceUrls: [{ label: 'Sede del Ministerio de Justicia', url: NATIONALITY_OFFICIAL_PROCEDURE }],
    },
    {
      key: 'obtain_application_signatures',
      title: 'Obtener firmas del modelo oficial — Nacionalidad menor',
      description: 'Obtener y verificar las firmas válidas. En menor de 14 años con ambos progenitores ejerciendo patria potestad, ambos firman en «Representante legal (si procede)». «Representante voluntario (si procede)» corresponde a la persona mandataria que presenta, normalmente Ksenia ILICHEVA cuando el mandato la designa. Invalidar expresamente cualquier versión anterior retirada.',
      priority: 'alta',
      phase: 'signatures',
      dependsOn: ['prepare_official_application'],
      blocksSubmission: true,
      clientActionRequired: true,
      clientAction: {
        es: 'Firmar la versión final del modelo oficial que EXPERT haya validado y enviado expresamente para firma.',
        ru: 'Подписать окончательную версию официального заявления, которую EXPERT проверил и отдельно направил на подпись.',
      },
      referenceUrls: [{ label: 'Guía EXPERT de firmas', url: NATIONALITY_SIGNATURE_GUIDE }],
    },
    {
      key: 'archive_docusign_completion_certificate',
      title: 'Archivar certificado de finalización del mandato — Nacionalidad menor',
      description: 'Si el mandato se firmó por DocuSign, archivar tanto el mandato firmado como el certificado oficial de finalización. Una captura o una nota no sustituyen el certificado.',
      priority: 'alta',
      phase: 'representation_mandate',
      dependsOn: ['prepare_representation_mandate'],
      blocksSubmission: true,
      skipAllowed: true,
    },
    {
      key: 'pre_submission_validation',
      title: 'Validar expediente antes de presentar — Nacionalidad menor',
      description: 'Validación automática final de residencia, representación, apellidos, modelo, firmas, documentos, tasa y trazabilidad. KIA debe resolver con el cliente las correcciones rutinarias y escalar solo incoherencias no resolubles. Al superar este gate, el expediente queda listo para presentar.',
      priority: 'critica',
      phase: 'final_review',
      dependsOn: ['verify_legal_residence_start', 'confirm_registry_surname_order', 'prepare_official_application', 'obtain_application_signatures', 'archive_docusign_completion_certificate'],
      blocksSubmission: true,
      referenceUrls: [{ label: 'Sede del Ministerio de Justicia', url: NATIONALITY_OFFICIAL_PROCEDURE }],
    },
    {
      key: 'pay_790_026_fee',
      title: 'Abonar tasa 790-026 — Nacionalidad menor',
      description: 'Comprobar primero si la tasa ya fue abonada. Si está pendiente, pagar el importe oficial vigente a nombre del interesado después de validar el expediente y archivar el justificante/NRC. Nunca repetir el pago.',
      priority: 'alta',
      phase: 'fee',
      dependsOn: ['pre_submission_validation'],
      blocksSubmission: true,
      referenceUrls: [{ label: 'Sede del Ministerio de Justicia', url: NATIONALITY_OFFICIAL_PROCEDURE }],
    },
    {
      key: 'submit_and_archive_receipt',
      title: 'Presentar y archivar justificante — Nacionalidad menor',
      description: 'Presentar solo con autorización profesional expresa. Archivar justificante, fecha, número de registro y copia final exactamente presentada.',
      priority: 'critica',
      phase: 'submit',
      humanApprovalRequired: true,
      dependsOn: ['pre_submission_validation', 'pay_790_026_fee'],
      blocksSubmission: true,
      referenceUrls: [{ label: 'Sede del Ministerio de Justicia', url: NATIONALITY_OFFICIAL_PROCEDURE }],
    },
    {
      key: 'follow_up_after_submission',
      title: 'Seguimiento posterior a presentación — Nacionalidad menor',
      description: 'Activar solo después de presentación acreditada. Registrar notificaciones, requerimientos, plazos y resolución.',
      priority: 'media',
      phase: 'follow_up',
      dependsOn: ['submit_and_archive_receipt'],
    },
  ];
}

const certificatesCommonSteps: ServiceCaseStep[] = [
  {
    key: 'documents',
    title: 'Recepción y revisión documental',
    description: 'Comprobar identidad y documentación exigida para la emisión.',
    clientVisible: true,
  },
  {
    key: 'identity',
    title: 'Identificación y validación',
    description: 'Completar la identificación online y, cuando proceda, validar las facultades de representación.',
    clientVisible: true,
  },
  {
    key: 'issue',
    title: 'Emisión',
    description: 'Emitir el certificado después de validar documentación e identidad/facultades.',
    clientVisible: true,
    humanApprovalRequired: true,
  },
  {
    key: 'install',
    title: 'Instalación y prueba',
    description: 'Acompañar la instalación y comprobar el funcionamiento del certificado.',
    clientVisible: true,
  },
];

const blueprints: ServiceOperationalBlueprint[] = [
  {
    slug: 'certificado-digital-persona-fisica',
    canonicalName: 'Certificado Digital Persona Física',
    category: 'certificado-digital',
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    initialNextAction: 'Revisar identidad y documentación para emisión online',
    requirements: [
      { key: 'adult_or_legal_capacity', label: 'Titular correctamente identificado y con capacidad para solicitar el certificado', required: true, clientCheckable: false },
      { key: 'online_identity', label: 'Identificación online completada correctamente', required: true, clientCheckable: true },
    ],
    documents: [
      { key: 'identity', label: 'DNI/NIE/TIE o documento de identidad válido del titular', required: true },
      { key: 'contact', label: 'Domicilio y datos de contacto actualizados', required: true },
    ],
    steps: certificatesCommonSteps,
    tasks: [
      { key: 'review', title: 'Revisar certificado digital persona física', description: 'Validar documentación e identificación online.', priority: 'alta', phase: 'documents', dueBusinessDays: 1 },
      { key: 'issue', title: 'Emitir certificado digital persona física', description: 'Emitir tras documentación e identidad validadas.', priority: 'alta', phase: 'issue', humanApprovalRequired: true, dueBusinessDays: 1 },
      { key: 'install', title: 'Confirmar instalación y prueba del certificado personal', description: 'Verificar que el cliente ha instalado y probado el certificado.', priority: 'media', phase: 'install' },
    ],
    kia: {
      userSummary: 'KIA guía al titular para reunir documentación, completar identificación online y seguir instalación/prueba.',
      adminSummary: 'KIA muestra checklist, faltantes y siguiente fase; la emisión sigue siendo una acción profesional.',
      escalationRules: ['Identidad no validable', 'Documento de identidad caducado o incoherente', 'Incidencia técnica de emisión'],
    },
  },
  {
    slug: 'certificado-digital-entidad',
    canonicalName: 'Certificado Digital de Entidad',
    category: 'certificado-digital',
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    initialNextAction: 'Revisar entidad, representación e identificación online',
    requirements: [
      { key: 'entity', label: 'Entidad identificada correctamente', required: true, clientCheckable: true },
      { key: 'representation', label: 'Representante con facultades suficientes y verificables', required: true, clientCheckable: false },
      { key: 'online_identity', label: 'Identificación online del representante completada', required: true, clientCheckable: true },
    ],
    documents: [
      { key: 'representative_identity', label: 'DNI/NIE/TIE del representante', required: true },
      { key: 'entity_tax_id', label: 'NIF/CIF y razón social de la entidad', required: true },
      { key: 'registry', label: 'Escritura, nota mercantil o documentación registral vigente', required: true },
      { key: 'powers', label: 'Poderes o nombramiento del representante cuando proceda', required: true },
    ],
    steps: certificatesCommonSteps,
    tasks: [
      { key: 'review', title: 'Revisar certificado digital de entidad', description: 'Validar entidad, documentos y facultades del representante.', priority: 'alta', phase: 'documents', dueBusinessDays: 1 },
      { key: 'issue', title: 'Emitir certificado digital de entidad', description: 'Emitir tras validar documentación, representación e identidad.', priority: 'alta', phase: 'issue', humanApprovalRequired: true, dueBusinessDays: 1 },
      { key: 'install', title: 'Confirmar instalación y prueba del certificado de entidad', description: 'Verificar instalación y prueba con el representante.', priority: 'media', phase: 'install' },
    ],
    kia: {
      userSummary: 'KIA explica documentos de entidad y representación y guía el proceso online.',
      adminSummary: 'KIA destaca faltantes de entidad/facultades y prepara la siguiente acción.',
      escalationRules: ['Facultades no acreditadas', 'Datos registrales incoherentes', 'Entidad no identificable', 'Incidencia técnica de emisión'],
    },
  },
  {
    slug: 'pack-certificados-digitales',
    canonicalName: 'Pack Certificados Digitales — Persona Física + Entidad',
    category: 'certificado-digital',
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    initialNextAction: 'Revisar titular, entidad, representación e identificación online',
    requirements: [
      { key: 'personal_holder', label: 'Titular del certificado personal correctamente identificado', required: true, clientCheckable: true },
      { key: 'entity', label: 'Entidad correctamente identificada', required: true, clientCheckable: true },
      { key: 'representation', label: 'Facultades de representación verificables', required: true, clientCheckable: false },
    ],
    documents: [
      { key: 'identity', label: 'DNI/NIE/TIE del titular/representante', required: true },
      { key: 'contact', label: 'Domicilio y datos de contacto', required: true },
      { key: 'entity_tax_id', label: 'Razón social y NIF/CIF', required: true },
      { key: 'registry', label: 'Escritura, nota mercantil o documentación registral', required: true },
      { key: 'powers', label: 'Poderes o nombramiento cuando proceda', required: true },
    ],
    steps: certificatesCommonSteps,
    tasks: [
      { key: 'review', title: 'Revisar pack de certificados digitales', description: 'Validar persona, entidad, representación e identificación.', priority: 'alta', phase: 'documents', dueBusinessDays: 1 },
      { key: 'issue_personal', title: 'Emitir certificado digital persona física', description: 'Emitir certificado personal tras validación.', priority: 'alta', phase: 'issue', humanApprovalRequired: true, dueBusinessDays: 1 },
      { key: 'issue_entity', title: 'Emitir certificado digital de entidad', description: 'Emitir certificado de entidad tras validación de facultades.', priority: 'alta', phase: 'issue', humanApprovalRequired: true, dueBusinessDays: 1 },
      { key: 'install', title: 'Confirmar instalación y prueba de ambos certificados', description: 'Verificar funcionamiento de ambos certificados.', priority: 'media', phase: 'install' },
    ],
    kia: {
      userSummary: 'KIA reúne en un solo flujo los requisitos del certificado personal y de entidad.',
      adminSummary: 'KIA separa los dos entregables bajo un único expediente y muestra el estado de cada emisión.',
      escalationRules: ['Identidad no validada', 'Facultades insuficientes', 'Incoherencia entre titular y representante'],
    },
  },
  {
    slug: 'nacionalidad-espanola-menor-nacido-en-espana',
    canonicalName: 'Nacionalidad española para menor nacido en España',
    category: 'extranjeria-nacionalidad',
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    initialNextAction: 'Revisar documentación, mandato, residencia legal y datos registrales antes de preparar el modelo oficial',
    requirements: [
      { key: 'born_in_spain', label: 'El menor ha nacido en España', required: true, clientCheckable: true },
      { key: 'legal_residence_year', label: 'El menor cumple el periodo legal de residencia aplicable antes de presentar', required: true, clientCheckable: false },
      { key: 'representation', label: 'Representación/firma del menor correctamente resuelta según edad y patria potestad', required: true, clientCheckable: false },
      { key: 'maternal_surname_review', label: 'Apellido personal de la madre, posible cambio por matrimonio y documento existente que lo acredita revisados antes de cerrar los apellidos registrales', required: true, clientCheckable: true },
      { key: 'registry_surnames', label: 'Apellidos derivados de la filiación y su orden para la futura inscripción española confirmados antes de preparar la solicitud', required: true, clientCheckable: false },
    ],
    documents: [
      { key: 'birth_certificate', label: 'Certificación literal de nacimiento española', required: true },
      { key: 'minor_passport', label: 'Pasaporte completo y en vigor del menor', required: true },
      { key: 'minor_residence', label: 'NIE/TIE y resolución que permita acreditar el inicio de residencia legal del menor', required: true },
      { key: 'registration', label: 'Empadronamiento familiar/colectivo actualizado', required: true },
      { key: 'parents_identity', label: 'Pasaportes y NIE/TIE de progenitores o representantes', required: true },
      { key: 'representation_docs', label: 'Documentación adicional de representación si solo actúa uno de los progenitores', required: false, conditionalWhen: 'No firman ambos representantes con patria potestad' },
      { key: 'maternal_personal_surname', label: 'Certificado de nacimiento o de matrimonio de la madre que acredite su apellido personal anterior al matrimonio, con traducción oficial y legalización/apostilla cuando procedan; revisar primero los documentos existentes', required: false, conditionalWhen: 'Solo si la documentación existente no basta y el órgano competente exige prueba adicional para determinar los apellidos; no es requisito general de toda solicitud inicial' },
    ],
    steps: nationalityMinorSteps(),
    tasks: nationalityMinorTasks(),
    kia: {
      userSummary: 'KIA gestiona de forma autónoma la preparación completa: revisa documentos ya disponibles, solicita solo faltantes reales, mantiene el mismo hilo con la familia, resuelve correcciones, prepara el modelo, controla firmas y tasa y deja el expediente listo para presentar. La identidad extranjera vigente se distingue de la futura inscripción española.',
      adminSummary: 'Objetivo operativo: cero intervención ordinaria de Admin hasta LISTO PARA PRESENTAR. KIA aplica los gates, itera con el cliente en ES/RU y escala solo excepciones jurídicas o documentales no resolubles. La presentación definitiva permanece bajo aprobación profesional.',
      escalationRules: ['Residencia legal no conciliable con evidencia', 'Patria potestad o representación en conflicto', 'Desacuerdo entre progenitores', 'Apellido personal materno o filiación incoherentes tras pedir la evidencia disponible', 'Documento dudoso, ilegible o potencialmente alterado', 'Pago duplicado o no conciliable', 'La sede exige identidad/firma personal de la representante', 'El cliente solicita intervención humana'],
    },
  },
  {
    slug: 'arraigo-social',
    canonicalName: 'Arraigo Social',
    category: 'extranjeria-nacionalidad',
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    initialNextAction: 'Validar permanencia, ausencias y vía familiar/integración',
    requirements: [
      { key: 'stay_two_years', label: 'Acreditar al menos 2 años de permanencia continuada inmediatamente anteriores a la solicitud', required: true, clientCheckable: false },
      { key: 'absences', label: 'Ausencias dentro del límite aplicable durante el periodo exigido', required: true, clientCheckable: false },
      { key: 'route', label: 'Acreditar vía de vínculos familiares + medios económicos o informe favorable de integración social', required: true, clientCheckable: false },
      { key: 'compatible_status', label: 'Situación migratoria y periodos de protección internacional compatibles con el cómputo', required: true, clientCheckable: false },
    ],
    documents: [
      ...immigrationCommonDocuments(),
      { key: 'stay_evidence', label: 'Pruebas de permanencia continuada durante al menos 2 años', required: true },
      { key: 'family_link', label: 'Documentación del vínculo familiar cuando se utilice esta vía', required: false, conditionalWhen: 'Vía familiar' },
      { key: 'means', label: 'Prueba de medios económicos suficientes cuando se utilice la vía familiar', required: false, conditionalWhen: 'Vía familiar' },
      { key: 'integration_report', label: 'Informe favorable de integración social', required: false, conditionalWhen: 'No se utiliza la vía familiar' },
    ],
    steps: immigrationCaseSteps('EX-10 y documentación de arraigo social'),
    tasks: immigrationTasks('Arraigo Social', 'EX-10'),
    kia: {
      userSummary: 'KIA ayuda a construir la cronología de 2 años y a identificar si la vía es familiar + medios o integración social.',
      adminSummary: 'KIA revisa cronología, ausencias, protección internacional, vía jurídica y faltantes.',
      escalationRules: ['Ausencias relevantes', 'Protección internacional previa', 'Antecedentes', 'Cronología incompleta', 'Vía familiar/integración no acreditada'],
    },
  },
  {
    slug: 'arraigo-familiar',
    canonicalName: 'Arraigo Familiar',
    category: 'extranjeria-nacionalidad',
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    initialNextAction: 'Revisar si el vínculo encaja en el arraigo familiar vigente',
    requirements: [
      {
        key: 'current_route',
        label: 'El supuesto encaja en una modalidad vigente de arraigo familiar, no en una autorización familiar distinta',
        required: true,
        clientCheckable: false,
      },
      {
        key: 'minor_eu_route',
        label: 'Si es progenitor/tutor de menor UE/EEE/Suiza: el menor reside en España y está a cargo, existe convivencia o se cumplen las obligaciones paternofiliales',
        required: false,
        clientCheckable: false,
        reviewIf: 'Vía progenitor/tutor de menor UE/EEE/Suiza',
      },
      {
        key: 'disability_support_route',
        label: 'Si presta apoyo a persona con discapacidad UE/EEE/Suiza: vínculo familiar, convivencia, cargo y necesidad de apoyo acreditados',
        required: false,
        clientCheckable: false,
        reviewIf: 'Vía de apoyo a familiar con discapacidad UE/EEE/Suiza',
      },
      { key: 'family_link', label: 'Vínculo familiar acreditado documentalmente', required: true, clientCheckable: false },
      { key: 'compatible_status', label: 'Situación migratoria compatible con la autorización solicitada', required: true, clientCheckable: false },
    ],
    documents: [
      ...immigrationCommonDocuments(),
      { key: 'family_link', label: 'Certificados/documentos que acrediten el vínculo familiar', required: true },
      { key: 'reference_person', label: 'Documento de identidad/nacionalidad del familiar de referencia', required: true },
      {
        key: 'minor_care',
        label: 'Pruebas de convivencia, custodia/cargo o cumplimiento de obligaciones paternofiliales',
        required: false,
        conditionalWhen: 'Vía progenitor/tutor de menor UE/EEE/Suiza',
      },
      {
        key: 'disability_support',
        label: 'Documentación de discapacidad, necesidad de apoyo, convivencia y situación de cargo',
        required: false,
        conditionalWhen: 'Vía de apoyo a familiar con discapacidad UE/EEE/Suiza',
      },
    ],
    steps: immigrationCaseSteps('EX-10 y documentación de arraigo familiar'),
    tasks: immigrationTasks('Arraigo Familiar', 'EX-10'),
    kia: {
      userSummary: 'KIA identifica el vínculo y pide solo los documentos pertinentes al supuesto familiar.',
      adminSummary: 'KIA obliga a validar el supuesto vigente antes de prometer esta vía.',
      escalationRules: ['Vínculo fuera de los supuestos vigentes', 'Patria potestad/custodia compleja', 'Antecedentes', 'Documentación extranjera no válida'],
    },
  },
  {
    slug: 'arraigo-laboral',
    canonicalName: 'Arraigo Sociolaboral',
    category: 'extranjeria-nacionalidad',
    aliases: ['arraigo-laboral'],
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    initialNextAction: 'Validar 2 años de permanencia y contrato(s) conforme al arraigo sociolaboral vigente',
    requirements: [
      { key: 'stay_two_years', label: 'Acreditar al menos 2 años de permanencia continuada inmediatamente anteriores a la solicitud', required: true, clientCheckable: false },
      { key: 'contracts', label: 'Disponer de uno o varios contratos que cumplan los requisitos del arraigo sociolaboral vigente', required: true, clientCheckable: false },
      { key: 'weekly_hours', label: 'Jornada global de al menos 20 horas semanales en cómputo conjunto cuando proceda', required: true, clientCheckable: false },
      { key: 'employer_compliance', label: 'Empleador/es en condiciones de cumplir obligaciones tributarias y de Seguridad Social exigibles', required: true, clientCheckable: false },
    ],
    documents: [
      ...immigrationCommonDocuments(),
      { key: 'stay_evidence', label: 'Pruebas de permanencia continuada durante al menos 2 años', required: true },
      { key: 'contracts', label: 'Contrato o contratos de trabajo firmados que sustentan la solicitud', required: true },
      { key: 'employer_docs', label: 'Documentación del empleador necesaria para acreditar solvencia/cumplimiento cuando proceda', required: true },
    ],
    steps: immigrationCaseSteps('EX-10 y documentación de arraigo sociolaboral'),
    tasks: immigrationTasks('Arraigo Sociolaboral', 'EX-10'),
    kia: {
      userSummary: 'KIA revisa permanencia y datos básicos de los contratos, pero deriva cualquier duda laboral o de empleador a revisión profesional.',
      adminSummary: 'KIA trata “arraigo laboral” como alias legacy y trabaja con la modalidad vigente “arraigo sociolaboral”.',
      escalationRules: ['Jornada global insuficiente', 'Contrato condicionado o incoherente', 'Empleador con incidencias', 'Cronología de permanencia dudosa'],
    },
  },
  {
    slug: 'renovacion-residencia',
    canonicalName: 'Renovación de Residencia',
    category: 'extranjeria-nacionalidad',
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    initialNextAction: 'Identificar autorización actual, plazo y requisitos de renovación aplicables',
    requirements: [
      { key: 'permit_type', label: 'Tipo exacto de autorización actual identificado', required: true, clientCheckable: false },
      { key: 'filing_window', label: 'Solicitud dentro de plazo o con estrategia revisada si existe presentación tardía', required: true, clientCheckable: false },
      { key: 'renewal_requirements', label: 'Cumplimiento de los requisitos específicos de renovación/modificación de esa autorización', required: true, clientCheckable: false },
    ],
    documents: [
      { key: 'tie', label: 'TIE actual por ambas caras', required: true },
      { key: 'passport', label: 'Pasaporte completo y en vigor', required: true },
      { key: 'registration', label: 'Empadronamiento actualizado cuando resulte aplicable', required: false },
      { key: 'basis', label: 'Documentos que acrediten mantenimiento/cambio de las circunstancias que sustentan la renovación', required: true },
    ],
    steps: immigrationCaseSteps('solicitud de renovación o modificación aplicable'),
    tasks: immigrationTasks('Renovación de Residencia', 'solicitud de renovación'),
    kia: {
      userSummary: 'KIA identifica tipo de permiso y fecha de caducidad para generar el checklist específico.',
      adminSummary: 'KIA no aplica un checklist genérico si no se ha identificado la autorización que se renueva.',
      escalationRules: ['Autorización no identificada', 'Fuera de plazo', 'Cambio relevante de circunstancias', 'Antecedentes o incidencias de residencia'],
    },
  },
  {
    slug: 'nacionalidad-espanola',
    canonicalName: 'Nacionalidad Española por Residencia',
    category: 'extranjeria-nacionalidad',
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    initialNextAction: 'Determinar plazo de residencia aplicable y validar continuidad/documentación',
    requirements: [
      { key: 'residence_period', label: 'Cumplimiento del periodo de residencia legal exigible según el supuesto personal', required: true, clientCheckable: false },
      { key: 'maternal_surname_review', label: 'Apellido personal de la madre, posible cambio por matrimonio y documento existente que lo acredita; revisar antes de solicitar prueba adicional', required: true, clientCheckable: true },
      { key: 'continuous_residence', label: 'Residencia legal, continuada e inmediatamente anterior a la solicitud', required: true, clientCheckable: false },
      { key: 'good_conduct', label: 'Buena conducta cívica y ausencia de incidencias incompatibles', required: true, clientCheckable: false },
      { key: 'integration', label: 'Requisitos de integración/pruebas o exenciones correctamente determinados', required: true, clientCheckable: false },
    ],
    documents: [
      { key: 'maternal_personal_surname', label: 'Certificado de nacimiento o de matrimonio de la madre que acredite su apellido personal anterior al matrimonio, con traducción oficial y legalización/apostilla cuando procedan; revisar primero los documentos existentes', required: false, conditionalWhen: 'Solo si la documentación existente no basta y el órgano competente exige prueba adicional para determinar los apellidos; no es requisito general de toda solicitud inicial' },
      { key: 'passport', label: 'Pasaporte completo y en vigor', required: true },
      { key: 'residence', label: 'TIE/NIE y documentación de residencia legal', required: true },
      { key: 'birth', label: 'Certificado de nacimiento del país de origen, legalizado/apostillado y traducido cuando proceda', required: true },
      { key: 'criminal_record', label: 'Certificado de antecedentes penales del país de origen, legalizado/apostillado y traducido cuando proceda', required: true },
      { key: 'ccse_dele', label: 'CCSE/DELE o documentación de exención/dispensa cuando corresponda', required: false, conditionalWhen: 'Según nacionalidad, edad y circunstancias personales' },
    ],
    steps: immigrationCaseSteps('solicitud de nacionalidad por residencia'),
    tasks: immigrationTasks('Nacionalidad Española', 'solicitud de nacionalidad'),
    kia: {
      userSummary: 'KIA determina el plazo aplicable y genera una lista documental adaptada al supuesto.',
      adminSummary: 'KIA marca continuidad de residencia, exenciones y antecedentes como puntos de control.',
      escalationRules: ['Ausencias relevantes', 'Antecedentes', 'Plazo de residencia dudoso', 'Dispensa/exención no clara', 'Documentación extranjera incoherente'],
    },
  },
  {
    slug: 'reagrupacion-familiar',
    canonicalName: 'Reagrupación Familiar',
    category: 'extranjeria-nacionalidad',
    initialState: 'pendiente_documentacion',
    initialStatus: 'nuevo',
    initialPriority: 'alta',
    initialNextAction: 'Validar familiar reagrupable, autorización del reagrupante, medios y vivienda',
    requirements: [
      { key: 'sponsor_status', label: 'Situación y autorización del reagrupante compatibles con la reagrupación', required: true, clientCheckable: false },
      { key: 'eligible_relative', label: 'Familiar incluido entre los familiares reagrupables en el supuesto aplicable', required: true, clientCheckable: false },
      { key: 'means', label: 'Medios económicos suficientes según unidad familiar', required: true, clientCheckable: false },
      { key: 'housing', label: 'Vivienda adecuada acreditada mediante el informe/documento exigible', required: true, clientCheckable: false },
    ],
    documents: [
      { key: 'sponsor_passport', label: 'Pasaporte y TIE/documentación de residencia del reagrupante', required: true },
      { key: 'relative_passport', label: 'Pasaporte del familiar a reagrupar', required: true },
      { key: 'family_link', label: 'Documentación acreditativa del vínculo familiar, legalizada/apostillada y traducida cuando proceda', required: true },
      { key: 'means', label: 'Nóminas, contratos, declaraciones u otros justificantes de medios económicos', required: true },
      { key: 'housing_report', label: 'Informe de vivienda adecuada o documento aplicable', required: true },
    ],
    steps: immigrationCaseSteps('solicitud de reagrupación familiar'),
    tasks: immigrationTasks('Reagrupación Familiar', 'solicitud de reagrupación'),
    kia: {
      userSummary: 'KIA estructura familiar, medios y vivienda para evitar pedir documentos que no correspondan.',
      adminSummary: 'KIA calcula qué bloque necesita revisión humana y separa requisitos del reagrupante y del familiar.',
      escalationRules: ['Familiar no encaja en supuesto ordinario', 'Medios limítrofes', 'Vivienda pendiente', 'Dependencia económica compleja', 'Documentación extranjera no válida'],
    },
  },
];

const bySlug = new Map<string, ServiceOperationalBlueprint>();
for (const blueprint of blueprints) {
  bySlug.set(blueprint.slug, blueprint);
  for (const alias of blueprint.aliases ?? []) bySlug.set(alias, blueprint);
}

export const BATCH1_OPERATIONAL_BLUEPRINTS = blueprints;

export function getServiceOperationalBlueprint(slug: string): ServiceOperationalBlueprint | null {
  return bySlug.get(slug) ?? null;
}

export function hasServiceOperationalBlueprint(slug: string): boolean {
  return bySlug.has(slug);
}

export function getServiceDocumentChecklist(slug: string): string[] {
  const blueprint = getServiceOperationalBlueprint(slug);
  return blueprint?.documents.filter((doc) => doc.required).map((doc) => doc.label) ?? [];
}
