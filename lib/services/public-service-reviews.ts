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

/**
 * Reads only reviews that are explicitly publishable and approved.
 * Fail-closed: public service pages must keep rendering if Supabase is unavailable.
 */
export async function getPublicServiceReviewSummary(
  serviceSlug: string,
): Promise<PublicServiceReviewSummary> {
  try {
    const admin = getSupabaseAdmin();

    const { data: cases, error: casesError } = await admin
      .from('cases')
      .select('id')
      .eq('service_id', serviceSlug)
      .order('opened_at', { ascending: false })
      .limit(300);

    if (casesError || !cases?.length) return EMPTY_SUMMARY;

    const caseIds = cases.map((item) => item.id);

    const { data: reviews, error: reviewsError } = await admin
      .from('reviews')
      .select('id,rating,comment,comment_publishable,created_at,featured')
      .in('case_id', caseIds)
      .eq('status', 'approved')
      .eq('published', true)
      .eq('allow_publish', true)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (reviewsError || !reviews?.length) return EMPTY_SUMMARY;

    const normalized = reviews.map((review) => ({
      id: review.id,
      rating: Number(review.rating),
      comment: review.comment_publishable === true && typeof review.comment === 'string' && review.comment.trim()
        ? review.comment.trim()
        : null,
      createdAt: review.created_at,
      featured: Boolean(review.featured),
    }));

    const average =
      normalized.reduce((total, review) => total + review.rating, 0) / normalized.length;

    return {
      average: Math.round(average * 10) / 10,
      count: normalized.length,
      reviews: normalized.filter((review) => review.comment).slice(0, 3),
    };
  } catch (error) {
    console.error('[public-service-reviews]', error);
    return EMPTY_SUMMARY;
  }
}
