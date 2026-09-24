create table public.kia_work_inbox (
  event_id uuid primary key,
  connection_id uuid not null references public.kia_work_connections(id),
  payload jsonb not null,
  payload_hash text not null,
  state text not null default 'pending' check (state in ('pending','processing','applied','review')),
  attempts integer not null default 0,
  received_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  locked_until timestamptz,
  last_error text,
  result jsonb
);
create index kia_work_inbox_ready_idx on public.kia_work_inbox(available_at) where state in ('pending','processing');
alter table public.kia_work_inbox enable row level security;
revoke all on public.kia_work_inbox from public,anon,authenticated;
grant select,insert,update on public.kia_work_inbox to service_role;

create function public.kia_work_receive(p_connection uuid,p_event jsonb,p_hash text)
returns public.kia_work_inbox language plpgsql security invoker set search_path=public as $$
declare c public.kia_work_connections; r public.kia_work_inbox; claim public.kia_work_claims;
begin
  c := public.kia_work_lock_scope(p_connection);
  select * into r from public.kia_work_inbox where event_id=(p_event->>'event_id')::uuid;
  if found then
    if r.connection_id<>p_connection or r.payload_hash<>p_hash then raise exception 'work_event_conflict'; end if;
    return r;
  end if;
  if not (c.task_policies ? (p_event->>'task_id')) then raise exception 'work_task_not_authorized'; end if;
  if abs(extract(epoch from (now()-(p_event->>'occurred_at')::timestamptz)))>900 then raise exception 'work_event_expired'; end if;
  select * into claim from public.kia_work_claims where task_id=(p_event->>'task_id')::uuid for share;
  if not found or claim.connection_id<>p_connection or claim.run_id<>p_event->>'run_id'
    or claim.version<>(p_event->>'claim_version')::integer or claim.lease_until<=now() then raise exception 'work_stale_claim'; end if;
  insert into public.kia_work_inbox(event_id,connection_id,payload,payload_hash)
    values((p_event->>'event_id')::uuid,p_connection,p_event,p_hash) returning * into r;
  return r;
end $$;

create function public.kia_work_take_results(p_limit integer default 10,p_event uuid default null)
returns setof public.kia_work_inbox language sql security invoker set search_path=public as $$
  with ready as (
    select event_id from public.kia_work_inbox
    where (p_event is null or event_id=p_event) and available_at<=now()
      and (state='pending' or (state='processing' and locked_until<=now()))
    order by available_at,event_id for update skip locked limit least(greatest(p_limit,1),20)
  )
  update public.kia_work_inbox r set state='processing',attempts=attempts+1,locked_until=now()+interval '2 minutes'
    from ready where ready.event_id=r.event_id returning r.*;
$$;
revoke all on function public.kia_work_receive(uuid,jsonb,text), public.kia_work_take_results(integer,uuid) from public,anon,authenticated;
grant execute on function public.kia_work_receive(uuid,jsonb,text), public.kia_work_take_results(integer,uuid) to service_role;
