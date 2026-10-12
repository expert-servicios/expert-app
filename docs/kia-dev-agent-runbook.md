# KIA Dev Agent — sandbox foundation (NOT ACTIVE)

**Status:** design + guarded code, NOT activated and NOT merged on production main.
**Scope exception:** EXPERT management explicitly prioritizes construction of the safe development agent before continuing E0-M3-06 / Workspace V2 QA. This does not change the phase checkpoint or authorize unrelated features.

## Separation of responsibilities

- KIA (existing orchestrator): defines the authorized task and follows the canonical checkpoint.
- GitHub Actions runner: **manual workflow_dispatch only**. No schedule, no webhook, no public endpoint.
- Codex in an isolated GitHub Actions checkout: proposes edits in sandbox; cannot push, merge or deploy. A bounded patch is exported for independent review.
- Human maintainer: reviews patch, CI/security, and decides if a PR should be created/fused separately.

This foundation is **not yet integrated into KIA chat, Telegram or an autonomous work queue**. That requires a separately reviewed connector and authentic identity/authorization checks. Do not describe it as a running autonomous development agent.

## Activation gates (all mandatory)

1. Merge foundation only after full CI, review and app + ksenia-expert previews for the final commit. Confirm current E0 checkpoint and task manifest.
2. Independently review the exact pinned versions of checkout/setup-node/upload-artifact and the OpenAI Codex Action before adding a secret.
3. Review and change `executionEnabled` in `config/kia-dev-agent-tasks.json` **in a separate PR**.
4. Create GitHub environment `kia-dev-agent` with required reviewers; add `KIA_DEV_AGENT_OPENAI_API_KEY` as an environment secret using GitHub UI. Never paste keys into a chat or repository.
5. Set GitHub repository variable `KIA_DEV_AGENT_ENABLED=true` after approval. The worker checks this AND the manifest gate AND `refs/heads/main`; fail closed if any disagree.
6. Manual dispatch of exactly one approved `task_id` in `validate` first, then `patch`. No automatic dispatch. Require a budget and per-run timeout before unattended scheduling.
7. Do not use a production DB credential, Holded key or deploy token in this environment. GitHub workflow token is read-only.
8. Run regression and security checks on the resulting candidate patch in a **separate isolated review** before promoting to PR. A passing Codex run alone is insufficient.

## Operational contract

- Source: `config/kia-dev-agent-tasks.json` with narrowly approved, explicit file allowlist and acceptance tests.
- Stale checkpoint: deny; phase != E0: deny; unapproved task ID: deny.
- Changed file not in exact allowlist, deletion/rename, oversized diff or too many files: deny.
- Artifact `candidate.patch` is **untrusted code**; never auto-apply to main. No direct pull-request write permission.
- GitHub Actions logs, generated prompts and patches must not include production secrets.
- A worker cannot certify its own security review. No self-approval, merges, migrations, financial edits or production deployments.
- Protect against repeated execution: concurrency limits to a single workflow; manual run audit through GitHub.
- A disabled run can be validated locally with `node scripts/kia-dev-agent.mjs validate E0-M3-06-DOCINDEX`.
- The checker fails closed after the canonical checkpoint advances beyond this task.

## Next engineering increments (separate approval gates)

1. Validate the foundation and pin external action versions.
2. Add a **read-only** KIA Admin connector to request work from the approved task registry.
3. Add a durable queue, explicit operator identity, risk budget, immutable run records and idempotency.
4. Add a separate PR broker with restricted GitHub App permission to create draft PRs, never merge. Only after security testing.
5. Connect push/Telegram alerts for blockers; follow the Plan Maestro QA Workspace V2 once safe development workflows are validated.

**No unattended execution is enabled by this PR.**

## Verification / release of the foundation (2026-10-12)

- Canonical Plan Maestro is synchronized from protected main; its active checkpoint is **E0-M3-06-admin-users-tenant-object-scope-audit**, not the historic document-index task. The old `E0-M3-06-DOCINDEX` task remains **suspended**. It cannot be executed.
- Manual mode `audit` checks the disabled manifest without any API key or code execution. Mode `validate` checks the chosen task and exact checkpoint, rejecting suspended or stale tasks. Mode `patch` is separately gated and unavailable while the manifest is disabled.
- An offline patch-flow integration test verifies path restrictions, file-mode restrictions and `git apply --check` in a temporary repository. This does **not** prove that real Codex ran.
- GitHub CI and both Vercel previews must pass on the **same final HEAD**. Vercel `git_info_fail` is a Git source retrieval error; check Vercel logs and integration before changing application code.
- GitHub environment `kia-dev-agent` must be restricted to protected `main`, require independent reviewers and must hold only the dedicated Codex key. Repository admins must set an external API spend limit before activation. GitHub's 15-minute workflow timeout is **not** a monetary cap; the workflow cannot enforce account-level spending limits by itself.
- KIA has **no active integration** with this workflow yet. The KIA admin-only dispatch bridge, durable work queue and draft-PR broker are separate later work with independent security review.
