-- Atomic, fenced and recoverable web KIA turn processing.
-- Runs only server-side with service_role. Feature flag remains off.
alter table public.kia_public_web_messages
  add column processing_claim uuid,
  add column claim_expires_at timestamptz;

create index kia_web_claim_expiry_idx
  on public.kia_public_web_messages(claim_expires_at)
  where role = 'user' and delivery_state = 'received';

create or replace function public.kia_web_claim_turn(
  p_session_id uuid, p_message_id uuid, p_body text, p_claim uuid
) returns jsonb
language plpgsql security invoker
set search_path = pg_catalog, public
as $$
declare
  v_id uuid;
  v_body text;
  v_state text;
  v_expiry timestamptz;
  v_reply text;
begin
  if p_claim is null or p_body is null or length(btrim(p_body)) not between 1 and 4000 then
    return jsonb_build_object('outcome','invalid');
  end if;
  perform 1 from public.kia_public_web_sessions
    where id = p_session_id and state='active' and expires_at > now();
  if not found then return jsonb_build_object('outcome','invalid_session'); end if;

  insert into public.kia_public_web_messages
    (session_id,client_message_id,role,body,delivery_state,processing_claim,claim_expires_at)
  values (p_session_id,p_message_id,'user',btrim(p_body),'received',p_claim,now()+interval '90 seconds')
  on conflict on constraint kia_public_web_messages_turn_dedupe do nothing
  returning id into v_id;
  if v_id is not null then return jsonb_build_object('outcome','acquired'); end if;

  select id,body,delivery_state,claim_expires_at
    into v_id,v_body,v_state,v_expiry
    from public.kia_public_web_messages
    where session_id=p_session_id and client_message_id=p_message_id and role='user'
    for update;
  if v_id is null then return jsonb_build_object('outcome','busy'); end if;
  if v_body <> btrim(p_body) then return jsonb_build_object('outcome','mismatch'); end if;

  select body into v_reply from public.kia_public_web_messages
    where session_id=p_session_id and client_message_id=p_message_id and role='assistant';
  if v_reply is not null then return jsonb_build_object('outcome','replay','reply',v_reply); end if;

  if v_state='failed' or (v_state='received' and (v_expiry is null or v_expiry < now())) then
    update public.kia_public_web_messages
      set processing_claim=p_claim, claim_expires_at=now()+interval '90 seconds',
          delivery_state='received'
      where id=v_id;
    return jsonb_build_object('outcome','acquired');
  end if;
  return jsonb_build_object('outcome','busy');
end;
$$;

create or replace function public.kia_web_renew_turn(
  p_session_id uuid,p_message_id uuid,p_claim uuid
) returns boolean
language plpgsql security invoker
set search_path = pg_catalog, public
as $$
begin
  update public.kia_public_web_messages set claim_expires_at=now()+interval '90 seconds'
  where session_id=p_session_id and client_message_id=p_message_id
    and role='user' and processing_claim=p_claim
    and delivery_state='received' and claim_expires_at > now();
  return found;
end;
$$;

create or replace function public.kia_web_complete_turn(
  p_session_id uuid,p_message_id uuid,p_claim uuid,p_reply text
) returns jsonb
language plpgsql security invoker
set search_path = pg_catalog, public
as $$
declare
  v_user uuid;
  v_reply text;
begin
  if p_reply is null or length(btrim(p_reply)) not between 1 and 4000 then
    return jsonb_build_object('outcome','invalid_reply');
  end if;
  perform 1 from public.kia_public_web_sessions
    where id=p_session_id and state='active' and expires_at>now() for key share;
  if not found then return jsonb_build_object('outcome','invalid_session'); end if;

  select id into v_user from public.kia_public_web_messages
    where session_id=p_session_id and client_message_id=p_message_id and role='user'
      and processing_claim=p_claim and delivery_state='received'
      and claim_expires_at > now() for update;
  if v_user is null then return jsonb_build_object('outcome','lost_claim'); end if;

  insert into public.kia_public_web_messages
    (session_id,client_message_id,role,body,delivery_state)
  values(p_session_id,p_message_id,'assistant',btrim(p_reply),'sent')
    on conflict on constraint kia_public_web_messages_turn_dedupe do nothing;
  select body into v_reply from public.kia_public_web_messages
    where session_id=p_session_id and client_message_id=p_message_id and role='assistant';

  update public.kia_public_web_messages set delivery_state='sent',
    claim_expires_at=null,processing_claim=null where id=v_user;
  return jsonb_build_object('outcome','complete','reply',v_reply);
end;
$$;

create or replace function public.kia_web_fail_turn(
  p_session_id uuid,p_message_id uuid,p_claim uuid
) returns boolean
language plpgsql security invoker
set search_path = pg_catalog, public
as $$
begin
  update public.kia_public_web_messages
    set delivery_state='failed',claim_expires_at=null,processing_claim=null
  where session_id=p_session_id and client_message_id=p_message_id
    and role='user' and processing_claim=p_claim and delivery_state='received';
  return found;
end;
$$;

-- Functions in exposed public schema are NOT browser callable.
revoke all on function public.kia_web_claim_turn(uuid,uuid,text,uuid) from public,anon,authenticated;
revoke all on function public.kia_web_renew_turn(uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function public.kia_web_complete_turn(uuid,uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.kia_web_fail_turn(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.kia_web_claim_turn(uuid,uuid,text,uuid) to service_role;
grant execute on function public.kia_web_renew_turn(uuid,uuid,uuid) to service_role;
grant execute on function public.kia_web_complete_turn(uuid,uuid,uuid,text) to service_role;
grant execute on function public.kia_web_fail_turn(uuid,uuid,uuid) to service_role;
