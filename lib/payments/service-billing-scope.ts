export type ServiceBillingScope = 'profile' | 'company';

const PROFILE_BILLING_SERVICE_SLUGS = new Set([
  'nacionalidad-espanola-menor-nacido-en-espana',
]);

export type ServiceBillingResolution =
  | { scope: 'profile'; companyId: null }
  | { scope: 'company'; companyId: string }
  | { scope: 'company_required'; companyId: null };

export function resolveServiceBillingScope(input: {
  serviceSlugs: string[];
  explicitCompanyId?: string | null;
  activeCompanyId?: string | null;
  clientType?: string | null;
}): ServiceBillingResolution {
  const hasProfileOnlyService = input.serviceSlugs.some((slug) => PROFILE_BILLING_SERVICE_SLUGS.has(slug));

  // Personal legal/administrative procedures must stay billed to the person,
  // even when that same profile also manages one or more companies in EXPERT.
  if (hasProfileOnlyService) {
    return { scope: 'profile', companyId: null };
  }

  const companyId = input.explicitCompanyId ?? input.activeCompanyId ?? null;
  if (companyId) {
    return { scope: 'company', companyId };
  }

  if (input.clientType === 'empresa' || input.clientType === 'autonomo') {
    return { scope: 'company_required', companyId: null };
  }

  return { scope: 'profile', companyId: null };
}
