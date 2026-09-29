-- Atomic idempotency keys for email-derived records.
alter table public.email_events
  add column if not exists source_key text;

alter table public.internal_tasks
  add column if not exists source_key text;

do $$
begin
  if exists (
    select 1
    from public.email_events
    where metadata->>'source_key' is not null
    group by metadata->>'source_key'
    having count(*) > 1
  ) then
    raise exception 'Duplicate email_events metadata source_key detected; review manually.';
  end if;

  if exists (
    select 1
    from public.internal_tasks
    where metadata->>'source_key' is not null
    group by metadata->>'source_key'
    having count(*) > 1
  ) then
    raise exception 'Duplicate internal_tasks metadata source_key detected; review manually.';
  end if;
end
$$;

update public.email_events
set source_key = metadata->>'source_key'
where source_key is null
  and metadata->>'source_key' is not null;

update public.internal_tasks
set source_key = metadata->>'source_key'
where source_key is null
  and metadata->>'source_key' is not null;

create unique index if not exists email_events_source_key_uidx
  on public.email_events (source_key)
  where source_key is not null;

create unique index if not exists internal_tasks_source_key_uidx
  on public.internal_tasks (source_key)
  where source_key is not null;
