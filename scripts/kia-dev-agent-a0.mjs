#!/usr/bin/env node
// A0: offline policy verifier only. No provider calls, mutations or dispatch.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const paths={
 master:join(root,'docs/expert-kia-ecosystem-master-plan-2026-10-10.md'),
 policy:join(root,'config/kia-dev-agent-policy.proposal.json'),
 tasks:join(root,'config/kia-dev-agent-tasks.a0.json')
};
export function verifyA0({master,policy,manifest,taskId}){
 const marker=master.match(/<!-- ECOSYSTEM_CHECKPOINT ([^\n]*?) -->/)?.[1];
 if(!marker) throw Error('CHECKPOINT_MISSING');
 const fields=Object.fromEntries(marker.split(/\s+/).map(x=>x.split('=')));
 if(fields.phase!=='E0'||fields.phase_status!=='IN_PROGRESS'||fields.scope_frozen!=='true'||fields.production_flags!=='UNCHANGED')throw Error('INVALID_PHASE');
 if(manifest.schemaVersion!=='kia-dev-agent-task-manifest/a0'||manifest.executionEnabled!==false)throw Error('MANIFEST_NOT_DISABLED');
 if(policy.lifecycle!=='proposal_only'||policy.phase!=='E0'||policy.requiredCheckpoint!==fields.next)throw Error('POLICY_MISMATCH');
 if(Object.values(policy.featureGates).some(x=>x!==false))throw Error('FEATURE_GATE_ENABLED');
 if(policy.budget?.maximumTotalPerTrialPeriod!==5||policy.budget?.currency!=='USD'||policy.budget?.budgetEnforcement!=='NOT_IMPLEMENTED')throw Error('BUDGET_POLICY_MISMATCH');
 if(policy.approval?.mergeRequiresExplicitHumanApproval!==true||policy.supervisionDelegation?.mergers?.futureLowRiskAutoMergeEnabled!==false)throw Error('APPROVAL_POLICY_MISMATCH');
 if(manifest.maxChangedFiles!==1||manifest.maxPatchBytes>12000||manifest.tasks.length!==1)throw Error('BOUNDS_MISMATCH');
 const task=manifest.tasks.find(t=>t.id===taskId);
 if(!task||task.status!=='suspended'||task.phase!=='E0'||task.requiredCheckpoint!==fields.next)throw Error('TASK_NOT_ELIGIBLE');
 if(task.allowedPaths.length!==1||task.allowedPaths[0]!=='tests/fixtures/kia-dev-agent-synthetic.txt')throw Error('UNSAFE_PATH');
 return {checkpoint:fields.next,taskId,eligible:false,executionEnabled:false,mayDispatch:false,mayWrite:false,mayMerge:false,budgetUsd:5};
}
export function runA0(taskId='E0-A0-SYNTHETIC-001'){
 const read=p=>readFileSync(p,'utf8');
 return verifyA0({master:read(paths.master),policy:JSON.parse(read(paths.policy)),manifest:JSON.parse(read(paths.tasks)),taskId});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const command=process.argv[2];if(command!=='audit')throw Error('AUDIT_ONLY');process.stdout.write(JSON.stringify(runA0(process.argv[3]))+'\n');}
 catch(e){process.stderr.write('KIA_A0_BLOCKED: '+e.message+'\n');process.exitCode=1;}
}
