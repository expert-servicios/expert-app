import { describe, expect, it } from 'vitest';
import {
  classifyMeetingStatement,
  reviewMeetingStatements,
  type MeetingStatementCandidate,
} from '../../lib/ai/kia/kia-meeting-note-review';

const example: MeetingStatementCandidate = {
  meetingId: 'meet-2026-10-14',
  notesVersion: 'gemini-v1',
  subjectId: 'company-subject-1',
  companyId: 'company-1',
  legalEntityScope: 'legal_entity',
  claimId: 'invoice-transfer',
  kind: 'proposed_action',
  title: 'Move preincorporation invoice from company to founder',
  meetingNotesRef: 'drive://meeting-notes-1',
  evidence: [{ kind: 'meeting_notes', ref: 'drive://meeting-notes-1', verified: false }],
};

const approved = {
  authority: 'authenticated_expert_staff' as const,
  decision: 'approve' as const,
  sourceRef: 'approved-record-1',
  issuedAt: '2026-10-14T19:30:00+02:00',
  claimId: 'invoice-transfer',
};

describe('KIA meeting notes: review-first gate', () => {
  it('keeps proposed action unapproved', () => {
    const result = classifyMeetingStatement(example);
    expect(result.status).toBe('pending_review');
    expect(result.reason).toBe('meeting_proposal_is_not_staff_approval');
    expect(result.authorizedSideEffects).toEqual([]);
  });
  it('does not trust confident legal opinions', () => {
    expect(classifyMeetingStatement({ ...example, kind: 'legal_or_tax_opinion' }).status).toBe('pending_review');
  });
  it('does not guess census attributes', () => {
    expect(classifyMeetingStatement({ ...example, claimId: 'cnae', kind: 'census_attribute' }).status).toBe('pending_review');
  });
  it('cannot treat a model 303 mentioned in notes as filed', () => {
    expect(classifyMeetingStatement({ ...example, claimId: '303', kind: 'fact' }).status).toBe('pending_review');
  });
  it('recognizes externally verified facts without writing them', () => {
    const r = classifyMeetingStatement({ ...example, kind: 'fact', evidence: [{ kind: 'official_document', ref: 'aeat://receipt-1', verified: true }] });
    expect(r.status).toBe('verified_fact');
    expect(r.authorizedSideEffects).toEqual([]);
  });
  it('requires corroboration for a claimed approval', () => {
    expect(classifyMeetingStatement({ ...example, authorityDecisions: [approved] }).status).toBe('pending_review');
  });
  it('still only proposes action if approval and evidence are validated', () => {
    const r = classifyMeetingStatement({ ...example, authorityDecisions: [approved], evidence: [{ kind: 'verified_staff_record', ref: 'registry-1', verified: true }] });
    expect(r.status).toBe('confirmed_agreement');
    expect(r.suggestedNextStep).toBe('prepare_action_proposal');
    expect(r.authorizedSideEffects).toEqual([]);
  });
  it('revokes an older agreement when explicitly superseded', () => {
    const r = classifyMeetingStatement({ ...example, authorityDecisions: [{ ...approved, decision: 'revoke' }] });
    expect(r.status).toBe('revoked');
    expect(r.suggestedNextStep).toBe('none');
  });
  it('does not duplicate identical versioned statements', () => {
    expect(reviewMeetingStatements([example, example])).toHaveLength(1);
  });
  it('blocks conflicting duplicate claims', () => {
    expect(() => reviewMeetingStatements([example, { ...example, title: 'Opposite instruction' }])).toThrow('meeting_note_conflicting_duplicate_claim');
  });
  it('does not conflate founder and company subjects', () => {
    expect(reviewMeetingStatements([example, { ...example, legalEntityScope: 'natural_person', subjectId: 'person-subject-1', companyId: null }])).toHaveLength(2);
  });
  it('rejects company candidates without canonical company id', () => {
    expect(() => classifyMeetingStatement({ ...example, companyId: null })).toThrow('meeting_note_company_scope_required');
  });
});