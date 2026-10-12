import { describe, expect, it } from 'vitest';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateCandidatePatch } from '../../scripts/kia-dev-agent.mjs';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml');
const sandboxFile = '.github/workflows/kia-dev-agent-sandbox.yml';
const foundationFile = '.github/workflows/kia-dev-agent-foundation.yml';
const read = (path) => readFileSync(path, 'utf8');
const load = (source) => yaml.load(source, { json: false });
const sandbox = read(sandboxFile);
const foundation = read(foundationFile);

describe('KIA Dev Agent workflow CI contract', () => {
  it('loads strict YAML without duplicate keys', () => {
    const doc = load(sandbox);
    expect(Object.keys(doc.jobs).sort()).toEqual(['inspect', 'patch', 'validate']);
    expect(Object.keys(load(foundation).jobs)).toEqual(['validate']);
    expect(() => load(sandbox + '\njobs:\n  extra: {}\n')).toThrow();
    expect(() => load(sandbox.replace('  inspect:', '  patch:'))).toThrow();
  });
  it('allows manual dispatch only and uses read-only token permissions', () => {
    for (const source of [sandbox, foundation]) {
      const doc = load(source);
      expect(Object.keys(doc.on)).toEqual(['workflow_dispatch']);
      expect(doc.permissions).toEqual({ contents: 'read' });
      expect(source).not.toMatch(/^\s*(push|pull_request|schedule|repository_dispatch):/m);
    }
  });
  it('requires activation on protected main and never pushes or merges', () => {
    const doc = load(sandbox);
    expect(doc.jobs.patch.if).toContain("github.ref == 'refs/heads/main'");
    expect(doc.jobs.patch.if).toContain("vars.KIA_DEV_AGENT_ENABLED == 'true'");
    expect(doc.jobs.patch.environment).toBe('kia-dev-agent');
    expect(doc.jobs.patch['timeout-minutes']).toBeLessThanOrEqual(15);
    expect(doc.jobs.inspect.needs).toBe('patch');
    expect(doc.jobs.patch.steps.filter((step) => String(step.uses ?? '').includes('openai/codex-action'))).toHaveLength(1);
    expect(doc.jobs.patch.steps.some((step) => String(step.uses ?? '').includes('upload-artifact'))).toBe(true);
    expect(sandbox).not.toMatch(/git push|gh pr merge|vercel deploy|supabase db push/);
  });
  it('pins all external actions to immutable 40-char commits', () => {
    for (const source of [sandbox, foundation]) {
      const actions = [...source.matchAll(/^\s*uses:\s*([^\s#]+)/gm)].map((m) => m[1]);
      expect(actions.length).toBeGreaterThan(0);
      for (const action of actions) expect(action).toMatch(/^[\w-]+\/[\w-]+@[a-f0-9]{40}$/);
    }
  });
  it('validates bash blocks without running their commands', () => {
    for (const source of [sandbox, foundation]) {
      for (const job of Object.values(load(source).jobs)) {
        for (const step of job.steps) {
          if (typeof step.run !== 'string') continue;
          execFileSync('bash', ['-n'], { input: step.run, encoding: 'utf8' });
        }
      }
    }
  });
  it('requires allowlisted patch inspection before applying untrusted artifact', () => {
    const steps = load(sandbox).jobs.inspect.steps;
    const inspectIdx = steps.findIndex((s) => String(s.run ?? '').includes('kia-dev-agent.mjs inspect'));
    const applyIdx = steps.findIndex((s) => String(s.run ?? '').includes('git apply --'));
    expect(inspectIdx).toBeGreaterThanOrEqual(0);
    expect(applyIdx).toBeGreaterThan(inspectIdx);
    expect(steps.some((s) => String(s.run ?? '').includes('kia-dev-agent.mjs verify'))).toBe(true);
  });
  it('rejects suspended tasks and validates selected task, not just manifest', () => {
    const doc = load(sandbox);
    expect(doc.on.workflow_dispatch.inputs.mode.default).toBe('audit');
    expect(doc.on.workflow_dispatch.inputs.mode.options).toEqual(['audit', 'validate', 'patch']);
    const checks = doc.jobs.validate.steps.map((step) => step.run ?? '');
    expect(checks).toContain('node scripts/kia-dev-agent.mjs audit-policy');
    expect(checks.some((step) => step.includes('kia-dev-agent.mjs validate "$KIA_TASK_ID"'))).toBe(true);
    const eligibility = doc.jobs.validate.steps.find((step) => String(step.run ?? '').includes('kia-dev-agent.mjs validate'));
    expect(eligibility.if).toContain("inputs.mode == 'patch'");
    expect(eligibility.if).toContain("inputs.mode == 'validate'");
  });
  it('exercises the exact Codex version gate with valid and invalid values', () => {
    const step = load(sandbox).jobs.patch.steps.find((item) => item.name === 'Require compatible exact Codex CLI version');
    expect(step).toBeDefined();
    const check = (version) => execFileSync('bash', ['-e', '-c', step.run], {
      env: { ...process.env, CODEX_VERSION: version },
      stdio: 'pipe',
    });
    expect(() => check('0.138.0')).not.toThrow();
    expect(() => check('0.139.5')).not.toThrow();
    expect(() => check('1.0.0')).not.toThrow();
    for (const bad of ['', '0.137.9', '0.138.0-beta', 'latest', '0.138.0; echo unsafe']) {
      expect(() => check(bad)).toThrow();
    }
  });
  it('simulates a safe patch from generation to git apply without secrets', () => {
    const sandboxDir = mkdtempSync(join(tmpdir(), 'kia-patch-contract-'));
    const relative = 'tests/api/dry-run.ts';
    const target = join(sandboxDir, relative);
    const policy = { maxChangedFiles: 3, maxPatchBytes: 80000 };
    const task = { allowedPaths: [relative] };
    const patch = [
      'diff --git a/' + relative + ' b/' + relative,
      'index 0123456..9876543 100644',
      '--- a/' + relative,
      '+++ b/' + relative,
      '@@ -1 +1 @@',
      '-const ok = false;',
      '+const ok = true;',
      '',
    ].join('\\n');
    try {
      mkdirSync(join(sandboxDir, 'tests/api'), { recursive: true });
      writeFileSync(target, 'const ok = false;\\n');
      execFileSync('git', ['init', '-q'], { cwd: sandboxDir });
      expect(validateCandidatePatch(task, policy, patch).paths).toEqual([relative]);
      expect(() => validateCandidatePatch(task, policy, patch.replace('+++ b/' + relative, '+++ b/config/secret.ts'))).toThrow();
      expect(() => validateCandidatePatch(task, policy, patch.replace('100644', '120000'))).toThrow();
      const patchFile = join(sandboxDir, 'candidate.patch');
      writeFileSync(patchFile, patch);
      execFileSync('git', ['apply', '--check', '--', patchFile], { cwd: sandboxDir });
      execFileSync('git', ['apply', '--', patchFile], { cwd: sandboxDir });
      expect(readFileSync(target, 'utf8')).toBe('const ok = true;\\n');
    } finally {
      rmSync(sandboxDir, { recursive: true, force: true });
    }
  });

});
