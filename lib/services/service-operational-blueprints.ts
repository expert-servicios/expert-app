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

export type ServiceCaseStep = {
  key: string;
  title: string;
  description: string;
  clientVisible: boolean;
  humanApprovalRequired?: boolean;
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
  syncCalendar?: boolean;
  clientActionRequired?: boolean;
  clientActionKind?: 'signature' | 'representation' | 'documents' | 'approval';
  clientReminderBusinessDays?: number[];
  internalEscalationBusinessDay?: number;
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

function immigrationCaseSteps(
  applicationLabel: string,
  representationMode: 'extranjeria' | 'nationality' = 'extranjeria',
): ServiceCaseStep[] {
  const representationStep: ServiceCaseStep = representationMode === 'extranjeria'
    ? {
        key: 'formal_representation',
        title: 'Acreditación formal de representación',
        description: 'Si EXPERT presenta en nombre del interesado, acreditar previamente la representación mediante poder notarial o apoderamiento apud acta/Registro Electrónico de Apoderamientos (REA), salvo otra habilitación legal aplicable. Una autorización privada simple no desbloquea la presentación de Extranjería.',
        clientVisible: true,
        humanApprovalRequired: true,
      }
    : {
        key: 'voluntary_representation',
        title: 'Mandato de representación voluntaria',
        description: 'Si EXPERT presenta la solicitud de nacionalidad, formalizar y archivar el mandato o poder del representante voluntario antes de presentar.',
        clientVisible: true,
        humanApprovalRequired: true,
      };

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
    representationStep,
    {
      key: 'prepare',
      title: 'Preparación del expediente',
      description: `Preparar ${applicationLabel}, anexos y paquete documental para presentación.`,
      clientVisible: true,
    },
    {
      key: 'fee',
      title: 'Tasas',
      description: 'Preparar, abonar o registrar las tasas administrativas aplicables al procedimiento y archivar sus justificantes.',
      clientVisible: true,
      humanApprovalRequired: true,
    },
    {
      key: 'final_review',
      title: 'Revisión final',
      description: 'Comprobar expediente, representación, formularios, tasas y anexos inmediatamente antes de presentar.',
      clientVisible: true,
      humanApprovalRequired: true,
    },
    {
      key: 'submit',
      title: 'Presentación',
      description: representationMode === 'extranjeria'
        ? 'Presentar únicamente después de validar el expediente, las tasas y la representación formal cuando EXPERT actúe en nombre del interesado.'
        : 'Presentar únicamente después de validar el expediente, las tasas y archivar el mandato o poder de representación voluntaria cuando EXPERT actúe como representante.',
      clientVisible: true,
      humanApprovalRequired: true,
    },
    {
      key: 'receipt',
      title: 'Justificante de presentación',
      description: 'Archivar justificante, número de expediente y fecha/hora de registro y comunicar la presentación al cliente.',
      clientVisible: true,
    },
    {
      key: 'follow_up',
      title: 'Seguimiento',
      description: 'Controlar requerimientos, notificaciones, resolución y siguiente acción.',
      clientVisible: true,
    },
  ];
}

