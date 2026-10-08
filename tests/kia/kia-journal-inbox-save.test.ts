import { describe,expect,it } from 'vitest';
import { getKiaToolPolicy, isKiaToolSafeForAutonomousExecution } from '@/lib/ai/kia/kia-tool-registry';
import { validateKiaToolArguments } from '@/lib/ai/kia/kia-tool-definitions';

describe('KIA journal proposal persistence',()=>{
 it('requires admin-mediated nonautonomous approval',()=>{
  expect(getKiaToolPolicy('save_journal_entry_proposal')).toMatchObject({
   riskTier:'R2',effect:'draft',requiresHumanApproval:true,allowedChannels:['admin']
  });
  expect(isKiaToolSafeForAutonomousExecution('save_journal_entry_proposal')).toBe(false);
 });
 it('rejects tenant overrides and malformed entries',()=>{
  expect(()=>validateKiaToolArguments('save_journal_entry_proposal',{companyId:'other'})).toThrow();
  expect(()=>validateKiaToolArguments('save_journal_entry_proposal',{
   date:'2026-10-08',reason:'Regularización revisable',evidenceRefs:['file:123'],
   lines:[{account:'57200000',debitCents:100,creditCents:0},{account:'43000000',debitCents:0,creditCents:100}]
  })).not.toThrow();
 });
});