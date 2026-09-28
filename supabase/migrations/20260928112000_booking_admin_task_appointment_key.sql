-- One canonical Admin meeting task per appointment.
-- Nullable so unrelated internal tasks remain unaffected.

alter table public.internal_tasks
  add column if not exists booking_appointment_id uuid references public.appointments(id) on delete set null;

create unique index if not exists internal_tasks_booking_appointment_id_uidx
  on public.internal_tasks (booking_appointment_id)
  where booking_appointment_id is not null;

-- Backfill only rows that are already unambiguous. Preflight confirmed there
-- are currently no booking task duplicates in production.
update public.internal_tasks
set booking_appointment_id = (metadata->>'appointment_id')::uuid
where booking_appointment_id is null
  and source = 'system'
  and metadata->>'task_kind' = 'booking_meeting'
  and metadata->>'appointment_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
