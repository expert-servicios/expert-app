import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export type PublicServiceReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  featured: boolean;
};

export type PublicServiceReviewSummary = {
  average: number | null;
  count: number;
  reviews: PublicServiceReview[];
};

const EMPTY_SUMMARY: PublicServiceReviewSummary = {
  average: null,
  count: 0,
  reviews: [],
};
const PAGE_SIZE = 1000;
const CASE_BATCH_SIZE = 100;

/**
 * Single source of truth for ratings on the public listing and detail pages.
 * Only verified reviews from a case with the exact service_id count. A pending TEXT moderation never blocks its verified star rating.
 * Stars are independent of permission to publish a written comment.
 *
 * Query in batches to avoid N+1 database requests on public catalog grids.
 * Fail closed if a batch is unavailable; never show invented ratings.
 */
export async function getPublicServiceReviewSummaries(
  serviceSlugs: readonly string[],
): Promise<Record<string, PublicServiceReviewSummary>> {
  const uniqueSlugs = [...new Set(serviceSlugs.filter(Boolean))];
  const empty = () => Object.fromEntries(uniqueSlugs.map((slug) => [
    slug, { ...EMPTY_SUMMARY, reviews: [] },
  ])) as Record<string, PublicServiceReviewSummary>;
  if (!uniqueSlugs.length) return {};

  try {
    const admin = getSupabaseAdmin();
    const caseToSlug = new Map<string, string>();
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await admin
        .from('cases')
        .select('id,service_id')
        .in('service_id', uniqueSlugs)
        .order('id', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) throw error;
      for (const row of data ?? []) {
        if (row.service_id && uniqueSlugs.includes(row.service_id)) {
          caseToSlug.set(row.id, row.service_id);
        }
      }
      if (!data || data.length < PAGE_SIZE) break;
    }

    const summaries = empty();
    const sums = new Map<string, number>();
    const caseIds = [...caseToSlug.keys()];
    for (let start = 0; start < caseIds.length; start += CASE_BATCH_SIZE) {
      const batchIds = caseIds.slice(start, start + CASE_BATCH_SIZE);
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const { data, error } = await admin
          .from('reviews')
          .select('id,case_id,rating,comment,comment_publishable,allow_publish,published,created_at,featured,status,review_request_id')
          .in('case_id', batchIds)
          .in('status', ['approved', 'pending'])
          .order('id', { ascending: true })
          .range(offset, offset + PAGE_SIZE - 1);
        if (error) throw error;
        for (const review of data ?? []) {
          // Pending comments count only when backed by a verified, issued request.
          // Excludes legacy/test pending records without a request.
          if (review.status !== 'approved' && !review.review_request_id) continue;
          const slug = caseToSlug.get(review.case_id);
          const summary = slug ? summaries[slug] : undefined;
          if (!summary) continue;
          const rating = Number(review.rating);
          if (!Number.isInteger(rating) || rating < 1 || rating > 5) continue;
          summary.count += 1;
          sums.set(slug!, (sums.get(slug!) ?? 0) + rating);
          const comment = review.status === 'approved' &&
            review.allow_publish === true &&
            review.published === true &&
            review.comment_publishable === true &&
            typeof review.comment === 'string'
              ? review.comment.trim()
              : '';
          if (comment) summary.reviews.push({
            id: review.id,
            rating,
            comment,
            createdAt: review.created_at,
            featured: Boolean(review.featured),
          });
        }
        if (!data || data.length < PAGE_SIZE) break;
      }
    }

    for (const [slug, summary] of Object.entries(summaries)) {
      if (summary.count) summary.average = (sums.get(slug) ?? 0) / summary.count;
      summary.reviews = summary.reviews
        .sort((a, b) => Number(b.featured) - Number(a.featured) ||
          b.createdAt.localeCompare(a.createdAt))
        .slice(0, 3);
    }
    return summaries;
  } catch (error) {
    console.error('[public-service-reviews]', error);
    return empty();
  }
}

export async function getPublicServiceReviewSummary(
  serviceSlug: string,
): Promise<PublicServiceReviewSummary> {
  const summaries = await getPublicServiceReviewSummaries([serviceSlug]);
  return summaries[serviceSlug] ?? EMPTY_SUMMARY;
}
