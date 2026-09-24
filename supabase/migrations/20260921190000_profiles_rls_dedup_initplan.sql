-- Reduce duplicate permissive RLS policies on public.profiles and
-- move auth.uid() evaluation into an initPlan, following Supabase RLS guidance.
-- Authorization semantics are intentionally preserved.

drop policy if exists "user own profile" on public.profiles;
drop policy if exists "user update own profile" on public.profiles;

alter policy "Users can view own profile"
  on public.profiles
  using ((select auth.uid()) = id);

alter policy "Users can update own profile"
  on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
