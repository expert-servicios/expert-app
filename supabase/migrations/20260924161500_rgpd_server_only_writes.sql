revoke insert, update, delete
on table public.rgpd_self_implementation_projects
from authenticated;

drop policy if exists "rgpd projects insert own"
on public.rgpd_self_implementation_projects;

drop policy if exists "rgpd projects update own"
on public.rgpd_self_implementation_projects;

drop policy if exists "rgpd projects delete own"
on public.rgpd_self_implementation_projects;

-- Authenticated users keep read access only to their own snapshots through
-- the existing "rgpd projects select own" RLS policy.
-- All writes are performed by authenticated server routes using service_role.
