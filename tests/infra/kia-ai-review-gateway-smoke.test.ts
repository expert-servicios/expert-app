import { describe, expect, it } from 'vitest';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const workflow = readFileSync('.github/workflows/kia-ai-review-gateway-smoke.yml', 'utf8');
const blocks = [...workflow.matchAll(/^          python3 - <<'PY'\n([\s\S]*?)^          PY$/gm)];
const scripts = blocks.map(match =>
  match[1].split('\n').map(line => line.startsWith('          ') ? line.slice(10) : line).join('\n')
);
const httpMock = [
  'import io, json, os, urllib.request, urllib.error',
  'scenario = os.environ.get("MOCK_SCENARIO", "ok")',
  'claude = "anthropic/claude-haiku-4.5"',
  'gemini = "google/gemini-2.5-flash-lite"',
  'def response(payload):',
  '    return io.BytesIO(json.dumps(payload).encode("utf-8"))',
  'def urlopen(req, timeout=None):',
  '    url = req.full_url if hasattr(req, "full_url") else str(req)',
  '    if url.endswith("/v1/models"):',
  '        models = [{"id": claude, "type": "language"}, {"id": gemini, "type": "language"}]',
  '        if scenario == "missing_model": models.pop()',
  '        if scenario == "wrong_type": models[0]["type"] = "embedding"',
  '        if scenario == "catalog_failure": raise urllib.error.HTTPError(url, 503, "down", {}, None)',
  '        return response({"data": models})',
  '    if url.endswith("/v1/chat/completions"):',
  '        if scenario == "gateway_failure": raise urllib.error.HTTPError(url, 402, "budget", {}, None)',
  '        body = json.loads(req.data)',
  '        assert body["max_tokens"] == 32',
  '        assert body["messages"][0]["content"] == "Reply with exactly KIA_REVIEW_SMOKE_OK"',
  '        assert body["model"] in (claude, gemini)',
  '        if scenario == "wrong_response": return response({"choices": [{"message": {"content": "WRONG"}}], "model": body["model"]})',
  '        if scenario == "wrong_model": return response({"choices": [{"message": {"content": "KIA_REVIEW_SMOKE_OK"}}], "model": "other/model"})',
  '        return response({"choices": [{"message": {"content": "KIA_REVIEW_SMOKE_OK"}}], "model": body["model"]})',
  '    raise AssertionError("Unexpected URL")',
  'urllib.request.urlopen = urlopen',
].join('\n');

function run(index: number, scenario = 'ok', key = 'mock-only') {
  const folder = mkdtempSync(join(tmpdir(), 'kia-review-smoke-'));
  try {
    const result = spawnSync('python3', ['-c', httpMock + '\n' + scripts[index]], {
      encoding: 'utf8', timeout: 10000,
      env: {
        NODE_ENV: 'test',
        PATH: process.env.PATH ?? '/usr/bin:/bin',
        MOCK_SCENARIO: scenario,
        CLAUDE_MODEL: 'anthropic/claude-haiku-4.5',
        GEMINI_MODEL: 'google/gemini-2.5-flash-lite',
        AI_GATEWAY_API_KEY: key,
        GITHUB_OUTPUT: join(folder, 'step-output.txt'),
      },
    });
    expect(result.error).toBeUndefined();
    return { status: result.status, output: result.stdout + result.stderr };
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}

describe('KIA AI Gateway isolated provider checks', () => {
  it('has valid non-escaped GitHub interpolation and disabled-by-default gates', () => {
    expect(workflow).not.toContain('\\' + '$' + '{{');
    expect(workflow).toContain("github.ref == 'refs/heads/main'");
    expect(workflow).toContain("github.sha == vars.KIA_AI_REVIEW_SMOKE_APPROVED_SHA");
    expect(workflow).toContain("vars.KIA_AI_REVIEW_SMOKE_ENABLED == 'true'");
    expect(workflow).toContain('environment: kia-ai-review-smoke');
    expect(workflow).toContain('secrets.AI_GATEWAY_API_KEY');
    expect(workflow).toContain('contents: read');
    expect(workflow).not.toMatch(/actions\/checkout|git push|gh pr merge|vercel deploy|supabase db push/);
    expect(blocks).toHaveLength(2);
  });

  it('verifies exact models in the live-format catalog without needing a key', () => {
    const valid = run(0, 'ok', '');
    expect(valid.status, valid.output).toBe(0);
    expect(valid.output).toContain('CATALOG_OK');
  });

  it('rejects missing models, wrong modalities and catalog outages', () => {
    for (const scenario of ['missing_model', 'wrong_type', 'catalog_failure']) {
      const result = run(0, scenario, '');
      expect(result.status, result.output).not.toBe(0);
      expect(result.output).not.toContain('CATALOG_OK');
    }
  });

  it('checks both providers independently and denies absent authentication', () => {
    const valid = run(1);
    expect(valid.status, valid.output).toBe(0);
    expect(valid.output).toContain('Claude: SMOKE_OK');
    expect(valid.output).toContain('Gemini: SMOKE_OK');
    expect(run(1, 'ok', '').status).not.toBe(0);
  });

  it('fails closed on quota, invalid response and model substitution', () => {
    for (const scenario of ['gateway_failure', 'wrong_response', 'wrong_model']) {
      const result = run(1, scenario);
      expect(result.status, result.output).not.toBe(0);
      expect(result.output).not.toContain('TWO_PROVIDER_SMOKE_OK');
    }
  });
});
