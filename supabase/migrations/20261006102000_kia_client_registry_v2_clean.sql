-- KIA Client Registry v2 — scoped, auditable and atomic.
-- Detailed operational history: 24 months.
-- Compact trace: 6 years unless legal_hold.
-- Confirmed facts/instructions require provenance and are replaced atomically.

alter table public.client_registry_events
  add column if not exists detail_until timestamptz,
  add column if not exists retain_until timestamptz,
  add column if not exists retention_class text not null default 'standard';

update public.client_registry_events
set detail_until = coalesce(detail_until, occurred_at + interval '24 months'),
    retain_until = coalesce(retain_until, occurred_at + interval '6 years')
where detail_until is null or retain_until is null;

alter table public.client_registry_events
  alter column detail_until set default (now() + interval '24 months'),
  alter column detail_until set not null,
  alter column retain_until set default (now() + interval '6 years'),
  alter column retain_until set not null;

alter table public.client_registry_events
  drop constraint if exists client_registry_events_retention_class_check;
alter table public.client_registry_events
  add constraint client_registry_events_retention_class_check
  check (retention_class in ('standard','legal_hold'));

alter table public.client_registry_events
  drop constraint if exists client_registry_events_retention_window_check;
alter table public.client_registry_events
  add constraint client_registry_events_retention_window_check
  check (detail_until >= occurred_at and retain_until >= detail_until);

create table if not exists public.client_registry_facts (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.client_registry_subjects(id) on delete restrict,
  fact_key text not null,
  category text not null default 'general',
  fact_value text not null,
  verification_status text not null default 'confirmed',
  source_ref text,
  source_event_id uuid references public.client_registry_events(id) on delete set null,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  status text not null default 'active',
  superseded_by_fact_id uuid references public.client_registry_facts(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(fact_key) between 1 and 160),
  check (char_length(fact_value) between 1 and 4000),
  check (verification_status in ('confirmed','needs_review')),
  check (status in ('staged','active','superseded','revoked')),
  check (valid_to is null or valid_to >= valid_from),
  check (
    verification_status <> 'confirmed'
    or source_ref is not null
    or source_event_id is not null
  )
);

alter table public.client_registry_facts
  drop constraint if exists client_registry_facts_provenance_check;
alter table public.client_registry_facts
  add constraint client_registry_facts_provenance_check
  check (
    verification_status <> 'confirmed'
    or source_ref is not null
    or source_event_id is not null
  );

create unique index if not exists client_registry_facts_active_key_uidx
  on public.client_registry_facts(subject_id, fact_key)
  where status = 'active' and valid_to is null;

create table if not exists public.client_registry_instructions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.client_registry_subjects(id) on delete restrict,
  instruction_key text not null,
  scope text not null default 'general',
  instruction_text text not null,
  priority smallint not null default 3 check (priority between 1 and 5),
  verification_status text not null default 'confirmed',
  source_ref text,
  source_event_id uuid references public.client_registry_events(id) on delete set null,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  status text not null default 'active',
  superseded_by_instruction_id uuid references public.client_registry_instructions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(instruction_key) between 1 and 160),
  check (char_length(instruction_text) between 1 and 4000),
  check (verification_status in ('confirmed','needs_review')),
  check (status in ('staged','active','superseded','revoked')),
  check (valid_to is null or valid_to >= valid_from),
  check (
    verification_status <> 'confirmed'
    or source_ref is not null
    or source_event_id is not null
  )
);

alter table public.client_registry_instructions
  drop constraint if exists client_registry_instructions_provenance_check;
alter table public.client_registry_instructions
  add constraint client_registry_instructions_provenance_check
  check (
    verification_status <> 'confirmed'
    or source_ref is not null
    or source_event_id is not null
  );

create unique index if not exists client_registry_instructions_active_key_uidx
  on public.client_registry_instructions(subject_id, instruction_key)
  where status = 'active' and valid_to is null;

