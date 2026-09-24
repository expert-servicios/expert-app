-- Service-only adapter credentials and a transactional result ledger.
alter table public.email_attachment_documents alter column company_id drop not null;
create table public.kia_work_connections (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id),
  client_id uuid not null references public.profiles(id),
  tenant_id uuid,
  company_id uuid,
  created_by uuid not null references public.profiles(id),
  token_hash text not null unique,
  task_policies jsonb not null check (jsonb_typeof(task_policies) = 'object'),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index kia_work_connections_case_idx on public.kia_work_connections(case_id);
create table public.kia_work_claims (
  task_id uuid primary key references public.internal_tasks(id),
  connection_id uuid not null references public.kia_work_connections(id),
  run_id text not null,
  version integer not null default 1,
  lease_until timestamptz not null,
  case_next_action text,
  task_updated_at timestamptz not null
);
create table public.kia_work_events (
  event_id uuid primary key,
  connection_id uuid not null references public.kia_work_connections(id),
  case_id uuid not null references public.cases(id),
  task_id uuid not null references public.internal_tasks(id),
  payload_hash text not null,
  payload jsonb not null,
  witness jsonb not null default '{}',
  result jsonb not null,
  created_at timestamptz not null default now()
);
create index kia_work_events_case_idx on public.kia_work_events(case_id,created_at);
alter table public.kia_work_connections enable row level security;
alter table public.kia_work_claims enable row level security;
alter table public.kia_work_events enable row level security;
revoke all on public.kia_work_connections, public.kia_work_claims, public.kia_work_events from public, anon, authenticated;
grant select, insert, update, delete on public.kia_work_connections, public.kia_work_claims, public.kia_work_events to service_role;

-- Revalidate inside the transaction as well as at the HTTP boundary.
create function public.kia_work_lock_scope(p_connection uuid)
returns public.kia_work_connections language plpgsql security invoker set search_path = public as $$
declare c public.kia_work_connections; k public.cases; p public.profiles;
begin
  select * into c from public.kia_work_connections where id=p_connection for update;
  if not found or c.revoked_at is not null or c.expires_at <= now() then raise exception 'work_unauthorized'; end if;
  select * into k from public.cases where id=c.case_id for update;
  if not found or k.closed_at is not null or k.client_id is distinct from c.client_id
    or k.company_id is distinct from c.company_id or k.tenant_id is distinct from c.tenant_id then
    raise exception 'work_scope_changed';
  end if;
  select * into p from public.profiles where id=c.created_by for share;
  if not found or p.status = 'inactive' or not coalesce((p.role in ('owner','admin') or
    (p.role='tenant_admin' and p.tenant_id is not null and p.tenant_id=c.tenant_id)),false) then
    raise exception 'work_forbidden';
  end if;
  return c;
end $$;

create function public.kia_work_claim(p_connection uuid,p_task uuid,p_run text)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare c public.kia_work_connections; t public.internal_tasks; claim public.kia_work_claims; policy jsonb;
begin
  c := public.kia_work_lock_scope(p_connection);
  policy := c.task_policies -> p_task::text;
  if policy is null or length(p_run) not between 1 and 100 then raise exception 'work_task_not_authorized'; end if;
  select * into t from public.internal_tasks where id=p_task for update;
  if not found or t.case_id is distinct from c.case_id or t.client_id is distinct from c.client_id
    or t.status not in ('pendiente','en_progreso') then raise exception 'work_task_not_available'; end if;
  if exists (select 1 from jsonb_array_elements_text(policy->'dependencies') d
    where not exists (select 1 from public.internal_tasks dep where dep.id=d.value::uuid
      and dep.case_id=c.case_id and dep.status='completada')) then raise exception 'work_dependencies_pending'; end if;
  select * into claim from public.kia_work_claims where task_id=p_task for update;
  if found and claim.lease_until > now() then
    if claim.connection_id=p_connection and claim.run_id=p_run and claim.task_updated_at=t.updated_at then
      return to_jsonb(claim);
    end if;
    raise exception 'work_task_claimed';
  end if;
  update public.internal_tasks set status='en_progreso',updated_at=clock_timestamp() where id=p_task returning * into t;
  insert into public.kia_work_claims(task_id,connection_id,run_id,version,lease_until,task_updated_at,case_next_action)
    values(p_task,p_connection,p_run,coalesce(claim.version,0)+1,now()+interval '15 minutes',t.updated_at,
      (select next_action from public.cases where id=c.case_id))
    on conflict(task_id) do update set connection_id=excluded.connection_id,run_id=excluded.run_id,
      version=excluded.version,lease_until=excluded.lease_until,task_updated_at=excluded.task_updated_at,
      case_next_action=excluded.case_next_action
    returning * into claim;
  return to_jsonb(claim);
