export type ServiceBillingScope = 'profile' | 'company';
export type ServiceBillingPolicy = 'profile_only' | 'company_only' | 'flexible';

const PROFILE_ONLY_SERVICE_SLUGS = new Set([
  // Personal taxes / procedures.
  'irpf',
  'modelo-151',

  // Immigration, nationality and personal identification procedures.
  'arraigo-social',
  'arraigo-familiar',
  'arraigo-laboral',
  'renovacion-residencia',
  'nacionalidad-espanola',
  'nacionalidad-espanola-menor-nacido-en-espana',
  'reagrupacion-familiar',
  'permiso-residencia-inicial',
  'nie-pasaporte',

  // Succession is attached to the natural-person estate/heirs in this catalog.
  'herencia',

  // The contracting person is the future entrepreneur/shareholder; the entity
  // does not necessarily exist yet and must never be required to buy these.
  'alta-autonomo',
  'constitucion-sl',
  'constitucion-sl-circe',
  'nif-socio-extranjero',

  // The certificate identifies the natural person, not a linked company.
  'certificado-digital-persona-fisica',
]);

const COMPANY_ONLY_SERVICE_SLUGS = new Set([
  // This product identifies an existing legal entity and therefore needs an
  // explicit company record as the invoice/contracting scope.
  'certificado-digital-entidad',

  // Catalog services without direct checkout today. Keeping them here makes
  // future checkout enablement fail safely instead of inheriting profile scope.
  'impuesto-sociedades',
  'cuentas-anuales',
  'apoderamientos-mercantiles',
  'certificado-digital-sin-animo-lucro',
]);

export type ServiceBillingResolution =
  | { scope: 'profile'; companyId: null }
  | { scope: 'company'; companyId: string }
  | { scope: 'company_required'; companyId: null }
  | { scope: 'mixed_billing_scope'; companyId: null };

export function getServiceBillingPolicy(slug: string): ServiceBillingPolicy {
  if (PROFILE_ONLY_SERVICE_SLUGS.has(slug)) return 'profile_only';
  if (COMPANY_ONLY_SERVICE_SLUGS.has(slug)) return 'company_only';
  return 'flexible';
}

export function resolveServiceBillingScope(input: {
  serviceSlugs: string[];
  explicitCompanyId?: string | null;
  clientType?: string | null;
}): ServiceBillingResolution {
  const policies = input.serviceSlugs.map(getServiceBillingPolicy);
  const hasProfileOnly = policies.includes('profile_only');
  const hasCompanyOnly = policies.includes('company_only');
  const hasFlexible = policies.includes('flexible');
  const companyId = input.explicitCompanyId ?? null;

  // A personal legal/tax procedure cannot share an invoice recipient with a
  // service that is obligatorily attached to a legal entity.
  if (hasProfileOnly && hasCompanyOnly) {
    return { scope: 'mixed_billing_scope', companyId: null };
  }

  // Flexible services follow only an explicitly selected entity. The active
  // dashboard company is UI context and must never silently attribute a charge.
  // Therefore a cart containing a personal service plus a company-scoped
  // flexible service is rejected only when a company was explicitly selected.
  if (hasProfileOnly && hasFlexible && companyId) {
    return { scope: 'mixed_billing_scope', companyId: null };
  }

  // Strictly personal services stay on the natural-person profile even if that
  // user also manages one or more companies in EXPERT.
  if (hasProfileOnly) {
    return { scope: 'profile', companyId: null };
  }

  // Company-only services require an actual linked entity, never just a label
  // on the user's personal profile.
  if (hasCompanyOnly) {
    return companyId
      ? { scope: 'company', companyId }
      : { scope: 'company_required', companyId: null };
  }

  // Flexible services (Holded, mixed tax/admin services, training, etc.) can be
  // contracted by a natural person/autonomo or by a linked company. An autonomo
  // remains a natural person and does not need a company record merely to pay.
  if (companyId) {
    return { scope: 'company', companyId };
  }

  // A profile explicitly marked as "empresa" must select/create the entity that
  // is going to be invoiced. This does not apply to autonomos.
  if (input.clientType === 'empresa') {
    return { scope: 'company_required', companyId: null };
  }

  return { scope: 'profile', companyId: null };
}
