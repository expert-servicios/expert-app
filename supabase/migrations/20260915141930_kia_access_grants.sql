-- KIA M4.5: authoritative operational/manual access grants.
-- Commercial capability grants continue to live in subscription_entitlements.
-- This table stores only explicit elevated KIA scopes and never stores secrets.

create table if not exists public.kia_access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  grant_kind text not null default 'scope' check (grant_kind = 'scope'),
  grant_value text not null check (grant_value in ('kia:operator', 'kia:admin')),
  source text not null check (source in ('staff_assignment', 'manual_approval')),
  active boolean not null default true,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  granted_by uuid references public.profiles(id) on delete set null,
  grant_reason text,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  revocation_reason text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'::text),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until is null or valid_until > valid_from),
  check ((revoked_at is null and revoked_by is null) or revoked_at is not null)
);

comment on table public.kia_access_grants is
  'Authoritative operational/manual grants for elevated KIA scopes. Server-side only; no secrets. Commercial kia.operator capability remains in subscription_entitlements.';

create index if not exists kia_access_grants_user_active_idx
  on public.kia_access_grants (user_id, active, revoked_at);

create index if not exists kia_access_grants_tenant_company_idx
  on public.kia_access_grants (tenant_id, company_id);

create index if not exists kia_access_grants_value_idx
  on public.kia_access_grants (grant_value);

alter table public.kia_access_grants enable row level security;

-- Fail closed for browser roles. The canonical KIA resolver reads through the
-- server-side Supabase admin client only.
revoke all on table public.kia_access_grants from anon, authenticated;
