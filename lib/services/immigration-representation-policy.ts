export type ImmigrationRepresentationMode =
  | 'justice_voluntary_mandate'
  | 'extranjeria_formal_power'
  | 'route_dependent';

export type ImmigrationRepresentationPolicy = {
  serviceSlug: string;
  mode: ImmigrationRepresentationMode;
  authority: 'ministerio_justicia' | 'extranjeria';
  canExpertPresent: boolean | 'conditional';
  evidence: string[];
  filingRule: string;
  legalBasis: string[];
  blockSubmissionUntilValidated: boolean;
  remoteOnly?: boolean;
  clientDigitalCredentialRequired?: boolean;
  credentialFallbackServiceSlug?: string;
};

const policies: ImmigrationRepresentationPolicy[] = [
  {
    serviceSlug: 'nacionalidad-espanola-menor-nacido-en-espana',
    mode: 'justice_voluntary_mandate',
    authority: 'ministerio_justicia',
    canExpertPresent: true,
    evidence: ['Mandato o poder de representante voluntario', 'Identidad de representante y otorgantes'],
    filingRule: 'EXPERT puede presentar telemáticamente como representante voluntario cuando el mandato o poder esté acreditado.',
    legalBasis: ['RD 1004/2015 art. 5', 'Ley 39/2015 art. 5'],
    blockSubmissionUntilValidated: true,
    remoteOnly: true,
    clientDigitalCredentialRequired: true,
    credentialFallbackServiceSlug: 'certificado-digital-persona-fisica',
  },
  {
    serviceSlug: 'nacionalidad-espanola',
    mode: 'justice_voluntary_mandate',
    authority: 'ministerio_justicia',
    canExpertPresent: true,
    evidence: ['Mandato o poder de representante voluntario', 'Identidad del solicitante y representante'],
    filingRule: 'EXPERT puede presentar telemáticamente como representante voluntario cuando el mandato o poder esté acreditado.',
    legalBasis: ['RD 1004/2015 art. 5', 'Ley 39/2015 art. 5'],
    blockSubmissionUntilValidated: true,
    remoteOnly: true,
    clientDigitalCredentialRequired: true,
    credentialFallbackServiceSlug: 'certificado-digital-persona-fisica',
  },
  {
    serviceSlug: 'renovacion-residencia',
    mode: 'extranjeria_formal_power',
    authority: 'extranjeria',
    canExpertPresent: true,
    evidence: ['Apoderamiento notarial o apud acta', 'O habilitación válida por convenio/registro cuando resulte aplicable'],
    filingRule: 'Si EXPERT presenta en nombre del sujeto legitimado, la representación debe cumplir el régimen específico del art. 197.4 del RD 1155/2024.',
    legalBasis: ['RD 1155/2024 art. 197.4', 'Ley 39/2015 art. 5'],
    blockSubmissionUntilValidated: true,
    remoteOnly: true,
    clientDigitalCredentialRequired: true,
    credentialFallbackServiceSlug: 'certificado-digital-persona-fisica',
  },
  {
    serviceSlug: 'reagrupacion-familiar',
    mode: 'extranjeria_formal_power',
    authority: 'extranjeria',
    canExpertPresent: true,
    evidence: ['Apoderamiento notarial o apud acta', 'O habilitación válida por convenio/registro cuando resulte aplicable'],
    filingRule: 'La persona reagrupante puede presentar personalmente o mediante representante; EXPERT solo presenta tras acreditar representación válida.',
    legalBasis: ['RD 1155/2024 art. 197.4', 'Hoja 8 Migraciones'],
    blockSubmissionUntilValidated: true,
    remoteOnly: true,
    clientDigitalCredentialRequired: true,
    credentialFallbackServiceSlug: 'certificado-digital-persona-fisica',
  },
  {
    serviceSlug: 'permiso-residencia-inicial',
    mode: 'route_dependent',
    authority: 'extranjeria',
    canExpertPresent: 'conditional',
    evidence: ['Determinar primero la autorización exacta y el sujeto legitimado', 'Después aplicar la acreditación de representación que corresponda'],
    filingRule: 'No existe una regla única: según la autorización puede estar legitimado el extranjero, el empleador, el reagrupante u otro sujeto.',
    legalBasis: ['RD 1155/2024 art. 197', 'Hoja informativa específica de cada autorización'],
    blockSubmissionUntilValidated: true,
    remoteOnly: true,
    clientDigitalCredentialRequired: true,
    credentialFallbackServiceSlug: 'certificado-digital-persona-fisica',
  },
  {
    serviceSlug: 'arraigo-social',
    mode: 'route_dependent',
    authority: 'extranjeria',
    canExpertPresent: 'conditional',
    evidence: ['Validar legitimación de la modalidad concreta antes de prometer presentación por tercero'],
    filingRule: 'La ficha oficial vigente identifica al extranjero personalmente, o a su representante legal si es menor o incapaz; no asumir representación voluntaria genérica.',
    legalBasis: ['Hoja 28 Migraciones', 'RD 1155/2024 art. 197'],
    blockSubmissionUntilValidated: true,
    remoteOnly: true,
    clientDigitalCredentialRequired: true,
    credentialFallbackServiceSlug: 'certificado-digital-persona-fisica',
  },
  {
    serviceSlug: 'arraigo-familiar',
    mode: 'route_dependent',
    authority: 'extranjeria',
    canExpertPresent: 'conditional',
    evidence: ['Validar legitimación y supuesto familiar concreto antes de determinar la representación'],
    filingRule: 'No prometer presentación por EXPERT hasta validar la modalidad vigente y el sujeto legitimado.',
    legalBasis: ['Hoja 31 Migraciones', 'RD 1155/2024 art. 197'],
    blockSubmissionUntilValidated: true,
    remoteOnly: true,
    clientDigitalCredentialRequired: true,
    credentialFallbackServiceSlug: 'certificado-digital-persona-fisica',
  },
  {
    serviceSlug: 'arraigo-laboral',
    mode: 'route_dependent',
    authority: 'extranjeria',
    canExpertPresent: 'conditional',
    evidence: ['Validar legitimación del arraigo sociolaboral y forma de presentación aplicable'],
    filingRule: 'No asumir que un mandato privado habilita a EXPERT para presentar; validar primero el régimen del procedimiento.',
    legalBasis: ['Hoja 29 Migraciones', 'RD 1155/2024 art. 197'],
    blockSubmissionUntilValidated: true,
    remoteOnly: true,
    clientDigitalCredentialRequired: true,
    credentialFallbackServiceSlug: 'certificado-digital-persona-fisica',
  },
];

const bySlug = new Map(policies.map((policy) => [policy.serviceSlug, policy]));

export const IMMIGRATION_REPRESENTATION_POLICIES = policies;

export function getImmigrationRepresentationPolicy(serviceSlug: string) {
  return bySlug.get(serviceSlug) ?? null;
}
