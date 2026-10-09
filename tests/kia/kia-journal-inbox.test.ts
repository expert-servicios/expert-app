import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
const load=(p:string)=>readFileSync(resolve(process.cwd(),p),'utf8');
describe('KIA journal inbox',()=>{
 const api=load('app/api/admin/empresas/[id]/propuestas-contables/route.ts');
 const migration=load('supabase/migrations/20261008224600_kia_journal_proposal_inbox.sql');
 const ui=load('app/(protected)/admin/empresas/[id]/CompanyJournalProposalsPanel.tsx');
 it('checks company and staff before storage operations',()=>{
  expect(api).toContain("['owner','admin'].includes(profile.role)");
  expect(api).toContain(".eq('company_id',id)");
  expect(api).toContain("saveKiaJournalInboxProposal(ctx.admin,ctx.userId,{companyId:id,...parsed.data})");
  const saveService=load('lib/ai/kia/kia-journal-inbox-save.ts');
  expect(saveService).toContain('prepareKiaJournalProposal(input)');
  expect(saveService).toContain(".eq('company_id',p.companyId)");
 });
 it('accepts only transitions from pending and has immutable audit trail',()=>{
  expect(api).toContain(".eq('status','pending_review')");
  expect(migration).toContain("new.status not in ('approved','rejected')");
  expect(migration).toContain('create table if not exists public.kia_journal_proposal_events');
  expect(migration).toContain('enable row level security');
  expect(migration).toContain('revoke all on public.kia_journal_proposals from public, anon, authenticated;');
 });
 it('is independent from Holded mutations',()=>{
  expect(api).not.toMatch(/createLedgerEntry|deleteLedgerEntry|createHoldedGateway/);
  expect(ui).toContain('NO crea un asiento en Holded');
  expect(api).toContain('holdedMutated:false');
 });
});
