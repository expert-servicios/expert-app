-- KIA KADM3: transactional administrative action creation and transitions.
-- No connector execution, browser automation, credentials, certificates, or R2+ activation.

create or replace function public.kia_administrative_transition_allowed(
  p_from text,
  p_to text
)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select case p_from
    when 'draft' then p_to = any(array['prepared','cancelled','blocked'])
    when 'prepared' then p_to = any(array['needs_review','approved','cancelled','blocked'])
    when 'needs_review' then p_to = any(array['prepared','approved','cancelled','blocked'])
    when 'approved' then p_to = any(array['queued','expired','cancelled','blocked'])
    when 'queued' then p_to = any(array['claimed','expired','cancelled','blocked'])
    when 'claimed' then p_to = any(array['running','manual_takeover','failed_safe','cancelled','blocked'])
    when 'running' then p_to = any(array['awaiting_user_auth','awaiting_final_approval','verifying','manual_takeover','failed_safe','blocked','cancelled'])
    when 'awaiting_user_auth' then p_to = any(array['running','manual_takeover','failed_safe','expired','cancelled','blocked'])
    when 'awaiting_final_approval' then p_to = any(array['running','manual_takeover','failed_safe','expired','cancelled','blocked'])
    when 'verifying' then p_to = any(array['completed','manual_takeover','failed_safe','blocked'])
    when 'blocked' then p_to = any(array['prepared','needs_review','approved','queued','manual_takeover','cancelled'])
    when 'manual_takeover' then p_to = any(array['running','verifying','completed','cancelled','failed_safe'])
    else false
  end;
$$;

revoke all on function public.kia_administrative_transition_allowed(text, text) from public, anon, authenticated;
grant execute on function public.kia_administrative_transition_allowed(text, text) to service_role;

create or replace function public.kia_create_administrative_action(
  p_tenant_id uuid,
  p_company_id uuid,
  p_case_id uuid,
  p_requested_by uuid,
  p_assigned_professional_id uuid,
  p_capability text,
  p_organism text,
  p_action_type text,
  p_risk text,
  p_effect text,
  p_requires_user_auth boolean,
  p_requires_final_approval boolean,
  p_action_snapshot jsonb,
  p_action_snapshot_hash text,
  p_idempotency_key text default null,
  p_actor_type text default 'kia',
  p_actor_id text default null,
  p_correlation_id text default null
)
returns public.administrative_actions
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_action public.administrative_actions;
begin
  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || ':' || p_idempotency_key, 0));

    select * into v_action
    from public.administrative_actions
    where tenant_id = p_tenant_id
      and idempotency_key = p_idempotency_key
    limit 1;

    if found then
      return v_action;
    end if;
  end if;

  insert into public.administrative_actions (
    tenant_id,
    company_id,
    case_id,
    requested_by,
    assigned_professional_id,
    capability,
    organism,
    action_type,
    state,
    risk,
    effect,
    requires_user_auth,
    requires_final_approval,
    action_snapshot,
    action_snapshot_hash,
    idempotency_key
  ) values (
    p_tenant_id,
    p_company_id,
    p_case_id,
    p_requested_by,
    p_assigned_professional_id,
    p_capability,
    p_organism,
    p_action_type,
    'draft',
    p_risk,
    p_effect,
    p_requires_user_auth,
    p_requires_final_approval,
    coalesce(p_action_snapshot, '{}'::jsonb),
    p_action_snapshot_hash,
    nullif(trim(p_idempotency_key), '')
  )
  returning * into v_action;

  insert into public.administrative_action_events (
    action_id,
    tenant_id,
    event_type,
    previous_state,
    new_state,
    actor_type,
    actor_id,
    correlation_id,
    payload
  ) values (
    v_action.id,
    v_action.tenant_id,
    'action_created',
    null,
    'draft',
    p_actor_type,
    p_actor_id,
    p_correlation_id,
    jsonb_build_object('row_version', v_action.row_version)
  );

  return v_action;
end;
$$;

revoke all on function public.kia_create_administrative_action(uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,boolean,boolean,jsonb,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.kia_create_administrative_action(uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,boolean,boolean,jsonb,text,text,text,text,text) to service_role;

create or replace function public.kia_transition_administrative_action(
  p_action_id uuid,
  p_expected_row_version integer,
  p_to_state text,
  p_actor_type text,
  p_actor_id text default null,
  p_event_type text default 'state_transition',
  p_correlation_id text default null,
  p_payload jsonb default '{}'::jsonb
)
returns public.administrative_actions
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_current public.administrative_actions;
  v_updated public.administrative_actions;
begin
  select * into v_current
  from public.administrative_actions
  where id = p_action_id
  for update;

  if not found then
    raise exception 'KIA_ACTION_NOT_FOUND';
  end if;

  if v_current.row_version <> p_expected_row_version then
    raise exception 'KIA_ACTION_VERSION_CONFLICT';
  end if;

  if not public.kia_administrative_transition_allowed(v_current.state, p_to_state) then
    raise exception 'KIA_ACTION_INVALID_TRANSITION:%->%', v_current.state, p_to_state;
  end if;

  update public.administrative_actions
  set state = p_to_state,
      row_version = row_version + 1,
      claimed_at = case when p_to_state = 'claimed' and claimed_at is null then now() else claimed_at end,
      started_at = case when p_to_state = 'running' and started_at is null then now() else started_at end,
      completed_at = case when p_to_state = 'completed' then now() else completed_at end,
      updated_at = now()
  where id = p_action_id
    and row_version = p_expected_row_version
  returning * into v_updated;

  if not found then
    raise exception 'KIA_ACTION_VERSION_CONFLICT';
  end if;

  insert into public.administrative_action_events (
    action_id,
    tenant_id,
    event_type,
    previous_state,
    new_state,
    actor_type,
    actor_id,
    correlation_id,
    payload
  ) values (
    v_updated.id,
    v_updated.tenant_id,
    coalesce(nullif(trim(p_event_type), ''), 'state_transition'),
    v_current.state,
    v_updated.state,
    p_actor_type,
    p_actor_id,
    p_correlation_id,
    coalesce(p_payload, '{}'::jsonb) || jsonb_build_object(
      'previous_row_version', v_current.row_version,
      'row_version', v_updated.row_version
    )
  );

  return v_updated;
end;
$$;

revoke all on function public.kia_transition_administrative_action(uuid,integer,text,text,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.kia_transition_administrative_action(uuid,integer,text,text,text,text,text,jsonb) to service_role;

comment on function public.kia_create_administrative_action(uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,boolean,boolean,jsonb,text,text,text,text,text) is
  'Atomically creates a KIA administrative action and its initial audit event. Idempotent per tenant/idempotency key.';
comment on function public.kia_transition_administrative_action(uuid,integer,text,text,text,text,text,jsonb) is
  'Atomically validates and applies one KADM1 state transition with optimistic concurrency and an append-only audit event.';
