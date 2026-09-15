-- KIA M5.1: evolve the existing kia_memories store into a scoped, auditable Memory v2 model.
-- Additive migration only. Existing legacy fields remain compatible with the current runtime.

alter table public.kia_memories
  add column if not exists tenant_id uuid references public.tenants(id) on delete cascade,
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists case_id uuid references public.cases(id) on delete cascade,
  add column if not exists professional_id uuid references public.profiles(id) on delete set null,
  add column if not exists session_id uuid references public.kia_sessions(id) on delete set null,
  add column if not exists memory_scope text not null default 'user',
  add column if not exists source_type text not null default 'conversation',
  add column if not exists source_ref text,
  add column if not exists source_timestamp timestamptz,
  add column if not exists confidence numeric(4,3) not null default 1.000,
  add column if not exists retention_policy text not null default 'standard',
  add column if not exists expires_at timestamptz,
  add column if not exists permissions jsonb not null default '{"read":["kia"],"write":["kia"]}'::jsonb,
  add column if not exists provenance jsonb not null default '{}'::jsonb,
  add column if not exists version integer not null default 1,
  add column if not exists supersedes_id uuid references public.kia_memories(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.kia_memories
  drop constraint if exists kia_memories_memory_scope_check,
  add constraint kia_memories_memory_scope_check
    check (memory_scope in ('working', 'user', 'company', 'case', 'professional', 'knowledge')),
  drop constraint if exists kia_memories_source_type_check,
  add constraint kia_memories_source_type_check
    check (source_type in ('conversation', 'document', 'integration', 'professional', 'system', 'derived')),
  drop constraint if exists kia_memories_confidence_check,
  add constraint kia_memories_confidence_check
    check (confidence >= 0 and confidence <= 1),
  drop constraint if exists kia_memories_retention_policy_check,
  add constraint kia_memories_retention_policy_check
    check (retention_policy in ('session', 'short', 'standard', 'long', 'legal', 'permanent')),
  drop constraint if exists kia_memories_version_check,
  add constraint kia_memories_version_check
    check (version >= 1),
  drop constraint if exists kia_memories_permissions_object_check,
  add constraint kia_memories_permissions_object_check
    check (jsonb_typeof(permissions) = 'object'::text),
  drop constraint if exists kia_memories_provenance_object_check,
  add constraint kia_memories_provenance_object_check
    check (jsonb_typeof(provenance) = 'object'::text),
  drop constraint if exists kia_memories_scope_anchor_check,
  add constraint kia_memories_scope_anchor_check
    check (
      (memory_scope = 'working' and session_id is not null)
      or (memory_scope = 'user' and (client_id is not null or lead_id is not null or phone is not null))
      or (memory_scope = 'company' and company_id is not null)
      or (memory_scope = 'case' and case_id is not null)
      or (memory_scope = 'professional' and professional_id is not null)
      or (memory_scope = 'knowledge')
    ),
  drop constraint if exists kia_memories_expiry_check,
  add constraint kia_memories_expiry_check
    check (expires_at is null or expires_at > created_at);

create index if not exists kia_memories_tenant_scope_idx
  on public.kia_memories (tenant_id, memory_scope, created_at desc);

create index if not exists kia_memories_company_scope_idx
  on public.kia_memories (company_id, memory_scope, created_at desc)
  where company_id is not null;

create index if not exists kia_memories_case_scope_idx
  on public.kia_memories (case_id, created_at desc)
  where case_id is not null;

create index if not exists kia_memories_professional_scope_idx
  on public.kia_memories (professional_id, created_at desc)
  where professional_id is not null;

create index if not exists kia_memories_session_scope_idx
  on public.kia_memories (session_id, created_at desc)
  where session_id is not null;

create index if not exists kia_memories_supersedes_idx
  on public.kia_memories (supersedes_id)
  where supersedes_id is not null;

create index if not exists kia_memories_expires_at_idx
  on public.kia_memories (expires_at)
  where expires_at is not null;

comment on column public.kia_memories.memory_scope is
  'Memory v2 scope: working, user, company, case, professional, or knowledge.';
comment on column public.kia_memories.provenance is
  'Structured origin metadata. Must not contain credentials or secrets.';
comment on column public.kia_memories.permissions is
  'Memory-level read/write policy metadata evaluated server-side by KIA.';
comment on column public.kia_memories.version is
  'Monotonic logical version for a memory fact or summary chain.';
comment on column public.kia_memories.supersedes_id is
  'Previous memory entry superseded by this version; history remains immutable.';
