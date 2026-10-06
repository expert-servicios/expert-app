alter table public.appointments
  drop constraint if exists appointments_appointment_type_check;

alter table public.appointments
  add constraint appointments_appointment_type_check
  check (
    appointment_type = any (
      array[
        'consulta_gratuita'::text,
        'mentoria'::text,
        'asesoramiento'::text,
        'consulta-inicial'::text,
        'demo-holded'::text,
        'onboarding'::text,
        'formacion-holded'::text,
        'mentoria-mensual'::text,
        'seguimiento-mensual-empresa'::text,
        'seguimiento-mensual-autonomo'::text,
        'academy-admision'::text,
        'reunion'::text,
        'demo'::text,
        'formacion'::text,
        'cal_booking'::text
      ]
    )
  );
