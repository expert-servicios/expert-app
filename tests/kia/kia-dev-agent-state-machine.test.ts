import { describe, expect, it } from 'vitest';
import {
  DevAgentTransitionError,
  transitionDevAgentRequest,
  type DevAgentRequestSnapshot,
  type DevAgentMachinePolicy,
  type DevAgentPrincipal,
  type DevAgentAction,
} from '@/lib/ai/kia/kia-dev-agent-state-machine';

const now = '2026-10-12T11:25:00.000Z';
const manifestSha = 'a'.repeat(64);
const headSha = 'b'.repeat(40);
const digest = 'c'.repeat(64);
const owner: DevAgentPrincipal = {kind:'human',id:'requester',role:'owner',active:true,tenantId:null};
const reviewer: DevAgentPrincipal = {kind:'human',id:'reviewer',role:'admin',active:true,tenantId:null};
const inspector: DevAgentPrincipal = {kind:'human',id:'inspector',role:'owner',active:true,tenantId:null};
const broker: DevAgentPrincipal = {kind:'broker',verified:true};
const runner: DevAgentPrincipal = {kind:'runner',verified:true};
const policy: DevAgentMachinePolicy = {
  taskId:'E0-READY',taskStatus:'sandbox-approved',manifestSha,headSha,checkpoint:'E0-approved',
  executionEnabled:true,environmentEnabled:true,protectedRunner:true,spendBudgetApproved:true,
};
const request = (state:DevAgentRequestSnapshot['state']='draft'):DevAgentRequestSnapshot => ({
  id:'request-1',state,version:0,createdBy:'requester',tenantId:null,taskId:policy.taskId,
  manifestSha,headSha,checkpoint:policy.checkpoint,requestDigest:digest,
  expiresAt:'2026-10-12T12:15:00.000Z',reviewedBy:null,approvedDigest:null,
  approvalExpiresAt:null,providerRunId:null,patchDigest:null,
});
const ctx=(principal:DevAgentPrincipal, extra:Partial<DevAgentMachinePolicy>={})=>({
  principal,now,expectedVersion:0,policy:{...policy,...extra},
});
const apply=(snap:DevAgentRequestSnapshot,action:DevAgentAction,principal:DevAgentPrincipal,extra:Partial<DevAgentMachinePolicy>={})=>
  transitionDevAgentRequest(snap,action,{...ctx(principal,extra),expectedVersion:snap.version});

