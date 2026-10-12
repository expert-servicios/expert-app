import { describe, expect, it } from 'vitest';
import { getKiaToolPolicy, resolveKiaToolDefinitions } from '@/lib/ai/kia/kia-tool-registry';
import { validateKiaToolArguments } from '@/lib/ai/kia/kia-tool-definitions';
import { executeKiaAdminOfficeTool } from '@/lib/ai/kia/kia-admin-office-tools';
import { getKiaDevAgentStatus, previewKiaDevAgentTask } from '@/lib/ai/kia/kia-dev-agent-read-model';
import type { KiaContext } from '@/lib/ai/kia/kia-context-builder';

const names = ['get_admin_dev_agent_status', 'preview_admin_dev_agent_task'] as const;
const context = (role: string, isStaff: boolean) => ({
  actor: { role, isStaff, userId: 'test', tenantId: null },
}) as unknown as KiaContext;

describe('KIA Dev Agent Admin read-only integration', () => {
  it('registers exactly two R1 read tools for Admin/Owner, not client channels', () => {
    for (const name of names) {
      expect(getKiaToolPolicy(name)).toMatchObject({
        effect: 'read', riskTier: 'R1', requiresHumanApproval: false,
        capability: 'administration', allowedChannels: ['admin'], allowedRoles: ['admin', 'owner'],
      });
      expect(resolveKiaToolDefinitions({ channel: 'admin', maxRiskTier: 'R1', allowedEffects: ['read'] }).map(x => x.name)).toContain(name);
      for (const channel of ['dashboard', 'telegram', 'email', 'waba'] as const) {
        expect(resolveKiaToolDefinitions({ channel }).map(x => x.name)).not.toContain(name);
      }
    }
  });

  it('validates exact task IDs and rejects unbounded arguments', () => {
    expect(validateKiaToolArguments(names[0], {})).toEqual({});
    expect(() => validateKiaToolArguments(names[0], { token: 'oops' })).toThrow();
    expect(validateKiaToolArguments(names[1], {taskId:'E0-M3-06-DOCINDEX'})).toEqual({taskId:'E0-M3-06-DOCINDEX'});
    for (const taskId of ['../../credentials','', 'untrusted', 'X'.repeat(1000)]) {
      expect(() => validateKiaToolArguments(names[1], {taskId})).toThrow();
    }
  });

  it('exposes disabled, immutable catalog without GitHub dispatch or credentials', () => {
    const status = getKiaDevAgentStatus();
    expect(status.mode).toBe('read_only');
    expect(status.integrationStage).toBe('admin_catalog_only');
    expect(status.executionEnabledInManifest).toBe(false);
    expect(status.canDispatchFromKia).toBe(false);
    expect(status.canCreatePullRequests).toBe(false);
    expect(status.canMergeOrDeploy).toBe(false);
    expect(status.tasks).toHaveLength(1);
    expect(status.tasks[0].status).toBe('suspended');
    expect(JSON.stringify(status)).not.toMatch(/API_KEY|sk-proj|Bearer|openai-api-key/);
  });

  it('does not turn a suspended or unknown task into an executable action', () => {
    for (const id of ['E0-M3-06-DOCINDEX','FAKE-TASK']) {
      const result = previewKiaDevAgentTask(id);
      expect(result).toMatchObject({eligibleForDispatch:false,dispatched:false,draftOnly:true});
      expect(result.deniedReason).toBe(id === 'FAKE-TASK' ? 'task_not_in_manifest' : 'task_not_approved');
    }
  });

  it('rejects client, tenant_admin, inactive and non-staff actors before reading manifest', async () => {
    for (const [role, staff] of [['client', false], ['tenant_admin', false], ['admin', false]] as const) {
      for (const name of names) {
        const result = await executeKiaAdminOfficeTool(name, {taskId:'E0-M3-06-DOCINDEX'}, context(role,staff), {} as never);
        expect(result.ok).toBe(false);
      }
    }
  });

  it('permits Admin/Owner status and preview only without database calls', async () => {
    for (const role of ['admin','owner']) {
      const read = await executeKiaAdminOfficeTool(names[0], {}, context(role,true), {} as never);
      expect(read.ok).toBe(true);
      expect(read.result?.canDispatchFromKia).toBe(false);
      const preview = await executeKiaAdminOfficeTool(names[1], {taskId:'E0-M3-06-DOCINDEX'}, context(role,true), {} as never);
      expect(preview.ok).toBe(true);
      expect(preview.result?.eligibleForDispatch).toBe(false);
    }
  });
});
