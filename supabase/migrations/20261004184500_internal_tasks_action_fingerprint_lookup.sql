create index if not exists idx_internal_tasks_open_action_metadata_gin
  on public.internal_tasks using gin (metadata jsonb_path_ops)
  where status in ('pendiente', 'en_progreso')
    and metadata ->> 'action_fingerprint' is not null;
