create table if not exists public.social_content_items (
  id uuid primary key default gen_random_uuid(),
  source_kind text not null check (source_kind in ('mentoring','blog','service','product','guide','case','company','other')),
  source_ref text,
  source_url text,
  pillar text not null,
  title text not null,
  status text not null default 'idea' check (status in ('idea','draft','review','approved','scheduled','published','rejected')),
  priority integer not null default 3 check (priority between 1 and 5),
  target_platforms text[] not null default array['linkedin','facebook','instagram']::text[],
  hook text,
  master_copy text,
  linkedin_copy text,
  facebook_copy text,
  instagram_copy text,
  cta_label text,
  cta_url text,
  asset_type text check (asset_type is null or asset_type in ('text','image','carousel','video','reel','document')),
  asset_brief text,
  consent_required boolean not null default false,
  consent_status text not null default 'not_required' check (consent_status in ('not_required','pending','granted','denied')),
  scheduled_at timestamptz,
  published_at timestamptz,
  metrics jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_content_items_status_idx on public.social_content_items(status);
create index if not exists social_content_items_pillar_idx on public.social_content_items(pillar);
create index if not exists social_content_items_source_kind_idx on public.social_content_items(source_kind);
create index if not exists social_content_items_scheduled_idx on public.social_content_items(scheduled_at);

alter table public.social_content_items enable row level security;

comment on table public.social_content_items is 'Private editorial backlog for social and public content. Access is intended through authenticated admin routes only.';
comment on column public.social_content_items.master_copy is 'Canonical draft from which channel adaptations are derived.';
comment on column public.social_content_items.consent_status is 'Publication gate for content that identifies or relies on third-party mentoring participants or cases.';
