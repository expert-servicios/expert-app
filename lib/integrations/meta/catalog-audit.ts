import { services } from '@/lib/utils/catalog';
import { ADMIN_CATALOG } from '@/lib/utils/admin-catalog';
import { getMetaCatalogDrafts, parseFixedEuroPrice } from './catalog-mapper';

export type MetaCatalogAudit = {
  total: number;
  ready: number;
  manualReview: number;
  warningCounts: Record<string, number>;
  byCategory: Array<{
    category: string;
    total: number;
    ready: number;
    manualReview: number;
  }>;
  pilotCandidates: string[];
  commercialConsistency: {
    publicServiceCount: number;
    adminItemCount: number;
    overlappingSlugs: number;
    exactPriceMatches: number;
    priceMismatches: number;
    publicWithoutAdmin: number;
    adminWithoutPublic: number;
    publicWithoutFixedPrice: number;
    issues: Array<{
      slug: string;
      publicPrice: number | null;
      adminSuggestedPrice: number | null;
      issue: 'missing_admin_item' | 'missing_public_fixed_price' | 'price_mismatch' | 'admin_alias_only';
    }>;
  };
};

function auditCommercialConsistency(): MetaCatalogAudit['commercialConsistency'] {
  const adminById = new Map(ADMIN_CATALOG.map((item) => [item.id, item]));
  const publicBySlug = new Map(services.map((service) => [service.slug, service]));

  let overlappingSlugs = 0;
  let exactPriceMatches = 0;
  let priceMismatches = 0;
  let publicWithoutAdmin = 0;
  let adminWithoutPublic = 0;
  let publicWithoutFixedPrice = 0;
  const issues: MetaCatalogAudit['commercialConsistency']['issues'] = [];

  for (const service of services) {
    const publicPrice = parseFixedEuroPrice(service.price);
    const adminItem = adminById.get(service.slug);

    if (!adminItem) {
      publicWithoutAdmin++;
      if (publicPrice === null) publicWithoutFixedPrice++;
      issues.push({
        slug: service.slug,
        publicPrice,
        adminSuggestedPrice: null,
        issue: 'missing_admin_item',
      });
      continue;
    }

    overlappingSlugs++;
    if (publicPrice === null) {
      publicWithoutFixedPrice++;
      issues.push({
        slug: service.slug,
        publicPrice: null,
        adminSuggestedPrice: adminItem.suggestedPrice,
        issue: 'missing_public_fixed_price',
      });
      continue;
    }

    if (publicPrice === adminItem.suggestedPrice) {
      exactPriceMatches++;
    } else {
      priceMismatches++;
      issues.push({
        slug: service.slug,
        publicPrice,
        adminSuggestedPrice: adminItem.suggestedPrice,
        issue: 'price_mismatch',
      });
    }
  }

  for (const item of ADMIN_CATALOG) {
    if (!publicBySlug.has(item.id)) {
      adminWithoutPublic++;
      issues.push({
        slug: item.id,
        publicPrice: null,
        adminSuggestedPrice: item.suggestedPrice,
        issue: 'admin_alias_only',
      });
    }
  }

  return {
    publicServiceCount: services.length,
    adminItemCount: ADMIN_CATALOG.length,
    overlappingSlugs,
    exactPriceMatches,
    priceMismatches,
    publicWithoutAdmin,
    adminWithoutPublic,
    publicWithoutFixedPrice,
    issues,
  };
}

export function auditMetaCatalog(): MetaCatalogAudit {
  const drafts = getMetaCatalogDrafts();
  const warningCounts: Record<string, number> = {};
  const byCategory = new Map<string, { total: number; ready: number; manualReview: number }>();

  for (const item of drafts) {
    for (const warning of item.warnings) {
      warningCounts[warning] = (warningCounts[warning] ?? 0) + 1;
    }

    const current = byCategory.get(item.sourceCategorySlug) ?? { total: 0, ready: 0, manualReview: 0 };
    current.total += 1;
    if (item.marketingReady) current.ready += 1;
    else current.manualReview += 1;
    byCategory.set(item.sourceCategorySlug, current);
  }

  const pilotCandidates: string[] = [];
  for (const category of byCategory.keys()) {
    const candidate = drafts.find((item) => item.sourceCategorySlug === category && item.marketingReady);
    if (candidate) pilotCandidates.push(candidate.retailerId);
    if (pilotCandidates.length >= 5) break;
  }

  const ready = drafts.filter((item) => item.marketingReady).length;

  return {
    total: drafts.length,
    ready,
    manualReview: drafts.length - ready,
    warningCounts,
    byCategory: Array.from(byCategory.entries()).map(([category, values]) => ({ category, ...values })),
    pilotCandidates,
    commercialConsistency: auditCommercialConsistency(),
  };
}
