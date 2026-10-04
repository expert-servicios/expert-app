create unique index if not exists uq_internal_tasks_open_action_fingerprint
  on public.internal_tasks ((metadata ->> 'action_fingerprint'))
  where status in ('pendiente', 'en_progreso')
    and metadata ->> 'action_fingerprint' is not null;


-- Supports the JSONB containment lookup used by the email agent while the
-- expression btree above enforces uniqueness under concurrent cron runs.
create index if not exists idx_internal_tasks_open_metadata_gin
  on public.internal_tasks using gin (metadata jsonb_path_ops)
  where status in ('pendiente', 'en_progreso');
