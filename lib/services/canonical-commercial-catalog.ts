import { services, type Service } from '@/lib/utils/catalog';
import { ADMIN_CATALOG, type CatalogItem } from '@/lib/utils/admin-catalog';
import {
  getAliasesForCanonicalService,
  getChildOffersForCanonicalService,
  resolveCanonicalServiceId,
} from '@/lib/services/commercial-catalog-bindings';

export type CanonicalServiceStatus = 'draft' | 'active' | 'paused' | 'retired';
export type CanonicalServiceType = 'service' | 'training' | 'plan' | 'procedure';
export type BillingMode = 'one_time' | 'recurring' | 'quote';
export type PriceMode = 'fixed' | 'from' | 'quote';
export type VatTreatment =
  | 'plus_vat'
  | 'vat_included'
  | 'exempt'
  | 'outside_scope'
  | 'manual_review';

export interface CanonicalServiceIdentity {
  serviceId: string;
  slug: string;
  categoryId: string;
  status: CanonicalServiceStatus;
  serviceType: CanonicalServiceType;
}

export interface CanonicalServiceContent {
  serviceId: string;
  locale: 'es' | 'ru' | 'en';
  name: string;
  shortDescription: string;
  description: string;
  metaTitle: string | null;
  metaDescription: string | null;
  landingPath: string;
}

export interface CanonicalCommercialOffer {
  offerId: string;
  serviceId: string;
  code: string;
  billingMode: BillingMode;
  priceMode: PriceMode;
  currency: 'EUR';
  amountCents: number | null;
  vatTreatment: VatTreatment;
  status: CanonicalServiceStatus;
  source: 'legacy_public' | 'legacy_admin';
  sourceId: string;
  stripePriceId: string | null;
  stripePriceEnvKey: string | null;
}

export interface CanonicalShadowService {
  identity: CanonicalServiceIdentity;
  aliases: string[];
  contentEs: CanonicalServiceContent;
  offers: CanonicalCommercialOffer[];
  warnings: string[];
}

function normalizeServiceType(service: Service): CanonicalServiceType {
  if (service.categoria === 'formacion') return 'training';
  if (service.slug.startsWith('plan-')) return 'plan';
  return 'service';
}

function parseLegacyPublicPrice(price?: string): {
  mode: PriceMode;
  amountCents: number | null;
  vatTreatment: VatTreatment;
} {
  if (!price?.trim()) {
    return { mode: 'quote', amountCents: null, vatTreatment: 'manual_review' };
  }

  const normalized = price.trim();
  const vatTreatment: VatTreatment = /\+\s*IVA/i.test(normalized)
    ? 'plus_vat'
    : /IVA\s+incluido/i.test(normalized)
      ? 'vat_included'
      : 'manual_review';

  if (/^consultar$/i.test(normalized)) {
    return { mode: 'quote', amountCents: null, vatTreatment };
  }

  const amountMatch = normalized.match(/(\d+(?:[.,]\d{1,2})?)\s*€/);
  const amountCents = amountMatch
    ? Math.round(Number(amountMatch[1].replace(',', '.')) * 100)
    : null;

  if (/^desde\b/i.test(normalized)) {
    return { mode: 'from', amountCents, vatTreatment };
  }

  if (amountCents !== null) {
    return { mode: 'fixed', amountCents, vatTreatment };
  }

  return { mode: 'quote', amountCents: null, vatTreatment: 'manual_review' };
}

function publicOffer(service: Service): CanonicalCommercialOffer {
  const parsed = parseLegacyPublicPrice(service.price);
  return {
    offerId: `legacy-public:${service.slug}`,
    serviceId: service.slug,
    code: 'default',
    billingMode: parsed.mode === 'quote' ? 'quote' : 'one_time',
    priceMode: parsed.mode,
    currency: 'EUR',
    amountCents: parsed.amountCents,
    vatTreatment: parsed.vatTreatment,
    status: 'active',
    source: 'legacy_public',
    sourceId: service.slug,
    stripePriceId: service.stripePriceId ?? null,
    stripePriceEnvKey: null,
  };
}

