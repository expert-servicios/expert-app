# KIA Dev Agent — Claude/Gemini Gateway smoke (isolated, not enabled)

Related master-plan proposal [#744](https://github.com/expert-servicios/expert-app/pull/744) and development-agent foundation [#742](https://github.com/expert-servicios/expert-app/pull/742).

The manually dispatched workflow `.github/workflows/kia-ai-review-gateway-smoke.yml` is **not an agent**, cannot review PRs, cannot patch code, and has no merge or production capabilities. It uses read-only `GITHUB_TOKEN` permissions and no checkout; all inputs are fixed synthetic text.

## Preconditions — all required

1. The workflow must be reviewed and merged into `main`; it cannot safely be tested with real secrets from an unreviewed branch.
2. GitHub environment `kia-ai-review-smoke` exists, limited to `main`, with required authorized external review when available; place the already-created `AI_GATEWAY_API_KEY` as an **environment secret** in that environment (prefer environment-scoped secret over repository-wide exposure). If only the repository secret exists, arrange the environment protection before enabling and restrict the workflow to this trusted, reviewed script. Never paste its value into issues/chat.
3. From live <https://ai-gateway.vercel.sh/v1/models> set repository variables `KIA_REVIEW_CLAUDE_MODEL` (an exact `anthropic/*` ID) and `KIA_REVIEW_GEMINI_MODEL` (an exact `google/*` ID). No unverified model slug should be copied from a prior chat.
4. Set variable `KIA_AI_REVIEW_SMOKE_APPROVED_SHA` to the exact reviewed HEAD of `main`, and only then `KIA_AI_REVIEW_SMOKE_ENABLED=true`. The workflow denies stale HEAD or other actors. Set the enable variable back to `false` after the test.
5. Check the 5 USD **total** (nonresetting) key budget, expiry, and current balance in Vercel. Budget is a soft cap; a crossing request can complete. Two tiny invocations only.
6. Perform `catalog` mode first (no authentication or billable generation). After success, explicitly select `smoke` mode once. Confirm exact responses in Actions and provider/model + spend in Vercel AI Gateway Logs. No retries on uncertain spending outcomes without inspection.

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
