import { describe, expect, it } from 'vitest';
import { buildKiaDevAgentRequestPreview } from '@/lib/ai/kia/kia-dev-agent-request-contract';
import { previewKiaDevAgentTask } from '@/lib/ai/kia/kia-dev-agent-read-model';

const actor = {userId:'test-owner-123',role:'owner',tenantId:'test-tenant',isStaff:true};
const taskId = 'E0-M3-06-DOCINDEX';

describe('KIA Dev Agent review request contract (not an executable queue)', () => {
  it('builds a stable fingerprint for an authenticated owner without persisting anything', () => {
    const a=buildKiaDevAgentRequestPreview({taskId,actor});
    const b=buildKiaDevAgentRequestPreview({taskId,actor});
    expect(a).toEqual(b);
    expect(a).toMatchObject({
      protocolVersion:1,status:'blocked',reason:'task_not_approved',
      canQueue:false,queued:false,canDispatch:false,persisted:false,
      approvalState:'not_requested',requiresHumanReview:true,
    });
    expect(a.reviewFingerprint).toMatch(/^[a-f0-9]{32}$/);
    expect(JSON.stringify(a)).not.toContain(actor.userId);
    expect(JSON.stringify(a)).not.toContain(actor.tenantId);
    expect(JSON.stringify(a)).not.toContain('KIA_CODEX_LAB_API_KEY');
  });
  it('changes the fingerprint when actor or tenant changes', () => {
    const a=buildKiaDevAgentRequestPreview({taskId,actor});
    expect(buildKiaDevAgentRequestPreview({taskId,actor:{...actor,userId:'other'}}).reviewFingerprint).not.toBe(a.reviewFingerprint);
    expect(buildKiaDevAgentRequestPreview({taskId,actor:{...actor,tenantId:'other'}}).reviewFingerprint).not.toBe(a.reviewFingerprint);
  });
  it('rejects non-staff, absent, tenant-admin, and malformed actor IDs', () => {
    const invalid=[
      null,undefined,
      {...actor,isStaff:false},
      {...actor,role:'tenant_admin'},
      {...actor,role:'client'},
      {...actor,role:null},
      {...actor,userId:''},
      {...actor,userId:'a'.repeat(150)},
    ];
    for(const entry of invalid) {
      expect(buildKiaDevAgentRequestPreview({taskId,actor:entry})).toMatchObject({
        reason:'actor_not_authorized',reviewFingerprint:null,canDispatch:false,queued:false,
      });
    }
  });
  it('unknown tasks never receive an executable or queued preview', () => {
    const result=buildKiaDevAgentRequestPreview({taskId:'UNKNOWN-TASK',actor});
    expect(result).toMatchObject({reason:'task_not_found',reviewFingerprint:null,requestedCheckpoint:null,persisted:false});
  });
  it('connects preflight review to existing admin preview while leaving all execution gates closed', () => {
    const result=previewKiaDevAgentTask(taskId,actor);
    expect(result.requestReview).toMatchObject({
      taskId,reason:'task_not_approved',queued:false,canDispatch:false,persisted:false,
    });
    expect(result.eligibleForDispatch).toBe(false);
    expect(result.dispatched).toBe(false);
  });
});
