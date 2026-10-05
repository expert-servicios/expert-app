create table if not exists public.company_document_roots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null check (provider in ('google','ms365')),
  external_folder_id text not null,
  display_name text,
  status text not null default 'active' check (status in ('active','paused','error','revoked')),
  sync_mode text not null default 'mirror_and_index' check (sync_mode in ('mirror_only','index_only','mirror_and_index')),
  last_indexed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, provider)
);

create index if not exists company_document_roots_company_id_idx
  on public.company_document_roots(company_id);

alter table public.company_document_roots enable row level security;

revoke all on table public.company_document_roots from anon, authenticated;
grant all on table public.company_document_roots to service_role;

insert into public.company_document_roots (
  company_id, provider, external_folder_id, display_name, status, sync_mode
)
values (
  '188a1871-0ea8-4b11-adac-c9acc41c4a4b',
  'google',
  '1j7F3yUqfUviCoWoGqxSVpr1KAhL3W3If',
  'DGM — Diseño Global Meridiano',
  'active',
  'mirror_and_index'
)
on conflict (company_id, provider) do update
set external_folder_id = excluded.external_folder_id,
    display_name = excluded.display_name,
    status = excluded.status,
    sync_mode = excluded.sync_mode,
    updated_at = now();
