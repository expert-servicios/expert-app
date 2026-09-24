-- Cover the active-company foreign key used by reverse company cleanup
-- and future multi-entity profile lookups.
-- Scope: index only. No data, RLS, grants, or constraints changed.

create index if not exists profiles_active_company_id_idx
  on public.profiles(active_company_id);
