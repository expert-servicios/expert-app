-- RU-003: persisted user language preference for EXPERT internationalization.
-- Additive only: no historical financial records are modified.
-- Existing profiles intentionally default to Spanish; language is never inferred from nationality.

alter table public.profiles
  add column if not exists preferred_language text not null default 'es';

comment on column public.profiles.preferred_language is
  'Preferred UI/communication language. Supported values: es, ru, en. Never infer from nationality.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_preferred_language_allowed'
  ) then
    alter table public.profiles
      add constraint profiles_preferred_language_allowed
      check (preferred_language in ('es', 'ru', 'en'));
  end if;
end
$$;
