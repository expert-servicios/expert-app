-- Repair native booking constraints in production.
-- The 2026-09-23 native booking migration is recorded as applied, but the
-- appointment_type and status CHECK constraints remained on their legacy
-- Spanish-only definitions. Extend them without rewriting historical rows.

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
