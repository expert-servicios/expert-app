-- KIA Client Registry v2: layered retention + durable client-specific facts/instructions.
-- Operational policy:
--   * detailed operational window: 24 months
--   * minimal event trace retention: 6 years unless separately placed on legal hold
--   * structural facts/instructions remain active until explicitly superseded/revoked
--
-- All new tables are server-side only. The browser never writes client-specific memory.

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

create index if not exists client_registry_events_subject_detail_idx
  on public.client_registry_events(subject_id, occurred_at desc)
  where retention_class = 'standard';

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
  check (status in ('active','superseded','revoked')),
  check (valid_to is null or valid_to >= valid_from)
);

create unique index if not exists client_registry_facts_active_key_uidx
  on public.client_registry_facts(subject_id, fact_key)
  where status = 'active' and valid_to is null;
create index if not exists client_registry_facts_subject_active_idx
  on public.client_registry_facts(subject_id, category, updated_at desc)
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
  check (status in ('active','superseded','revoked')),
  check (valid_to is null or valid_to >= valid_from)
);

create unique index if not exists client_registry_instructions_active_key_uidx
  on public.client_registry_instructions(subject_id, instruction_key)
  where status = 'active' and valid_to is null;
create index if not exists client_registry_instructions_subject_active_idx
  on public.client_registry_instructions(subject_id, priority desc, updated_at desc)
  where status = 'active' and valid_to is null;

create table if not exists public.client_registry_period_summaries (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.client_registry_subjects(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  summary_text text not null,
  event_count integer not null default 0 check (event_count >= 0),
  generated_at timestamptz not null default now(),
  version bigint not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start),
  unique (subject_id, period_start, period_end)
);

create index if not exists client_registry_period_summaries_subject_period_idx
  on public.client_registry_period_summaries(subject_id, period_end desc);

alter table public.client_registry_facts enable row level security;
alter table public.client_registry_instructions enable row level security;
alter table public.client_registry_period_summaries enable row level security;

revoke all on table public.client_registry_facts from anon, authenticated;
revoke all on table public.client_registry_instructions from anon, authenticated;
revoke all on table public.client_registry_period_summaries from anon, authenticated;

grant select, insert, update on table public.client_registry_facts to service_role;
grant select, insert, update on table public.client_registry_instructions to service_role;
grant select, insert, update on table public.client_registry_period_summaries to service_role;

drop policy if exists "client_registry_facts_browser_deny" on public.client_registry_facts;
create policy "client_registry_facts_browser_deny"
on public.client_registry_facts
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "client_registry_instructions_browser_deny" on public.client_registry_instructions;
create policy "client_registry_instructions_browser_deny"
on public.client_registry_instructions
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "client_registry_period_summaries_browser_deny" on public.client_registry_period_summaries;
create policy "client_registry_period_summaries_browser_deny"
on public.client_registry_period_summaries
for all
to anon, authenticated
using (false)
with check (false);

comment on table public.client_registry_facts is
  'Versioned confirmed structural facts for one client/company registry subject. Active facts have no time-based expiry; they are superseded or revoked explicitly.';
comment on table public.client_registry_instructions is
  'Versioned client-specific operating instructions for KIA/EXPERT. Active instructions remain until explicitly superseded or revoked.';
comment on table public.client_registry_period_summaries is
  'Compact historical registry summaries outside the 24-month detailed operational window.';
comment on column public.client_registry_events.detail_until is
  'End of the 24-month detailed operational window. Does not itself delete the event.';
comment on column public.client_registry_events.retain_until is
  'Default six-year minimum trace-retention boundary. Legal holds are handled separately.';
