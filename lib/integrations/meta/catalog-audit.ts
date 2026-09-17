import { getMetaCatalogDrafts } from './catalog-mapper';

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
};

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
  };
}
