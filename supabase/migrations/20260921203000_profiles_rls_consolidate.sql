-- Consolidate public.profiles RLS policies by command while preserving
-- the exact effective authorization union from the previous six policies.
-- Scope: policies only. No grants, RLS enablement, functions, or data changes.

drop policy if exists "Admins can manage all profiles" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "admin all profiles" on public.profiles;
drop policy if exists "tenant_admin select profiles" on public.profiles;

create policy "profiles authenticated select"
  on public.profiles
  as permissive
  for select
  to authenticated
  using (
    is_admin()
    or is_admin_email()
    or ((select auth.uid()) = id)
    or (is_tenant_admin() and tenant_id = auth_tenant_id())
  );

create policy "profiles authenticated update"
  on public.profiles
  as permissive
  for update
  to authenticated
  using (
    is_admin()
    or is_admin_email()
    or ((select auth.uid()) = id)
  )
  with check (
    is_admin()
    or is_admin_email()
    or ((select auth.uid()) = id)
  );

create policy "profiles admin insert"
  on public.profiles
  as permissive
  for insert
  to authenticated
  with check (
    is_admin()
    or is_admin_email()
  );

create policy "profiles admin delete"
  on public.profiles
  as permissive
  for delete
  to authenticated
  using (
    is_admin()
    or is_admin_email()
  );
