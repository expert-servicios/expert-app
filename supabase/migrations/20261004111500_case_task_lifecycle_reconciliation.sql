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
  v_now timestamptz := now();
begin
  -- Finalization wins over a legacy state that may still say "presentado".
  if new.status = 'finalizado' or new.state = 'finalizado' then
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
  elsif new.status = 'presentado' or new.state = 'presentado' then
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
         coalesce(metadata ->> 'blocks_submission', 'false') = 'true'
         or metadata ->> 'task_key' = 'submit_and_archive_receipt'
       );

    if new.due_date is not null then
      new.due_date := null;
    end if;
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



-- Promote the case automatically when the canonical submission task is completed.
-- This closes the loop for Admin/KIA Work: completing "presentar y archivar justificante"
-- must not leave the case in pre-submission state with stale reminders.
create or replace function public.promote_case_after_submission_task()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $
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
$;

drop trigger if exists trg_promote_case_after_submission_task on public.internal_tasks;
create trigger trg_promote_case_after_submission_task
after update of status on public.internal_tasks
for each row
when (old.status is distinct from new.status)
execute function public.promote_case_after_submission_task();

revoke all on function public.promote_case_after_submission_task() from public, anon, authenticated;
grant execute on function public.promote_case_after_submission_task() to service_role;

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
   and (c.status = 'presentado' or c.state = 'presentado')
   and t.status in ('pendiente', 'en_progreso')
   and (
     coalesce(t.metadata ->> 'blocks_submission', 'false') = 'true'
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
   and (c.status = 'finalizado' or c.state = 'finalizado')
   and t.status in ('pendiente', 'en_progreso');

update public.cases
   set due_date = null,
       updated_at = now()
 where (status in ('presentado', 'finalizado') or state in ('presentado', 'finalizado'))
   and due_date is not null;

revoke all on function public.reconcile_case_task_lifecycle() from public, anon, authenticated;
grant execute on function public.reconcile_case_task_lifecycle() to service_role;
