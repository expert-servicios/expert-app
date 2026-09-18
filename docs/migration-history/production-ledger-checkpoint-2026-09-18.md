# Production ledger checkpoint — 2026-09-18

## Scope

Read-only checkpoint for issue #143. No DDL, DML, `migration repair`, or direct writes to `supabase_migrations.schema_migrations` were performed.

## Current production ledger

- Project: `ybtpqscmqrrjjmuoryap` (EXPERT)
- PostgreSQL: 15.8
- Ledger rows: **155**
- First version: `20260508082323`
- Last version: `20260918073212`
- Rows with empty `statements`: **0**
- Recovery baseline versions matching `20260912*`: **0**

The previous 133-row snapshot is no longer a valid before-state for a production repair.

## Delta after the former 133-row checkpoint

| Remote production version | Remote name | Current local migration | Classification |
| --- | --- | --- | --- |
| 20260913101837 | profiles_preferred_language | 20260913102000_profiles_preferred_language.sql | semantic match, different version |
| 20260915141930 | kia_access_grants | 20260915142000_kia_access_grants.sql | semantic match, different version |
| 20260915142511 | kia_access_grants_explicit_deny | 20260915162500_kia_access_grants_explicit_deny.sql | semantic match, different version |
| 20260915144043 | kia_memory_v2_schema | 20260915163500_kia_memory_v2_schema.sql | semantic match, different version |
| 20260915144054 | kia_memories_explicit_deny | 20260915163600_kia_memories_explicit_deny.sql | semantic match, different version |
| 20260915145730 | kia_memories_search_v2 | 20260915164500_kia_memories_search_v2.sql | semantic match, different version |
| 20260915152533 | kia_administrative_actions_core | 20260915171500_kia_administrative_actions_core.sql | semantic match, different version |
| 20260915194210 | kia_administrative_action_service | 20260915173000_kia_administrative_action_service.sql | semantic match, different version |
| 20260915194211 | kia_administrative_action_service | 20260915173000_kia_administrative_action_service.sql | **duplicate remote semantic application** |
| 20260916060120 | kia_administrative_approval_service | 20260915174500_kia_administrative_approval_service.sql | semantic match, different version |
| 20260916191059 | kia_channel_identities | 20260916190000_kia_channel_identities.sql | semantic match, different version |
| 20260916191151 | kia_channel_identities_restrict_service_role | 20260916191500_kia_channel_identities_restrict_service_role.sql | semantic match, different version |
| 20260916211014 | kia_telegram_link_tokens | 20260916214500_kia_telegram_link_tokens.sql | semantic match, different version |
| 20260916211401 | kia_channel_link_tokens_explicit_deny | 20260916214600_kia_channel_link_tokens_explicit_deny.sql | semantic match, different version |
| 20260916223931 | client_integrations_live_provider_uniqueness | 20260916223931_client_integrations_live_provider_uniqueness.sql | exact version/name |
| 20260917195815 | catalog_orders_separate_checkout_disbursements | 20260917195815_catalog_orders_separate_checkout_disbursements.sql | exact version/name |
| 20260917201207 | preserve_catalog_payment_breakdown_on_order_updates | 20260917201207_preserve_catalog_payment_breakdown_on_order_updates.sql | exact version/name |
| 20260917212053 | cases_order_id_unique | 20260917212053_cases_order_id_unique.sql | exact version/name |
| 20260917212504 | nationality_catalog_order_fulfillment | 20260917212504_nationality_catalog_order_fulfillment.sql | exact version/name |
| 20260917212807 | normalize_checkout_completion_trigger | 20260917212807_normalize_checkout_completion_trigger.sql | exact version/name |
| 20260917213213 | preserve_paid_status_when_holded_skipped | 20260917213213_preserve_paid_status_when_holded_skipped.sql | exact version/name |
| 20260918073212 | nationality_post_payment_admin_followup | 20260918073212_nationality_post_payment_admin_followup.sql | exact version/name |

## Stop condition discovered

The production ledger includes two distinct tracking versions for the same `kia_administrative_action_service` semantic migration:

- `20260915194210`
- `20260915194211`

This duplicate must be explicitly accounted for in the final history-only repair. It must not be silently collapsed by a filename-only mapping.

## Updated transition boundary

The old 133-row rollback/repair manifest must not be executed. Before any production ledger mutation:

1. the GitHub Actions read-only preflight must see the current frozen snapshot;
2. an exact encrypted backup of all **155** rows including `statements` must be produced;
3. the final repair manifest must be generated from that backup;
4. if the row count or tip changes again, stop and regenerate the plan;
5. only official Supabase CLI `migration repair` is permitted for history reconciliation;
6. no direct `DELETE/INSERT/UPDATE` against the migration ledger is allowed.
