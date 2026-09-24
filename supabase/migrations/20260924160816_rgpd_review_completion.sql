alter table public.rgpd_self_implementation_projects
  add column if not exists review_summary text null;

create or replace function public.complete_rgpd_review(
  p_project_id uuid,
  p_reviewer_id uuid,
  p_summary text
)
returns table(project_id uuid, task_id uuid, project_status text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_project public.rgpd_self_implementation_projects%rowtype;
  v_summary text;
begin
  v_summary := btrim(coalesce(p_summary, ''));

  if length(v_summary) < 20 then
    raise exception 'rgpd_review_summary_too_short';
  end if;

  if length(v_summary) > 10000 then
    raise exception 'rgpd_review_summary_too_long';
  end if;

  select *
    into v_project
  from public.rgpd_self_implementation_projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'rgpd_project_not_found';
  end if;

  if v_project.status = 'completed' then
    return query
      select v_project.id, v_project.review_task_id, v_project.status;
    return;
  end if;

  if v_project.status <> 'in_review' then
    raise exception 'rgpd_project_not_in_review';
  end if;

  if v_project.reviewer_id is distinct from p_reviewer_id then
    raise exception 'rgpd_review_reviewer_mismatch';
  end if;

  if v_project.review_task_id is null then
    raise exception 'rgpd_review_task_missing';
  end if;

  update public.internal_tasks
  set status = 'completada',
      completed_at = now(),
      updated_at = now(),
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'rgpd_review_completed_at', now()
      )
  where id = v_project.review_task_id;

  update public.rgpd_self_implementation_projects
  set status = 'completed',
      review_summary = v_summary,
      review_completed_at = now(),
      updated_at = now()
  where id = v_project.id;

  return query
    select v_project.id, v_project.review_task_id, 'completed'::text;
end;
$$;

revoke all on function public.complete_rgpd_review(uuid, uuid, text) from public;
revoke all on function public.complete_rgpd_review(uuid, uuid, text) from anon;
revoke all on function public.complete_rgpd_review(uuid, uuid, text) from authenticated;
grant execute on function public.complete_rgpd_review(uuid, uuid, text) to service_role;
