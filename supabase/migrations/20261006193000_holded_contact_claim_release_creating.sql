-- #55: allow the owner to release a contact-creation claim after the
-- external POST has started but failed before a Holded contact was created.
-- This is a forward-only repair; do not rewrite the frozen baseline function.
create or replace function public.release_holded_contact_creation_claim(
  p_claim_id uuid,
  p_owner_token uuid,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  update public.holded_contact_creation_claims
     set state = 'released',
         lease_expires_at = now(),
         updated_at = now(),
         last_error = left(p_error, 500)
   where id = p_claim_id
     and owner_token = p_owner_token
     and state in ('claimed', 'creating');

  if not found then
    raise exception 'Holded contact claim ownership lost';
  end if;
end;
$function$;

revoke all on function public.release_holded_contact_creation_claim(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.release_holded_contact_creation_claim(uuid, uuid, text)
  to service_role;