function immigrationTasks(
  serviceName: string,
  applicationLabel: string,
  representationMode: 'extranjeria' | 'nationality' = 'extranjeria',
): ServiceTaskTemplate[] {
  const representationTask: ServiceTaskTemplate = representationMode === 'extranjeria'
    ? {
        key: 'formalize_representation',
        title: `Acreditar representación formal — ${serviceName}`,
        description: 'Si EXPERT presentará en nombre del interesado, obtener y validar apoderamiento apud acta/REA, poder notarial u otra habilitación válida antes de desbloquear la presentación.',
        priority: 'alta',
        phase: 'representation',
        humanApprovalRequired: true,
        dueBusinessDays: 1,
        dependsOn: ['review_documents'],
        syncCalendar: true,
        clientActionRequired: true,
        clientActionKind: 'representation',
        clientReminderBusinessDays: [1, 3, 5],
        internalEscalationBusinessDay: 5,
      }
    : {
        key: 'formalize_voluntary_representation',
        title: `Formalizar representación voluntaria — ${serviceName}`,
        description: 'Si EXPERT presentará la solicitud de nacionalidad, preparar, firmar y validar el mandato o poder de representación voluntaria antes de presentar.',
        priority: 'alta',
        phase: 'representation',
        humanApprovalRequired: true,
        dueBusinessDays: 1,
        dependsOn: ['review_documents'],
        syncCalendar: true,
        clientActionRequired: true,
        clientActionKind: 'signature',
        clientReminderBusinessDays: [1, 3, 5],
        internalEscalationBusinessDay: 5,
      };

  const representationKey = representationTask.key;

  return [
    {
      key: 'validate',
      title: `Validar requisitos — ${serviceName}`,
      description: 'Revisar encaje jurídico, requisitos, incidencias y documentación mínima antes de continuar.',
      priority: 'alta',
      phase: 'intake',
      dueBusinessDays: 1,
      syncCalendar: true,
    },
    {
      key: 'review_documents',
      title: `Revisar documentación — ${serviceName}`,
      description: 'Comprobar documentos recibidos contra el checklist canónico y registrar faltantes.',
      priority: 'media',
      phase: 'documents',
      dueBusinessDays: 1,
      dependsOn: ['validate'],
      syncCalendar: true,
    },
    representationTask,
    {
      key: 'prepare_application',
      title: `Preparar ${applicationLabel} — ${serviceName}`,
      description: 'Preparar formularios, anexos y paquete documental según la vía validada.',
      priority: 'media',
      phase: 'prepare',
      dueBusinessDays: 1,
      dependsOn: [representationKey],
      syncCalendar: true,
    },
    {
      key: 'fee',
      title: `Gestionar tasas — ${serviceName}`,
      description: 'Preparar, abonar o registrar las tasas administrativas aplicables y archivar sus justificantes.',
      priority: 'alta',
      phase: 'fee',
      dueBusinessDays: 1,
      dependsOn: ['prepare_application'],
      syncCalendar: true,
      humanApprovalRequired: true,
    },
    {
      key: 'final_review',
      title: `Revisión final antes de presentar — ${serviceName}`,
      description: 'Comprobar formularios, anexos, representación y tasas antes de la firma/presentación.',
      priority: 'alta',
      phase: 'final_review',
      dueBusinessDays: 0,
      dependsOn: ['fee'],
      syncCalendar: true,
      humanApprovalRequired: true,
    },
    {
      key: 'submit',
      title: `Presentar expediente — ${serviceName}`,
      description: representationMode === 'extranjeria'
        ? 'Acción profesional. No presentar sin expediente validado, tasas controladas y representación formal acreditada cuando EXPERT actúe por el interesado.'
        : 'Acción profesional. No presentar sin expediente validado, tasas controladas y mandato/poder acreditado cuando EXPERT actúe como representante voluntario.',
      priority: 'alta',
      phase: 'submit',
      dueBusinessDays: 0,
      dependsOn: ['final_review'],
      syncCalendar: true,
      humanApprovalRequired: true,
    },
    {
      key: 'receipt',
      title: `Archivar justificante y comunicar presentación — ${serviceName}`,
      description: 'Guardar justificante/número de expediente y comunicar al cliente la presentación y siguientes pasos.',
      priority: 'alta',
      phase: 'receipt',
      dueBusinessDays: 0,
      dependsOn: ['submit'],
      syncCalendar: true,
    },
    {
      key: 'follow_up',
      title: `Seguimiento — ${serviceName}`,
      description: 'Controlar requerimientos, notificaciones, resolución y siguiente acción.',
      priority: 'media',
      phase: 'follow_up',
      dueBusinessDays: 1,
      dependsOn: ['receipt'],
      syncCalendar: true,
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
    initialNextAction: 'Validar residencia legal, patria potestad y preparar mandato de representación voluntaria',
    requirements: [
      { key: 'born_in_spain', label: 'El menor ha nacido en España', required: true, clientCheckable: true },
      { key: 'legal_residence_year', label: 'El menor cumple el periodo legal de residencia aplicable antes de presentar', required: true, clientCheckable: false },
      { key: 'representation', label: 'Representación/firma del menor correctamente resuelta según edad y patria potestad', required: true, clientCheckable: false },
      { key: 'voluntary_representation', label: 'Mandato o poder de representación voluntaria válido cuando EXPERT realiza la presentación', required: true, clientCheckable: false },
      { key: 'parents_signature', label: 'Firmas de ambos progenitores cuando ambos ejercen la patria potestad, salvo acreditación válida de actuación por uno solo', required: true, clientCheckable: false },
    ],
    documents: [
      { key: 'birth_certificate', label: 'Certificación literal de nacimiento española', required: true },
      { key: 'minor_passport', label: 'Pasaporte completo y en vigor del menor', required: true },
      { key: 'minor_residence', label: 'NIE/TIE y resolución que permita acreditar el inicio de residencia legal del menor', required: true },
      { key: 'registration', label: 'Empadronamiento familiar/colectivo actualizado', required: true },
      { key: 'parents_identity', label: 'Pasaportes y NIE/TIE de progenitores o representantes', required: true },
      { key: 'voluntary_representation_mandate', label: 'Mandato de representación voluntaria a favor de Ksenia ILICHEVA como persona física representante', required: true, notes: 'Debe quedar firmado y archivado antes de presentar telemáticamente.' },
      { key: 'official_minor_application', label: 'Modelo normalizado oficial de solicitud de nacionalidad del menor firmado por ambos progenitores cuando corresponda', required: true, notes: 'No sustituir por mandato ni por DocuSign estándar. Debe validarse método de firma conforme al RD 1004/2015 art. 5.4.' },
      { key: 'representative_recognized_signature', label: 'Versión/documentación con firma electrónica reconocida de Ksenia cuando corresponda para la presentación electrónica', required: true, notes: 'Aplicar con certificado electrónico personal reconocido del representante.' },
      { key: 'representation_docs', label: 'Documentación adicional de representación si solo actúa uno de los progenitores', required: false, conditionalWhen: 'No firman ambos representantes con patria potestad' },
    ],
    steps: [
      {
        key: 'intake',
        title: 'Validación inicial',
        description: 'Comprobar nacimiento en España, residencia legal, edad del menor, patria potestad y posibles bloqueos.',
        clientVisible: true,
      },
      {
        key: 'documents',
        title: 'Revisión documental',
        description: 'Comprobar documentos del menor y de los progenitores, vigencia y coherencia.',
        clientVisible: true,
      },
      {
        key: 'representation_mandate',
        title: 'Mandato de representación y firmas',
        description: 'Preparar el mandato de representación voluntaria y obtener las firmas de ambos progenitores cuando corresponda.',
        clientVisible: true,
      },
      {
        key: 'prepare_official_application',
        title: 'Modelo oficial de solicitud',
        description: 'Pre-rellenar el modelo normalizado oficial del menor y obtener/validar las firmas exigidas de los progenitores antes de continuar.',
        clientVisible: true,
        humanApprovalRequired: true,
      },
      {
        key: 'recognized_signature',
        title: 'Firma electrónica reconocida del representante',
        description: 'Aplicar la firma electrónica reconocida de Ksenia ILICHEVA cuando corresponda antes de la presentación electrónica.',
        clientVisible: false,
        humanApprovalRequired: true,
      },
      {
        key: 'fee',
        title: 'Pago y registro de tasa',
        description: 'Abonar o registrar la tasa 790-026 y archivar el justificante en el expediente.',
        clientVisible: true,
        humanApprovalRequired: true,
      },
      {
        key: 'final_review',
        title: 'Revisión final',
        description: 'Comprobar mandato firmado, documentación, tasa y formulario inmediatamente antes de presentar.',
        clientVisible: true,
        humanApprovalRequired: true,
      },
      {
        key: 'submit',
        title: 'Presentación',
        description: 'Presentar telemáticamente únicamente con mandato firmado, tasa registrada, documentación validada y aprobación profesional.',
        clientVisible: true,
        humanApprovalRequired: true,
      },
      {
        key: 'receipt',
        title: 'Justificante y comunicación',
        description: 'Archivar justificante y número de expediente y comunicar a la familia la presentación y siguientes pasos.',
        clientVisible: true,
      },
      {
        key: 'follow_up',
        title: 'Seguimiento',
        description: 'Controlar requerimientos, notificaciones, resolución y siguiente acción.',
        clientVisible: true,
      },
    ],
    tasks: [
      {
        key: 'validate',
        title: 'Validar requisitos — Nacionalidad menor nacido en España',
        description: 'Revisar año de residencia legal, edad, patria potestad, identidad de ambos progenitores y viabilidad antes de continuar.',
        priority: 'alta',
        phase: 'intake',
        dueBusinessDays: 1,
        syncCalendar: true,
      },
      {
        key: 'review_documents',
        title: 'Revisar documentación — Nacionalidad menor nacido en España',
        description: 'Comprobar documentos recibidos contra el checklist canónico y registrar faltantes.',
        priority: 'media',
        phase: 'documents',
        dueBusinessDays: 1,
        dependsOn: ['validate'],
        syncCalendar: true,
      },
      {
        key: 'prepare_representation_mandate',
        title: 'Preparar mandato de representación voluntaria — Nacionalidad menor',
        description: 'Generar el mandato con datos del expediente y de Ksenia ILICHEVA como representante voluntaria y solicitar la firma de ambos progenitores cuando corresponda.',
        priority: 'alta',
        phase: 'representation_mandate',
        dueBusinessDays: 1,
        dependsOn: ['review_documents'],
        syncCalendar: true,
        clientActionRequired: true,
        clientActionKind: 'signature',
        clientReminderBusinessDays: [1, 3, 5],
        internalEscalationBusinessDay: 5,
      },
      {
        key: 'verify_signed_mandate',
        title: 'Validar mandato firmado — Nacionalidad menor',
        description: 'Comprobar el mandato firmado y archivar documento y certificado de finalización antes de preparar la presentación.',
        priority: 'alta',
        phase: 'representation_mandate',
        humanApprovalRequired: true,
        dueBusinessDays: 0,
        dependsOn: ['prepare_representation_mandate'],
        syncCalendar: true,
      },
      {
        key: 'verify_legal_residence_start',
        title: 'Verificar inicio de residencia legal — Nacionalidad menor',
        description: 'Confirmar documentalmente la fecha/año de inicio de residencia legal del menor mediante TIE anterior, resolución inicial o evidencia oficial equivalente. No inferirla de la fecha de nacimiento ni de la fecha de expedición de la TIE actual.',
        priority: 'critica',
        phase: 'legal_residence',
        humanApprovalRequired: true,
        dueBusinessDays: 1,
        dependsOn: ['verify_signed_mandate'],
        syncCalendar: true,
      },
      {
        key: 'prepare_official_application',
        title: 'Pre-rellenar modelo oficial — Nacionalidad menor',
        description: 'Cumplimentar el modelo normalizado oficial del menor con los datos validados del expediente.',
        priority: 'alta',
        phase: 'official_application',
        dueBusinessDays: 0,
        dependsOn: ['verify_legal_residence_start'],
        syncCalendar: true,
      },
      {
        key: 'obtain_parent_signatures',
        title: 'Obtener firmas de progenitores — Solicitud oficial nacionalidad menor',
        description: 'Enviar el modelo oficial para firma manuscrita de ambos progenitores cuando corresponda y recibir el PDF completo firmado. No usar DocuSign estándar como sustituto.',
        priority: 'alta',
        phase: 'official_application_signatures',
        dueBusinessDays: 1,
        dependsOn: ['prepare_official_application'],
        syncCalendar: true,
        clientActionRequired: true,
        clientActionKind: 'signature',
        clientReminderBusinessDays: [1, 3, 5],
        internalEscalationBusinessDay: 5,
      },
      {
        key: 'verify_official_application',
        title: 'Validar solicitud oficial firmada — Nacionalidad menor',
        description: 'Revisar identidad, firmas, patria potestad, integridad y legibilidad del modelo oficial antes de continuar.',
        priority: 'alta',
        phase: 'official_application_signatures',
        humanApprovalRequired: true,
        dueBusinessDays: 0,
        dependsOn: ['obtain_parent_signatures'],
        syncCalendar: true,
      },
      {
        key: 'apply_recognized_signature',
        title: 'Aplicar firma electrónica reconocida de Ksenia — Nacionalidad menor',
        description: 'Aplicar certificado electrónico personal reconocido de Ksenia ILICHEVA al documento o actuación que lo requiera antes de la presentación.',
        priority: 'critica',
        phase: 'recognized_signature',
        humanApprovalRequired: true,
        dueBusinessDays: 0,
        dependsOn: ['verify_official_application'],
        syncCalendar: true,
      },
      {
        key: 'fee',
        title: 'Pagar/registrar tasa 790-026 — Nacionalidad menor',
        description: 'Abonar o registrar la tasa 790-026 y archivar justificante antes de presentar.',
        priority: 'alta',
        phase: 'fee',
        humanApprovalRequired: true,
        dueBusinessDays: 0,
        dependsOn: ['apply_recognized_signature'],
        syncCalendar: true,
      },
      {
        key: 'final_review',
        title: 'Revisión final — Nacionalidad menor',
        description: 'Comprobar mandato, documentación, formulario y tasa antes de la presentación.',
        priority: 'alta',
        phase: 'final_review',
        humanApprovalRequired: true,
        dueBusinessDays: 0,
        dependsOn: ['fee'],
        syncCalendar: true,
      },
      {
        key: 'submit',
        title: 'Presentar expediente — Nacionalidad menor nacido en España',
        description: 'Acción profesional. Presentar solo con mandato, tasa y expediente final validados.',
        priority: 'critica',
        phase: 'submit',
        humanApprovalRequired: true,
        dueBusinessDays: 0,
        dependsOn: ['final_review'],
        syncCalendar: true,
      },
      {
        key: 'receipt',
        title: 'Archivar justificante y comunicar presentación — Nacionalidad menor',
        description: 'Guardar justificante/número de expediente y enviar confirmación y siguientes pasos a la familia.',
        priority: 'alta',
        phase: 'receipt',
        dueBusinessDays: 0,
        dependsOn: ['submit'],
        syncCalendar: true,
      },
      {
        key: 'follow_up',
        title: 'Seguimiento — Nacionalidad menor nacido en España',
        description: 'Controlar requerimientos, notificaciones, resolución y siguiente acción.',
        priority: 'media',
        phase: 'follow_up',
        dueBusinessDays: 1,
        dependsOn: ['receipt'],
        syncCalendar: true,
      },
    ],
    kia: {
      userSummary: 'KIA guía a la familia para comprobar residencia legal, documentos y firmas; separa mandato, modelo oficial firmado por progenitores y firma electrónica reconocida del representante antes de presentar.',
      adminSummary: 'KIA prioriza cómputo de residencia, patria potestad, mandato, solicitud oficial firmada y firma electrónica reconocida de Ksenia; la presentación queda bloqueada hasta validar todas las capas.',
      escalationRules: ['Residencia legal dudosa', 'Patria potestad o firma no resuelta', 'Mandato incompleto o incoherente', 'Solicitud oficial sin firmas válidas', 'Método de firma electrónica no verificable', 'Datos personales incoherentes', 'Documentos extranjeros pendientes de legalización/traducción'],
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
      { key: 'filing_actor', label: 'Forma de presentación validada según la legitimación específica del arraigo social', required: true, clientCheckable: false },
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
      adminSummary: 'KIA revisa cronología, ausencias, protección internacional, vía jurídica y faltantes. No promete presentación por representante sin validar la legitimación específica y el artículo 197 del RD 1155/2024.',
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
      { key: 'filing_actor', label: 'Forma de presentación y legitimación verificadas para el supuesto concreto', required: true, clientCheckable: false },
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
      adminSummary: 'KIA obliga a validar el supuesto vigente y quién está legitimado para presentar antes de prometer esta vía o una presentación por representante.',
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
      { key: 'filing_actor', label: 'Sujeto legitimado para presentar identificado y representación validada si EXPERT presenta', required: true, clientCheckable: false },
    ],
    documents: [
      { key: 'tie', label: 'TIE actual por ambas caras', required: true },
      { key: 'passport', label: 'Pasaporte completo y en vigor', required: true },
      { key: 'registration', label: 'Empadronamiento actualizado cuando resulte aplicable', required: false },
      { key: 'basis', label: 'Documentos que acrediten mantenimiento/cambio de las circunstancias que sustentan la renovación', required: true },
      { key: 'representation_power', label: 'Poder notarial, apud acta o acreditación de representación válida para Extranjería', required: false, conditionalWhen: 'EXPERT presenta en nombre del sujeto legitimado' },
    ],
    steps: [
      ...immigrationCaseSteps('solicitud de renovación o modificación aplicable'),
      { key: 'representation_gate', title: 'Validación de representación', description: 'Antes de presentar por EXPERT, comprobar que el poder o habilitación cumple el artículo 197 del RD 1155/2024.', clientVisible: true, humanApprovalRequired: true },
    ],
    tasks: [
      ...immigrationTasks('Renovación de Residencia', 'solicitud de renovación'),
      { key: 'verify_representation', title: 'Validar representación — Renovación de Residencia', description: 'No presentar por EXPERT hasta verificar poder notarial, apud acta u otra habilitación válida para Extranjería.', priority: 'alta', phase: 'representation', humanApprovalRequired: true },
    ],
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
      { key: 'continuous_residence', label: 'Residencia legal, continuada e inmediatamente anterior a la solicitud', required: true, clientCheckable: false },
      { key: 'good_conduct', label: 'Buena conducta cívica y ausencia de incidencias incompatibles', required: true, clientCheckable: false },
      { key: 'integration', label: 'Requisitos de integración/pruebas o exenciones correctamente determinados', required: true, clientCheckable: false },
      { key: 'voluntary_representation', label: 'Mandato o poder de representación voluntaria válido cuando EXPERT presenta ante el Ministerio de Justicia', required: true, clientCheckable: false },
    ],
    documents: [
      { key: 'passport', label: 'Pasaporte completo y en vigor', required: true },
      { key: 'residence', label: 'TIE/NIE y documentación de residencia legal', required: true },
      { key: 'birth', label: 'Certificado de nacimiento del país de origen, legalizado/apostillado y traducido cuando proceda', required: true },
      { key: 'criminal_record', label: 'Certificado de antecedentes penales del país de origen, legalizado/apostillado y traducido cuando proceda', required: true },
      { key: 'ccse_dele', label: 'CCSE/DELE o documentación de exención/dispensa cuando corresponda', required: false, conditionalWhen: 'Según nacionalidad, edad y circunstancias personales' },
      { key: 'voluntary_representation_mandate', label: 'Mandato o poder de representación voluntaria para nacionalidad por residencia', required: false, conditionalWhen: 'EXPERT presenta en nombre del solicitante' },
    ],
    steps: [
      ...immigrationCaseSteps('solicitud de nacionalidad por residencia', 'nationality'),
      { key: 'representation_mandate', title: 'Mandato de representación', description: 'Preparar y validar el mandato o poder cuando EXPERT presente telemáticamente ante el Ministerio de Justicia.', clientVisible: true, humanApprovalRequired: true },
    ],
    tasks: [
      ...immigrationTasks('Nacionalidad Española', 'solicitud de nacionalidad', 'nationality'),
      { key: 'verify_representation', title: 'Validar mandato — Nacionalidad Española', description: 'Comprobar que el mandato o poder identifica al solicitante y a Ksenia ILICHEVA como representante voluntaria antes de presentar.', priority: 'alta', phase: 'representation_mandate', humanApprovalRequired: true },
    ],
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
      { key: 'filing_actor', label: 'Persona reagrupante identificada como sujeto legitimado y representación validada si EXPERT presenta', required: true, clientCheckable: false },
    ],
    documents: [
      { key: 'sponsor_passport', label: 'Pasaporte y TIE/documentación de residencia del reagrupante', required: true },
      { key: 'relative_passport', label: 'Pasaporte del familiar a reagrupar', required: true },
      { key: 'family_link', label: 'Documentación acreditativa del vínculo familiar, legalizada/apostillada y traducida cuando proceda', required: true },
      { key: 'means', label: 'Nóminas, contratos, declaraciones u otros justificantes de medios económicos', required: true },
      { key: 'housing_report', label: 'Informe de vivienda adecuada o documento aplicable', required: true },
      { key: 'representation_power', label: 'Poder notarial, apud acta o acreditación de representación válida para Extranjería', required: false, conditionalWhen: 'EXPERT presenta en nombre de la persona reagrupante' },
    ],
    steps: [
      ...immigrationCaseSteps('solicitud de reagrupación familiar'),
      { key: 'representation_gate', title: 'Validación de representación', description: 'La persona reagrupante puede presentar personalmente o mediante representante; EXPERT solo presenta tras acreditar representación válida.', clientVisible: true, humanApprovalRequired: true },
    ],
    tasks: [
      ...immigrationTasks('Reagrupación Familiar', 'solicitud de reagrupación'),
      { key: 'verify_representation', title: 'Validar representación — Reagrupación Familiar', description: 'Comprobar poder notarial, apud acta u otra habilitación válida antes de presentar por EXPERT.', priority: 'alta', phase: 'representation', humanApprovalRequired: true },
    ],
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
