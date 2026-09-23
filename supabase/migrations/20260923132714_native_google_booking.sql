-- Native EXPERT booking support for Google Calendar / Meet.
-- Protects public bookings against concurrent overlapping reservations without
-- altering historical Cal.com rows.

alter table public.appointments
  add column if not exists appointment_end timestamp with time zone,
  add column if not exists booking_provider text,
  add column if not exists provider_booking_id text;


-- Native booking uses canonical English states/service keys while historical
-- rows retain the original Spanish values. Extend, do not rewrite, history.
alter table public.appointments
  drop constraint if exists appointments_appointment_type_check;

alter table public.appointments
  add constraint appointments_appointment_type_check
  check (
    appointment_type in (
      'consulta_gratuita', 'mentoria', 'asesoramiento',
      'consulta-inicial', 'demo-holded', 'onboarding',
      'formacion-holded', 'academy-admision',
      'reunion', 'demo', 'formacion', 'cal_booking'
    )
  );

alter table public.appointments
  drop constraint if exists appointments_status_check;

alter table public.appointments
  add constraint appointments_status_check
  check (
    status in (
      'pendiente', 'confirmada', 'completada', 'cancelada',
      'pending', 'pending_calendar', 'confirmed',
      'cancelled', 'rescheduled', 'completed'
    )
  );

create unique index if not exists appointments_provider_booking_key
  on public.appointments (booking_provider, provider_booking_id)
  where provider_booking_id is not null;

alter table public.appointments
  drop constraint if exists appointments_no_active_overlap;

alter table public.appointments
  add constraint appointments_no_active_overlap
  exclude using gist (
    tstzrange(appointment_date, appointment_end, '[)') with &&
  )
  where (
    appointment_end is not null
    and status in ('pending_calendar', 'confirmed')
  );

comment on column public.appointments.booking_provider is
  'Booking origin/provider. google_native is the EXPERT-owned Google Calendar/Meet flow; cal is legacy.';

comment on column public.appointments.provider_booking_id is
  'Provider-side booking/event identifier used for idempotency.';
