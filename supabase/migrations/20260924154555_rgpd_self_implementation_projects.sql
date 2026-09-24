create table if not exists public.rgpd_self_implementation_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid null references public.companies(id) on delete set null,
  version integer not null default 1 check (version > 0),
  status text not null default 'draft' check (status in ('draft','review_requested','archived')),
  payload jsonb not null default '{}'::jsonb,
  consent_to_store boolean not null default false,
  consent_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.rgpd_self_implementation_projects is
'Voluntary server-side snapshots of the RGPD self-implementation tool for authenticated users. No anonymous storage.';

alter table public.rgpd_self_implementation_projects enable row level security;

create policy "rgpd projects select own"
on public.rgpd_self_implementation_projects
for select
to authenticated
using (auth.uid() = user_id);

create policy "rgpd projects insert own"
on public.rgpd_self_implementation_projects
for insert
to authenticated
with check (auth.uid() = user_id and consent_to_store = true and consent_at is not null);

create policy "rgpd projects update own"
on public.rgpd_self_implementation_projects
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id and consent_to_store = true and consent_at is not null);

create policy "rgpd projects delete own"
on public.rgpd_self_implementation_projects
for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on table public.rgpd_self_implementation_projects to authenticated;

create index if not exists rgpd_self_implementation_projects_user_id_idx
  on public.rgpd_self_implementation_projects(user_id);

create index if not exists rgpd_self_implementation_projects_company_id_idx
  on public.rgpd_self_implementation_projects(company_id)
  where company_id is not null;

create index if not exists rgpd_self_implementation_projects_updated_at_idx
  on public.rgpd_self_implementation_projects(updated_at desc);
