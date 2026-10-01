-- Registry-backed company identity locks + partial Company 360 intake.
-- Forward-looking only; no historical financial data is changed.

alter table public.companies
  add column if not exists registry_source text,
  add column if not exists registry_source_url text,
  add column if not exists registry_verified_at timestamptz,
  add column if not exists registry_locked_fields text[] not null default '{}'::text[],
  add column if not exists registry_snapshot jsonb not null default '{}'::jsonb;

create table if not exists public.company_intake_profiles (
  company_id uuid primary key references public.companies(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','ready','completed')),
  payload jsonb not null default '{}'::jsonb,
  completion_percent integer not null default 0 check (completion_percent between 0 and 100),
  last_saved_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists company_intake_profiles_client_idx
  on public.company_intake_profiles(client_id, updated_at desc);

alter table public.company_intake_profiles enable row level security;
