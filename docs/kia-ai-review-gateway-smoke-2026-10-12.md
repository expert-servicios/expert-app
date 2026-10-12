# KIA Dev Agent — Claude/Gemini Gateway smoke (isolated, not enabled)

Related master-plan proposal [#744](https://github.com/expert-servicios/expert-app/pull/744) and development-agent foundation [#742](https://github.com/expert-servicios/expert-app/pull/742).

The manually dispatched workflow `.github/workflows/kia-ai-review-gateway-smoke.yml` is **not an agent**, cannot review PRs, cannot patch code, and has no merge or production capabilities. It uses read-only `GITHUB_TOKEN` permissions and no checkout; all inputs are fixed synthetic text.

## Preconditions — all required

1. The workflow must be reviewed and merged into `main`; it cannot safely be tested with real secrets from an unreviewed branch.
2. GitHub environment `kia-ai-review-smoke` exists, limited to `main`, with required reviewer approval where plan and repository rules permit. The existing repository secret `AI_GATEWAY_API_KEY` can be read by the protected `smoke` job; a second copy is unnecessary. Only move to an environment-scoped secret if you intentionally restrict exposure further and can safely transfer it without revealing it in chat. The `catalog` job does not receive the secret. Never paste its value into issues/chat.
3. The reviewed workflow pins `anthropic/claude-haiku-4.5` and `google/gemini-2.5-flash-lite` for the two smoke requests, and performs a fresh provider/model check against the live catalog at dispatch. No separate model variables are required; changing models requires a reviewed commit and an updated approved SHA.
4. Set variable `KIA_AI_REVIEW_SMOKE_APPROVED_SHA` to the exact reviewed HEAD of `main`, and only then `KIA_AI_REVIEW_SMOKE_ENABLED=true`. The workflow denies stale HEAD or other actors. Set the enable variable back to `false` after the test.
5. Check the 5 USD **total** (nonresetting) key budget, expiry, and current balance in Vercel. Budget is a soft cap; a crossing request can complete. Two tiny invocations only.
6. Perform `catalog` mode first (no secrets or billable generation). In `smoke` mode the same catalog job must pass before the protected environment job can use the key; execute once. Confirm exact responses in Actions and provider/model + spend in Vercel AI Gateway Logs. No retries on uncertain spending outcomes without inspection.

No production secrets, Holded, Supabase, clients, confidential diffs, filesystem scripts from PRs, or provider tokens are accessed. This does **not** prove the future review-job authorization, PR safety, or end-to-end agent functionality.

## Failure expectations

| Error | Safety behavior |
| --- | --- |
| Missing/invalid secret or model ID | Fail closed, no fallback to another provider |
| 401/402/429/503 | Abort; inspect Gateway logs, balance/permission; no automatic retry |
| Provider gives unexpected text | Fail the check; do not call it verified |
| New commit lands before dispatch | SHA guard skips the job |
| User or branch not authorized | Skip |
| Untrusted diff or PR text | Never read or execute it in this workflow |

**State at authoring:** workflow exists **only on a draft PR**. Live GitHub dispatch and direct two-provider proof are not yet performed.
