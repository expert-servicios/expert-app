# Scheduler ownership

## Canonical scheduler

Application HTTP crons are owned by **Supabase pg_cron** and call:

`https://expertconsulting.es/api/cron/*`

Authentication uses the Vault secret `cron_secret`, exposed to the public Vercel project only as `PG_CRON_SECRET`.

## Vercel projects

- `ksenia-expert`: serves `expertconsulting.es`; `VERCEL_CRON_EXECUTOR_ENABLED=0`.
- `app`: historically executed the same `vercel.json` schedules. Those schedules are removed after migration to pg_cron.

`CRON_SECRET` remains a compatibility credential during migration, but it is not accepted on `ksenia-expert` while `VERCEL_CRON_EXECUTOR_ENABLED=0`.

## Deployment sequence

1. Verify a real pg_net request to `email-queue` returns 2xx using Vault.
2. Deploy the commit that removes `vercel.json.crons`.
3. Confirm the production deployment is READY.
4. Apply `20261006113000_consolidate_application_crons.sql`.
5. Verify `cron.job` contains exactly one application schedule per route.
6. Inspect `net._http_response` after representative runs for 2xx/timeouts.
7. Only then retire legacy `CRON_SECRET` / GitHub scheduler credentials if no other consumer needs them.

Do not run Vercel and Supabase schedules for the same route at the same time.
