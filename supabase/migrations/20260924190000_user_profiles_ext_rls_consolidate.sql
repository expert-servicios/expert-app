-- Consolidate public.user_profiles_ext RLS policies by command.
-- Preserve the effective authorization union while removing overlapping
-- permissive policies and limiting evaluation to authenticated users.
-- Scope: policies only. No grants, functions, constraints, or data changes.

drop policy if exists "Admins can delete all profiles" on public.user_profiles_ext;
drop policy if exists "Users can delete own profile" on public.user_profiles_ext;
drop policy if exists "Admins can insert profiles" on public.user_profiles_ext;
drop policy if exists "Users can insert own profile" on public.user_profiles_ext;
drop policy if exists "Admins can view all profiles" on public.user_profiles_ext;
drop policy if exists "Users can view own profile" on public.user_profiles_ext;
drop policy if exists "Admins can update all profiles" on public.user_profiles_ext;
drop policy if exists "Users can update own profile" on public.user_profiles_ext;

create policy "user_profiles_ext authenticated select"
  on public.user_profiles_ext
  as permissive
  for select
  to authenticated
  using (
    is_admin_user()
    or ((select auth.uid()) = id)
  );

create policy "user_profiles_ext authenticated insert"
  on public.user_profiles_ext
  as permissive
  for insert
  to authenticated
  with check (
    is_admin_user()
    or ((select auth.uid()) = id)
  );

create policy "user_profiles_ext authenticated update"
  on public.user_profiles_ext
  as permissive
  for update
  to authenticated
  using (
    is_admin_user()
    or ((select auth.uid()) = id)
  )
  with check (
    is_admin_user()
    or ((select auth.uid()) = id)
  );

create policy "user_profiles_ext authenticated delete"
  on public.user_profiles_ext
  as permissive
  for delete
  to authenticated
  using (
    is_admin_user()
    or ((select auth.uid()) = id)
  );
