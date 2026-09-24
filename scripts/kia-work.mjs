#!/usr/bin/env node
// Work's explicit adapter. Credentials live in the process environment, never in command arguments.
import { readFile } from 'node:fs/promises';
const [command, arg, runId] = process.argv.slice(2);
const base = new URL(process.env.KIA_WORK_URL ?? 'https://invalid.invalid');
if (base.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(base.hostname)) throw new Error('HTTPS required');
if (!process.env.KIA_WORK_TOKEN?.match(/^kw_[A-Za-z0-9_-]{43}$/)) throw new Error('Missing scoped KIA_WORK_TOKEN');
let method; let body;
if (command === 'context') method = 'GET';
else if (command === 'claim' && arg && runId) { method = 'POST'; body = { task_id: arg, run_id: runId }; }
else if (command === 'report' && arg) { method = 'PATCH'; body = JSON.parse(await readFile(arg, 'utf8')); }
else throw new Error('Usage: kia-work.mjs context | claim TASK_ID RUN_ID | report EVENT_JSON_FILE');
try {
  const response = await fetch(new URL('/api/kia/work', base), { method, redirect: 'error',
    headers: { Authorization: `Bearer ${process.env.KIA_WORK_TOKEN}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30_000) });
  const result = await response.json();
  console.log(JSON.stringify(result, null, 2));
  if (response.status === 202) process.exitCode = 2; // Persisted, not yet verified or completed.
  else if (!response.ok) process.exitCode = 1;
} catch {
  console.error('Result unconfirmed. Keep the same event_id and payload for reconciliation; do not repeat the external action.');
  process.exitCode = 1;
}
