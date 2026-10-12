#!/usr/bin/env node
// KIA Dev Agent safety gate: trusted manifest, bounded scope, no network or GitHub writes.
// This script prepares a prompt and validates a patch; it never invokes a model.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

export const root = resolve(import.meta.dirname, '..');
export const policyPath = join(root, 'config/kia-dev-agent-tasks.json');
export const checkpointPath = join(root, 'docs/expert-kia-ecosystem-master-plan-2026-10-10.md');

export function loadPolicy() {
  const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
  if (policy.version !== 1 || !Array.isArray(policy.tasks)) throw new Error('Unsupported policy');
  if (!Number.isSafeInteger(policy.maxChangedFiles) || policy.maxChangedFiles < 1 ||
      !Number.isSafeInteger(policy.maxPatchBytes) || policy.maxPatchBytes < 1) {
    throw new Error('Invalid policy limits');
  }
  return policy;
}

export function selectTask(policy, taskId, planText = readFileSync(checkpointPath, 'utf8')) {
  if (!/^[A-Z0-9-]{5,90}$/.test(taskId ?? '')) throw new Error('Invalid task id');
  const task = policy.tasks.find((t) => t.id === taskId && t.status === 'sandbox-approved');
  if (!task || !Array.isArray(task.allowedPaths) || !task.allowedPaths.length) {
    throw new Error('Task not approved in manifest');
  }
  if (!task.allowedPaths.every((p) =>
    typeof p === 'string' && p.length > 0 && !p.startsWith('/') &&
    !p.includes('..') && !p.includes('\\') && !/[\x00-\x1f\x7f]/.test(p) &&
    (p.startsWith('app/api/') || p.startsWith('tests/api/')))) {
    throw new Error('Unsafe task path allowlist');
  }
  if (new Set(task.allowedPaths).size !== task.allowedPaths.length) throw new Error('Duplicate task paths');
  const marker = planText.match(/<!-- ECOSYSTEM_CHECKPOINT ([^\n]*?) -->/)?.[1];
  if (!marker) throw new Error('Missing canonical checkpoint');
  const checkpoint = Object.fromEntries(marker.split(/\s+/).map((token) => token.split('=')));
  if (checkpoint.phase !== 'E0' || checkpoint.phase_status !== 'IN_PROGRESS' ||
      checkpoint.scope_frozen !== 'true' || checkpoint.next !== task.requiredCheckpoint) {
    throw new Error('Checkpoint changed; refuse stale task');
  }
  if (task.phase !== 'E0') throw new Error('Out-of-phase task');
  return task;
}


export function assertActivation(policy, environment = process.env) {
  if (policy.executionEnabled !== true ||
      environment.KIA_DEV_AGENT_ENABLED !== 'true' ||
      environment.GITHUB_REF !== 'refs/heads/main') {
    throw new Error('KIA Dev Agent is disabled (or branch is not main)');
  }
}

function workdir() {
  const dir = join(process.env.RUNNER_TEMP || tmpdir(), 'kia-dev-agent');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  return dir;
}

export function composePrompt(task) {
  return [
    'You are the isolated EXPERT KIA development worker. Output only reviewed source changes.',
    'TASK: ' + task.id + ' - ' + task.title,
    'OBJECTIVE: ' + task.objective,
    'ALLOWED EDIT PATHS (exact; no other files):',
    ...task.allowedPaths.map((p) => '- ' + p),
    'ACCEPTANCE:', ...task.acceptance.map((p) => '- ' + p),
    'Never merge, deploy, access production, migrate, modify real financial data,',
    'change configuration or credentials, connect to Holded or external services,',
    'alter .github, or run scripts that contact external accounts.',
    'The workspace is ephemeral, GitHub token is read-only, and results are a reviewable patch.',
    'If the change cannot be done safely within the allowlist, make no changes and explain.',
  ].join('\n') + '\n';
}

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 5_000_000 });
}
function gitNames(args) {
  return git([...args, '-z']).split('\0').filter(Boolean);
}

export function verifyPatch(task, policy) {
  const changed = gitNames(['diff', '--name-only', 'HEAD']);
  const untracked = gitNames(['ls-files', '--others', '--exclude-standard']);
  const all = [...new Set([...changed, ...untracked])];
  if (!all.length) throw new Error('Agent produced no code changes');
  if (all.length > policy.maxChangedFiles) throw new Error('Changed file count exceeds limit');
  if (all.some((p) => !task.allowedPaths.includes(p))) throw new Error('Out-of-scope file changed');
  // Intent-to-add captures authorized new tests without committing any repository change.
  if (untracked.length) git(['add', '-N', '--', ...untracked]);
  const namesWithStatus = git(['diff', '--name-status', 'HEAD']).trim().split('\n').filter(Boolean);
  if (namesWithStatus.some((line) => !/^[AM]\t/.test(line))) throw new Error('Deletion/rename/type change forbidden');
  const patch = git(['diff', '--binary', 'HEAD']);
  const bytes = Buffer.byteLength(patch, 'utf8');
  if (bytes < 1 || bytes > policy.maxPatchBytes) throw new Error('Patch size outside allowed limits');
  const destination = join(workdir(), 'candidate.patch');
  writeFileSync(destination, patch, { mode: 0o600 });
  return { taskId: task.id, paths: all, patchBytes: bytes, patchPath: destination, requiresReview: true };
}

