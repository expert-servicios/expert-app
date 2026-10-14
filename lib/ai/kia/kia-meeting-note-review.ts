/**
 * Read-only classification gate for AI-extracted meeting notes.
 *
 * The extractor supplies CANDIDATE assertions, not commands. Callers must
 * resolve the canonical subject and authenticate any evidence/approval via
 * server-side sources before calling this function. Even an approved result
 * is only a proposal: this module deliberately has no persistence/tools.
 */
export type MeetingAssertionKind =
  | 'fact'
  | 'question'
  | 'proposed_action'
  | 'legal_or_tax_opinion'
  | 'census_attribute';

export type MeetingEvidenceKind =
  | 'meeting_notes'
  | 'official_document'
  | 'canonical_record'
  | 'verified_staff_record';

export interface MeetingEvidence {
  ref: string;
  kind: MeetingEvidenceKind;
  /** Server-side verification; never trust a value copied from Gemini notes. */
  verified: boolean;
}

export interface MeetingAuthorityDecision {
  /** Authority MUST be checked against the authenticated Admin session. */
  authority: 'authenticated_expert_staff';
  decision: 'approve' | 'revoke';
  sourceRef: string;
  issuedAt: string;
  /** Approval is for this exact statement, not the entire meeting. */
  claimId: string;
}

export interface MeetingStatementCandidate {
  meetingId: string;
  notesVersion: string;
  subjectId: string;
  /** Required to prevent merging an autonomo with the company. */
  legalEntityScope: 'natural_person' | 'legal_entity';
  companyId?: string | null;
  claimId: string;
  kind: MeetingAssertionKind;
  title: string;
  meetingNotesRef: string;
  evidence: readonly MeetingEvidence[];
  authorityDecisions?: readonly MeetingAuthorityDecision[];
}

export type MeetingReviewState =
  | 'pending_review'
  | 'verified_fact'
  | 'confirmed_agreement'
  | 'revoked';

export interface ReviewedMeetingStatement {
  sourceKey: string;
  status: MeetingReviewState;
  title: string;
  legalEntityScope: MeetingStatementCandidate['legalEntityScope'];
  companyId: string | null;
  sourceRef: string;
  evidenceRefs: string[];
  /** These are *suggestions*, NOT permissions for system writes. */
  suggestedNextStep: 'review_with_expert' | 'record_verified_fact_proposal' | 'prepare_action_proposal' | 'none';
  reason: string;
  /** Never infer permission to email, book, pay, file taxes or edit Holded. */
  authorizedSideEffects: readonly [];
}

const HIGH_RISK_KINDS = new Set<MeetingAssertionKind>([
  'legal_or_tax_opinion',
  'census_attribute',
]);

function required(value: string, name: string): string {
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > 500 || /[\r\n]/.test(cleaned)) {
    throw new Error('meeting_note_invalid_' + name);
  }
  return cleaned;
}

function authorityFor(
  candidate: MeetingStatementCandidate,
  decision: 'approve' | 'revoke',
): boolean {
  return (candidate.authorityDecisions ?? []).some((item) =>
    item.claimId === candidate.claimId
    && item.decision === decision
    && item.authority === 'authenticated_expert_staff'
    && Boolean(item.sourceRef.trim())
    && Number.isFinite(Date.parse(item.issuedAt)),
  );
}

export function classifyMeetingStatement(candidate: MeetingStatementCandidate): ReviewedMeetingStatement {
  const meetingId = required(candidate.meetingId, 'meeting_id');
  const notesVersion = required(candidate.notesVersion, 'notes_version');
  const subjectId = required(candidate.subjectId, 'subject_id');
  const claimId = required(candidate.claimId, 'claim_id');
  const title = required(candidate.title, 'title');
  const meetingNotesRef = required(candidate.meetingNotesRef, 'notes_ref');
  if (!['natural_person', 'legal_entity'].includes(candidate.legalEntityScope)) {
    throw new Error('meeting_note_invalid_entity_scope');
  }
  if (candidate.legalEntityScope === 'legal_entity' && !candidate.companyId) {
    throw new Error('meeting_note_company_scope_required');
  }

  const evidence = candidate.evidence ?? [];
  const verifiedSources = evidence.filter((item) =>
    item.verified && item.kind !== 'meeting_notes' && item.ref.trim().length > 0,
  );
  const hasOfficialEvidence = verifiedSources.some((item) => item.kind === 'official_document');
  const approved = authorityFor(candidate, 'approve');
  const revoked = authorityFor(candidate, 'revoke');

  let status: MeetingReviewState = 'pending_review';
  let reason = 'meeting_notes_are_unverified';
  if (revoked) {
    status = 'revoked';
    reason = 'superseded_by_authenticated_expert_decision';
  } else if (candidate.kind === 'fact' && verifiedSources.length > 0) {
    status = 'verified_fact';
    reason = 'corroborated_by_verified_source';
  } else if (candidate.kind === 'proposed_action' && approved && verifiedSources.length > 0) {
    status = 'confirmed_agreement';
    reason = 'authenticated_approval_with_corroborating_record';
  } else if (HIGH_RISK_KINDS.has(candidate.kind) && !hasOfficialEvidence) {
    reason = 'legal_or_census_issue_requires_official_evidence';
  } else if (candidate.kind === 'question') {
    reason = 'question_requires_explicit_review';
  } else if (!approved && candidate.kind === 'proposed_action') {
    reason = 'meeting_proposal_is_not_staff_approval';
  }

  return {
    sourceKey: ['meeting.notes_review', meetingId, notesVersion, subjectId, claimId].join(':'),
    status,
    title,
    legalEntityScope: candidate.legalEntityScope,
    companyId: candidate.companyId ?? null,
    sourceRef: meetingNotesRef,
    evidenceRefs: verifiedSources.map((item) => item.ref),
    suggestedNextStep: status === 'pending_review'
      ? 'review_with_expert'
      : status === 'verified_fact'
        ? 'record_verified_fact_proposal'
        : status === 'confirmed_agreement'
          ? 'prepare_action_proposal'
          : 'none',
    reason,
    authorizedSideEffects: [],
  };
}

/** Exact duplicate events are harmless; conflicting duplicates fail closed. */
export function reviewMeetingStatements(
  candidates: readonly MeetingStatementCandidate[],
): ReviewedMeetingStatement[] {
  const byKey = new Map<string, ReviewedMeetingStatement>();
  for (const candidate of candidates) {
    const reviewed = classifyMeetingStatement(candidate);
    const prior = byKey.get(reviewed.sourceKey);
    if (prior) {
      if (JSON.stringify(prior) !== JSON.stringify(reviewed)) {
        throw new Error('meeting_note_conflicting_duplicate_claim');
      }
      continue;
    }
    byKey.set(reviewed.sourceKey, reviewed);
  }
  return [...byKey.values()];
}
