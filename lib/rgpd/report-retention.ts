/**
 * RGPD report retention policy (draft; review-only until approved).
 *
 * Only individual report interactions expire after 12 calendar months.
 * Never remove a contact, a marketing consent or any non-RGPD interaction.
 * Execution requires a separate authenticated, audited administrative workflow.
 */
export const RGPD_REPORT_RETENTION_MONTHS = 12;
export const RGPD_REPORT_NOTICE_VERSION = 'rgpd-report-2026-10-15';

type Metadata = Record<string, unknown>;
type Interaction = { at?: unknown; channel?: unknown; source_key?: unknown; details?: unknown };

export type RgpdRetentionPlan =
  | { action: 'none'; expired: 0; reason: string }
  | { action: 'manual_review'; expired: number; reason: string }
  | { action: 'review_delete_lead'; expired: number; reason: string }
  | { action: 'prune_interactions'; expired: number; reason: string; nextMetadata: Metadata };

function record(value: unknown): Metadata | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Metadata : null;
}

export function isRgpdReportInteraction(value: unknown): value is Interaction {
  const entry = record(value);
  return !!entry && entry.channel === 'rgpd_report'
    && typeof entry.source_key === 'string'
    && entry.source_key.startsWith('rgpd-report:');
}

function expiresAt(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const t = new Date(value);
  if (!Number.isFinite(t.valueOf())) return null;
  t.setUTCMonth(t.getUTCMonth() + RGPD_REPORT_RETENTION_MONTHS);
  return t.valueOf();
}

export function planRgpdReportRetention(input: {
  metadata: unknown;
  sourceKey?: string | null;
  category?: string | null;
  state?: string | null;
  lifecycleStage?: string | null;
  now: Date;
}): RgpdRetentionPlan {
  const metadata = record(input.metadata);
  if (!metadata || !Array.isArray(metadata.inquiries)) return { action: 'none', expired: 0, reason: 'no_inquiry_history' };
  if (!Number.isFinite(input.now.valueOf())) return { action: 'manual_review', expired: 0, reason: 'invalid_clock' };

  const rgpd = metadata.inquiries.filter(isRgpdReportInteraction);
  if (!rgpd.length) return { action: 'none', expired: 0, reason: 'no_rgpd_report_interactions' };
  // Invalid dates, explicit legal holds and marketing evidence MUST NOT be silently purged.
  if (rgpd.some(item => expiresAt(item.at) === null)) {
    return { action: 'manual_review', expired: 0, reason: 'missing_or_invalid_date' };
  }
  const old = rgpd.filter(item => (expiresAt(item.at) ?? Infinity) <= input.now.valueOf());
  if (!old.length) return { action: 'none', expired: 0, reason: 'not_due' };
  if (metadata.legal_hold === true || metadata.retention_hold === true) {
    return { action: 'manual_review', expired: old.length, reason: 'legal_or_retention_hold' };
  }
  // Check consent at interaction level AND root level; no implicit withdrawal.
  if (metadata.marketing_consent === true || rgpd.some(item =>
    record(item.details)?.marketing_consent === true)) {
    return { action: 'manual_review', expired: old.length, reason: 'marketing_consent_evidence' };
  }
  // Single-purpose leads may have references elsewhere; only an authorized
  // operator may delete/anonymize the whole record after checking dependencies.
  if (input.sourceKey?.startsWith('rgpd-report:')) {
    return { action: 'review_delete_lead', expired: old.length, reason: 'source_key_orphan_risk' };
  }

  // Filter by the *individual event timestamp*, not source_key: a reused
  // key must never cause deletion of a newer interaction with the same key.
  const nextInquiries = metadata.inquiries.filter((item: unknown) =>
    !isRgpdReportInteraction(item) || (expiresAt(item.at) ?? Infinity) > input.now.valueOf());
  return {
    action: 'prune_interactions',
    expired: old.length,
    reason: 'expired_informational_history_only',
    nextMetadata: {
      ...metadata,
      inquiries: nextInquiries,
    },
  };
}
