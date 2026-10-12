import { describe, expect, it } from 'vitest';
import { loadPolicy, selectTask, assertActivation, composePrompt, run, validateCandidatePatch } from '../../scripts/kia-dev-agent.mjs';

describe('KIA Dev Agent disabled foundation', () => {
  const policy = loadPolicy();
  it('is disabled, bounded and limited to approved paths', () => {
    expect(policy.executionEnabled).toBe(false);
    expect(policy.maxChangedFiles).toBeLessThanOrEqual(3);
    expect(policy.maxPatchBytes).toBeLessThanOrEqual(80000);
    const task = selectTask(policy, 'E0-M3-06-DOCINDEX');
    expect(task.allowedPaths).toHaveLength(2);
    expect(task.allowedPaths.every((p) => !p.includes('..'))).toBe(true);
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
  it('rejects unapproved or mismatched patch paths, duplicates and unsafe modes', () => {
    const task = selectTask(policy,'E0-M3-06-DOCINDEX');
    const a = task.allowedPaths[0];
    const valid = (file) => [
      'diff --git a/' + file + ' b/' + file,
      'index 1234567..abcdef0 100644',
      '--- a/' + file,
      '+++ b/' + file,
      '@@ -1 +1 @@',
      '-old',
      '+new',
      '',
    ].join('\n');
    expect(validateCandidatePatch(task, policy, valid(a)).paths).toEqual([a]);
    expect(() => validateCandidatePatch(task, policy, valid('app/api/secrets/route.ts'))).toThrow();
    expect(() => validateCandidatePatch(task, policy, valid(a).replace('+++ b/' + a,'+++ b/app/api/secrets/route.ts'))).toThrow();
    expect(() => validateCandidatePatch(task, policy, valid(a) + valid(a))).toThrow();
    expect(() => validateCandidatePatch(task, policy, valid(a).replace('index 1234567..abcdef0 100644', 'new file mode 120000'))).toThrow();
    expect(() => validateCandidatePatch(task, policy, valid(a) + String.fromCharCode(0))).toThrow();
  });
  it('provides audit-only validation without invoking an LLM', () => {
    expect(run('validate','E0-M3-06-DOCINDEX')).toMatchObject({enabled:false,eligible:true});
    expect(() => run('prepare','E0-M3-06-DOCINDEX')).toThrow();
    const prompt = composePrompt(selectTask(policy,'E0-M3-06-DOCINDEX'));
    expect(prompt).toContain('Never merge, deploy');
    expect(prompt).toContain('ALLOWED EDIT PATHS');
  });
});
