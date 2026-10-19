#!/usr/bin/env node
/**
 * A1: offline synthetic patch generator and verifier.
 *
 * Does not execute an LLM, read secrets, contact networks, or write the product
 * checkout. Creates exactly one fixture in a disposable temp git repository.
 * General agent-generated patches and privileged dispatch remain prohibited.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { runA0 } from './kia-dev-agent-a0.mjs';

export const SYNTHETIC_PATH = 'tests/fixtures/kia-dev-agent-synthetic.txt';
export const SYNTHETIC_TEXT = 'EXPERT_KIA_A1_SYNTHETIC_OK\n';

function digest(source, algorithm = 'sha256') {
  return createHash(algorithm).update(source).digest('hex');
}

export function buildSyntheticPatch() {
  const blob = Buffer.from(SYNTHETIC_TEXT, 'utf8');
  const gitObject = Buffer.concat([
    Buffer.from('blob ' + blob.length + '\0', 'utf8'), blob,
  ]);
  return [
    'diff --git a/' + SYNTHETIC_PATH + ' b/' + SYNTHETIC_PATH,
    'new file mode 100644',
    'index 0000000..' + digest(gitObject, 'sha1').slice(0, 7),
    '--- /dev/null',
    '+++ b/' + SYNTHETIC_PATH,
    '@@ -0,0 +1 @@',
    '+' + SYNTHETIC_TEXT.trimEnd(),
    '',
  ].join('\n');
}

/** Exact SHA-bound fixture validation, not a general purpose patch parser. */
export function inspectSyntheticPatch(candidate, manifest, reference = buildSyntheticPatch()) {
  if (!Buffer.isBuffer(candidate) || !Buffer.isBuffer(Buffer.from(reference, 'utf8'))) {
    throw new Error('A1_INVALID_PATCH_ENCODING');
  }
  const task = manifest?.tasks?.find(x => x.id === 'E0-A0-SYNTHETIC-001');
  if (manifest?.executionEnabled !== false || task?.status !== 'suspended' ||
      task?.allowedPaths?.length !== 1 || task.allowedPaths[0] !== SYNTHETIC_PATH ||
      manifest.maxChangedFiles !== 1 || manifest.maxPatchBytes > 12000) {
    throw new Error('A1_SCOPE_OR_GATE_CHANGED');
  }
  if (candidate.length === 0 || candidate.length > manifest.maxPatchBytes ||
      candidate.includes(0) || candidate.toString('utf8').includes('\r')) {
    throw new Error('A1_BINARY_OR_OVERSIZED_PATCH');
  }
  const expected = Buffer.from(reference, 'utf8');
  if (candidate.length !== expected.length ||
      !timingSafeEqual(createHash('sha256').update(candidate).digest(),
                       createHash('sha256').update(expected).digest())) {
    throw new Error('A1_PATCH_DIGEST_MISMATCH');
  }
  return { path: SYNTHETIC_PATH, patchBytes: candidate.length,
    patchSha256: digest(candidate), verified: true };
}

export function simulateA1({onSandboxCreated} = {}) {
  const gate = runA0();
  if (gate.eligible !== false || gate.executionEnabled !== false ||
      gate.mayDispatch !== false || gate.mayMerge !== false || gate.mayWrite !== false) {
    throw new Error('A1_A0_GATE_CHANGED');
  }

  const sourceRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const manifest = JSON.parse(readFileSync(join(sourceRoot, 'config/kia-dev-agent-tasks.a0.json'), 'utf8'));
  const patch = Buffer.from(buildSyntheticPatch(), 'utf8');
  const report = inspectSyntheticPatch(patch, manifest);
  const sandbox = mkdtempSync(join(tmpdir(), 'kia-a1-synthetic-'));
  let successful = false;
  try {
    if (onSandboxCreated) onSandboxCreated(sandbox); // tests only; not exposed as CLI input
    const patchFile = join(sandbox, 'candidate.patch');
    writeFileSync(patchFile, patch, { mode: 0o600, flag: 'wx' });

    // Fixed executable + fixed arguments; no shell, network, checkout of product
    // source, credentials or user-provided file paths.
    execFileSync('git', ['init', '--quiet', sandbox], { timeout: 10000, stdio: 'pipe' });
    execFileSync('git', ['-C', sandbox, 'apply', '--check', patchFile],
      { timeout: 10000, stdio: 'pipe' });
    execFileSync('git', ['-C', sandbox, 'apply', patchFile],
      { timeout: 10000, stdio: 'pipe' });
    const applied = readFileSync(join(sandbox, SYNTHETIC_PATH), 'utf8');
    if (applied !== SYNTHETIC_TEXT) throw new Error('A1_READBACK_FAILED');
    successful = true;
    return {
      status: 'synthetic_patch_verified',
      taskId: gate.taskId,
      manifestCheckpoint: gate.checkpoint,
      patchSha256: report.patchSha256,
      patchBytes: report.patchBytes,
      changedPaths: [report.path],
      sandbox,
      externalModelCalls: 0,
      billableUsd: 0,
      productRepositoryWrites: 0,
      mayDispatch: false,
      mayMerge: false,
    };
  } finally {
    if (!successful) rmSync(sandbox, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const mode = process.argv[2];
    if (mode !== 'simulate') throw new Error('A1_ONLY_SYNTHETIC_SIMULATE_ALLOWED');
    process.stdout.write(JSON.stringify(simulateA1()) + '\n');
  } catch (error) {
    process.stderr.write('KIA_A1_BLOCKED: ' + (error instanceof Error ? error.message : 'UNKNOWN') + '\n');
    process.exitCode = 1;
  }
}
