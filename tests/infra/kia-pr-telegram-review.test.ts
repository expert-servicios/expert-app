import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const workflow = readFileSync('.github/workflows/kia-pr-review-telegram.yml', 'utf8');
const protocol = readFileSync('docs/kia-pr-telegram-review-protocol.md', 'utf8');
const pythonLines = workflow.match(/^          python3 - <<'PY'\n([\s\S]*?)^          PY$/m)?.[1];
if (!pythonLines) throw new Error('Workflow Python script not found');
const python = pythonLines.split('\n').map(x => x.startsWith('          ') ? x.slice(10) : x).join('\n');

// The actual inline Python from the workflow is executed with a simulated HTTP
// boundary. No provider account, credential or network call is used.
const mock = String.raw`
import io
import json
import os
import urllib.request
import urllib.parse

scenario = os.getenv("MOCK_SCENARIO", "")
sha = "a" * 40
def response(value):
    return io.BytesIO(json.dumps(value).encode("utf-8"))
def fake_urlopen(req, timeout=None):
    url = req.full_url if hasattr(req, "full_url") else str(req)
    if "/getChat?" in url:
        return response({"ok": True, "result": {"type": "supergroup" if scenario == "group" else "private"}})
    if "/sendMessage" in url:
        print("TELEGRAM_SENT")
        return response({"ok": True, "result": {"message_id": 1}})
    if "/pulls/743/reviews" in url:
        return response([])
    if "/pulls/743" in url:
        return response({"state": "open", "draft": scenario == "draft", "merged": False,
            "base": {"ref": "main"}, "head": {"repo": {"full_name": "expert-servicios/expert-app"}, "sha": sha},
            "user": {"login": "expertestudiospro"}, "title": "Test notification"})
    if "/check-runs?" in url:
        names = ("Typecheck · Lint · Test", "Supabase migration repair contract",
            "KIA web persistence PostgreSQL integration", "KIA Work PostgreSQL active-scope integration")
        return response({"check_runs": [{"name": n, "status": "completed",
            "conclusion": "failure" if scenario == "bad_ci" and i == 0 else "success",
            "app": {"slug": "github-actions"}} for i, n in enumerate(names)]})
    if url.endswith("/status"):
        statuses = [{"context": "Vercel – app", "state": "success"},
                    {"context": "Vercel – ksenia-expert", "state": "success"}]
        return response({"statuses": statuses if scenario == "github_ok" else []})
    if "/v6/deployments?" in url:
        q = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
        project = q.get("projectId", [""])[0]
        good = q.get("sha") == [sha] and project in (
            "prj_8QaCDKDrAsLQ1c3nr4ueRVLXtYsD", "prj_UscIRsCiaqY051PTrRVncEfNyquJ")
        state = "READY" if good and not (scenario == "bad_vercel"
            and project == "prj_UscIRsCiaqY051PTrRVncEfNyquJ") else "ERROR"
        return response({"deployments": [{"state": state, "target": None,
            "meta": {"githubCommitSha": "b"*40 if scenario == "wrong_sha" else sha,
                     "githubOrg": "expert-servicios", "githubRepo": "expert-app"}}]})
    raise AssertionError("Unexpected HTTP endpoint")
urllib.request.urlopen = fake_urlopen
`;

function run(scenario: string, mode = 'check_pr', overrides: Record<string,string> = {}) {
  const p = spawnSync('python3', ['-c', mock + '\n' + python], {
    encoding: 'utf8', timeout: 8000,
    env: { NODE_ENV: 'test', PATH: process.env.PATH ?? '/usr/bin:/bin', MOCK_SCENARIO: scenario,
      REPOSITORY: 'expert-servicios/expert-app', PR_NUMBER: '743',
      GH_READ_TOKEN: 'mock-only', TG_BOT_TOKEN: 'mock-only', TG_PRIVATE_CHAT_ID: '123456789',
      VERCEL_READ_TOKEN: 'mock-only', DELIVERY_MODE: mode,
      TRIGGER_ACTOR: 'expertestudiospro', ...overrides }
  });
  expect(p.error).toBeUndefined();
  return { exit: p.status, output: p.stdout + p.stderr };
}

describe('KIA DevOps Telegram review - offline functional tests', () => {
  it('is read-only and off by default', () => {
    expect(workflow).toContain("vars.KIA_PR_REVIEW_TELEGRAM_ENABLED == 'true'");
    expect(workflow).toContain('pull_request_target:');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('pull-requests: read');
    expect(workflow).not.toMatch(/git push|gh pr merge|vercel deploy|supabase db push|actions\/checkout/);
    expect(protocol).toContain('revisión humana independiente');
  });
  it('sends a manual private delivery smoke with a valid maintainer', () => {
    const r = run('delivery', 'test_delivery');
    expect(r.exit).toBe(0);
    expect(r.output).toContain('TELEGRAM_SENT');
  });
  it('never sends to group, invalid chat ID, or untrusted actor', () => {
    for (const [scenario, overrides] of [
      ['group', {}], ['delivery', {TG_PRIVATE_CHAT_ID: '-100123456789'}],
      ['delivery', {TRIGGER_ACTOR: 'unknown'}]
    ] as const) {
      const r = run(scenario, 'test_delivery', overrides);
      expect(r.output).not.toContain('TELEGRAM_SENT');
    }
  });
  it('never sends if PR is draft or CI failed', () => {
    for (const scenario of ['draft', 'bad_ci']) {
      const r = run(scenario);
      expect(r.output).not.toContain('TELEGRAM_SENT');
    }
  });
  it('notifies for GitHub Vercel statuses and correctly matched Vercel API fallback', () => {
    for (const scenario of ['github_ok', 'vercel_ok']) {
      const r = run(scenario);
      expect(r.exit, `Scenario ${scenario} failed: ${r.output}`).toBe(0);
      expect(r.output).toContain('TELEGRAM_SENT');
    }
  });
  it('fails closed on Vercel mismatch, unsuccessful project or absent auth', () => {
    for (const scenario of ['wrong_sha','bad_vercel']) {
      const r = run(scenario);
      expect(r.output).not.toContain('TELEGRAM_SENT');
    }
    const withoutToken = run('vercel_ok', 'check_pr', {VERCEL_READ_TOKEN: ''});
    expect(withoutToken.output).not.toContain('TELEGRAM_SENT');
  });
});
