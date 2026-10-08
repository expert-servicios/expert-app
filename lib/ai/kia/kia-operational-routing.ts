import { getKiaSkillDefinition } from '@/lib/ai/kia/kia-skill-registry';

export const KIA_OPERATIONAL_CATEGORIES = [
  'commercial',
  'fiscal_accounting',
  'labor',
  'immigration',
  'rentals',
  'holded_support',
  'case_operations',
  'billing_collection',
  'non_human',
  'manual_review',
] as const;

export type KiaOperationalCategory = (typeof KIA_OPERATIONAL_CATEGORIES)[number];

export function isKiaOperationalCategory(value: unknown): value is KiaOperationalCategory {
  return typeof value === 'string' && (KIA_OPERATIONAL_CATEGORIES as readonly string[]).includes(value);
}

export type KiaOperationalRoutingInput = {
  skillId?: string | null;
  subAgentId?: string | null;
  detectedIntent?: string | null;
  serviceSlug?: string | null;
  recipientPurpose?: string | null;
  envelopeKind?: string | null;
  requiresManualReview?: boolean;
};

const RENTAL_SIGNAL = /(?:arrend|alquiler|inquilin|renta[-_ ]?(?:vivienda|local)|lease|rent)/i;
const BILLING_SIGNAL = /(?:factur|cobro|impag|recobro|deuda|payment|pago)/i;

function normalized(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

export function resolveKiaOperationalCategory(
  input: KiaOperationalRoutingInput,
): KiaOperationalCategory {
  if (input.requiresManualReview) return 'manual_review';

  const recipientPurpose = normalized(input.recipientPurpose);
  const envelopeKind = normalized(input.envelopeKind);
  const serviceSlug = normalized(input.serviceSlug);
  const intent = normalized(input.detectedIntent);
  const skillId = normalized(input.skillId);
  const subAgentId = normalized(input.subAgentId);

  if (recipientPurpose === 'billing') return 'billing_collection';
  if (RENTAL_SIGNAL.test(serviceSlug)) return 'rentals';
  if (BILLING_SIGNAL.test(serviceSlug)) return 'billing_collection';

  if (skillId.startsWith('holded.') || subAgentId === 'holded' || ['readiness', 'connect_holded'].includes(intent)) {
    return 'holded_support';
  }

  const skill = input.skillId ? getKiaSkillDefinition(input.skillId) : null;
  const domain = skill?.domain ?? null;

  if (domain === 'fiscal' || domain === 'accounting' || subAgentId === 'fiscal' || subAgentId === 'accounting') {
    return 'fiscal_accounting';
  }
  if (domain === 'labor' || subAgentId === 'labor' || intent === 'payroll_diagnostics') {
    return 'labor';
  }
  if (domain === 'immigration' || subAgentId === 'immigration' || intent === 'immigration_advice') {
    return 'immigration';
  }
  if (domain === 'documents' || domain === 'administration' || domain === 'corporate' || subAgentId === 'case') {
    return 'case_operations';
  }

  if (['service_selection', 'checkout', 'book_call', 'complete_profile'].includes(intent)) {
    return 'commercial';
  }
  if (['case_status', 'send_documents', 'document_classification', 'company_data_resolve', 'company_data_confirm', 'company_data_edit'].includes(intent)) {
    return 'case_operations';
  }

  if (['marketing', 'internal', 'system'].includes(envelopeKind)) return 'non_human';
  if (envelopeKind === 'provider' && recipientPurpose !== 'billing') return 'non_human';

  return 'manual_review';
}

export function kiaOperationalCategoryLabel(category: KiaOperationalCategory) {
  const labels: Record<KiaOperationalCategory, string> = {
    commercial: 'Comercial',
    fiscal_accounting: 'Fiscal / contable',
    labor: 'Laboral',
    immigration: 'Extranjería',
    rentals: 'Arrendamientos',
    holded_support: 'Holded / soporte',
    case_operations: 'Trámite / expediente',
    billing_collection: 'Facturación / cobro',
    non_human: 'Spam / no humano',
    manual_review: 'Otro / revisión manual',
  };
  return labels[category];
}
