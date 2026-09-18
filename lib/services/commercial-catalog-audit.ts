import { services } from '@/lib/utils/catalog';
import { ADMIN_CATALOG } from '@/lib/utils/admin-catalog';
import { SERVICES_CATALOG } from '@/lib/data/services-catalog';
import { getService } from '@/lib/services/service-registry';
import { parseFixedEuroPrice } from '@/lib/integrations/meta/catalog-mapper';
import { LEGACY_SERVICE_ALIASES } from '@/lib/services/commercial-catalog-bindings';

export type CommercialCatalogIssue =
  | 'price_mismatch'
  | 'public_price_ambiguous'
  | 'missing_admin_item'
  | 'admin_only_item'
  | 'conversation_only_item'
  | 'stripe_binding_without_fixed_public_price'
  | 'registry_without_public_item';

export type CommercialCatalogInventoryRow = {
  id: string;
  publicName: string | null;
  adminLabel: string | null;
  conversationTitle: string | null;
  publicPriceText: string | null;
  publicFixedPrice: number | null;
  adminSuggestedPrice: number | null;
  adminMode: 'payment' | 'subscription' | null;
  stripePriceId: string | null;
  stripePriceEnvKey: string | null;
  flowType: string | null;
  hasCheckout: boolean;
  isSubscription: boolean;
  sources: {
    publicCatalog: boolean;
    adminCatalog: boolean;
    conversationCatalog: boolean;
    serviceRegistry: boolean;
  };
  issues: CommercialCatalogIssue[];
};

export type CommercialAliasCandidate = {
  alias: string;
  canonical: string;
  reason: string;
  status: 'candidate';
};

export const COMMERCIAL_ALIAS_CANDIDATES: CommercialAliasCandidate[] = LEGACY_SERVICE_ALIASES.map(
  (binding) => ({
    alias: binding.alias,
    canonical: binding.canonicalServiceId,
    reason: binding.reason,
    status: 'candidate' as const,
  })
);

function conversationMap() {
  return new Map(
    SERVICES_CATALOG.flatMap((section) => section.services).map((item) => [item.id, item])
  );
}

export function auditCommercialCatalogInventory() {
  const publicBySlug = new Map(services.map((service) => [service.slug, service]));
  const adminById = new Map(ADMIN_CATALOG.map((item) => [item.id, item]));
  const conversationById = conversationMap();

  const ids = new Set<string>([
    ...publicBySlug.keys(),
    ...adminById.keys(),
    ...conversationById.keys(),
  ]);

  const rows: CommercialCatalogInventoryRow[] = Array.from(ids)
    .sort()
    .map((id) => {
      const publicItem = publicBySlug.get(id) ?? null;
      const adminItem = adminById.get(id) ?? null;
      const conversationItem = conversationById.get(id) ?? null;
      const registryItem = getService(id);
      const publicFixedPrice = parseFixedEuroPrice(publicItem?.price);
      const issues: CommercialCatalogIssue[] = [];

      if (publicItem && publicFixedPrice === null) issues.push('public_price_ambiguous');
      if (publicItem && !adminItem) issues.push('missing_admin_item');
      if (adminItem && !publicItem) issues.push('admin_only_item');
      if (conversationItem && !publicItem && !adminItem) issues.push('conversation_only_item');
      if (registryItem && !publicItem) issues.push('registry_without_public_item');

      if (
        publicFixedPrice !== null &&
        adminItem &&
        adminItem.suggestedPrice > 0 &&
        publicFixedPrice !== adminItem.suggestedPrice
      ) {
        issues.push('price_mismatch');
      }

      const stripePriceId = publicItem?.stripePriceId ?? registryItem?.stripePriceId ?? null;
      if (stripePriceId && publicFixedPrice === null) {
        issues.push('stripe_binding_without_fixed_public_price');
      }

      return {
        id,
        publicName: publicItem?.name ?? null,
        adminLabel: adminItem?.label ?? null,
        conversationTitle: conversationItem?.title ?? null,
        publicPriceText: publicItem?.price ?? null,
        publicFixedPrice,
        adminSuggestedPrice: adminItem?.suggestedPrice ?? null,
        adminMode: adminItem?.mode ?? null,
        stripePriceId,
        stripePriceEnvKey: adminItem?.stripePriceEnvKey ?? null,
        flowType: registryItem?.flowType ?? null,
        hasCheckout: registryItem?.hasCheckout ?? false,
        isSubscription: registryItem?.isSubscription ?? adminItem?.mode === 'subscription',
        sources: {
          publicCatalog: Boolean(publicItem),
          adminCatalog: Boolean(adminItem),
          conversationCatalog: Boolean(conversationItem),
          serviceRegistry: Boolean(registryItem),
        },
        issues,
      };
    });

  const issueCounts = rows.reduce<Record<string, number>>((acc, row) => {
    for (const issue of row.issues) acc[issue] = (acc[issue] ?? 0) + 1;
    return acc;
  }, {});

  return {
    generatedFrom: [
      'lib/utils/catalog.ts',
      'lib/utils/admin-catalog.ts',
      'lib/data/services-catalog.ts',
      'lib/services/service-registry.ts',
    ],
    readOnly: true as const,
    totals: {
      uniqueIds: rows.length,
      publicItems: services.length,
      adminItems: ADMIN_CATALOG.length,
      conversationItems: conversationById.size,
      rowsWithIssues: rows.filter((row) => row.issues.length > 0).length,
      stripeBoundRows: rows.filter((row) => Boolean(row.stripePriceId || row.stripePriceEnvKey)).length,
      checkoutableRows: rows.filter((row) => row.hasCheckout).length,
    },
    issueCounts,
    aliasCandidates: COMMERCIAL_ALIAS_CANDIDATES,
    rows,
  };
}
