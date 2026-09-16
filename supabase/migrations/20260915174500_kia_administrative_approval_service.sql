-- KIA KADM4: expiring approvals bound to exact action snapshots and action versions.
-- Raw approval tokens remain application-side; only SHA-256 hashes are stored.

create or replace function public.kia_request_administrative_approval(
  p_action_id uuid,
  p_approval_type text,
  p_requested_from uuid,
  p_token_hash text,
  p_expires_at timestamptz,
  p_metadata jsonb default '{}'::jsonb
)
returns public.administrative_action_approvals
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_action public.administrative_actions;
  v_approval public.administrative_action_approvals;
begin
  select * into v_action
  from public.administrative_actions
  where id = p_action_id
  for update;

  if not found then
    raise exception 'KIA_ACTION_NOT_FOUND';
  end if;

  if p_approval_type not in ('review','final_approval','user_auth_resume','manual_takeover') then
    raise exception 'KIA_APPROVAL_TYPE_INVALID';
  end if;

  if p_expires_at <= now() then
    raise exception 'KIA_APPROVAL_EXPIRY_INVALID';
  end if;

  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'KIA_APPROVAL_TOKEN_HASH_INVALID';
  end if;

  if p_approval_type = 'user_auth_resume' and v_action.state <> 'awaiting_user_auth' then
    raise exception 'KIA_APPROVAL_STATE_MISMATCH';
  end if;

  if p_approval_type = 'final_approval' and v_action.state <> 'awaiting_final_approval' then
    raise exception 'KIA_APPROVAL_STATE_MISMATCH';
  end if;

  insert into public.administrative_action_approvals (
    action_id,
    tenant_id,
    approval_type,
    decision,
    requested_from,
    action_snapshot_hash,
    token_hash,
    expires_at,
    metadata
  ) values (
    v_action.id,
    v_action.tenant_id,
    p_approval_type,
    'pending',
    p_requested_from,
    v_action.action_snapshot_hash,
    p_token_hash,
    p_expires_at,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'action_row_version', v_action.row_version,
      'action_state', v_action.state
    )
  )
  returning * into v_approval;

  insert into public.administrative_action_events (
    action_id,
    tenant_id,
    event_type,
    previous_state,
    new_state,
    actor_type,
    actor_id,
    payload
  ) values (
    v_action.id,
    v_action.tenant_id,
    'approval_requested',
    v_action.state,
    v_action.state,
    'system',
    null,
    jsonb_build_object(
      'approval_id', v_approval.id,
      'approval_type', v_approval.approval_type,
      'expires_at', v_approval.expires_at,
      'row_version', v_action.row_version
    )
  );

  return v_approval;
end;
$$;

revoke all on function public.kia_request_administrative_approval(uuid,text,uuid,text,timestamptz,jsonb) from public, anon, authenticated;
grant execute on function public.kia_request_administrative_approval(uuid,text,uuid,text,timestamptz,jsonb) to service_role;

create or replace function public.kia_consume_administrative_approval(
  p_action_id uuid,
  p_approval_type text,
  p_token_hash text,
  p_decided_by uuid,
  p_actor_type text default 'user',
  p_actor_id text default null,
  p_correlation_id text default null
)
returns public.administrative_action_approvals
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_action public.administrative_actions;
  v_approval public.administrative_action_approvals;
begin
  select * into v_action
  from public.administrative_actions
  where id = p_action_id
  for update;

  if not found then
    raise exception 'KIA_ACTION_NOT_FOUND';
  end if;

  if p_decided_by is null then
    raise exception 'KIA_APPROVER_REQUIRED';
  end if;

  select * into v_approval
  from public.administrative_action_approvals
  where action_id = p_action_id
    and approval_type = p_approval_type
    and token_hash = p_token_hash
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'KIA_APPROVAL_NOT_FOUND';
  end if;

  if v_approval.decision <> 'pending' or v_approval.consumed_at is not null then
    raise exception 'KIA_APPROVAL_ALREADY_USED';
  end if;

  if v_approval.expires_at <= now() then
    raise exception 'KIA_APPROVAL_EXPIRED';
  end if;

  if v_approval.requested_from is not null and v_approval.requested_from <> p_decided_by then
    raise exception 'KIA_APPROVAL_WRONG_APPROVER';
  end if;

  if v_approval.action_snapshot_hash <> v_action.action_snapshot_hash then
    raise exception 'KIA_APPROVAL_SNAPSHOT_MISMATCH';
  end if;

  if (v_approval.metadata ->> 'action_row_version') is distinct from v_action.row_version::text
     or (v_approval.metadata ->> 'action_state') is distinct from v_action.state then
    raise exception 'KIA_APPROVAL_ACTION_VERSION_MISMATCH';
  end if;

  if p_approval_type = 'user_auth_resume' and v_action.state <> 'awaiting_user_auth' then
    raise exception 'KIA_APPROVAL_STATE_MISMATCH';
  end if;

  if p_approval_type = 'final_approval' and v_action.state <> 'awaiting_final_approval' then
    raise exception 'KIA_APPROVAL_STATE_MISMATCH';
  end if;

  update public.administrative_action_approvals
  set decision = 'approved',
      decided_by = p_decided_by,
      decided_at = now(),
      consumed_at = now()
  where id = v_approval.id
  returning * into v_approval;

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
    'approval_consumed',
    v_action.state,
    v_action.state,
    p_actor_type,
    p_actor_id,
    p_correlation_id,
    jsonb_build_object(
      'approval_id', v_approval.id,
      'approval_type', v_approval.approval_type,
      'action_snapshot_hash', v_approval.action_snapshot_hash,
      'row_version', v_action.row_version
    )
  );

  return v_approval;
end;
$$;

revoke all on function public.kia_consume_administrative_approval(uuid,text,text,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.kia_consume_administrative_approval(uuid,text,text,uuid,text,text,text) to service_role;

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
  v_required_approval_type text;
  v_has_approval boolean;
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

  if p_to_state = 'running' and v_current.state in ('awaiting_user_auth','awaiting_final_approval') then
    v_required_approval_type := case
      when v_current.state = 'awaiting_user_auth' then 'user_auth_resume'
      else 'final_approval'
    end;

    select exists (
      select 1
      from public.administrative_action_approvals a
      where a.action_id = v_current.id
        and a.tenant_id = v_current.tenant_id
        and a.approval_type = v_required_approval_type
        and a.decision = 'approved'
        and a.consumed_at is not null
        and a.expires_at > a.consumed_at
        and a.action_snapshot_hash = v_current.action_snapshot_hash
        and (a.metadata ->> 'action_row_version') = v_current.row_version::text
        and (a.metadata ->> 'action_state') = v_current.state
    ) into v_has_approval;

    if not v_has_approval then
      raise exception 'KIA_ACTION_APPROVAL_REQUIRED';
    end if;
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
