# EXPERT KIA Development Agent — durable queue and authorization architecture (design only)

**Status:** DESIGN / NOT IMPLEMENTED / NOT ACTIVATED.  
**Date:** 2026-10-12. **Reference:** [PR #742](https://github.com/expert-servicios/expert-app/pull/742).  
**Scope:** Development-agent infrastructure is an explicitly authorized exception before continuing the frozen E0 Workspace V2 audit. This proposal **does not change** the canonical E0 checkpoint, authorize any migration, or deploy anything.

## 1. Current validated foundation (evidence, not permission)

- Existing KIA policy and tool registry expose Admin/Owner **read-only** catalogue and task preflight. Code is in the PR branch only.
- `config/kia-dev-agent-tasks.json` is still `executionEnabled: false`. Its sole E0-M3-06-DOCINDEX task is **suspended** and has a stale document-index checkpoint; it cannot be run.
- KIA preflight returns `canDispatch: false`, `queued: false`, `persisted: false`, and a review fingerprint that is **not** a durable idempotency key.
- A real, separate, non-writing Codex smoke succeeded in [kia-codex-lab run 38239318166](https://github.com/expert-servicios/kia-codex-lab/actions/runs/38239318166). This proves isolated invocation, **not** development task safety or account authorization in EXPERT.
- The lab enable variable was switched to `false` by the operator; API key revocation is an independent operator step and must be confirmed separately. Do not copy the lab key into EXPERT.

## 2. Trust boundaries and responsibilities

| Component | Authority | Explicitly forbidden |
| --- | --- | --- |
| KIA Admin UI/tools | Read approved catalog; prepare human-readable draft request | GitHub token, runner secrets, dispatch, SQL writes from an LLM tool |
| Authenticated server | Verify active EXPERT Owner/Admin actor; scope; versioned manifest and E0 checkpoint | Trust a role, tenant ID, file path or workflow supplied by a chat message |
| Request API (later) | Persist **draft** only with a unique idempotency key and append-only audit event | Directly trigger Actions or grant execution from draft |
| Independent reviewer | Confirm exact request digest, allowed file scope, budget and checkpoint | Approve own request, approve altered or expired digest |
| Narrow execution broker (later) | Once authorized, dispatch **one approved** workflow using a dedicated restricted GitHub App | Pull request merge, production deploy, migration, arbitrary workflow/ref or repository |
| GitHub Actions + Codex | Prepare a bounded candidate patch from reviewed code in isolated, credential-minimal runner | GitHub push, write to main, external customer/financial data, production secrets |
| Separate patch inspector | Validate untrusted patch structure, path mode and tests before any draft PR review | Treat the model's own description as proof of safety |

This is **not a general task agent**. It is a bounded development-worker proposal pipeline, separate from KIA Work cases, business tasks, financial data and customer documents.

## 3. Durable model for a future migration (not SQL to execute now)

Plan a separate forward-only reviewed migration with these tables. Do not reuse `internal_tasks` or `kia_work_*`, because these represent client operational workflows with different trust and tenant rules.

### `kia_dev_agent_requests`

- `id uuid PK`; `created_at`, `updated_at`, `expires_at` timestamptz.
- `created_by uuid FK profiles`, `tenant_id uuid NULL` (recorded as observed, **not** caller-asserted).
- `task_id text` constrained to canonical manifest IDs; `manifest_version int`, `checkpoint text`, `manifest_sha char(64)`, `head_sha char(40)`.
- `request_digest char(64)` SHA-256 of canonical immutable manifest/task/scope/checkpoint and actor, server-generated.
- `idempotency_key char(64)` server-generated with independent unique constraint for an active request. Retry with same actor/scope/task/checkpoint/manifest/head returns the **same** request; never silently makes a new request after terminal state.
- `state enum`: `draft`, `awaiting_review`, `approved`, `dispatching`, `running`, `patch_pending_review`, `rejected`, `cancelled`, `expired`, `failed`, `completed`.
- `reviewer_id uuid NULL`, `approved_digest char(64) NULL`, `reviewed_at`, `review_expires_at`. Approval is for **exact** immutable digest and runner ref, and becomes void on any content or checkpoint change.
- `max_changed_files`, `max_patch_bytes`, `max_runtime_seconds`, `max_provider_spend_usd` as **policy intent**, not a claim that GitHub or the LLM enforces a hard monetary cap.
- `runner_run_id bigint NULL`, `runner_attempt int NULL`, `patch_artifact_digest char(64) NULL`. Never store API keys, prompts containing PII, or customer payloads.

### `kia_dev_agent_attempts`

- `id uuid PK`, `request_id uuid FK`, `attempt_number int` unique per request.
- Immutable `head_sha`, reviewed `workflow_ref`, started/completed timestamps, `github_run_id`, `github_run_attempt`, conclusion, policy snapshot and error code (redacted).
- A retried GitHub webhook is matched by provider run ID + attempt and never creates an additional action.
- Failed/time-out executions **do not** auto-retry; reviewer must authorize a new attempt under the same approved policy if allowed.

### `kia_dev_agent_events` (append-only)

- `event_id uuid PK`, `request_id`, `sequence int` unique per request, `timestamp`, `actor_id`, `event_kind`, `from_state`, `to_state`, `request_digest`, `metadata jsonb` redacted.
- Optional integrity chain: `previous_event_hash`, `event_hash`; no direct update/delete for application actors.
- No user-provided event actor field accepted; derive identity from authenticated server or verified signed provider callback. An event record is not proof of an external action unless provider evidence is attached.

### Database isolation

- RLS enabled for **all** new tables, no `anon`/`authenticated` direct writes or unrestricted `service_role` passthrough. Server-side scoped RPC under carefully reviewed grants.
- Initially **EXPERT internal Owner/Admin only**. `tenant_admin`, clients, public KIA, Telegram and email cannot read or write queue data. On every mutation re-check **exact active** profile and role.
- Use a transaction with row locks and check-and-set state version for draft → review → approval → claim. Granting approval and claiming execution are distinct transactions and distinct principals.
- Enforce one active task request per canonical idempotency identity; use UNIQUE indexes and optimistic `version` CAS to prevent double-clicks and races.
- Explicit expiration, dead-letter/failure state, heartbeat and lease expiry without background auto-resubmission. Provider callback is idempotent and signature-verified.

## 4. State machine — no implicit promotion

```text
draft -> awaiting_review -> approved -> dispatching -> running -> patch_pending_review -> completed
     \-> cancelled       \-> rejected   \-> expired \-> failed        \-> failed
```

- `draft`: recorded intent, **not** authorization to execute. User edits invalidate the previous digest.
- `awaiting_review`: frozen manifest, file allowlist, budget, request digest, commit SHA, checkpoint and acceptance checks.
- `approved`: an **independent reviewer**, other than requester, authorizes one exact digest for a short bounded validity window.
- `dispatching`: broker atomically claims the approved request once; only a tightly enumerated, reviewed workflow + ref can run.
- `running`: independent heartbeat/provider run ID. Loss of lease requires review; never free-ride another worker.
- `patch_pending_review`: untrusted output is restricted to the allowlist, checked for binary/symlink/path escapes, checked by CI, and opened to a human review without automatic promotion.
- `completed`: only after independent explicit confirmation. **Never automatically merge** a PR or change production data.
- Any changed checkpoint, actor status, manifest, SHA, approved digest, repository allowlist or controls must reject/expire the request and require fresh review; do not silently update approval.
- `failed`, `cancelled`, `rejected`, `expired`, `completed` are terminal. New work requires a new human-approved request and distinct audit lineage.

## 5. Planned HTTP and orchestration API (not active)

- `GET /api/admin/kia/dev-agent/requests`: active EXPERT staff only, read-only paginated summaries. Never return secrets, raw prompts or customer data.
- `POST /api/admin/kia/dev-agent/requests`: create **draft** with `{taskId, idempotencyKey?}`; server derives actor and exact canonical manifest context, ignores caller-supplied actor/scope/ref. No GitHub side effects.
- `POST /api/admin/kia/dev-agent/requests/:id/submit`: freeze digest and enter `awaiting_review` if current E0 checkpoint matches. No execution.
- `POST /api/admin/kia/dev-agent/requests/:id/review`: separate reviewer, reason and exact digest; review must be denied on self-approval and stale SHA.
- `POST /api/internal/kia/dev-agent/dispatch`: **not a public route**, separate machine identity with limited GitHub App permission, single reviewed workflow/ref and committed idempotency atomically.
- `POST /api/internal/kia/dev-agent/events`: signed GitHub provider callback, allowlisted event kinds, verified timestamp and replay nonce; must not trust GitHub UI URLs or unsigned JSON.

Do not add these routes until the corresponding DB policies, broker separation, tests and security approval are ready. KIA chat and Telegram may show read-only status later but cannot call approval/dispatch routes.

## 6. Broker and execution gates

Before dispatch ALL must hold simultaneously:

1. Manifest `executionEnabled=true` in a separately reviewed commit, plus independent operations flag `KIA_DEV_AGENT_ENABLED=true`.
2. Reviewed `sandbox-approved` task with **exact** current E0 checkpoint, known allowed files, acceptance tests and hash; any mismatch denies.
3. Active authenticated EXPERT staff role and independent reviewer not equal to requester; immutable request digest and fresh approval.
4. Protected GitHub environment with required non-self reviewers, approved SHA/ref and dedicated non-production Codex key. **No fallback to unprotected runner**.
5. Quotas: count, bytes, time, concurrency, per-request rate and budget; halt if spent/remaining balance unknown. Timeouts do not guarantee a provider monetary cap.
6. Idempotent provider run ID/attempt mapping and durable lease. No retry after timeout unless manually reauthorized.
7. Separate tests for patch checksum + allowlist + no .github, migration, financial, credential or customer document paths.

Broker uses a dedicated GitHub App with **only** Actions permission needed for dispatch, bound to a single selected repo/workflow, and no merge/admin permissions. Design a second independent restricted PR writer only if approved later.

## 7. Threat model and acceptance checks

| Threat | Required failure test |
| --- | --- |
| Client or tenant admin asks KIA to create a run | HTTP 403; no new request/event/dispatch |
| Owner profile inactive, cross-tenant scope or swapped identity | Denied on **every** state transition |
| Duplicate clicks, retries and concurrent requests | One durable request and one claimed run, one event sequence |
| Request changes between approval and dispatch (TOCTOU) | Digest mismatch → deny + audit |
| Stale E0 checkpoint, manifest or commit SHA | Expire approval; deny dispatch |
| Reviewer approves own request | Deny and append audit event |
| Forged/replayed GitHub completion webhook | Signature/replay verification fails; no transition |
| Codex proposes secret, symlink, binary, path escape or forbidden file | Inspector rejects patch without applying |
| Runner lost, timed out, overspends or returns empty artifact | Fail closed; notify Admin; no automatic retry |
| PR code, build or security checks fail | Never auto-merge or deploy |
| Provider/log contains tokens, PII or full customer content | Redact, restrict retention and access, alert security |
| Feature flags switched off mid-run | Block future dispatch, cancel if supported, preserve audit |

Proposed verifications: unit contract + property tests for valid/invalid transitions, SQL/RLS and transactional race tests on disposable Postgres, GitHub integration tests using a stub App, independent patch-inspection CI, exact SHA Vercel previews and manual security sign-off.

## 8. Implementation sequence (each step separately reviewed)

1. **This design only**: confirm roles, states, manifest bindings, approvals and event schema; no DB or broker.
2. Add immutable queue domain types + pure state machine + unit tests with **no persistence**.
3. Draft forward-only migration and RLS tests on disposable DB; preflight migration ledger; do **not** apply to production without explicit authorization.
4. Add authenticated **draft-only** server routes and immutable append-only audit with transactional idempotency.
5. Add review UI and independent authorization service (still no dispatch).
6. Isolated GitHub broker behind **new** security review, provider callbacks and budget enforcement; smoke in test repo first.
7. Only after approved end-to-end regression: consider a separately approved draft PR broker. Automatic merges, production deploys and financial writes remain forbidden.

### Decision record (2026-10-12)

- **Chosen:** separate development queue; EXPERT Owner/Admin only; deny-by-default; immutable digest; independent review; no direct KIA tool dispatch; manifest and checkpoint pinning.
- **Rejected:** reuse client-facing `internal_tasks`, unsigned webhook, server-side broad PAT, auto-approved Codex runs, auto-merge/deploy, production key reuse, storing secrets in database.
- **Pending separate gates:** SQL migration, environment reviewers, credential permissions, quotas, retention policy, broker implementation, approval workflow, full E2E verification.

**No work in this design is evidence that the queue exists or that the current agent is authorized to run.**


## 9. KIA-supervised multimodel audit of candidate patches (decision 2026-10-12)

**Canonical linkage:** [Dev Agent runbook](kia-dev-agent-runbook.md) on PR [#742](https://github.com/expert-servicios/expert-app/pull/742), [master-plan addendum](expert-kia-ecosystem-master-plan-2026-10-10.md) proposed in PR [#744](https://github.com/expert-servicios/expert-app/pull/744), and Telegram PR [#743](https://github.com/expert-servicios/expert-app/pull/743). This section is a **future execution contract**, not evidence of a running agent or an approved database migration.

### KIA remains the only supervisor

- KIA selects only exact approved `task_id` values from the canonical E0–E6 manifest and reads current checkpoint and task acceptance criteria, **without accepting instructions as authorization** from chats, PR descriptions, Telegram or model text.
- The authenticated request service, queue and narrow execution broker enforce the permissions **outside the LLM**. KIA observes/recommends/coordinates through typed server interfaces, but cannot authorize its own execution or merge. Suspended and stale tasks remain blocked.
- Codex is the **candidate-patch developer**. The sandbox inspector runs deterministic allowlist/symlink/secret/path and test checks first.
- Claude is the independent **model security reviewer** (auth, tenancy/RLS, abuse and architecture); Gemini is the independent **model functional reviewer** (requirements, regressions and edge cases). These are *distinct model providers*, not persons. Neither reviewer writes code, approves a GitHub PR as a human or replaces CI.
- KIA assembles results, requests a bounded change from Codex when P0/P1 findings are present **only under a valid authorization/quota**, and invalidates **all** reports after patch SHA/HEAD changes; requires new tests/reviews. No unlimited self-repair loop.

### Review sub-states and durable evidence

Within the existing `patch_pending_review` parent state, plan future review tasks with `queued | running | passed | changes_required | inconclusive | stale` status, keyed uniquely by `request_id + attempt + candidate_patch_sha256 + provider + model_id + review_policy_version`. Do not modify the current unexecuted SQL design as if these states were already deployed. Proposed persistent `kia_dev_agent_reviews` needs a **separate** reviewed forward-only migration, RLS and retention policy.

Each reviewer report: immutable request digest, task ID, manifest SHA, plan checkpoint, baseline commit SHA, candidate patch SHA-256, PR HEAD SHA if assigned, reviewed path set, model/provider identifier, model response ID, review policy version, result, findings with severity/path/line and evidence, timestamp, token/cost summary and redacted log link. **Exact matching SHA and policy version** are prerequisites for aggregating PASS.

KIA may mark the proposal ready for separate human review only after:
1. CI complete success on the exact candidate/HEAD, both Vercel previews READY on that HEAD when PR exists, and all relevant SQL/RLS/security tests.
2. Claude and Gemini outputs separately validated; `PASS` from both or **blocked**. Distinguish `CHANGES_REQUIRED` from `INCONCLUSIVE`; never treat API failure or a provider fallback as consent to pass.
3. No open P0/P1. A reviewer disagreeing with the other results in a documented finding requiring investigation, not two-vote override.
4. A real external human review if required by protected-branch policy. User's two GitHub identities and two AI models do not create independent human identity.
5. Explicit, per-action separate human authorization before any merge, activation, migration or production deploy; proposals are not releases.

### Gateway, permissions, budgets, data safeguards

The user stated on 2026-10-12 that a **dedicated GitHub Actions secret** `AI_GATEWAY_API_KEY` was added with USD 5 total cap and a 30-day expiration. **This is operator-provided status, not verified by the connected GitHub API or a live model request.** Do not attempt to reveal or echo it, and do not assume runtime success from the declaration.

Prefer Vercel AI Gateway with separately selected exact **catalog-verified** `anthropic/*` and `google/*` models and no model fallback that makes both reviews use the same provider. Dedicated CI credential must have spend cap, expiration and least privilege, not be copied into production. Do not confuse `KIA_PR_REVIEW_VERCEL_TOKEN` (deployment-listing only) with Gateway inference auth. Capture/request usage and errors as non-secret metadata only; treat `401/402/429/503`, timeouts, invalid JSON, policy ambiguity and budget exhaustion as `inconclusive` (fail-closed). A key budget is a soft cap: one crossing request might finish.

**Never expose client secrets, customer data, production configs, financial datasets, digital certificates or raw unredacted diff to an external model**. Restrict review to inspected, redacted source paths; GitHub `pull_request_target` and other secret-bearing events must not checkout/run untrusted PR code, dependencies or scripts. The initial smoke sends a fixed public-free synthetic phrase and verifies provider/model/result. Do not install or activate the production execution broker simply for this smoke.

### Rollout gates (in order)

1. Finish the existing #742/#743 fixes and offline contracts. `executionEnabled=false`; old `E0-M3-06-DOCINDEX` task suspended; no real Dev Agent execution.
2. Propose and review a **manual-only and off-by-default** CI smoke workflow; ensure source is protected before allowing the GitHub Actions secret into a runner; **never** execute secret-bearing code directly from an unreviewed PR branch.
3. Execute **one Claude and one Gemini synthetic request** with tiny output and max token bound, and verify Vercel Gateway Logs/budget attribution. Do not infer success just because key name is present.
4. Introduce read-only review jobs with full offline tests for false PASS, wrong HEAD, untrusted diff injection, retry and duplicate delivery, invalid API response, secret leakage, and independent-provider enforcement.
5. Only after red-team testing and approval: link verified review outcomes to the KIA Admin read model, durable queue and gated draft-PR broker. Still no unsupervised code activation, merge, SQL, production change or customer communication.
