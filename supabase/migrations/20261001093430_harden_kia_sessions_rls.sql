-- KIA session history is server-only. The baseline policy name implied
-- service-role-only access but was created TO public USING (true).

drop policy if exists "Service role full access" on public.kia_sessions;
drop policy if exists kia_sessions_service_role_all on public.kia_sessions;

revoke all on public.kia_sessions from anon, authenticated;
grant all on public.kia_sessions to service_role;

create policy kia_sessions_service_role_all
  on public.kia_sessions
  as permissive
  for all
  to service_role
  using (true)
  with check (true);
