export const HOLDED_BRAND_NAME = 'Holded' as const;

export const EXPERT_IDENTITY = {
  brandName: 'EXPERT',
  legalName: 'EXPERT ESTUDIOS PROFESIONALES, SLU',
  taxId: 'B44991776',
  canonicalDomain: 'expertconsulting.es',
  publicEmail: 'info@expertconsulting.es',
  professionalEmail: 'soy@kseniailicheva.com',
  phoneDisplay: '+34 669 04 55 28',
  phoneE164: '+34669045528',
  address: 'C/ Pintor Agrassot, 19 - 03110 Mutxamel (Alicante)',
  credentials: {
    holdedSolutionPartner: 'Holded Solution Partner',
    holdedAccreditedAdvisory: 'Asesoría Holded acreditada',
    aeatSocialCollaborator: 'Colaborador social de la Agencia Tributaria',
    academy: 'EXPERT Business Academy — formación privada/no reglada',
  },
} as const;

/**
 * Protected names and claims are canonical copy. They may be embedded in localized
 * sentences, but the strings themselves must not be translated, transliterated,
 * declined or otherwise altered without an explicit brand-governance decision.
 */
export const PROTECTED_BRAND_TERMS = [
  HOLDED_BRAND_NAME,
  EXPERT_IDENTITY.brandName,
  'KIA',
  EXPERT_IDENTITY.credentials.holdedSolutionPartner,
  EXPERT_IDENTITY.credentials.holdedAccreditedAdvisory,
] as const;