/**
 * Enforce exact, text-only file boundaries before git apply can interpret a
 * Codex-generated artifact. Checking 'diff --git' alone is insufficient: the
 * ---/+++ paths can disagree with the display header.
 */
export function validateCandidatePatch(task, policy, patch) {
  const bytes = Buffer.isBuffer(patch) ? patch : Buffer.from(patch, 'utf8');
  if (!bytes.length || bytes.length > policy.maxPatchBytes) throw new Error('Patch exceeds size bound');
  const source = bytes.toString('utf8');
  if (Buffer.byteLength(source, 'utf8') !== bytes.length || source.includes(String.fromCharCode(0))) {
    throw new Error('Binary candidate rejected');
  }
  if (!source.startsWith('diff --git ')) throw new Error('Unexpected patch prefix');

  const chunks = source.split(/(?=^diff --git )/m).filter(Boolean);
  if (!chunks.length || chunks.length > policy.maxChangedFiles) throw new Error('Invalid patch file count');
  const filenames = chunks.map((chunk) => {
    const header = chunk.match(/^diff --git a\/([^\n]+) b\/([^\n]+)\n/);
    if (!header || header[1] !== header[2] || !task.allowedPaths.includes(header[1])) {
      throw new Error('Patch path not permitted');
    }
    const filename = header[1];
    if (/^(?:old mode |new mode |deleted file mode |rename |copy |similarity index |GIT binary patch|Binary files )/m.test(chunk)) {
      throw new Error('Patch includes forbidden metadata');
    }
    if (/^new file mode /m.test(chunk) && !chunk.includes('new file mode 100644\n')) {
      throw new Error('Unexpected new file mode');
    }
    const original = chunk.match(/^--- (.+)$/m)?.[1];
    const revised = chunk.match(/^\+\+\+ (.+)$/m)?.[1];
    if ((original !== 'a/' + filename && original !== '/dev/null') ||
        revised !== 'b/' + filename) {
      throw new Error('Patch edit paths do not match allowlist');
    }
    if (original === '/dev/null' && !chunk.includes('new file mode 100644\n')) {
      throw new Error('New files must use regular file mode');
    }
    if (!/^@@ /m.test(chunk)) throw new Error('Patch without edit hunks');
    return filename;
  });
  if (new Set(filenames).size !== filenames.length) throw new Error('Duplicate patch paths');
  return { paths: filenames, patchBytes: bytes.length };
}

export function inspectPatch(task, policy) {
  const path = join(workdir(), 'candidate.patch');
  const { paths, patchBytes } = validateCandidatePatch(task, policy, readFileSync(path));
  execFileSync('git', ['apply', '--check', '--', path], {
    cwd: root, encoding: 'utf8', maxBuffer: 5_000_000,
  });
  return { taskId: task.id, paths, patchBytes, valid: true };
}

export function run(command, taskId) {
  const policy = loadPolicy();
  if (command === 'lint-policy') {
    if (policy.executionEnabled !== false) throw new Error('Disabled foundation must remain off');
    if (policy.tasks.some((task) => task.status === 'sandbox-approved')) {
      throw new Error('Foundation tasks must be explicitly suspended');
    }
    return { disabled: true, taskCount: policy.tasks.length };
  }
  const task = selectTask(policy, taskId);
  if (command === 'validate') {
    return { taskId: task.id, phase: task.phase, enabled: policy.executionEnabled === true, eligible: true };
  }
  assertActivation(policy);
  if (command === 'prepare') {
    const path = join(workdir(), 'prompt.md');
    writeFileSync(path, composePrompt(task), { mode: 0o600 });
    return { taskId: task.id, promptPath: path, enabled: true };
  }
  if (command === 'verify') return verifyPatch(task, policy);
  if (command === 'inspect') return inspectPatch(task, policy);
  throw new Error('Unknown command');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  try {
    const result = run(process.argv[2], process.argv[3]);
    process.stdout.write(JSON.stringify(result) + '\n');
  } catch (error) {
    process.stderr.write('KIA_DEV_AGENT_BLOCKED: ' + (error instanceof Error ? error.message : 'unknown error') + '\n');
    process.exitCode = 1;
  }
}
