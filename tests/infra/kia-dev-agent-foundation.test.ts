import { describe, expect, it } from 'vitest';
import { loadPolicy, selectTask, assertActivation, composePrompt, run } from '../../scripts/kia-dev-agent.mjs';

describe('KIA Dev Agent disabled foundation', () => {
  const policy = loadPolicy();
  it('is disabled, bounded and limited to approved paths', () => {
    expect(policy.executionEnabled).toBe(false);
    expect(policy.maxChangedFiles).toBeLessThanOrEqual(3);
    expect(policy.maxPatchBytes).toBeLessThanOrEqual(80000);
    const task = selectTask(policy, 'E0-M3-06-DOCINDEX');
    expect(task.allowedPaths).toHaveLength(2);
    expect(task.allowedPaths.every((p: string) => !p.includes('..'))).toBe(true);
  });
  it('fails closed for unknown tasks, inappropriate phases and changed checkpoint', () => {
    expect(() => selectTask(policy, 'UNKNOWN-TASK')).toThrow();
    expect(() => selectTask({...policy, tasks:[{...policy.tasks[0], phase:'E1'}]}, 'E0-M3-06-DOCINDEX')).toThrow();
    expect(() => selectTask({...policy, tasks:[{...policy.tasks[0], requiredCheckpoint:'E0-M3-06-false'}]}, 'E0-M3-06-DOCINDEX')).toThrow();
  });
  it('never activates without both approved configuration and manual main context', () => {
    expect(() => assertActivation(policy, {KIA_DEV_AGENT_ENABLED:'true',GITHUB_REF:'refs/heads/main'})).toThrow();
    expect(() => assertActivation({...policy,executionEnabled:true},{KIA_DEV_AGENT_ENABLED:'false',GITHUB_REF:'refs/heads/main'})).toThrow();
    expect(() => assertActivation({...policy,executionEnabled:true},{KIA_DEV_AGENT_ENABLED:'true',GITHUB_REF:'refs/heads/feature'})).toThrow();
  });
  it('provides audit-only validation without invoking an LLM', () => {
    expect(run('validate','E0-M3-06-DOCINDEX')).toMatchObject({enabled:false,eligible:true});
    expect(() => run('prepare','E0-M3-06-DOCINDEX')).toThrow();
    const prompt = composePrompt(selectTask(policy,'E0-M3-06-DOCINDEX'));
    expect(prompt).toContain('Never merge, deploy');
    expect(prompt).toContain('ALLOWED EDIT PATHS');
  });
});
