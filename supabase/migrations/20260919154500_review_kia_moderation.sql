-- KIA review moderation metadata.
-- Public ratings remain visible even when only the free-text comment is withheld.
-- No client PII or star rating is required by the moderation model.

alter table public.reviews
  add column if not exists comment_publishable boolean not null default true,
  add column if not exists moderation_status text not null default 'pending',
  add column if not exists moderation_reason text,
  add column if not exists moderated_by text,
  add column if not exists moderation_policy_version text,
  add column if not exists moderation_model text,
  add column if not exists moderated_at timestamptz,
  add column if not exists human_override_reason text;

alter table public.reviews
  drop constraint if exists reviews_moderation_status_check,
  add constraint reviews_moderation_status_check
    check (moderation_status in ('pending', 'approved', 'hold_for_review', 'comment_not_publishable'));

alter table public.reviews
  drop constraint if exists reviews_moderated_by_check,
  add constraint reviews_moderated_by_check
    check (moderated_by is null or moderated_by in ('kia', 'human'));

comment on column public.reviews.comment_publishable is
  'Whether the free-text comment may be shown publicly. Rating publication is controlled independently by published + allow_publish.';
comment on column public.reviews.moderation_status is
  'Content moderation result. Negative sentiment is never a reason to withhold a review.';
comment on column public.reviews.moderation_policy_version is
  'Version of the public review moderation policy used for the decision.';