describe('EXPERT KIA development-agent pure state machine',()=>{
  it('follows only the exact allowed state progression with three different human identities',()=>{
    let s=request();
    for(const [action,principal,to] of [
      [{kind:'submit'},owner,'awaiting_review'],
      [{kind:'approve',digest,validUntil:'2026-10-12T12:00:00.000Z'},reviewer,'approved'],
      [{kind:'claim'},broker,'dispatching'],
      [{kind:'start',providerRunId:'38239318166'},runner,'running'],
      [{kind:'patch_ready',patchDigest:'d'.repeat(64)},runner,'patch_pending_review'],
      [{kind:'complete'},inspector,'completed'],
    ] as const){
      const result=apply(s,action,principal);
      expect(result.request.state).toBe(to);
      expect(result.request.version).toBe(s.version+1);
      expect(result.event).toMatchObject({from:s.state,to,version:s.version+1});
      s=result.request;
    }
    expect(()=>apply(s,{kind:'claim'},broker)).toThrowError(new DevAgentTransitionError('invalid_transition'));
  });
  it('denies self-approval, digest drift, old or overlong approvals',()=>{
    const draft=apply(request(),{kind:'submit'},owner).request;
    for(const [act,person] of [
      [{kind:'approve',digest,validUntil:'2026-10-12T12:00:00.000Z'},owner],
      [{kind:'approve',digest:'0'.repeat(64),validUntil:'2026-10-12T12:00:00.000Z'},reviewer],
      [{kind:'approve',digest,validUntil:'2026-10-12T11:24:00.000Z'},reviewer],
      [{kind:'approve',digest,validUntil:'2026-10-12T12:25:00.000Z'},reviewer],
    ] as const) expect(()=>apply(draft,act,person)).toThrow();
  });
  it('denies stale policy, disabled environment, absent independent reviewer and expired grant',()=>{
    const pending=apply(request(),{kind:'submit'},owner).request;
    expect(()=>apply(pending,{kind:'approve',digest,validUntil:'2026-10-12T12:00:00.000Z'},reviewer,{headSha:'f'.repeat(40)})).toThrow();
    const approved=apply(pending,{kind:'approve',digest,validUntil:'2026-10-12T12:00:00.000Z'},reviewer).request;
    for(const gate of ['executionEnabled','environmentEnabled','protectedRunner','spendBudgetApproved'] as const){
      expect(()=>apply(approved,{kind:'claim'},broker,{[gate]:false})).toThrowError(new DevAgentTransitionError('disabled'));
    }
    expect(()=>apply({...approved,reviewedBy:'requester'},{kind:'claim'},broker)).toThrow();
    expect(()=>transitionDevAgentRequest(approved,{kind:'claim'},{...ctx(broker),expectedVersion:approved.version,now:'2026-10-12T12:00:00.000Z'})).toThrow();
  });
  it('rejects unauthorized principals, cross-tenant admin, inactive owner, forged runner',()=>{
    const s=request();
    for(const principal of [
      {...owner,active:false},{...owner,tenantId:'foreign'},{...owner,role:'tenant_admin'},
      broker,runner,{kind:'human',id:'client',role:'client',active:true,tenantId:null},
    ] as DevAgentPrincipal[]) expect(()=>apply(s,{kind:'submit'},principal)).toThrow();
    expect(()=>apply(request('dispatching'),{kind:'start',providerRunId:'123'},{kind:'runner',verified:false})).toThrow();
  });
  it('rejects stale versions, invalid snapshots and duplicate claims',()=>{
    const s=request();
    expect(()=>transitionDevAgentRequest(s,{kind:'submit'},{...ctx(owner),expectedVersion:3})).toThrow();
    expect(()=>apply({...s,requestDigest:'not-a-hash'},{kind:'submit'},owner)).toThrow();
    expect(()=>apply({...s,version:-1},{kind:'submit'},owner)).toThrow();
    expect(()=>apply(request('dispatching'),{kind:'claim'},broker)).toThrow();
  });
  it('permits expiry only once at deadline, never automatic retry',()=>{
    const s=request();
    expect(()=>apply(s,{kind:'expire'},broker)).toThrowError(new DevAgentTransitionError('not_expired'));
    const result=transitionDevAgentRequest(s,{kind:'expire'},{...ctx(broker),now:s.expiresAt});
    expect(result.request.state).toBe('expired');
    expect(()=>apply(result.request,{kind:'submit'},owner)).toThrow();
    expect(()=>apply(request('failed'),{kind:'start',providerRunId:'22'},runner)).toThrow();
  });
  it('requires provider evidence and an independent final reviewer',()=>{
    const s=request('running');
    expect(()=>apply(s,{kind:'patch_ready',patchDigest:'d'.repeat(64)},runner)).toThrow();
    expect(()=>apply({...s,providerRunId:'123'},{kind:'patch_ready',patchDigest:'not-valid'},runner)).toThrow();
    const done={...request('patch_pending_review'),reviewedBy:'reviewer',approvedDigest:digest,
      approvalExpiresAt:'2026-10-12T12:00:00.000Z',providerRunId:'123',patchDigest:'d'.repeat(64)};
    expect(()=>apply(done,{kind:'complete'},owner)).toThrow();
    expect(()=>apply(done,{kind:'complete'},reviewer)).toThrow();
    expect(apply(done,{kind:'complete'},inspector).request.state).toBe('completed');
  });
  it('rejects invalid transition combinations across every supported state/action',()=>{
    const states:DevAgentRequestSnapshot['state'][]=[
      'draft','awaiting_review','approved','dispatching','running','patch_pending_review',
      'completed','failed','cancelled','rejected','expired',
    ];
    const actions:DevAgentAction[]=[
      {kind:'submit'},{kind:'approve',digest,validUntil:'2026-10-12T12:00:00.000Z'},
      {kind:'reject'},{kind:'cancel'},{kind:'expire'},{kind:'claim'},
      {kind:'start',providerRunId:'123'},{kind:'patch_ready',patchDigest:'d'.repeat(64)},
      {kind:'complete'},{kind:'fail'},
    ];
    for(const state of states) for(const action of actions) {
      if(state==='completed'||state==='failed'||state==='cancelled'||state==='rejected'||state==='expired'){
        expect(()=>apply(request(state),action,owner)).toThrow();
      }
    }
  });
});
