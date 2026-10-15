#!/usr/bin/env bash
set -euo pipefail
: "${DB_URL:?DB_URL is required (isolated CI PostgreSQL only)}"

# Match the live index expression in a disposable fixture. No production data.
psql "$DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
create table public.rgpd_qa_source_keys (
  id uuid primary key,
  tenant_id uuid,
  source text not null,
  source_key text,
  email text not null
);
create unique index rgpd_qa_source_keys_uniq
  on public.rgpd_qa_source_keys (
    coalesce(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid),
    source,
    source_key
  )
  where source_key is not null;
SQL

# Open a transaction for the first request and leave it pending while the second
# client attempts the same logical request with a different recipient.
psql "$DB_URL" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null &
begin;
insert into public.rgpd_qa_source_keys(id,tenant_id,source,source_key,email)
values('00000000-0000-4000-8000-000000000001',null,'website','rgpd-report:race-qa','original@example.test');
select pg_sleep(2);
commit;
SQL
writer_pid=$!
sleep 0.3

# Must wait for the first transaction and discard the colliding insert.
psql "$DB_URL" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
insert into public.rgpd_qa_source_keys(id,tenant_id,source,source_key,email)
values('00000000-0000-4000-8000-000000000002',null,'website','rgpd-report:race-qa','different@example.test')
on conflict do nothing;
SQL
wait "$writer_pid"

count="$(psql "$DB_URL" -Atc "select count(*) from public.rgpd_qa_source_keys where source='website' and source_key='rgpd-report:race-qa'")"
test "$count" = "1"
original="$(psql "$DB_URL" -Atc "select email from public.rgpd_qa_source_keys where source='website' and source_key='rgpd-report:race-qa'")"
test "$original" = "original@example.test"

# The same request key for a different tenant is independent by design.
psql "$DB_URL" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
insert into public.rgpd_qa_source_keys(id,tenant_id,source,source_key,email)
values('00000000-0000-4000-8000-000000000003',
       '00000000-0000-4000-8000-000000000099',
       'website','rgpd-report:race-qa','other-tenant@example.test');
SQL
count="$(psql "$DB_URL" -Atc "select count(*) from public.rgpd_qa_source_keys where source_key='rgpd-report:race-qa'")"
test "$count" = "2"
psql "$DB_URL" -v ON_ERROR_STOP=1 -c 'drop table public.rgpd_qa_source_keys;' >/dev/null
echo "RGPD source-key PostgreSQL race and tenant-scoping: PASS"