end $$;

create function public.kia_work_complete(p_connection uuid,p_event jsonb,p_hash text,p_witness jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare c public.kia_work_connections; t public.internal_tasks; claim public.kia_work_claims;
  prior public.kia_work_events; policy jsonb; next_tasks jsonb; outcome jsonb; verified boolean := false;
begin
  c := public.kia_work_lock_scope(p_connection);
  select * into prior from public.kia_work_events where event_id=(p_event->>'event_id')::uuid;
  if found then
    if prior.connection_id<>p_connection or prior.payload_hash<>p_hash then raise exception 'work_event_conflict'; end if;
    return prior.result;
  end if;
  policy := c.task_policies -> (p_event->>'task_id');
  if policy is null then raise exception 'work_task_not_authorized'; end if;
  select * into t from public.internal_tasks where id=(p_event->>'task_id')::uuid for update;
  select * into claim from public.kia_work_claims where task_id=t.id for update;
  if t.id is null or claim.task_id is null or claim.connection_id<>p_connection or claim.run_id<>p_event->>'run_id'
    or claim.version<>(p_event->>'claim_version')::integer or claim.lease_until<=now()
    or claim.task_updated_at is distinct from t.updated_at or t.case_id is distinct from c.case_id
    or t.client_id is distinct from c.client_id or t.status<>'en_progreso' then raise exception 'work_stale_claim'; end if;
  if p_event->>'result'='succeeded' then
    if exists (select 1 from jsonb_array_elements_text(policy->'dependencies') d
      where not exists (select 1 from public.internal_tasks dep where dep.id=d.value::uuid
        and dep.case_id=c.case_id and dep.status='completada')) then raise exception 'work_dependencies_pending'; end if;
    -- File bytes are checked by the server before this call; recheck the row version under lock.
    if policy->>'kind'='document_archived' and p_witness->>'type'='document' then
      perform 1 from public.documents where id=(p_witness->>'id')::uuid and case_id=c.case_id
        and client_id=c.client_id and checklist_item_key=policy->>'target' and state<>'rechazado'
        and replaced_by is null and updated_at=(p_witness->>'updated_at')::timestamptz for share;
      verified := found;
    elsif policy->>'kind'='email_sent' and p_witness->>'type'='email' then
      perform 1 from public.email_events where id=(p_witness->>'id')::bigint
        and metadata->>'case_id'=c.case_id::text and metadata->>'task_id'=t.id::text
        and event_type=policy->>'target' and status in ('sent','delivered')
        and resend_id=p_witness->>'provider_id' for share;
      verified := found;
    elsif policy->>'kind'='administrative_action_completed' and p_witness->>'type'='administrative_action' then
      perform 1 from public.administrative_actions where id=(p_witness->>'id')::uuid
        and id::text=policy->>'target' and case_id=c.case_id and state='completed'
        and row_version=(p_witness->>'row_version')::integer for share;
      verified := found;
    end if;
    if not verified then raise exception 'work_evidence_changed'; end if;
    update public.internal_tasks set status='completada',completed_at=now(),updated_at=clock_timestamp()
      where id=t.id;
  elsif p_event->>'result' in ('blocked','failed','cancelled') and length(trim(p_event->>'reason'))>0 then
    update public.internal_tasks set status='pendiente',updated_at=clock_timestamp() where id=t.id;
  else raise exception 'work_invalid_result'; end if;
  update public.kia_work_claims set lease_until=now() where task_id=t.id;
  select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'title',n.title) order by n.created_at,n.id),'[]'::jsonb)
    into next_tasks from public.internal_tasks n
    where n.case_id=c.case_id and n.client_id=c.client_id and n.status='pendiente'
      and c.task_policies ? n.id::text and not exists (
        select 1 from jsonb_array_elements_text(c.task_policies->n.id::text->'dependencies') d
        where not exists(select 1 from public.internal_tasks dep where dep.id=d.value::uuid
          and dep.case_id=c.case_id and dep.status='completada'));
  if p_event->>'result'='succeeded' and jsonb_array_length(next_tasks)>0 then
    update public.cases set next_action=next_tasks->0->>'title' where id=c.case_id
      and next_action is not distinct from claim.case_next_action;
  end if;
  outcome := jsonb_build_object('event_id',p_event->>'event_id','result',p_event->>'result','next_tasks',next_tasks);
  insert into public.kia_work_events(event_id,connection_id,case_id,task_id,payload_hash,payload,witness,result)
    values((p_event->>'event_id')::uuid,p_connection,c.case_id,t.id,p_hash,p_event,p_witness,outcome);
  return outcome;
