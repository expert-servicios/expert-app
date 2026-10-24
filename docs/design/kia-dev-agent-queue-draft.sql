-- DESIGN DRAFT ONLY. NOT A MIGRATION; do not execute on production.
-- Version: 2026-10-12 / EXPERT KIA development-worker queue.
-- This file deliberately lives in docs/design, NOT supabase/migrations.
-- A separately reviewed migration and disposable-DB/RLS suite are prerequisites.

begin;

create table public.kia_dev_agent_requests (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  tenant_id uuid,
  task_id text not null check (task_id ~ '^[A-Z0-9-]{5,90}$'),
  manifest_version integer not null check (manifest_version >= 1),
  manifest_sha text not null check (manifest_sha ~ '^[a-f0-9]{64}$'),
  head_sha text not null check (head_sha ~ '^[a-f0-9]{40}$'),
  checkpoint text not null check (length(checkpoint) between 8 and 180),
  request_digest text not null check (request_digest ~ '^[a-f0-9]{64}$'),
  -- Server-computed hash. Not a client-controlled replay or auth token.
  idempotency_key text not null check (idempotency_key ~ '^[a-f0-9]{64}$'),
  allowed_paths jsonb not null check (
    jsonb_typeof(allowed_paths) = 'array'
    and jsonb_array_length(allowed_paths) between 1 and 3
  ),
  state text not null default 'draft' check (
    state in ('draft','awaiting_review','approved','dispatching','running',
              'patch_pending_review','rejected','cancelled','expired','failed','completed')
  ),
  version integer not null default 0 check (version >= 0),
  expires_at timestamptz not null,
  reviewer_id uuid references public.profiles(id) on delete restrict,
  approved_digest text check (approved_digest ~ '^[a-f0-9]{64}$'),
  reviewed_at timestamptz,
  approval_expires_at timestamptz,
  runner_run_id bigint unique check (runner_run_id > 0),
  runner_attempt integer check (runner_attempt >= 1),
  patch_artifact_digest text check (patch_artifact_digest ~ '^[a-f0-9]{64}$'),
  max_changed_files integer not null check (max_changed_files between 1 and 3),
  max_patch_bytes integer not null check (max_patch_bytes between 1 and 80000),
  max_runtime_seconds integer not null check (max_runtime_seconds between 1 and 900),
  -- Operational budget intent, not a hard OpenAI API spending limit.
  max_provider_spend_usd numeric(10,2) check (max_provider_spend_usd > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint dev_req_approval_consistency check (
    (reviewer_id is null and approved_digest is null and reviewed_at is null and approval_expires_at is null)
    or (reviewer_id is not null and approved_digest is not null and reviewed_at is not null and approval_expires_at is not null)
  ),
  constraint dev_req_independent_reviewer check (reviewer_id is null or reviewer_id <> created_by),
  constraint dev_req_approval_matches_digest check (approved_digest is null or approved_digest = request_digest),
  constraint dev_req_expiry check (expires_at > created_at),
  constraint dev_req_approval_expiry check (
    approval_expires_at is null or (approval_expires_at > reviewed_at and approval_expires_at <= expires_at)
  ),
  constraint dev_req_approved_state_guard check (
    state not in ('approved','dispatching','running','patch_pending_review','completed')
    or reviewer_id is not null
  ),
  constraint dev_req_provider_attempt_pair check (
    (runner_run_id is null and runner_attempt is null)
    or (runner_run_id is not null and runner_attempt is not null)
  )
);

-- Atomic draft idempotency: same actor and key must resolve to one request,
-- including retries after terminal status (never silently launch another job).
create unique index kia_dev_req_actor_idempotency_key
  on public.kia_dev_agent_requests (created_by, idempotency_key);

-- Additional cross-click duplicate guard for unfinished logical work.
create unique index kia_dev_req_active_task_unique
  on public.kia_dev_agent_requests (created_by, task_id, manifest_sha, head_sha, checkpoint)
  where state in ('draft','awaiting_review','approved','dispatching','running','patch_pending_review');

create index kia_dev_req_owner_recent
  on public.kia_dev_agent_requests (created_by, created_at desc);
create index kia_dev_req_active_review
  on public.kia_dev_agent_requests (state, expires_at)
  where state in ('awaiting_review','approved','dispatching','running','patch_pending_review');

create table public.kia_dev_agent_attempts (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.kia_dev_agent_requests(id) on delete restrict,
  attempt_number integer not null check (attempt_number >= 1),
  request_digest text not null check (request_digest ~ '^[a-f0-9]{64}$'),
  head_sha text not null check (head_sha ~ '^[a-f0-9]{40}$'),
  workflow_ref text not null check (length(workflow_ref) between 8 and 240),
  github_run_id bigint check (github_run_id > 0),
  github_run_attempt integer check (github_run_attempt >= 1),
  status text not null check (status in ('pending','running','passed','failed','cancelled','expired')),
  error_code text check (error_code ~ '^[a-z0-9_]{1,80}$'),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  constraint dev_attempt_number_unique unique (request_id, attempt_number),
  constraint dev_attempt_provider_pair check (
    (github_run_id is null and github_run_attempt is null)
    or (github_run_id is not null and github_run_attempt is not null)
  ),
  constraint dev_attempt_times check (completed_at is null or (started_at is not null and completed_at >= started_at)),
  constraint dev_attempt_terminal_completed check (
    status not in ('passed','failed','cancelled','expired') or completed_at is not null
  )
);
create unique index kia_dev_attempt_github_run_unique
  on public.kia_dev_agent_attempts(github_run_id,github_run_attempt)
  where github_run_id is not null;

create table public.kia_dev_agent_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.kia_dev_agent_requests(id) on delete restrict,
  event_sequence integer not null check (event_sequence >= 1),
  event_kind text not null check (
    event_kind in ('created','submitted','approved','rejected','cancelled','expired',
                   'claimed','started','patch_ready','completed','failed','security_denied')
  ),
  actor_id uuid references public.profiles(id) on delete restrict,
  source text not null check (source in ('authenticated_admin','independent_reviewer','verified_broker','verified_runner')),
  request_digest text not null check (request_digest ~ '^[a-f0-9]{64}$'),
  from_state text,
  to_state text,
  metadata jsonb not null default '{}'::jsonb check (
    jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 8192
  ),
  occurred_at timestamptz not null default clock_timestamp(),
  constraint dev_event_request_sequence_unique unique (request_id, event_sequence)
);
create index kia_dev_event_request_history
  on public.kia_dev_agent_events(request_id, occurred_at, event_sequence);