function adminOffer(
  item: CatalogItem,
  serviceId: string,
  code = item.category === 'formacion' ? item.id : 'admin-default'
): CanonicalCommercialOffer {
  const isQuote = item.suggestedPrice <= 0;
  return {
    offerId: `legacy-admin:${item.id}`,
    serviceId,
    code,
    billingMode: isQuote ? 'quote' : item.mode === 'subscription' ? 'recurring' : 'one_time',
    priceMode: isQuote ? 'quote' : 'fixed',
    currency: 'EUR',
    amountCents: isQuote ? null : Math.round(item.suggestedPrice * 100),
    vatTreatment: 'manual_review',
    status: 'active',
    source: 'legacy_admin',
    sourceId: item.id,
    stripePriceId: null,
    stripePriceEnvKey: item.stripePriceEnvKey ?? null,
  };
}

export function buildCanonicalShadowCatalog(): CanonicalShadowService[] {
  const childBindingBySource = new Map(
    ADMIN_CATALOG.flatMap((item) =>
      getChildOffersForCanonicalService('formacion-holded')
        .filter((binding) => binding.sourceId === item.id)
        .map((binding) => [item.id, binding] as const)
    )
  );

  const adminByCanonicalService = new Map<string, Array<{ item: CatalogItem; offerCode?: string }>>();
  for (const item of ADMIN_CATALOG) {
    const childBinding = childBindingBySource.get(item.id);
    const canonicalServiceId = childBinding?.canonicalServiceId ?? resolveCanonicalServiceId(item.id);
    const current = adminByCanonicalService.get(canonicalServiceId) ?? [];
    current.push({ item, offerCode: childBinding?.offerCode });
    adminByCanonicalService.set(canonicalServiceId, current);
  }

  return services.map((service) => {
    const identity: CanonicalServiceIdentity = {
      serviceId: service.slug,
      slug: service.slug,
      categoryId: service.categoria,
      status: 'active',
      serviceType: normalizeServiceType(service),
    };

    const contentEs: CanonicalServiceContent = {
      serviceId: service.slug,
      locale: 'es',
      name: service.name,
      shortDescription: service.shortDescription,
      description: service.description,
      metaTitle: service.metaTitle ?? null,
      metaDescription: service.metaDescription ?? null,
      landingPath: `/servicios/${service.categoria}/${service.slug}`,
    };

    const offers = [publicOffer(service)];
    const warnings: string[] = [];
    const aliases = getAliasesForCanonicalService(service.slug).map((binding) => binding.alias);
    const adminBindings = adminByCanonicalService.get(service.slug) ?? [];

    if (adminBindings.length > 0) {
      for (const binding of adminBindings) {
        offers.push(adminOffer(binding.item, service.slug, binding.offerCode));
      }

      const publicAmount = offers[0].amountCents;
      const directlyComparable = adminBindings
        .filter((binding) => !binding.offerCode)
        .map((binding) => offers.find((offer) => offer.sourceId === binding.item.id))
        .filter((offer): offer is CanonicalCommercialOffer => Boolean(offer));

      if (
        offers[0].priceMode === 'fixed' &&
        directlyComparable.some(
          (candidate) => candidate.priceMode === 'fixed' && publicAmount !== candidate.amountCents
        )
      ) {
        warnings.push('legacy_price_conflict');
      }
    } else {
      warnings.push('missing_legacy_admin_binding');
    }

    if (offers[0].vatTreatment === 'manual_review') {
      warnings.push('vat_treatment_requires_review');
    }

    if (offers[0].priceMode !== 'fixed') {
      warnings.push('non_fixed_public_offer');
    }

    return { identity, aliases, contentEs, offers, warnings };
  });
}
