import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe,expect,it } from 'vitest';
const read=(p:string)=>readFileSync(resolve(process.cwd(),p),'utf8');

describe('Admin confirmation before journal proposal storage',()=>{
 const ui=read('app/(protected)/admin/empresas/[id]/JournalProposalSaveForm.tsx');
 const panel=read('app/(protected)/admin/empresas/[id]/CompanyJournalProposalsPanel.tsx');
 const api=read('app/api/admin/empresas/[id]/propuestas-contables/route.ts');
 it('only submits from explicit admin click and confirmation',()=>{
  expect(ui).toContain('window.confirm(');
  expect(ui).toContain('Confirmar guardado interno');
  expect(ui).toContain("method:'POST'");
  expect(ui).toContain('if(!confirmed)return');
  expect(panel).toContain('<JournalProposalSaveForm companyId={companyId} onSaved={load} />');
 });
 it('previews journal amounts and rejects malformed or unbalanced entries before submitting',()=>{
  expect(ui).toContain('function parseDraft(text: string)');
  expect(ui).toContain('debit!==credit');
  expect(ui).toContain('setDraft(null)');
  expect(ui).toContain('Justificantes:');
 });
 it('does not trust model-selected company id',()=>{
  expect(ui).toContain('La empresa procede de esta ficha');
  expect(api).toContain('saveKiaJournalInboxProposal(ctx.admin,ctx.userId,{companyId:id,...parsed.data})');
 });
 it('performs no Holded writes',()=>{
  expect(ui).not.toMatch(/createHoldedV2Client|createLedgerEntry|deleteLedgerEntry/);
  expect(ui).toContain('No genera un asiento en Holded');
 });
});
