export const NATIONALITY_MINOR_SERVICE_SLUG = 'nacionalidad-espanola-menor-nacido-en-espana';

export type NationalityMinorAutomationPolicy = {
  serviceSlug: string;
  targetState: 'listo_para_presentar';
  defaultVoluntaryRepresentative: string;
  autonomousTaskKeys: string[];
  humanGateTaskKeys: string[];
  signatureRules: {
    under14: {
      interestedSigns: false;
      legalRepresentativeBlock: string;
      voluntaryRepresentativeBlock: string;
      rule: string;
    };
  };
  clientCommunication: {
    sameThread: true;
    preferredLocales: readonly ['es', 'ru'];
    doNotRequestExistingDocuments: true;
    correctionLoopWithoutAdmin: true;
    correctionProtocol: {
      compareAgainstCanonicalVersion: true;
      validateCriticalDataBeforeSignatures: true;
      resendOnlyAffectedPages: true;
      confirmWhatIsAlreadyCorrect: true;
      askOnlyForRemainingCorrection: true;
      neverDeclareReadyBeforeFinalGate: true;
      rules: string[];
    };
    links: {
      signatureGuideEs: string;
      signatureGuideRu: string;
      autofirmaEs: string;
      autofirmaRu: string;
    };
  };
  readyToFileCriteria: string[];
  escalationRules: string[];
};

const POLICY: NationalityMinorAutomationPolicy = {
  serviceSlug: NATIONALITY_MINOR_SERVICE_SLUG,
  targetState: 'listo_para_presentar',
  defaultVoluntaryRepresentative: 'Ksenia ILICHEVA',
  autonomousTaskKeys: [
    'review_documents',
    'prepare_representation_mandate',
    'verify_legal_residence_start',
    'confirm_maternal_birth_surname',
    'confirm_registry_surname_order',
    'prepare_official_application',
    'obtain_application_signatures',
    'archive_docusign_completion_certificate',
    'pre_submission_validation',
    'pay_790_026_fee',
  ],
  humanGateTaskKeys: ['submit_and_archive_receipt'],
  signatureRules: {
    under14: {
      interestedSigns: false,
      legalRepresentativeBlock: 'Representante legal (si procede)',
      voluntaryRepresentativeBlock: 'Representante voluntario (si procede)',
      rule:
        'Cuando ambos progenitores ejercen la patria potestad, ambos firman como representantes legales. El bloque de representante voluntario corresponde a la persona mandataria que presenta, no a la segunda firma parental.',
    },
  },
  clientCommunication: {
    sameThread: true,
    preferredLocales: ['es', 'ru'],
    doNotRequestExistingDocuments: true,
    correctionLoopWithoutAdmin: true,
    correctionProtocol: {
      compareAgainstCanonicalVersion: true,
      validateCriticalDataBeforeSignatures: true,
      resendOnlyAffectedPages: true,
      confirmWhatIsAlreadyCorrect: true,
      askOnlyForRemainingCorrection: true,
      neverDeclareReadyBeforeFinalGate: true,
      rules: [
        'Antes de responder a un documento corregido, comparar la versión recibida con la última versión canónica marcada como vigente en el expediente; no asumir que una firma nueva implica que la versión sea correcta.',
        'Validar primero los datos críticos que bloquearían la presentación (identidad, apellidos, opción registral, fecha/lugar cuando proceda) y después la colocación/integridad de las firmas.',
        'Si el error está limitado a una página y el resto del documento sigue vigente, reenviar únicamente la página afectada para reducir confusión y evitar que el cliente firme una versión retirada.',
        'Confirmar expresamente los puntos que ya están correctos antes de pedir la corrección restante; pedir una sola acción concreta siempre que sea posible.',
        'No volver a solicitar certificados, documentos o datos que el expediente ya marque como recibidos, revisados o archivados.',
        'Mantener la respuesta en el mismo hilo y en el idioma preferido del cliente; incluir enlaces a la guía solo cuando ayudan a ejecutar la corrección.',
        'Tras recibir la nueva página, volver a comparar datos + firmas con la versión canónica. Solo entonces pasar a pre_submission_validation.',
        'No comunicar que el expediente está listo para presentar hasta que el gate final confirme versión, firmas, tasa, documentos y trazabilidad.',
      ],
    },
    links: {
      signatureGuideEs: '/docs/firmar-solicitud-nacionalidad-menor-progenitores',
      signatureGuideRu: '/ru/docs/podpisat-zayavlenie-grazhdanstvo-rebenka-roditeli',
      autofirmaEs: '/docs/firmar-pdf-certificado-digital-autofirma',
      autofirmaRu: '/ru/docs/podpisat-pdf-cifrovym-sertifikatom-autofirma',
    },
  },
  readyToFileCriteria: [
    'Identidad del menor y progenitores coherente con documentos vigentes',
    'Residencia legal del menor y plazo aplicable acreditados',
    'Patria potestad y representación legal resueltas',
    'Mandato de representación voluntaria firmado y archivado cuando EXPERT presenta',
    'Apellidos registrales y orden confirmados con evidencia suficiente',
    'Modelo oficial final generado con datos validados',
    'Firmas exigibles del modelo verificadas en los bloques correctos',
    'Tasa 790-026 verificada como pagada una sola vez y justificante archivado',
    'Paquete final coincide exactamente con la versión que se presentará',
  ],
  escalationRules: [
    'Conflicto entre documentos de identidad, filiación, patria potestad o residencia que no puede resolverse con evidencia objetiva',
    'Desacuerdo entre progenitores o ausencia de consentimiento exigible',
    'Indicios de documento alterado, ilegible, incompleto o de autenticidad dudosa',
    'Duda jurídica no cubierta por la regla oficial o por la base de conocimiento vigente',
    'Pago duplicado, importe anómalo o estado de tasa no conciliable',
    'La sede exige una identificación, firma o actuación personal de Ksenia antes de la presentación final',
    'El cliente solicita expresamente intervención humana',
  ],
};

export function getNationalityMinorAutonomyPolicy(serviceSlug: string) {
  return serviceSlug === NATIONALITY_MINOR_SERVICE_SLUG ? POLICY : null;
}
