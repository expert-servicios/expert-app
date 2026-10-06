revoke all on table public.recurring_meeting_series from anon, authenticated;
revoke all on table public.recurring_meeting_occurrences from anon, authenticated;

create index if not exists recurring_meeting_occurrences_appointment_id_idx
  on public.recurring_meeting_occurrences (appointment_id)
  where appointment_id is not null;
