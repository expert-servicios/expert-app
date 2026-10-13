import { categories, services } from '@/lib/utils/catalog';
import { getLocalizedServicePresentation } from '@/lib/services/service-localized-content';
import { getPublicServicePath } from '@/lib/i18n/service-routes';

/**
 * Read-only parity inventory. A localized path alone does not prove content or
 * checkout parity; the audit deliberately tracks these separately.
 */
export function auditRuServiceCatalog() {
  const categorySlugs = new Set<string>(categories.map(c => c.slug));
  const items = services.filter(s => categorySlugs.has(s.categoria)).map(service => {
    const localized = getLocalizedServicePresentation(service.slug, 'ru');
    const esPath = getPublicServicePath({ slug: service.slug, category: service.categoria }, 'es');
    const ruPath = getPublicServicePath({ slug: service.slug, category: service.categoria }, 'ru');
    return {
      serviceSlug: service.slug,
      category: service.categoria,
      esPath,
      ruPath,
      hasRuPresentation: Boolean(localized),
      missingRuPage: !localized || ruPath === esPath,
      ruTitle: localized?.title ?? null,
      canonicalPrice: service.price ?? null,
      checkoutAvailable: Boolean(service.stripePriceId || service.priceCalculator || service.unitPriceCalculator || service.deliveryOptions?.length),
      requiresEditorialReview: !localized || localized.indexable === false,
    };
  });
  return {
    generatedAt: new Date().toISOString(),
    source: 'lib/utils/catalog.ts + lib/services/service-localized-content.ts',
    total: items.length,
    localized: items.filter(i => i.hasRuPresentation).length,
    missing: items.filter(i => i.missingRuPage).length,
    needsEditorialReview: items.filter(i => i.requiresEditorialReview).length,
    byCategory: categories.map(c => ({
      slug: c.slug,
      total: items.filter(i => i.category === c.slug).length,
      translated: items.filter(i => i.category === c.slug && i.hasRuPresentation).length,
    })),
    items,
  };
}
