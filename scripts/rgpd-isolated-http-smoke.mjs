#!/usr/bin/env node
/**
 * Real HTTP smoke test against a disposable Next.js server.
 * NO external email/Supabase calls: the RGPD endpoint must fail closed.
 * Full enabled-flow E2E requires a separately provisioned, isolated backend.
 */
import { spawn } from 'node:child_process';

const port = '3785';
const base = `http://127.0.0.1:${port}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const child = spawn(process.execPath, ['./node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', port], {
  env: {
    ...process.env,
    RGPD_REPORT_ENABLED: 'false',
    RGPD_RU_REPORT_ENABLED: 'false',
    NEXT_PUBLIC_RGPD_REPORT_ENABLED: 'false',
    PORT: port,
  },
  stdio: ['ignore', 'ignore', 'ignore'],
});
let ready = false;
try {
  for (let i = 0; i < 60; i += 1) {
    if (child.exitCode !== null) throw new Error('Next.js server exited during startup');
    try {
      const health = await fetch(`${base}/privacidad`, { signal: AbortSignal.timeout(2000) });
      if (health.ok) { ready = true; break; }
    } catch { /* start in progress */ }
    await sleep(750);
  }
  if (!ready) throw new Error('Next.js server failed readiness check');

  for (const [path, language] of [
    ['/herramientas/rgpd', 'es'],
    ['/ru/instrumenty/rgpd', 'ru'],
    ['/privacidad', 'es'],
  ]) {
    const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(10000) });
    if (response.status !== 200) throw new Error(`${path} returned ${response.status}`);
    const html = await response.text();
    if (!html.includes(`<html lang="${language}"`)) throw new Error(`${path} wrong document language`);
  }

  const request = {
    requestId: '11111111-1111-4111-8111-111111111111',
    name: 'Prueba Aislada',
    email: 'isolated@example.test',
    locale: 'es',
    method: 'email',
    marketingConsent: false,
    informed: true,
    recaptchaToken: 'unverified-test-token',
    answers: {},
  };
  const response = await fetch(`${base}/api/rgpd/report`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(10000),
  });
  if (response.status !== 503) throw new Error(`Expected 503 disabled, got ${response.status}`);
  const result = await response.json();
  if (result.error !== 'feature_unavailable') throw new Error('Endpoint did not fail closed');

  const get = await fetch(`${base}/api/rgpd/report`, { signal: AbortSignal.timeout(10000) });
  if (get.status !== 405) throw new Error(`Expected GET 405, got ${get.status}`);

  console.log('RGPD isolated Next.js HTTP smoke: ES/RU/privacy 200, POST 503, GET 405 — PASS');
} finally {
  if (child.exitCode === null) child.kill('SIGTERM');
}
