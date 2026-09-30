-- KIA client registry hardening: durable cursor + true append-only event grants.
-- Additive follow-up because the original ledger migrations are already applied.

-- Preserve history when a lead/profile is later deleted. A registry subject can
-- legitimately become identity-orphaned while its audit history remains retained.
alter table public.client_registry_subjects
  drop constraint if exists client_registry_subjects_check;

-- The event ledger is append-only for normal server code.
revoke all on table public.client_registry_events from service_role;
grant select, insert on table public.client_registry_events to service_role;

-- Persistent reconciliation cursors prevent the cron from repeatedly processing
-- only the newest profiles/leads and make the initial backfill eventually complete.
create table if not exists public.client_registry_reconcile_state (
  id text primary key check (id = 'default'),
  profile_cursor uuid,
  lead_cursor uuid,
  updated_at timestamptz not null default now()
);

alter table public.client_registry_reconcile_state enable row level security;
revoke all on table public.client_registry_reconcile_state from anon, authenticated;
grant select, insert, update on table public.client_registry_reconcile_state to service_role;

drop policy if exists "client_registry_reconcile_state_browser_deny"
  on public.client_registry_reconcile_state;
create policy "client_registry_reconcile_state_browser_deny"
on public.client_registry_reconcile_state
for all
to anon, authenticated
using (false)
with check (false);

insert into public.client_registry_reconcile_state (id)
values ('default')
on conflict (id) do nothing;
