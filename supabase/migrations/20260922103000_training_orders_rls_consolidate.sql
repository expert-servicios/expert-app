-- Consolidate public.training_orders RLS policies by command.
-- Preserve the effective authorization union while removing overlapping
-- permissive policies and limiting evaluation to authenticated users.
-- Scope: policies only. No grants, functions, constraints, or data changes.

drop policy if exists "Admins full access" on public.training_orders;
drop policy if exists "Users can insert own training orders" on public.training_orders;
drop policy if exists "Users can update own training orders" on public.training_orders;
drop policy if exists "Users can view own training orders" on public.training_orders;

create policy "training_orders authenticated select"
  on public.training_orders
  as permissive
  for select
  to authenticated
  using (
    is_admin_email()
    or ((select auth.uid()) = user_id)
  );

create policy "training_orders authenticated insert"
  on public.training_orders
  as permissive
  for insert
  to authenticated
  with check (
    is_admin_email()
    or ((select auth.uid()) = user_id)
  );

create policy "training_orders authenticated update"
  on public.training_orders
  as permissive
  for update
  to authenticated
  using (
    is_admin_email()
    or ((select auth.uid()) = user_id)
  )
  with check (
    is_admin_email()
    or ((select auth.uid()) = user_id)
  );

create policy "training_orders admin delete"
  on public.training_orders
  as permissive
  for delete
  to authenticated
  using (
    is_admin_email()
  );
