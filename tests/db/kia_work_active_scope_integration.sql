\set ON_ERROR_STOP on

-- Disposable PostgreSQL integration for E0-M3-06. No production connection is used.
create role anon;
create role authenticated;
create role service_role bypassrls;

create table public.email_attachment_documents(company_id uuid not null);
create table public.profiles(
  id uuid primary key,
  role text not null,
  status text,
  tenant_id uuid
);
create table public.cases(
  id uuid primary key,
  client_id uuid not null,
  tenant_id uuid,
  company_id uuid,
  closed_at timestamptz,
  next_action text
);
create table public.internal_tasks(
  id uuid primary key,
  title text,
  case_id uuid,
  client_id uuid,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);
create table public.documents(
  id uuid primary key,
  case_id uuid,
  client_id uuid,
  checklist_item_key text,
  state text,
  replaced_by uuid,
  updated_at timestamptz
);
create table public.email_events(
  id bigint primary key,
  metadata jsonb,
  event_type text,
  status text,
  resend_id text
);
create table public.administrative_actions(
  id uuid primary key,
  case_id uuid,
  state text,
  row_version integer
);
create table public.kia_channel_identities(
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  profile_id uuid not null,
  channel text not null,
  external_user_id text not null,
  external_chat_id text not null,
  external_username text,
  status text,
  verified_at timestamptz,
  revoked_at timestamptz,
  created_by uuid,
  updated_at timestamptz default now()
);
create table public.kia_channel_link_tokens(
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  profile_id uuid not null,
  channel text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz
);

\ir ../../supabase/migrations/20260924170000_kia_work_case_orchestration.sql
\ir ../../supabase/migrations/20261011135500_kia_work_active_scope_guard.sql

grant select, update on public.profiles, public.cases to service_role;

insert into public.profiles(id, role, status, tenant_id) values
  ('00000000-0000-4000-8000-000000000001', 'owner', 'active', null),
  ('00000000-0000-4000-8000-000000000002', 'owner', 'inactive', null),
  ('00000000-0000-4000-8000-000000000003', 'owner', 'pending', null),
  ('00000000-0000-4000-8000-000000000004', 'owner', 'suspended', null),
  ('00000000-0000-4000-8000-000000000005', 'client', 'active', null);

insert into public.cases(id, client_id, closed_at) values
  ('00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000005', null);

insert into public.kia_work_connections(
  id, case_id, client_id, created_by, token_hash, task_policies, expires_at
) values
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', 'active', '{}', now() + interval '1 hour'),
  ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000002', 'inactive', '{}', now() + interval '1 hour'),
  ('00000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000003', 'pending', '{}', now() + interval '1 hour'),
  ('00000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000004', 'suspended', '{}', now() + interval '1 hour');

do $$
begin
  if not exists (
    select 1 from pg_class
    where oid = 'public.kia_work_connections'::regclass and relrowsecurity
  ) then
    raise exception 'kia_work_connections_rls_disabled';
  end if;
  if (select prosecdef from pg_proc where oid = 'public.kia_work_lock_scope(uuid)'::regprocedure) then
    raise exception 'kia_work_lock_scope_must_be_security_invoker';
  end if;
  if has_function_privilege('anon', 'public.kia_work_lock_scope(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.kia_work_lock_scope(uuid)', 'execute') then
    raise exception 'kia_work_lock_scope_public_execute_exposed';
  end if;
  if not has_function_privilege('service_role', 'public.kia_work_lock_scope(uuid)', 'execute') then
    raise exception 'kia_work_lock_scope_service_role_execute_missing';
  end if;
end
$$;

set role service_role;

do $$
declare resolved public.kia_work_connections;
begin
  resolved := public.kia_work_lock_scope('00000000-0000-4000-8000-000000000011');
  if resolved.id <> '00000000-0000-4000-8000-000000000011'::uuid then
    raise exception 'active_actor_not_authorized';
  end if;
end
$$;

do $$
declare connection_id uuid;
begin
  foreach connection_id in array array[
    '00000000-0000-4000-8000-000000000012'::uuid,
    '00000000-0000-4000-8000-000000000013'::uuid,
    '00000000-0000-4000-8000-000000000014'::uuid
  ] loop
    begin
      perform public.kia_work_lock_scope(connection_id);
      raise exception 'non_active_actor_authorized:%', connection_id;
    exception
      when others then
        if sqlerrm <> 'work_forbidden' then
          raise;
        end if;
    end;
  end loop;
end
$$;

begin;
update public.profiles
set status = 'suspended'
where id = '00000000-0000-4000-8000-000000000001';
do $$
begin
  perform public.kia_work_lock_scope('00000000-0000-4000-8000-000000000011');
  raise exception 'revoked_actor_authorized';
exception
  when others then
    if sqlerrm <> 'work_forbidden' then
      raise;
    end if;
end
$$;
rollback;

do $$
begin
  perform public.kia_work_lock_scope('00000000-0000-4000-8000-000000000011');
end
$$;

reset role;
set role authenticated;

do $$
begin
  perform public.kia_work_lock_scope('00000000-0000-4000-8000-000000000011');
  raise exception 'authenticated_execute_unexpectedly_allowed';
exception
  when insufficient_privilege then null;
end
$$;

reset role;

select 'PASS: KIA Work exact-active transaction guard, rollback, RLS and function ACL isolation' as result;
