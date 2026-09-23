# Service flow audit — 2026-09-23

Baseline: main at `fca0cfa7`. This is an inventory and shared-boundary regression audit, not a declaration that every service has passed a live client journey.

## Coverage and evidence

- Catalog: 50 services across 8 categories. Registry routes: 9 viability, 7 readiness, 34 direct_checkout.
- All 50 public service URLs returned HTTP 200 on expertconsulting.es. This verifies availability, not interactive behavior or legal content accuracy.
- 21 catalog entries have a Stripe price identifier; 29 do not. Price existence/activation in Stripe was not verified. The public page routes unpriced services to a quote; absence of a price is not itself a defect.
- 10 entries have specialized operational blueprints; 44 resolve through getServiceChecklist. The generic paid-order fallback creates a manual intake task, not a complete specialized checklist. These counts must not be treated as 40 broken services: subscriptions, Academy and Holded have distinct paths.
- Three monthly plans and two quote-plan aliases are added separately by the registry; their environment-bound prices were not validated. Academy fulfillment and subscription onboarding were covered by existing automated tests, not a live purchase.
- Connected database snapshot: 1 order, 2 cases, 11 internal tasks, 0 catalog_services rows. Its sample is insufficient to demonstrate catalog-wide operational readiness. Confirm environment and catalog synchronization before migration or scale-up; do not seed blindly.
- 62 test files / 332 tests pass, covering services, payments, onboarding, cart, quotes, Stripe retries, Academy, client document views and payment email localization. ESLint passes on changed files. Tests use fixtures/mocks or source assertions; no real payment, client email, signature or filing was performed.

## Reproduced and corrected

1. A case insert could succeed while linking orders.case_id failed. A replay found the case and skipped the link permanently. Reconciliation now links both new and existing cases. Behavioral regression test failed before the fix and passes after it.
2. A payment replay recreated completed/cancelled tasks because the lookup only included pending/in-progress status. The lookup now preserves tasks in every status and tolerates pre-existing duplicates. Behavioral tests failed before and pass after the fix.
3. Three existing source-based tests depended on LF line endings and failed on Windows despite equivalent source. Their readers now normalize CRLF.

The retry fix is sequential replay safety, not an atomic concurrency guarantee. Concurrent task insertion still needs a deliberate database uniqueness design, including legacy duplicates and task identity. The existing unique case order_id index protects case duplication.

## Prioritized remaining checks

1. Run controlled test-mode journeys through payment, case creation, document upload, human review, notification and closure for each service family, then each specialized service. Include interrupted payment, duplicate/concurrent webhook, incomplete documents, rejection, cancellation and refund. Use synthetic accounts and test providers.
2. Reconcile the catalog's fallback intake with the separate KIA checklist source so requirements are not silently lost after purchase. Review these six entries lacking a getServiceChecklist match: constitucion-sl-circe, nif-socio-extranjero, holded-migracion-laboral, holded-modulo-laboral, holded-modulo-formacion, holded-integraciones-api. Search their specialized intake before adding duplicate requirements.
3. Resolve naming mismatch in the dashboard: some unpriced entries are classified direct_checkout and display Contratar, but their public page correctly requests a quote. This is a navigation expectation issue, not proven payment failure.
4. Validate service closure conditions, assigned owners, overdue reminders and client-facing evidence for each family. Existing tests are not sufficient to certify these behaviors.
5. Validate ES/RU content and document parity for each service before claiming all are production_ready. Current production manifest explicitly covers only ten entries, with three marked production_ready.

No migration, production data modification or deployment is included in this audit change.
