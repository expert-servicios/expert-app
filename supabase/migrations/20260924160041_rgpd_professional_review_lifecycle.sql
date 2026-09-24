alter table public.rgpd_self_implementation_projects
  add column if not exists reviewer_id uuid null references public.profiles(id) on delete set null,
  add column if not exists review_started_at timestamptz null,
  add column if not exists review_completed_at timestamptz null,
  add column if not exists review_task_id uuid null references public.internal_tasks(id) on delete set null;

alter table public.rgpd_self_implementation_projects
  drop constraint if exists rgpd_self_implementation_projects_status_check;

alter table public.rgpd_self_implementation_projects
  add constraint rgpd_self_implementation_projects_status_check
  check (status in ('draft','review_requested','in_review','completed','archived'));

create or replace function public.accept_rgpd_review(
  p_project_id uuid,
  p_reviewer_id uuid
)
returns table(project_id uuid, task_id uuid, project_status text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_project public.rgpd_self_implementation_projects%rowtype;
  v_task_id uuid;
begin
  select *
    into v_project
  from public.rgpd_self_implementation_projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'rgpd_project_not_found';
  end if;

  if v_project.status = 'in_review' and v_project.review_task_id is not null then
    return query
      select v_project.id, v_project.review_task_id, v_project.status;
    return;
  end if;

  if v_project.status <> 'review_requested' then
    raise exception 'rgpd_project_not_review_requested';
  end if;

  insert into public.internal_tasks (
    title,
    description,
    status,
    priority,
    assigned_to,
    client_id,
    company_id,
    source,
    metadata
  )
  values (
    'Revisión profesional RGPD — versión ' || v_project.version,
    'Revisar el snapshot RGPD solicitado por el cliente. El snapshot original es inmutable; documentar conclusiones y acciones por separado.',
    'pendiente',
    'alta',
    p_reviewer_id,
    v_project.user_id,
    v_project.company_id,
    'system',
    jsonb_build_object(
      'type', 'rgpd_professional_review',
      'rgpd_project_id', v_project.id,
      'rgpd_version', v_project.version
    )
  )
  returning id into v_task_id;

  update public.rgpd_self_implementation_projects
  set status = 'in_review',
      reviewer_id = p_reviewer_id,
      review_started_at = now(),
      review_task_id = v_task_id,
      updated_at = now()
  where id = v_project.id;

  return query
    select v_project.id, v_task_id, 'in_review'::text;
end;
$$;

revoke all on function public.accept_rgpd_review(uuid, uuid) from public;
revoke all on function public.accept_rgpd_review(uuid, uuid) from anon;
revoke all on function public.accept_rgpd_review(uuid, uuid) from authenticated;
grant execute on function public.accept_rgpd_review(uuid, uuid) to service_role;