-- Defense in depth: audit events are append-only even for direct table writers.
-- A migration owner/superuser can still manage the schema; this is not a ledger-signature guarantee.
create function public.kia_dev_agent_deny_event_modification()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'kia_dev_agent_events_append_only' using errcode = '42501';
end;
$$;
create trigger kia_dev_agent_events_no_update_delete
  before update or delete on public.kia_dev_agent_events
  for each row execute function public.kia_dev_agent_deny_event_modification();

alter table public.kia_dev_agent_requests enable row level security;
alter table public.kia_dev_agent_attempts enable row level security;
alter table public.kia_dev_agent_events enable row level security;

-- No exposed anon/authenticated table policies. The API cannot use client JWTs
-- to edit queue state. Future SECURITY DEFINER RPCs need a distinct review.
revoke all on public.kia_dev_agent_requests,
  public.kia_dev_agent_attempts,
  public.kia_dev_agent_events
  from public, anon, authenticated, service_role;

-- Service-role may read only. Future mutations must be separately audited,
-- transactional, role-restricted RPCs with independent approval and CAS.
grant select on public.kia_dev_agent_requests,
  public.kia_dev_agent_attempts,
  public.kia_dev_agent_events to service_role;

revoke all on function public.kia_dev_agent_deny_event_modification() from public, anon, authenticated, service_role;

commit;
