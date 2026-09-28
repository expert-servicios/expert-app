-- One canonical Admin meeting task per appointment.
-- Nullable so unrelated internal tasks remain unaffected.

alter table public.internal_tasks
  add column if not exists booking_appointment_id uuid;

-- Fail closed if historical metadata is already ambiguous. Never choose a
-- duplicate row automatically: operational history must be reviewed manually.
do $$
begin
  if exists (
    select 1
    from public.internal_tasks
    where source = 'system'
      and metadata->>'task_kind' = 'booking_meeting'
      and metadata->>'appointment_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    group by metadata->>'appointment_id'
    having count(*) > 1
  ) then
    raise exception 'Duplicate booking meeting tasks detected; review them manually before applying this migration.';
  end if;
end
$$;

update public.internal_tasks
set booking_appointment_id = (metadata->>'appointment_id')::uuid
where booking_appointment_id is null
  and source = 'system'
  and metadata->>'task_kind' = 'booking_meeting'
  and metadata->>'appointment_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

create unique index if not exists internal_tasks_booking_appointment_id_uidx
  on public.internal_tasks (booking_appointment_id)
  where booking_appointment_id is not null;
