# Supabase production ledger checkpoint — 2026-09-17

Issue: #143  
Recovery PR: #194  
Project: `ybtpqscmqrrjjmuoryap`

## Scope

This checkpoint refreshes the recovery plan after `main` advanced beyond the validated 2026-09-12 baseline. The goal is to preserve all legitimate new work while keeping the production migration-history repair conservative and auditable.

No production DDL/DML, no `migration repair`, and no direct write to `supabase_migrations.schema_migrations` was performed in this checkpoint.

## Read-only production ledger checkpoint

Current production ledger:

- rows: **148**
- first version: `20260508082323`
- last version: `20260916223931`
- rows with empty `statements`: **0**
- `replay_probe_*` rows: **0**
- rows after the former frozen tip `20260911174615`: **15**

The post-frozen production tail is:

1. `20260913101837 profiles_preferred_language`
2. `20260915141930 kia_access_grants`
3. `20260915142511 kia_access_grants_explicit_deny`
4. `20260915144043 kia_memory_v2_schema`
5. `20260915144054 kia_memories_explicit_deny`
6. `20260915145730 kia_memories_search_v2`
7. `20260915152533 kia_administrative_actions_core`
8. `20260915194210 kia_administrative_action_service`
9. `20260915194211 kia_administrative_action_service`
10. `20260916060120 kia_administrative_approval_service`
11. `20260916191059 kia_channel_identities`
12. `20260916191151 kia_channel_identities_restrict_service_role`
13. `20260916211014 kia_telegram_link_tokens`
14. `20260916211401 kia_channel_link_tokens_explicit_deny`
15. `20260916223931 client_integrations_live_provider_uniqueness`

The two `kia_administrative_action_service` rows contain the same stored SQL (`MD5 7a6eda31192500620950497b4605e8d0`), so the second row is a true duplicate ledger application and must be handled explicitly during the CLI repair phase.

## Preserve current `main`

`main` had moved 92 commits beyond the recovery branch merge base. To avoid overwriting KIA, i18n, Holded, tests, or newer migrations, current `main` was merged **into the recovery branch only** through PR #277.

Recovery branch merge commit: `66004c4fdcd09f717c4e10af5f3e9a8765721397`.

This does not modify production `main` and does not touch the Supabase database.

## Revised active migration model

The old guard that required exactly 36 files is obsolete. The intended active history is now:

1. the validated **36-file immutable baseline** (`20260912000100` … `20260912003600`), then
2. legitimate chronological **post-baseline migrations**.

The migration-layout test now enforces the immutable baseline prefix, unique 14-digit versions, chronological post-baseline versions, and exclusion of pre-baseline legacy SQL from the active path. Future legitimate migrations can therefore be added without weakening the recovery boundary.

## Remote-only live migration recovered exactly

Production contained `20260916223931 client_integrations_live_provider_uniqueness`, but current `main` had no corresponding SQL file.

The exact stored production statement has been recovered as:

`supabase/migrations/20260916223931_client_integrations_live_provider_uniqueness.sql`

Its local SQL MD5 is `fd3fe7524586039a88fe61d1a955fe40`, exactly matching the production ledger statement MD5. This preserves the live uniqueness rule in future fresh-database builds without replaying it against production now.

## Production repair remains gated

Before any ledger mutation:

1. the read-only GitHub Actions preflight must successfully link to production using `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD`;
2. an exact encrypted backup of the current 148-row ledger must be produced;
3. the refreshed baseline + post-baseline tail must pass CI and a fresh-database rebuild;
4. the final repair plan must be generated from the then-current production ledger;
5. only official `supabase migration repair` commands may alter migration-history status;
6. direct `DELETE`/`INSERT`/`UPDATE` against `supabase_migrations.schema_migrations` remains prohibited;
7. after repair, run `supabase migration list`, `supabase db push --dry-run`, schema-fingerprint parity checks, and Supabase Security Advisor.

## Stop conditions

Stop the repair immediately if production gains another migration after this checkpoint, the ledger backup differs from the preflight snapshot, the fresh rebuild diverges from production structure, or the CLI proposes executable schema changes where only history repair is expected.
