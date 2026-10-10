/**
 * Canonical PostgREST OR expressions for the operational CRM.
 * A missing metadata flag on a newly submitted, unclassified lead should
 * not hide the request. Explicitly reviewed (false / segmented) historical
 * records remain outside the attention queue.
 */
export const CRM_ATTENTION_FILTER =
  'metadata->>crm_needs_attention.eq.true,and(state.eq.new,metadata->>crm_needs_attention.is.null,metadata->>crm_segment.is.null,or(source.is.null,source.not.in.(stripe_import,stripe_sync)))';

export const CRM_STRIPE_HISTORY_FILTER =
  'source.in.(stripe_import,stripe_sync),metadata->>crm_segment.in.(stripe_customer,stripe_imported,stripe_abandoned)';

/** Multiple PostgREST .or() calls overwrite each other; compose the two ORs. */
export function combineCrmOrFilters(segmentOr: string | null, searchOr: string | null) {
  if (segmentOr && searchOr) return `and(or(${segmentOr}),or(${searchOr}))`;
  return segmentOr ?? searchOr;
}
