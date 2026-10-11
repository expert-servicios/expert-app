-- E0-M3-06: revoke pending/suspended KIA Work authority in the database transaction.
-- Forward-only function replacement; no DML, financial updates or activation of KIA Work.
create or replace function public.kia_work_lock_scope(p_connection uuid)
returns public.kia_work_connections
language plpgsql security invoker set search_path = public as $$
declare c public.kia_work_connections; k public.cases; p public.profiles;
begin
  select * into c from public.kia_work_connections where id=p_connection for update;
  if not found or c.revoked_at is not null or c.expires_at <= now() then
    raise exception 'work_unauthorized';
  end if;
  select * into k from public.cases where id=c.case_id for update;
  if not found or k.closed_at is not null or k.client_id is distinct from c.client_id
    or k.company_id is distinct from c.company_id or k.tenant_id is distinct from c.tenant_id then
    raise exception 'work_scope_changed';
  end if;
  select * into p from public.profiles where id=c.created_by for share;
  if not found or p.status is distinct from 'active' or not coalesce((p.role in ('owner','admin') or
    (p.role='tenant_admin' and p.tenant_id is not null and p.tenant_id=c.tenant_id)),false) then
    raise exception 'work_forbidden';
  end if;
  return c;
end $$;
