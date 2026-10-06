-- Forward-only repair for the partially applied 20261004111500 migration.
-- Production already has reconcile_case_task_lifecycle() and its trigger.
-- Complete the missing submission-promotion trigger and harden function ACLs.
-- Intentionally excludes historical backfills; data drift is audited separately.

create or replace function public.promote_case_after_submission_task()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_next_action text;
begin
  if new.status <> 'completada'
     or old.status = 'completada'
     or new.case_id is null
     or coalesce(new.metadata ->> 'task_key', '') <> 'submit_and_archive_receipt'
     or new.metadata ? 'auto_completed_by_case_status'
  then
    return new;
  end if;

  select t.title
    into v_next_action
    from public.internal_tasks t
   where t.case_id = new.case_id
     and t.status in ('pendiente', 'en_progreso')
     and coalesce(t.metadata ->> 'phase', '') = 'follow_up'
   order by t.created_at, t.id
   limit 1;

  update public.cases
     set status = 'presentado',
         due_date = null,
         next_action = coalesce(v_next_action, 'Seguimiento posterior a presentación'),
         updated_at = now()
   where id = new.case_id
     and coalesce(status, '') <> 'finalizado'
     and coalesce(state, '') <> 'finalizado'
     and status is distinct from 'presentado';

  return new;
end;
$$;

drop trigger if exists trg_promote_case_after_submission_task on public.internal_tasks;
create trigger trg_promote_case_after_submission_task
after update of status on public.internal_tasks
for each row
when (old.status is distinct from new.status)
execute function public.promote_case_after_submission_task();

revoke all on function public.promote_case_after_submission_task() from public, anon, authenticated;
grant execute on function public.promote_case_after_submission_task() to service_role;

revoke all on function public.reconcile_case_task_lifecycle() from public, anon, authenticated;
grant execute on function public.reconcile_case_task_lifecycle() to service_role;
