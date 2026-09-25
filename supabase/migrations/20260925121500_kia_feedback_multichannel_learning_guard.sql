-- Generalize KIA feedback beyond retired WABA and keep learning human-approved.
alter table public.kia_feedback
  alter column phone drop not null;

alter table public.kia_feedback
  add column if not exists approved_for_learning boolean not null default false,
  add column if not exists feedback_context jsonb not null default '{}'::jsonb;

comment on column public.kia_feedback.approved_for_learning is
  'Only human-approved feedback may be injected back into KIA few-shot prompts.';

create index if not exists kia_feedback_learning_idx
  on public.kia_feedback (approved_for_learning, rating, created_at desc)
  where approved_for_learning = true;
