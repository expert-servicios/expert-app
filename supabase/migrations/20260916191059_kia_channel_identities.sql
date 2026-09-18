create table if not exists public.kia_channel_identities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check (channel in ('telegram')),
  external_user_id text not null,
  external_chat_id text not null,
  external_username text,
  status text not null default 'active' check (status in ('pending','active','revoked')),
  verified_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel, external_user_id),
  unique (channel, external_chat_id)
);

alter table public.kia_channel_identities enable row level security;

revoke all on table public.kia_channel_identities from anon, authenticated;
grant select, insert, update on table public.kia_channel_identities to service_role;

create index if not exists kia_channel_identities_profile_idx
  on public.kia_channel_identities(profile_id, status);
create index if not exists kia_channel_identities_tenant_idx
  on public.kia_channel_identities(tenant_id, status);

comment on table public.kia_channel_identities is
  'Explicit verified bindings between external messaging identities and EXPERT profiles. Service-role only; no bot secrets.';