create table if not exists public.client_registry_period_summaries (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.client_registry_subjects(id) on delete restrict,
  company_id uuid references public.companies(id) on delete set null,
  case_id uuid references public.cases(id) on delete set null,
  period_start date not null,
  period_end date not null,
  summary_text text not null,
  event_count integer not null default 0 check (event_count >= 0),
  generated_at timestamptz not null default now(),
  version bigint not null default 1,
  retention_class text not null default 'standard',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start),
  check (retention_class in ('standard','legal_hold'))
);

alter table public.client_registry_period_summaries
  add column if not exists company_id uuid references public.companies(id) on delete set null,
  add column if not exists case_id uuid references public.cases(id) on delete set null,
  add column if not exists retention_class text not null default 'standard';

alter table public.client_registry_period_summaries
  drop constraint if exists client_registry_period_summaries_retention_class_check;
alter table public.client_registry_period_summaries
  add constraint client_registry_period_summaries_retention_class_check
  check (retention_class in ('standard','legal_hold'));

drop index if exists client_registry_period_summaries_scope_uidx;
create unique index client_registry_period_summaries_scope_uidx
  on public.client_registry_period_summaries(subject_id, period_start, period_end, company_id, case_id)
  nulls not distinct;

create index if not exists client_registry_period_summaries_subject_scope_idx
  on public.client_registry_period_summaries(subject_id, company_id, case_id, period_end desc);

alter table public.client_registry_facts enable row level security;
alter table public.client_registry_instructions enable row level security;
alter table public.client_registry_period_summaries enable row level security;

revoke all on table public.client_registry_facts from anon, authenticated;
revoke all on table public.client_registry_instructions from anon, authenticated;
revoke all on table public.client_registry_period_summaries from anon, authenticated;

grant select, insert, update on table public.client_registry_facts to service_role;
grant select, insert, update on table public.client_registry_instructions to service_role;
grant select, insert, update, delete on table public.client_registry_period_summaries to service_role;

drop policy if exists "client_registry_facts_browser_deny" on public.client_registry_facts;
create policy "client_registry_facts_browser_deny"
on public.client_registry_facts for all to anon, authenticated
using (false) with check (false);

drop policy if exists "client_registry_instructions_browser_deny" on public.client_registry_instructions;
create policy "client_registry_instructions_browser_deny"
on public.client_registry_instructions for all to anon, authenticated
using (false) with check (false);

drop policy if exists "client_registry_period_summaries_browser_deny" on public.client_registry_period_summaries;
create policy "client_registry_period_summaries_browser_deny"
on public.client_registry_period_summaries for all to anon, authenticated
using (false) with check (false);

