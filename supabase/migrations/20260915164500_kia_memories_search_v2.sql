-- KIA M5.2: scoped semantic retrieval for Memory v2.
-- Fail closed: non-knowledge scopes require their exact anchor to be supplied.

create or replace function public.kia_memories_search_v2(
  query_embedding          extensions.vector(1536),
  scope_filter             text[],
  tenant_id_filter         uuid default null,
  client_id_filter         uuid default null,
  lead_id_filter           uuid default null,
  phone_filter             text default null,
  company_id_filter        uuid default null,
  case_id_filter           uuid default null,
  professional_id_filter   uuid default null,
  session_id_filter        uuid default null,
  similarity_threshold     float default 0.72,
  match_count              int default 8
)
returns table (
  id                 uuid,
  content            text,
  memory_type        text,
  memory_scope       text,
  source_type        text,
  source_ref         text,
  source_timestamp   timestamptz,
  confidence         numeric,
  retention_policy   text,
  permissions        jsonb,
  provenance         jsonb,
  version            integer,
  supersedes_id      uuid,
  created_at         timestamptz,
  updated_at         timestamptz,
  similarity         float
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    m.id,
    m.content,
    m.memory_type,
    m.memory_scope,
    m.source_type,
    m.source_ref,
    m.source_timestamp,
    m.confidence,
    m.retention_policy,
    m.permissions,
    m.provenance,
    m.version,
    m.supersedes_id,
    m.created_at,
    m.updated_at,
    1 - (m.embedding <=> query_embedding) as similarity
  from public.kia_memories m
  where
    m.embedding is not null
    and m.memory_scope = any(scope_filter)
    and (m.expires_at is null or m.expires_at > now())
    and (
      (m.memory_scope = 'working'
        and session_id_filter is not null
        and m.session_id = session_id_filter)
      or
      (m.memory_scope = 'user'
        and (
          (client_id_filter is not null and m.client_id = client_id_filter)
          or (lead_id_filter is not null and m.lead_id = lead_id_filter)
          or (phone_filter is not null and m.phone = phone_filter)
        ))
      or
      (m.memory_scope = 'company'
        and company_id_filter is not null
        and m.company_id = company_id_filter)
      or
      (m.memory_scope = 'case'
        and case_id_filter is not null
        and m.case_id = case_id_filter)
      or
      (m.memory_scope = 'professional'
        and professional_id_filter is not null
        and m.professional_id = professional_id_filter)
      or
      (m.memory_scope = 'knowledge'
        and (m.tenant_id is null or (tenant_id_filter is not null and m.tenant_id = tenant_id_filter)))
    )
    and (
      m.memory_scope = 'knowledge'
      or tenant_id_filter is null
      or m.tenant_id is null
      or m.tenant_id = tenant_id_filter
    )
    and 1 - (m.embedding <=> query_embedding) >= similarity_threshold
  order by m.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 50);
$$;

revoke all on function public.kia_memories_search_v2(
  extensions.vector,
  text[],
  uuid,
  uuid,
  uuid,
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  double precision,
  integer
) from public, anon, authenticated;

grant execute on function public.kia_memories_search_v2(
  extensions.vector,
  text[],
  uuid,
  uuid,
  uuid,
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  double precision,
  integer
) to service_role;

comment on function public.kia_memories_search_v2 is
  'Scoped, expiry-aware semantic retrieval for KIA Memory v2. Non-knowledge scopes require exact anchors.';
