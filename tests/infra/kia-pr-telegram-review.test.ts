import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/kia-pr-review-telegram.yml', 'utf8');
const protocol = readFileSync('docs/kia-pr-telegram-review-protocol.md', 'utf8');

describe('KIA DevOps Telegram review notification gate', () => {
  it('defaults to off and never enables agent or deploy', () => {
    expect(workflow).toContain("vars.KIA_PR_REVIEW_TELEGRAM_ENABLED == 'true'");
    expect(workflow).toContain("github.ref == 'refs/heads/main'");
    expect(workflow).toContain('pull_request_target:');
    expect(workflow).toContain('types: [ready_for_review]');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('pull-requests: read');
    expect(workflow).not.toMatch(/git push|gh pr merge|vercel deploy|supabase db push|actions\/checkout|openai\/codex-action/);
  });
  it('uses only a dedicated private-channel secret and has a maintainer delivery smoke', () => {
    expect(workflow).toContain('secrets.KIA_PR_REVIEW_TELEGRAM_BOT_TOKEN');
    expect(workflow).toContain('secrets.KIA_PR_REVIEW_TELEGRAM_CHAT_ID');
    expect(workflow).toContain("inputs.mode == 'test_delivery'");
    expect(workflow).toContain('send_message(message)');
    expect(workflow).toContain('/getChat?chat_id=');
    expect(workflow).toContain('!= "private"');
    expect(workflow).toContain('secrets.KIA_PR_REVIEW_VERCEL_TOKEN');
    expect(workflow).not.toContain('TELEGRAM_BOT_TOKEN:');
    expect(protocol).toContain('@expert_devops_bot');
  });
  it('requires current CI and Vercel states before notification', () => {
    for (const check of ['Typecheck · Lint · Test', 'Supabase migration repair contract', 'KIA web persistence PostgreSQL integration', 'KIA Work PostgreSQL active-scope integration', 'vercel - app', 'vercel - ksenia-expert']) {
      expect(workflow).toContain(check);
    }
    expect(workflow).toContain('if pr.get("state") != "open" or pr.get("draft") or pr.get("merged")');
    expect(workflow).toContain('if mode == "test_delivery"');
    expect(workflow).toContain('api.vercel.com/v6/deployments?');
    expect(workflow).toContain('githubCommitSha');
    expect(workflow).toContain('projectId');
    expect(protocol).toContain('revisión humana independiente');
  });
});
