create unique index if not exists uq_internal_tasks_open_action_fingerprint
  on public.internal_tasks ((metadata ->> 'action_fingerprint'))
  where status in ('pendiente', 'en_progreso')
    and metadata ->> 'action_fingerprint' is not null;
