-- Prevent authenticated users from self-promoting through public.profiles.
-- The profiles UPDATE RLS intentionally allows users to maintain their own profile,
-- so privilege-bearing columns require a separate immutable-field guard.

create or replace function public.protect_profile_privileged_self_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if auth.uid() = old.id
     and not (public.is_admin() or public.is_admin_email())
     and (
       new.role is distinct from old.role
       or new.status is distinct from old.status
       or new.tenant_id is distinct from old.tenant_id
       or new.has_monthly_plan is distinct from old.has_monthly_plan
       or new.plan is distinct from old.plan
       or new.stripe_customer_id is distinct from old.stripe_customer_id
     )
  then
    raise exception 'privileged_profile_fields_are_server_managed'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_profile_privileged_self_update on public.profiles;
create trigger trg_protect_profile_privileged_self_update
before update on public.profiles
for each row
execute function public.protect_profile_privileged_self_update();

revoke all on function public.protect_profile_privileged_self_update() from public, anon, authenticated;
grant execute on function public.protect_profile_privileged_self_update() to service_role;
