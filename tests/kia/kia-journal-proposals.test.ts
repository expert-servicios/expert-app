import { describe, expect, it } from 'vitest';
import { prepareKiaJournalProposal, type KiaJournalProposalInput } from '@/lib/ai/kia/kia-journal-proposals';
const valid: KiaJournalProposalInput = {
  companyId: '188a1871-0ea8-4b11-adac-c9acc41c4a4b',
  date: '2026-01-01',
  reason: 'Corrección contable pendiente de autorización',
  evidenceRefs: ['drive:file-id-123'],
  lines: [{ account: '57200000', debitCents: 125000, creditCents: 0 }, { account: '43000000', debitCents: 0, creditCents: 125000 }],
};
describe('KIA journal proposals, never posted', () => {
  it('accepts documented and balanced entries with explicit human review', () => {
    const r = prepareKiaJournalProposal(valid);
    expect(r.ok).toBe(true);
    expect(r.holdedMutated).toBe(false);
    if (r.ok) expect(r.proposal).toMatchObject({ totalDebitCents: 125000, totalCreditCents: 125000, status: 'pending_human_review', requiresHumanApproval: true });
  });
  it('rejects unbalanced entries', () => {
    const r = prepareKiaJournalProposal({ ...valid, lines: [{ ...valid.lines[0] }, { ...valid.lines[1], creditCents: 124999 }] });
    expect(r.ok).toBe(false);
  });
  it('rejects unsupported or untraceable entries', () => {
    expect(prepareKiaJournalProposal({ ...valid, evidenceRefs: [] }).ok).toBe(false);
    expect(prepareKiaJournalProposal({ ...valid, companyId: 'not-a-company' }).ok).toBe(false);
    expect(prepareKiaJournalProposal({ ...valid, date: '2026-02-30' }).ok).toBe(false);
  });
  it('rejects double-sided, fractional or negative lines', () => {
    expect(prepareKiaJournalProposal({ ...valid, lines: [{ account: '57200000', debitCents: 125000, creditCents: 1 }, valid.lines[1]] }).ok).toBe(false);
    expect(prepareKiaJournalProposal({ ...valid, lines: [{ account: '57200000', debitCents: -1, creditCents: 0 }, valid.lines[1]] }).ok).toBe(false);
    expect(prepareKiaJournalProposal({ ...valid, lines: [{ account: '57200000', debitCents: 1.5, creditCents: 0 }, valid.lines[1]] }).ok).toBe(false);
  });
});
