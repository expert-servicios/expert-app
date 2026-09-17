# KIA Responses shadow sampling

## Purpose

Compare the current KIA decision path with OpenAI Responses on a small, non-authoritative sample of real dashboard traffic. The baseline KIA result always remains the user-visible answer.

## Runtime controls

- `KIA_OPENAI_RESPONSES_SHADOW_ENABLED=false` by default.
- `KIA_OPENAI_RESPONSES_SHADOW_SAMPLE_RATE=0.05` when enabling the experiment; values are clamped to 0..1.
- `OPENAI_RESPONSES_MODEL` selects the candidate model.

## Eligibility

A request is sampled only when all of the following are true:

- the task is allowlisted;
- the final baseline decision does not require manual review;
- the next action is not `create_task` or `update_case`;
- every still-requested tool has a registered policy;
- every such tool is read-only, R0/R1 and requires no human approval;
- sampling is selected by deterministic hash bucket.

## Route wiring

The canonical `/api/ai/kia` route schedules the shadow call with Next.js `after()`. This keeps the primary response path independent of candidate latency and uses the serverless lifecycle primitive rather than an untracked promise.

The shadow request receives a redacted user message. The sampling key is hashed before it is passed to the sampler.

## Data handling

Shadow telemetry intentionally contains only hashes and aggregate comparison metadata such as models, scores, latency, estimated cost, regression/improvement and a safe error string. It does not persist prompts, responses, client/company identifiers or tool arguments.

OpenAI Responses is called with `store:false` by the Responses adapter. Returned candidate tool calls are evaluated only and are never executed.

## Rollout

1. Merge and validate with the shadow flag disabled.
2. Enable at 5% only after production configuration review.
3. Review regression rate, hard failures, latency and cost before increasing the rate.
4. Keep legal/administrative mutation capabilities outside this experiment until their dedicated approval and action-service architecture exists.
