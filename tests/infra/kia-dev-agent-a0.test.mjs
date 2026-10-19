import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { paths, verifyA0, runA0 } from '../../scripts/kia-dev-agent-a0.mjs';

const base=()=>({
 master:readFileSync(paths.master,'utf8'),
 policy:JSON.parse(readFileSync(paths.policy,'utf8')),
 manifest:JSON.parse(readFileSync(paths.tasks,'utf8')),
 taskId:'E0-A0-SYNTHETIC-001'
});
describe('A0 development agent policy remains inert',()=>{
 it('reads canonical checkpoint without dispatch',()=>{
  expect(runA0()).toMatchObject({eligible:false,executionEnabled:false,mayDispatch:false,mayWrite:false,mayMerge:false,budgetUsd:5});
 });
 it('rejects stale checkpoint',()=>{const x=base();x.manifest.tasks[0].requiredCheckpoint='E1';expect(()=>verifyA0(x)).toThrow('TASK_NOT_ELIGIBLE');});
 it('rejects unknown task',()=>{const x=base();x.taskId='UNKNOWN';expect(()=>verifyA0(x)).toThrow('TASK_NOT_ELIGIBLE');});
 it('rejects enabled manifest',()=>{const x=base();x.manifest.executionEnabled=true;expect(()=>verifyA0(x)).toThrow('MANIFEST_NOT_DISABLED');});
 it('rejects enabling any privileged feature gate',()=>{const x=base();x.policy.featureGates.automaticMergeEnabled=true;expect(()=>verifyA0(x)).toThrow('FEATURE_GATE_ENABLED');});
 it('rejects unsafe path',()=>{const x=base();x.manifest.tasks[0].allowedPaths=['app/api/admin/users/route.ts'];expect(()=>verifyA0(x)).toThrow('UNSAFE_PATH');});
 it('rejects altered budget',()=>{const x=base();x.policy.budget.maximumTotalPerTrialPeriod=50;expect(()=>verifyA0(x)).toThrow('BUDGET_POLICY_MISMATCH');});
 it('rejects expired phase marker',()=>{const x=base();x.master=x.master.replace('phase_status=IN_PROGRESS','phase_status=COMPLETE');expect(()=>verifyA0(x)).toThrow('INVALID_PHASE');});
 it('rejects relaxed human approval',()=>{const x=base();x.policy.approval.mergeRequiresExplicitHumanApproval=false;expect(()=>verifyA0(x)).toThrow('APPROVAL_POLICY_MISMATCH');});
});
