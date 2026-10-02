create table if not exists public.social_channel_accounts (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('meta','linkedin','google_ads')),
  channel text not null check (channel in ('facebook','instagram','meta_ads','linkedin_member','linkedin_organization','linkedin_ads','google_ads')),
  external_account_id text not null,
  display_name text,
  status text not null default 'pending' check (status in ('pending','connected','disabled','error')),
  auth_mode text not null check (auth_mode in ('system_user','oauth_user','service_account','cloud_project')),
  scopes text[] not null default '{}'::text[],
  secret_ref text,
  metadata jsonb not null default '{}'::jsonb,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider,channel,external_account_id)
);

create table if not exists public.social_publication_jobs (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.social_content_items(id) on delete cascade,
  channel_account_id uuid references public.social_channel_accounts(id) on delete set null,
  provider text not null check (provider in ('meta','linkedin','google_ads')),
  channel text not null check (channel in ('facebook','instagram','meta_ads','linkedin_member','linkedin_organization','linkedin_ads','google_ads')),
  scheduled_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('draft','scheduled','publishing','published','failed','cancelled')),
  payload jsonb not null default '{}'::jsonb,
  external_object_id text,
  external_url text,
  attempt_count integer not null default 0,
  last_error_code text,
  last_error_message text,
  published_at timestamptz,
  metrics_last_synced_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_publication_jobs_scheduled_idx
  on public.social_publication_jobs(status,scheduled_at);
create index if not exists social_publication_jobs_content_idx
  on public.social_publication_jobs(content_item_id);
create index if not exists social_publication_jobs_channel_idx
  on public.social_publication_jobs(provider,channel,scheduled_at);
create index if not exists social_channel_accounts_status_idx
  on public.social_channel_accounts(provider,status);

alter table public.social_channel_accounts enable row level security;
alter table public.social_publication_jobs enable row level security;

comment on table public.social_channel_accounts is 'Non-secret channel/account metadata. Credentials remain in server-side secret storage; secret_ref only points to them.';
comment on table public.social_publication_jobs is 'Cross-channel EXPERT publication calendar and auditable publishing queue.';
comment on column public.social_publication_jobs.scheduled_at is 'Canonical future execution time controlled by EXPERT, independent of native platform schedulers.';
