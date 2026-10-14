-- Private, opt-in legal-review alert outbox. No scheduler or Telegram enablement.
create table if not exists public.regulatory_devops_notification_outbox (
 id uuid primary key default gen_random_uuid(),
 change_id uuid not null references public.regulatory_changes(id) on delete cascade,
 snapshot_id uuid not null references public.regulatory_snapshots(id),
 channel text not null default 'expert_devops_telegram' check(channel='expert_devops_telegram'),
 status text not null default 'pending' check(status in ('pending','processing','sent','skipped','retry','delivery_uncertain','dead')),
 attempts integer not null default 0 check(attempts>=0 and attempts<=5),
 claim_token uuid,
 locked_until timestamptz,
 next_attempt_at timestamptz not null default now(),
 last_error text,
 delivered_at timestamptz,
 created_at timestamptz not null default now(),
 unique(change_id,snapshot_id,channel)
);
create index if not exists regulatory_devops_outbox_due on public.regulatory_devops_notification_outbox(next_attempt_at,created_at) where status in ('pending','retry');
alter table public.regulatory_devops_notification_outbox enable row level security;
revoke all on public.regulatory_devops_notification_outbox from public, anon, authenticated;
grant select,insert,update on public.regulatory_devops_notification_outbox to service_role;

-- Reclaim only unsent jobs. A claimed delivery is never automatically
-- reclaimed: Telegram has no provider idempotency token, so a lost response
-- requires manual reconciliation before any subsequent send.
create or replace function public.claim_regulatory_devops_notification_batch(p_limit integer default 2)
returns setof public.regulatory_devops_notification_outbox
language sql security invoker set search_path = ''
as $$
 with ready as (
   select id from public.regulatory_devops_notification_outbox
   where status in ('pending','retry') and next_attempt_at<=now() and attempts<5
   order by next_attempt_at,created_at
   limit least(greatest(p_limit,1),3)
   for update skip locked
 )
 update public.regulatory_devops_notification_outbox as jobs
 set status='processing', attempts=jobs.attempts+1,
     claim_token=gen_random_uuid(), locked_until=now()+interval '3 minutes'
 from ready where jobs.id=ready.id
 returning jobs.*;
$$;
revoke all on function public.claim_regulatory_devops_notification_batch(integer) from public,anon,authenticated;
grant execute on function public.claim_regulatory_devops_notification_batch(integer) to service_role;
