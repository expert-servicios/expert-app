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

## KIA supervisor + Codex / Claude / Gemini — approved agent architecture (2026-10-12)

**Canonical decision:** KIA is the **single orchestrator and supervisor** of the development-agent lifecycle. The implementation executor is **Codex**. **Claude** and **Gemini** are *separate technical auditors* (model-independent from Codex, not human-independent). This arrangement refines the already-approved **safe Dev Agent scope exception**, not a second KIA, a new E0–E6 phase, an active autonomous system, or consent to a production release. See [Plan Maestro E0–E6](expert-kia-ecosystem-master-plan-2026-10-10.md) (adenda proposed in [PR #744](https://github.com/expert-servicios/expert-app/pull/744)) and [durable queue design](kia-dev-agent-durable-queue-design-2026-10-12.md). Until the draft PRs are reviewed/merged, documentation in either PR is **proposed, not live**.

### Responsibility and authority matrix

| Participant | Allowed work (only after future activation gates) | Explicitly prohibited |
| --- | --- | --- |
| **KIA supervisor** | Read canonical plan/checkpoint, select approved scoped task, coordinate the stage transitions, collect reports, request an authorized retry, pause on uncertainty, present status/blockers to Admin | Invent tasks, create approval identities, call unrestricted GitHub dispatch, bypass independent review, merge or deploy |
| **Codex worker** | Generate a constrained candidate patch in an isolated, credential-minimal sandbox within the manifest file allowlist | Self-certify, directly push to `main`, merge, run migrations, change financial/customer data, read operational secrets |
| **Claude reviewer** | Technical read-only review of authorization, secrets, threat model, access scopes, supply-chain and implementation correctness | Run changed PR code with secrets, modify patches, grant approval on behalf of a person |
| **Gemini reviewer** | Independent model-based read-only review of requirements, edge cases, regression/test coverage, ES/RU and cross-module behavior | Rewrite submitted evidence, vote as a human GitHub reviewer, override failed deterministic tests |
| **CI + Vercel** | Execute deterministic tests in isolated context, check both preview deployments at the exact HEAD SHA | Substitute historical success for current SHA, automatically release |
| **Human governance** | Direction's functional authorization and separate real-person review where policy requires; only an explicitly authorized maintainer can later decide to merge | Use a second GitHub account owned by the same person or either model as an “independent human” |

**Operating sequence, target architecture (not yet functioning):** KIA reads the active E0 task + approved manifest -> authenticated Owner/Admin creates a draft request -> policy/approval gate locks digest, HEAD, scope, budget and checkpoint -> a restricted broker dispatches the isolated Codex worker once -> an independent patch inspector denies forbidden changes -> CI runs on the candidate -> Claude and Gemini review the same immutable patch/head and produce structured reports -> KIA consolidates blockers, routes narrowly scoped fixes back to Codex only after authorization and within retry/quota limits -> all gates verified -> restricted broker may create a **draft** GitHub PR in a later approved increment -> KIA notifies Admin via the dedicated DevOps Telegram channel -> human governance reviews; **no autonomous merge, migration, activation or production deployment**. A draft-only review request is not dispatch authorization.

### Multi-model review contract / binding

- The proposed reviewer jobs are **read-only**. Run only on trusted repository workflow code in an isolated runner; no checkout or execution of untrusted PR HEAD alongside API credentials. Retrieve a minimum redacted diff through a read-only API; a PR's text/diff is **untrusted data**, never tool instructions.
- Use **Vercel AI Gateway** with a dedicated **GitHub Actions** credential `AI_GATEWAY_API_KEY`, stored in a restricted secret/environment, expiring and spend-capped. Do not copy production provider keys into CI. App-side `VERCEL_OIDC_TOKEN` does not automatically authenticate GitHub Actions. `KIA_PR_REVIEW_VERCEL_TOKEN` checks deployments only, not model inference.
- Pin reviewer **provider/model IDs from the live Gateway catalog** when implementing; configure Claude and Gemini independently (no substitution of one failed reviewer by the same model/provider). Run **two minimal approved smoke calls** and inspect Gateway Logs, provider/model, cost and permissions before trusting their reports.
- Reports must include `task_id`, `request_digest`, `candidate_patch_sha256`, `base_sha`, `head_sha` (when a PR exists), `provider`, `model_id`, `model_version` if available, `reviewed_paths`, `risk_level`, `findings` (file/line/evidence/severity), `verdict`, `timestamp`, `cost` and `tool_run_id`. Verdicts: `PASS`, `CHANGES_REQUIRED`, `INCONCLUSIVE` (never auto-promote `INCONCLUSIVE`).
- If candidate content/digest or HEAD changes, **both AI reports and relevant CI/preview evidence become stale**; invalidate verdicts and rerun. A valid PASS from both auditors is an **additional technical gate**, never proof of independent human approval.
- Threat tests must cover malicious instructions inside code comments/diffs (prompt injection), hidden secrets/PII, very large diffs, wrong SHA, impersonation, fork PRs, non-private chat, revoked/stale approvals, duplicate events, expense limit, missing/invalid API keys, provider 401/402/429/timeouts and unexpected model output.
- **Fail closed:** any P0/P1, unverified reviewer report, missing CI, unavailable Gateway/provider, quota breach, stale checkpoint or pending human review must block promotion. Never publish raw model input, full diffs containing secrets, sensitive user data or credentials in notifications/logs.

### Delivery increments and validation (none activated by this document)

1. Finish existing #742 sandbox/manifest/security tests and #743 Telegram test defects before introducing an additional privileged executor.
2. Build two **offline/mock review fixtures** and typed report validation; compare both reports to the immutable patch and exact HEAD without adding credentials.
3. Verify dedicated CI Gateway credentials exist (names only), model catalog, budgets and approved test data; conduct individual Claude/Gemini live smokes **only after explicit spend/data approval**.
4. Add a separately reviewed **manual/opt-in** read-only AI review workflow, with protected environment and all negative security tests. Start with #742 and #743; record model responses and exact SHAs.
5. Integrate the two reviewer results into KIA Admin's **read-only status**, then into the future durable queue/approval broker **only after** server-side actor checks, RLS, durable idempotency and callback signature verification. KIA chat or Telegram must never directly authorize execution.
6. Consider restricted draft-PR creation, bounded remediation retries and optional notifications under separate gates. Re-review any changed patch; human approval remains necessary.

**Live state at decision time:** #742/#743/#744 are draft PRs. Existing Dev Agent tools only offer read-only previews; task execution remains `executionEnabled: false`, initial task suspended. No Gemini/Claude auditing job, Gateway key smoke, automatic KIA orchestration, persistent queue, Telegram delivery or PR broker has been verified live.

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

## KIA Admin read-only integration (PR #742)

The authenticated KIA Admin/Owner policy now exposes `get_admin_dev_agent_status` and `preview_admin_dev_agent_task` through the existing `kia-admin-office-tools` registry. Both are **R1 read only**, restricted to the Admin channel and staff roles; the existing Office scope gate additionally checks `context.actor.isStaff`. They return only versioned manifest metadata, never a GitHub token, OpenAI secret, real-time run state, or a dispatch request. Tenant admins and clients are denied.

The real Codex isolated smoke completed successfully on 2026-10-12: https://github.com/expert-servicios/kia-codex-lab/actions/runs/38239318166 (single response, read-only, unchanged workspace). Lab variable `KIA_CODEX_SMOKE_ENABLED` was reportedly set to `false` by its operator; revocation of its API key remains a separate operator action. Neither the lab nor this Admin read model creates a production execution grant.

Any future durable queue, GitHub dispatch token, protected environment and draft-PR broker must be reviewed and delivered separately. **No autonomous execution, migrations, rollout or merge is authorized** by these read tools.

## Request review contract — not a working queue

The pure `kia-dev-agent-request-contract.ts` prepares a **blocked review preview** bound to the authenticated KIA Admin/Owner actor and the exact manifest task ID. A SHA-256 fingerprint helps reviewers correlate identical proposals, but is **not** a durable idempotency constraint. The preview includes an explicit `queued=false`, `persisted=false`, `canDispatch=false`, `approvalState=not_requested` and does not include raw actor IDs, account credentials, customer documents or arbitrary prompt text. A suspended, unknown, unapproved, or disabled task remains blocked. The Admin read tool attaches this preflight record after Office staff authorization.

Later, a durable queue requires its own schema, actor/tenant/role checks on each operation, uniqueness enforced in the database, replay protection, status/audit history, an approved execution broker, and independent security review. **No migrations or persistent tasks are created by this commit.**
