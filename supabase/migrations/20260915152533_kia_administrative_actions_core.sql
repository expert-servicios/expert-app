-- KIA KADM2: auditable persistence core for administrative actions.
-- Additive only. No connector execution, browser automation, credentials, or certificates.

create table if not exists public.administrative_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  company_id uuid references public.companies(id),
  case_id uuid references public.cases(id),
  requested_by uuid not null references public.profiles(id),
  assigned_professional_id uuid references public.profiles(id) on delete set null,
  capability text not null,
  organism text not null,
  action_type text not null,
  state text not null default 'draft',
  risk text not null,
  effect text not null,
  requires_user_auth boolean not null default false,
  requires_final_approval boolean not null default false,
  action_snapshot jsonb not null default '{}'::jsonb,
  action_snapshot_hash text not null,
  idempotency_key text,
  row_version integer not null default 1,
  claimed_by text,
  claimed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  failure_code text,
  failure_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint administrative_actions_state_check check (
    state in (
      'draft','prepared','needs_review','approved','queued','claimed','running',
      'awaiting_user_auth','awaiting_final_approval','verifying','completed','blocked',
      'cancelled','failed_safe','expired','manual_takeover'
    )
  ),
  constraint administrative_actions_risk_check check (risk in ('R0','R1','R2','R3','R4','R5')),
  constraint administrative_actions_effect_check check (effect in ('read','draft','write','external_action')),
  constraint administrative_actions_snapshot_object_check check (jsonb_typeof(action_snapshot) = 'object'),
  constraint administrative_actions_snapshot_hash_check check (length(trim(action_snapshot_hash)) >= 32),
  constraint administrative_actions_row_version_check check (row_version >= 1),
  constraint administrative_actions_r0_auth_check check (not (risk = 'R0' and requires_user_auth)),
  constraint administrative_actions_final_approval_check check (
    not requires_final_approval or risk in ('R4','R5')
  ),
  constraint administrative_actions_completed_at_check check (
    completed_at is null or completed_at >= created_at
  )
);

create unique index if not exists administrative_actions_tenant_idempotency_uq
  on public.administrative_actions (tenant_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists administrative_actions_tenant_state_idx
  on public.administrative_actions (tenant_id, state, created_at desc);

create index if not exists administrative_actions_company_idx
  on public.administrative_actions (company_id, created_at desc)
  where company_id is not null;

create index if not exists administrative_actions_case_idx
  on public.administrative_actions (case_id, created_at desc)
  where case_id is not null;

create index if not exists administrative_actions_requested_by_idx
  on public.administrative_actions (requested_by, created_at desc);

create table if not exists public.administrative_action_events (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.administrative_actions(id),
  tenant_id uuid not null references public.tenants(id),
  event_type text not null,
  previous_state text,
  new_state text,
  actor_type text not null,
  actor_id text,
  correlation_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint administrative_action_events_event_type_check check (length(trim(event_type)) > 0),
  constraint administrative_action_events_actor_type_check check (
    actor_type in ('user','professional','kia','system','connector')
  ),
  constraint administrative_action_events_previous_state_check check (
    previous_state is null or previous_state in (
      'draft','prepared','needs_review','approved','queued','claimed','running',
      'awaiting_user_auth','awaiting_final_approval','verifying','completed','blocked',
      'cancelled','failed_safe','expired','manual_takeover'
    )
  ),
  constraint administrative_action_events_new_state_check check (
    new_state is null or new_state in (
      'draft','prepared','needs_review','approved','queued','claimed','running',
      'awaiting_user_auth','awaiting_final_approval','verifying','completed','blocked',
      'cancelled','failed_safe','expired','manual_takeover'
    )
  ),
  constraint administrative_action_events_payload_object_check check (jsonb_typeof(payload) = 'object')
);

create index if not exists administrative_action_events_action_idx
  on public.administrative_action_events (action_id, created_at asc);

create index if not exists administrative_action_events_tenant_idx
  on public.administrative_action_events (tenant_id, created_at desc);

create index if not exists administrative_action_events_correlation_idx
  on public.administrative_action_events (correlation_id)
  where correlation_id is not null;

create table if not exists public.administrative_action_approvals (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.administrative_actions(id),
  tenant_id uuid not null references public.tenants(id),
  approval_type text not null,
  decision text not null default 'pending',
  requested_from uuid references public.profiles(id),
  decided_by uuid references public.profiles(id),
  action_snapshot_hash text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  decided_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint administrative_action_approvals_type_check check (
    approval_type in ('review','final_approval','user_auth_resume','manual_takeover')
  ),
  constraint administrative_action_approvals_decision_check check (
    decision in ('pending','approved','rejected','revoked','expired')
  ),
  constraint administrative_action_approvals_snapshot_hash_check check (
    length(trim(action_snapshot_hash)) >= 32
  ),
  constraint administrative_action_approvals_token_hash_check check (
    length(trim(token_hash)) >= 32
  ),
  constraint administrative_action_approvals_expiry_check check (expires_at > created_at),
  constraint administrative_action_approvals_decision_time_check check (
    decided_at is null or decided_at >= created_at
  ),
  constraint administrative_action_approvals_consumed_time_check check (
    consumed_at is null or consumed_at >= created_at
  ),
  constraint administrative_action_approvals_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create unique index if not exists administrative_action_approvals_token_hash_uq
  on public.administrative_action_approvals (token_hash);

create index if not exists administrative_action_approvals_action_idx
  on public.administrative_action_approvals (action_id, created_at desc);

create index if not exists administrative_action_approvals_pending_idx
  on public.administrative_action_approvals (action_id, expires_at)
  where decision = 'pending';

alter table public.administrative_actions enable row level security;
alter table public.administrative_action_events enable row level security;
alter table public.administrative_action_approvals enable row level security;

revoke all on table public.administrative_actions from public, anon, authenticated;
revoke all on table public.administrative_action_events from public, anon, authenticated;
revoke all on table public.administrative_action_approvals from public, anon, authenticated;

grant select, insert, update on table public.administrative_actions to service_role;
grant select, insert on table public.administrative_action_events to service_role;
grant select, insert, update on table public.administrative_action_approvals to service_role;

create policy "administrative_actions_deny_browser"
on public.administrative_actions
for all
to anon, authenticated
using (false)
with check (false);

create policy "administrative_action_events_deny_browser"
on public.administrative_action_events
for all
to anon, authenticated
using (false)
with check (false);

create policy "administrative_action_approvals_deny_browser"
on public.administrative_action_approvals
for all
to anon, authenticated
using (false)
with check (false);

comment on table public.administrative_actions is
  'KIA administrative action command records. Execution remains disabled until later KADM phases.';
comment on table public.administrative_action_events is
  'Append-only audit trail for KIA administrative action lifecycle events.';
comment on table public.administrative_action_approvals is
  'Expiring approvals bound to an exact administrative action snapshot hash. Stores token hashes only.';
