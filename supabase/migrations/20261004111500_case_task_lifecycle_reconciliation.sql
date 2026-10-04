-- Reconcile case lifecycle with internal workflow tasks.
-- Prevents stale pre-submission tasks from remaining overdue after a case is presented
-- and closes every remaining case task when the case is finalized.

create or replace function public.reconcile_case_task_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text;
  v_now timestamptz := now();
begin
  v_status := coalesce(new.status, new.state);

  if v_status = 'presentado' then
    update public.internal_tasks
       set status = 'completada',
           completed_at = coalesce(completed_at, v_now),
           updated_at = v_now,
           metadata = coalesce(metadata, '{}'::jsonb)
             || jsonb_build_object(
                  'auto_completed_by_case_status', 'presentado',
                  'auto_completed_at', v_now
                )
     where case_id = new.id
       and status in ('pendiente', 'en_progreso')
       and (
         coalesce((metadata ->> 'blocks_submission')::boolean, false)
         or metadata ->> 'task_key' = 'submit_and_archive_receipt'
       );

    if new.due_date is not null then
      new.due_date := null;
    end if;
  elsif v_status = 'finalizado' then
    update public.internal_tasks
       set status = 'completada',
           completed_at = coalesce(completed_at, v_now),
           updated_at = v_now,
           metadata = coalesce(metadata, '{}'::jsonb)
             || jsonb_build_object(
                  'auto_completed_by_case_status', 'finalizado',
                  'auto_completed_at', v_now
                )
     where case_id = new.id
       and status in ('pendiente', 'en_progreso');

    new.due_date := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_reconcile_case_task_lifecycle on public.cases;
create trigger trg_reconcile_case_task_lifecycle
before update of status, state on public.cases
for each row
when (
  old.status is distinct from new.status
  or old.state is distinct from new.state
)
execute function public.reconcile_case_task_lifecycle();

-- Backfill existing drift without touching unrelated manual/email tasks on presented cases.
update public.internal_tasks t
   set status = 'completada',
       completed_at = coalesce(t.completed_at, now()),
       updated_at = now(),
       metadata = coalesce(t.metadata, '{}'::jsonb)
         || jsonb_build_object(
              'auto_completed_by_case_status', 'presentado_backfill',
              'auto_completed_at', now()
            )
  from public.cases c
 where t.case_id = c.id
   and coalesce(c.status, c.state) = 'presentado'
   and t.status in ('pendiente', 'en_progreso')
   and (
     coalesce((t.metadata ->> 'blocks_submission')::boolean, false)
     or t.metadata ->> 'task_key' = 'submit_and_archive_receipt'
   );

update public.internal_tasks t
   set status = 'completada',
       completed_at = coalesce(t.completed_at, now()),
       updated_at = now(),
       metadata = coalesce(t.metadata, '{}'::jsonb)
         || jsonb_build_object(
              'auto_completed_by_case_status', 'finalizado_backfill',
              'auto_completed_at', now()
            )
  from public.cases c
 where t.case_id = c.id
   and coalesce(c.status, c.state) = 'finalizado'
   and t.status in ('pendiente', 'en_progreso');

update public.cases
   set due_date = null,
       updated_at = now()
 where coalesce(status, state) in ('presentado', 'finalizado')
   and due_date is not null;

revoke all on function public.reconcile_case_task_lifecycle() from public, anon, authenticated;
grant execute on function public.reconcile_case_task_lifecycle() to service_role;
