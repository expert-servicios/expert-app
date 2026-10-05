alter table public.companies
  add column if not exists preferred_language text;

alter table public.companies
  drop constraint if exists companies_preferred_language_check;

alter table public.companies
  add constraint companies_preferred_language_check
  check (preferred_language is null or preferred_language in ('es','ru','en'));

create table if not exists public.company_document_index (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null check (provider in ('google','ms365')),
  external_file_id text not null,
  external_parent_id text,
  relative_path text not null,
  name text not null,
  mime_type text,
  size_bytes bigint,
  provider_created_at timestamptz,
  provider_modified_at timestamptz,
  checksum text,
  is_folder boolean not null default false,
  category text,
  indexed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (company_id, provider, external_file_id)
);

create index if not exists company_document_index_company_path_idx
  on public.company_document_index(company_id, relative_path);

create index if not exists company_document_index_company_name_idx
  on public.company_document_index(company_id, name);

alter table public.company_document_index enable row level security;
revoke all on table public.company_document_index from anon, authenticated;
grant all on table public.company_document_index to service_role;
