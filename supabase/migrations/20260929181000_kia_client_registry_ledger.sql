-- KIA client registry ledger: append-only verified history + compact snapshot.
create table if not exists public.client_registry_subjects (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  client_id uuid references public.profiles(id) on delete set null,
  email_normalized text,
  phone_normalized text,
  lifecycle_stage text not null default 'lead'
    check (lifecycle_stage in ('lead','prospect','client','inactive','archived')),
  merged_into_subject_id uuid references public.client_registry_subjects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (lead_id is not null or client_id is not null or email_normalized is not null or phone_normalized is not null),
  check (merged_into_subject_id is null or merged_into_subject_id <> id)
);
create unique index if not exists client_registry_subjects_lead_uidx on public.client_registry_subjects(lead_id)
  where lead_id is not null and merged_into_subject_id is null;
create unique index if not exists client_registry_subjects_client_uidx on public.client_registry_subjects(client_id)
  where client_id is not null and merged_into_subject_id is null;
create index if not exists client_registry_subjects_email_idx on public.client_registry_subjects(email_normalized)
  where email_normalized is not null;
create index if not exists client_registry_subjects_phone_idx on public.client_registry_subjects(phone_normalized)
  where phone_normalized is not null;

create table if not exists public.client_registry_events (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.client_registry_subjects(id) on delete cascade,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  channel text,
  direction text check (direction is null or direction in ('in','out','internal')),
  title text,
  summary text,
  source_table text,
  source_id text,
  source_ref text,
  source_key text not null unique,
  lead_id uuid references public.leads(id) on delete set null,
  client_id uuid references public.profiles(id) on delete set null,
  company_id uuid,
  case_id uuid references public.cases(id) on delete set null,
  importance smallint not null default 1 check (importance between 0 and 5),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists client_registry_events_subject_time_idx on public.client_registry_events(subject_id, occurred_at desc);
create index if not exists client_registry_events_client_time_idx on public.client_registry_events(client_id, occurred_at desc)
  where client_id is not null;
create index if not exists client_registry_events_lead_time_idx on public.client_registry_events(lead_id, occurred_at desc)
  where lead_id is not null;
create index if not exists client_registry_events_case_time_idx on public.client_registry_events(case_id, occurred_at desc)
  where case_id is not null;

create table if not exists public.client_registry_snapshots (
  subject_id uuid primary key references public.client_registry_subjects(id) on delete cascade,
  as_of timestamptz not null default now(),
  version bigint not null default 1,
  lifecycle_stage text not null default 'lead',
  summary_text text not null default '',
  snapshot jsonb not null default '{}'::jsonb,
  source_event_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.client_registry_subjects enable row level security;
alter table public.client_registry_events enable row level security;
alter table public.client_registry_snapshots enable row level security;
revoke all on table public.client_registry_subjects from anon, authenticated;
revoke all on table public.client_registry_events from anon, authenticated;
revoke all on table public.client_registry_snapshots from anon, authenticated;
grant all on table public.client_registry_subjects to service_role;
grant all on table public.client_registry_events to service_role;
grant all on table public.client_registry_snapshots to service_role;
