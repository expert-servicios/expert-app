import { createHash } from 'node:crypto';
import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  prepareKiaJournalProposal,
  type KiaJournalProposalInput,
} from './kia-journal-proposals';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;
type SavedRow = { id: string; status: string };

export type JournalInboxSaveResult =
  | { ok: true; proposal: SavedRow; alreadyExists: boolean; holdedMutated: false }
  | { ok: false; error: string; duplicate: boolean; holdedMutated: false };

/**
 * Store a journal suggestion only in EXPERT's private review inbox.
 * Caller MUST authorize a real staff actor and company before invoking.
 * This service does not instantiate or call a Holded client.
 */
export async function saveKiaJournalInboxProposal(
  admin: AdminClient,
  actorId: string,
  input: KiaJournalProposalInput,
): Promise<JournalInboxSaveResult> {
  const prepared = prepareKiaJournalProposal(input);
  if (!prepared.ok) {
    return { ok: false, error: prepared.errors.join(' '), duplicate: false, holdedMutated: false };
  }
  const p = prepared.proposal;
  const fingerprint = createHash('sha256').update(JSON.stringify({
    companyId: p.companyId,
    date: p.date,
    reason: p.reason,
    evidenceRefs: p.evidenceRefs,
    lines: p.lines,
  })).digest('hex');
  const { data, error } = await admin.from('kia_journal_proposals').insert({
    company_id: p.companyId,
    created_by: actorId,
    entry_date: p.date,
    reason: p.reason,
    evidence_refs: p.evidenceRefs,
    lines: p.lines,
    total_debit_cents: p.totalDebitCents,
    total_credit_cents: p.totalCreditCents,
    fingerprint,
  }).select('id,status').single();
  if (!error && data) {
    return { ok: true, proposal: data as SavedRow, alreadyExists: false, holdedMutated: false };
  }
  if (error?.code === '23505') {
    const existing = await admin.from('kia_journal_proposals')
      .select('id,status').eq('company_id',p.companyId).eq('fingerprint',fingerprint).maybeSingle();
    if (!existing.error && existing.data) {
      return { ok: true, proposal: existing.data as SavedRow, alreadyExists: true, holdedMutated: false };
    }
    return { ok: false, error: 'Propuesta duplicada. Revise la bandeja.', duplicate: true, holdedMutated: false };
  }
  return { ok: false, error: 'No se pudo guardar la propuesta contable.', duplicate: false, holdedMutated: false };
}