create or replace function public.replace_client_registry_fact(
  p_subject_id uuid,
  p_fact_key text,
  p_category text,
  p_fact_value text,
  p_source_ref text default null,
  p_source_event_id uuid default null,
  p_valid_from timestamptz default now(),
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_current public.client_registry_facts%rowtype;
  v_new_id uuid;
  v_updated integer;
begin
  if nullif(btrim(p_fact_key), '') is null or nullif(btrim(p_fact_value), '') is null then
    raise exception 'client_registry_fact_invalid';
  end if;
  if p_source_ref is null and p_source_event_id is null then
    raise exception 'client_registry_provenance_required';
  end if;

  select * into v_current
  from public.client_registry_facts
  where subject_id = p_subject_id
    and fact_key = btrim(p_fact_key)
    and status = 'active'
    and valid_to is null
  for update;

  if found
     and v_current.fact_value = btrim(p_fact_value)
     and v_current.category = coalesce(nullif(btrim(p_category), ''), 'general')
  then
    return v_current.id;
  end if;

  insert into public.client_registry_facts(
    subject_id, fact_key, category, fact_value, verification_status,
    source_ref, source_event_id, valid_from, status, metadata
  ) values (
    p_subject_id, btrim(p_fact_key), coalesce(nullif(btrim(p_category), ''), 'general'),
    btrim(p_fact_value), 'confirmed', p_source_ref, p_source_event_id,
    coalesce(p_valid_from, now()), case when v_current.id is null then 'active' else 'staged' end,
    coalesce(p_metadata, '{}'::jsonb)
  ) returning id into v_new_id;

  if v_current.id is not null then
    update public.client_registry_facts
       set status = 'superseded',
           valid_to = coalesce(p_valid_from, now()),
           superseded_by_fact_id = v_new_id,
           updated_at = now()
     where id = v_current.id
       and subject_id = p_subject_id
       and status = 'active'
       and valid_to is null;
    get diagnostics v_updated = row_count;
    if v_updated <> 1 then
      raise exception 'client_registry_fact_replace_conflict';
    end if;

    update public.client_registry_facts
       set status = 'active', updated_at = now()
     where id = v_new_id and status = 'staged';
  end if;

  return v_new_id;
end;
$$;

create or replace function public.replace_client_registry_instruction(
  p_subject_id uuid,
  p_instruction_key text,
  p_scope text,
  p_instruction_text text,
  p_priority smallint default 3,
  p_source_ref text default null,
  p_source_event_id uuid default null,
  p_valid_from timestamptz default now(),
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_current public.client_registry_instructions%rowtype;
  v_new_id uuid;
  v_updated integer;
  v_priority smallint := greatest(1, least(5, coalesce(p_priority, 3)));
begin
  if nullif(btrim(p_instruction_key), '') is null or nullif(btrim(p_instruction_text), '') is null then
    raise exception 'client_registry_instruction_invalid';
  end if;
  if p_source_ref is null and p_source_event_id is null then
    raise exception 'client_registry_provenance_required';
  end if;

  select * into v_current
  from public.client_registry_instructions
  where subject_id = p_subject_id
    and instruction_key = btrim(p_instruction_key)
    and status = 'active'
    and valid_to is null
  for update;

  if found
     and v_current.instruction_text = btrim(p_instruction_text)
     and v_current.scope = coalesce(nullif(btrim(p_scope), ''), 'general')
     and v_current.priority = v_priority
  then
    return v_current.id;
  end if;

  insert into public.client_registry_instructions(
    subject_id, instruction_key, scope, instruction_text, priority,
    verification_status, source_ref, source_event_id, valid_from, status, metadata
  ) values (
    p_subject_id, btrim(p_instruction_key), coalesce(nullif(btrim(p_scope), ''), 'general'),
    btrim(p_instruction_text), v_priority, 'confirmed', p_source_ref, p_source_event_id,
    coalesce(p_valid_from, now()), case when v_current.id is null then 'active' else 'staged' end,
    coalesce(p_metadata, '{}'::jsonb)
  ) returning id into v_new_id;

  if v_current.id is not null then
    update public.client_registry_instructions
       set status = 'superseded',
           valid_to = coalesce(p_valid_from, now()),
           superseded_by_instruction_id = v_new_id,
           updated_at = now()
     where id = v_current.id
       and subject_id = p_subject_id
       and status = 'active'
       and valid_to is null;
    get diagnostics v_updated = row_count;
    if v_updated <> 1 then
      raise exception 'client_registry_instruction_replace_conflict';
    end if;

    update public.client_registry_instructions
       set status = 'active', updated_at = now()
     where id = v_new_id and status = 'staged';
  end if;

  return v_new_id;
end;
$$;

revoke all on function public.replace_client_registry_fact(uuid,text,text,text,text,uuid,timestamptz,jsonb)
  from public, anon, authenticated;
revoke all on function public.replace_client_registry_instruction(uuid,text,text,text,smallint,text,uuid,timestamptz,jsonb)
  from public, anon, authenticated;
grant execute on function public.replace_client_registry_fact(uuid,text,text,text,text,uuid,timestamptz,jsonb)
  to service_role;
grant execute on function public.replace_client_registry_instruction(uuid,text,text,text,smallint,text,uuid,timestamptz,jsonb)
  to service_role;
