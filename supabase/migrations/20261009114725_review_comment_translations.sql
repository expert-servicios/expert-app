-- Store translated public review text, never overwrite the original.
alter table public.reviews add column if not exists comment_translations jsonb not null default '{}'::jsonb;
