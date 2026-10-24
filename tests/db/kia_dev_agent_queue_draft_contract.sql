-- Runs only against the disposable PostgreSQL service in GitHub Actions.
-- Requires CI to create stub profiles and Supabase-compatible DB roles first.
\set ON_ERROR_STOP on

do $contract$
declare
  requester uuid := gen_random_uuid();
  reviewer uuid := gen_random_uuid();
  digest text := repeat('c',64);
  manifest text := repeat('a',64);
  head text := repeat('b',40);
  one_id uuid;
begin
  if (select count(*) from pg_class where relname in
      ('kia_dev_agent_requests','kia_dev_agent_attempts','kia_dev_agent_events') and relkind = 'r') <> 3 then
    raise exception 'three_tables_required';
  end if;
  if (select count(*) from pg_class where relname in
      ('kia_dev_agent_requests','kia_dev_agent_attempts','kia_dev_agent_events') and relrowsecurity = true) <> 3 then
    raise exception 'rls_not_enabled';
  end if;
  if exists (select 1 from pg_policies where tablename like 'kia_dev_agent_%') then
    raise exception 'unexpected_exposed_policy';
  end if;
  if has_table_privilege('anon','public.kia_dev_agent_requests','select')
     or has_table_privilege('authenticated','public.kia_dev_agent_requests','select')
     or has_table_privilege('authenticated','public.kia_dev_agent_attempts','insert')
     or has_table_privilege('authenticated','public.kia_dev_agent_events','update')
     or has_table_privilege('service_role','public.kia_dev_agent_requests','insert')
     or not has_table_privilege('service_role','public.kia_dev_agent_requests','select') then
    raise exception 'unsafe_acl';
  end if;

  insert into public.profiles (id) values (requester),(reviewer);
  insert into public.kia_dev_agent_requests(
    created_by,task_id,manifest_version,manifest_sha,head_sha,checkpoint,
    request_digest,idempotency_key,allowed_paths,expires_at,
    max_changed_files,max_patch_bytes,max_runtime_seconds
  ) values (
    requester,'E0-SMOKE-01',1,manifest,head,'E0-M3-06-test',
    digest,repeat('d',64),'["tests/api/fixture.test.ts"]'::jsonb,
    now() + interval '2 hours',1,80000,900
  ) returning id into one_id;

  -- Replay of same request must be rejected by a permanent unique index.
  begin
    insert into public.kia_dev_agent_requests (
      created_by,task_id,manifest_version,manifest_sha,head_sha,checkpoint,
      request_digest,idempotency_key,allowed_paths,expires_at,
      max_changed_files,max_patch_bytes,max_runtime_seconds
    ) values (
      requester,'E0-SMOKE-01',1,manifest,head,'E0-M3-06-test',
      digest,repeat('d',64),'["tests/api/fixture.test.ts"]'::jsonb,
      now() + interval '2 hours',1,80000,900
    );
    raise exception 'duplicate_idempotency_accepted';
  exception when unique_violation then null;
  end;

  -- Another key does not bypass single unfinished task constraint.
  begin
    insert into public.kia_dev_agent_requests (
      created_by,task_id,manifest_version,manifest_sha,head_sha,checkpoint,
      request_digest,idempotency_key,allowed_paths,expires_at,
      max_changed_files,max_patch_bytes,max_runtime_seconds
    ) values (
      requester,'E0-SMOKE-01',1,manifest,head,'E0-M3-06-test',
      digest,repeat('e',64),'["tests/api/fixture.test.ts"]'::jsonb,
      now() + interval '2 hours',1,80000,900
    );
    raise exception 'active_request_duplicate_accepted';
  exception when unique_violation then null;
  end;

  -- Review cannot be self approved or refer to a different digest.
  begin
    update public.kia_dev_agent_requests set
      reviewer_id=requester,approved_digest=digest,reviewed_at=now(),
      approval_expires_at=now()+interval '45 minutes'
    where id=one_id;
    raise exception 'self_review_accepted';
  exception when check_violation then null;
  end;

  begin
    update public.kia_dev_agent_requests set
      reviewer_id=reviewer,approved_digest=repeat('0',64),reviewed_at=now(),
      approval_expires_at=now()+interval '45 minutes'
    where id=one_id;
    raise exception 'stale_digest_accepted';
  exception when check_violation then null;
  end;

  update public.kia_dev_agent_requests set
    reviewer_id=reviewer,approved_digest=digest,reviewed_at=now(),
    approval_expires_at=now()+interval '45 minutes',state='approved'
  where id=one_id;

  -- One provider attempt maps to one row.
  insert into public.kia_dev_agent_attempts(
    request_id,attempt_number,request_digest,head_sha,workflow_ref,
    github_run_id,github_run_attempt,status,started_at
  ) values (one_id,1,digest,head,'main:.github/workflows/kia-dev-agent-sandbox.yml',
            123456789,1,'running',now());
  begin
    insert into public.kia_dev_agent_attempts(
      request_id,attempt_number,request_digest,head_sha,workflow_ref,
      github_run_id,github_run_attempt,status,started_at
    ) values (one_id,2,digest,head,'main:.github/workflows/kia-dev-agent-sandbox.yml',
              123456789,1,'running',now());
    raise exception 'replayed_github_attempt_accepted';
  exception when unique_violation then null;
  end;

  insert into public.kia_dev_agent_events(
    request_id,event_sequence,event_kind,actor_id,source,request_digest,from_state,to_state
  ) values (one_id,1,'created',requester,'authenticated_admin',digest,null,'draft');

  begin
    update public.kia_dev_agent_events set event_kind='cancelled' where request_id=one_id;
    raise exception 'audit_update_accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.kia_dev_agent_events where request_id=one_id;
    raise exception 'audit_delete_accepted';
  exception when insufficient_privilege then null;
  end;
  if (select count(*) from public.kia_dev_agent_events where request_id=one_id) <> 1 then
    raise exception 'audit_event_modified';
  end if;

  -- Client and tenant-level roles never get table access.
  if has_table_privilege('anon','public.kia_dev_agent_events','insert')
     or has_table_privilege('authenticated','public.kia_dev_agent_requests','update')
     or has_table_privilege('service_role','public.kia_dev_agent_events','delete') then
    raise exception 'unexpected_table_write_grant';
  end if;

  raise notice 'kia_dev_agent_queue_draft_contract_passed';
end
$contract$;
