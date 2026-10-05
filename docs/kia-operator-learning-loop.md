# KIA — Operator Learning Loop

## Goal

Corrections made while EXPERT handles real client work should become reusable KIA behavior instead of remaining only in chat history.

## Promotion rule

Do not copy raw conversations into the prompt. Promote only reusable, non-client-specific learning into one or more of:

1. **Operator lesson** — behavioral/operational rule in `kia_operator_lessons`.
2. **Official source** — authoritative regulatory source in Regulatory Registry.
3. **Specialist corpus** — durable legal/operational methodology.
4. **Positive example / feedback** — useful model behavior for few-shot retrieval.
5. **Regression test** — protects important corrections against future changes.

Client facts remain in client/case context and are not generalized as global lessons.

## Priority

Operator lessons are injected as a high-priority context block. They do not override legislation, security policy or explicit user instructions, but they take precedence over generic stylistic examples.

## Email anti-duplicate rule

Before every autonomous KIA email send:
- check the live Gmail thread again;
- locate the inbound message being answered;
- if any EXPERT outbound message exists after that inbound message, treat the thread as already answered and do not send;
- fail closed if the live duplicate check itself fails;
- preserve the existing idempotency claim as a second layer.

This protects against timeouts, manual sends and internal-state lag.


## DGM as first accounting case study

DISEÑO GLOBAL MERIDIANO, S.L. is the first explicit accounting-rebuild case using this loop.

What remains company-scoped:
- the identity of DGM;
- its five rental properties;
- tenant/incidence details;
- accounting balances and corrections;
- its email history.

What is promoted globally:
- audit read-only before write;
- take a snapshot before reconstruction;
- classify correct/missing/wrong/duplicate/review items;
- analyse multi-asset businesses by economic unit when useful;
- reconcile tax filings against accounting;
- do not activate client access until the internal environment is ready.

Canonical playbook: `docs/clients/dgm-accounting-rebuild-2025-2026.md`.
