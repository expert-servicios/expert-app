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