end $$;
revoke all on function public.kia_work_lock_scope(uuid), public.kia_work_claim(uuid,uuid,text),
  public.kia_work_complete(uuid,jsonb,text,jsonb) from public,anon,authenticated;
grant execute on function public.kia_work_lock_scope(uuid), public.kia_work_claim(uuid,uuid,text),
  public.kia_work_complete(uuid,jsonb,text,jsonb) to service_role;

-- Personal client identities retain profile ownership without a fabricated tenant.
alter table public.kia_channel_identities alter column tenant_id drop not null;
alter table public.kia_channel_link_tokens alter column tenant_id drop not null;
create or replace function public.kia_consume_telegram_link_token(
  p_token_hash text,
  p_external_user_id text,
  p_external_chat_id text,
  p_external_username text default null
)
returns table(profile_id uuid, tenant_id uuid, identity_id uuid)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_token public.kia_channel_link_tokens%rowtype;
  v_profile record;
  v_identity public.kia_channel_identities%rowtype;
begin
  if coalesce(trim(p_token_hash), '') = ''
     or coalesce(trim(p_external_user_id), '') = ''
     or coalesce(trim(p_external_chat_id), '') = '' then
    raise exception 'KIA_TELEGRAM_LINK_INVALID_INPUT';
  end if;

  select * into v_token
  from public.kia_channel_link_tokens
  where channel = 'telegram'
    and token_hash = p_token_hash
  for update;

  if not found then
    raise exception 'KIA_TELEGRAM_LINK_INVALID';
  end if;
  if v_token.consumed_at is not null then
    raise exception 'KIA_TELEGRAM_LINK_ALREADY_USED';
  end if;
  if v_token.expires_at <= now() then
    raise exception 'KIA_TELEGRAM_LINK_EXPIRED';
  end if;

  select p.id, p.tenant_id, p.status into v_profile
  from public.profiles p
  where p.id = v_token.profile_id;

  if not found
     or v_profile.status = 'inactive'
     or v_profile.tenant_id is distinct from v_token.tenant_id then
    raise exception 'KIA_TELEGRAM_LINK_PROFILE_INVALID';
  end if;

  select * into v_identity
  from public.kia_channel_identities
  where channel = 'telegram'
    and (external_user_id = p_external_user_id or external_chat_id = p_external_chat_id)
  limit 1
  for update;

  if found then
    if v_identity.profile_id <> v_token.profile_id
       or v_identity.tenant_id is distinct from v_token.tenant_id
       or v_identity.external_user_id <> p_external_user_id
       or v_identity.external_chat_id <> p_external_chat_id then
      raise exception 'KIA_TELEGRAM_LINK_IDENTITY_CONFLICT';
    end if;

    update public.kia_channel_identities
    set status = 'active',
        verified_at = now(),
        revoked_at = null,
        external_username = p_external_username,
        updated_at = now()
    where id = v_identity.id
    returning * into v_identity;
  else
    insert into public.kia_channel_identities (
      tenant_id,
      profile_id,
      channel,
      external_user_id,
      external_chat_id,
      external_username,
      status,
      verified_at,
      created_by
    ) values (
      v_token.tenant_id,
      v_token.profile_id,
      'telegram',
      p_external_user_id,
      p_external_chat_id,
      p_external_username,
      'active',
      now(),
      v_token.profile_id
    ) returning * into v_identity;
  end if;

  update public.kia_channel_link_tokens
  set consumed_at = now()
  where id = v_token.id;

  return query select v_token.profile_id, v_token.tenant_id, v_identity.id;
end;
$$;

revoke all on function public.kia_consume_telegram_link_token(text, text, text, text) from public, anon, authenticated;
grant execute on function public.kia_consume_telegram_link_token(text, text, text, text) to service_role;
