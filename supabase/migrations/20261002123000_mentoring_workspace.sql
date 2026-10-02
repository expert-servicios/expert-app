create table if not exists public.mentoring_engagements (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  program text not null,
  project_name text not null,
  mentee_name text not null,
  mentee_email text,
  country text,
  engagement_type text not null check (engagement_type in ('speed','intensive','longitudinal')),
  status text not null default 'active' check (status in ('prospect','active','paused','completed','closed')),
  started_at date,
  ended_at date,
  source_label text,
  source_url text,
  summary_internal text,
  current_focus text,
  next_action text,
  publication_status text not null default 'private' check (publication_status in ('private','consent_pending','publishable','published')),
  publication_consent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mentoring_sessions (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.mentoring_engagements(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  duration_minutes integer check (duration_minutes is null or duration_minutes between 1 and 1440),
  session_number integer check (session_number is null or session_number > 0),
  objective text,
  summary text,
  decisions text,
  next_actions text,
  evidence text,
  private_notes text,
  source_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mentoring_artifacts (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.mentoring_engagements(id) on delete cascade,
  session_id uuid references public.mentoring_sessions(id) on delete set null,
  artifact_type text not null check (artifact_type in ('document','link','trello','email','transcript','screenshot','other')),
  title text not null,
  storage_path text,
  external_url text,
  notes text,
  public_allowed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.mentoring_publications (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.mentoring_engagements(id) on delete cascade,
  publication_type text not null check (publication_type in ('case_study','blog','note','quote','landing_block')),
  title text not null,
  slug text,
  status text not null default 'idea' check (status in ('idea','draft','review','approved','published','rejected')),
  summary text,
  body text,
  publication_url text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mentoring_engagements_lead_idx on public.mentoring_engagements(lead_id);
create index if not exists mentoring_engagements_status_idx on public.mentoring_engagements(status);
create index if not exists mentoring_engagements_program_idx on public.mentoring_engagements(program);
create index if not exists mentoring_engagements_publication_idx on public.mentoring_engagements(publication_status);
create index if not exists mentoring_sessions_engagement_idx on public.mentoring_sessions(engagement_id, occurred_at desc);
create index if not exists mentoring_artifacts_engagement_idx on public.mentoring_artifacts(engagement_id, created_at desc);
create index if not exists mentoring_publications_engagement_idx on public.mentoring_publications(engagement_id, created_at desc);

alter table public.mentoring_engagements enable row level security;
alter table public.mentoring_sessions enable row level security;
alter table public.mentoring_artifacts enable row level security;
alter table public.mentoring_publications enable row level security;

comment on table public.mentoring_engagements is 'Private mentoring workspace. Direct client access is intentionally blocked by RLS; admin routes use the service role.';
comment on column public.mentoring_engagements.summary_internal is 'Internal mentoring notes. Never expose to public pages.';
comment on column public.mentoring_engagements.publication_status is 'Publication gate. Public case-study content requires explicit review/consent.';
