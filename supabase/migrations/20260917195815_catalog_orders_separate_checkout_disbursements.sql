create or replace function public.apply_checkout_disbursement_to_catalog_order()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_session_id text;
  v_checkout_metadata jsonb;
  v_disbursement_cents bigint := 0;
  v_professional_net_cents bigint := 0;
  v_stripe_total_cents bigint := 0;
  v_professional_gross_cents bigint := 0;
  v_vat_cents bigint := 0;
begin
  if new.source is distinct from 'catalog' then
    return new;
  end if;

  v_session_id := nullif(new.metadata -> 'checkout_session' ->> 'id', '');
  if v_session_id is null then
    return new;
  end if;

  select cs.metadata
    into v_checkout_metadata
  from public.checkout_sessions cs
  where cs.stripe_session_id = v_session_id;

  if v_checkout_metadata is null then
    return new;
  end if;

  if coalesce(v_checkout_metadata ->> 'disbursement_total_cents', '0') !~ '^[0-9]+$' then
    raise exception 'Invalid disbursement_total_cents for checkout session %', v_session_id;
  end if;

  v_disbursement_cents := (v_checkout_metadata ->> 'disbursement_total_cents')::bigint;
  if v_disbursement_cents <= 0 then
    return new;
  end if;

  if coalesce(v_checkout_metadata ->> 'disbursement_mandate_accepted', 'false') <> 'true' then
    raise exception 'Catalog checkout % contains a disbursement without accepted mandate; manual review required', v_session_id;
  end if;

  if coalesce(v_checkout_metadata ->> 'revenue_amount_cents', '') !~ '^[0-9]+$' then
    raise exception 'Invalid revenue_amount_cents for checkout session %', v_session_id;
  end if;
  v_professional_net_cents := (v_checkout_metadata ->> 'revenue_amount_cents')::bigint;

  v_stripe_total_cents := round(coalesce(new.amount_eur, new.amount) * 100)::bigint;
  if v_stripe_total_cents <= v_disbursement_cents then
    raise exception 'Disbursement exceeds or equals collected total for checkout session %; manual review required', v_session_id;
  end if;

  v_professional_gross_cents := v_stripe_total_cents - v_disbursement_cents;
  if v_professional_net_cents > v_professional_gross_cents then
    raise exception 'Professional net exceeds professional gross for checkout session %; manual review required', v_session_id;
  end if;
  v_vat_cents := v_professional_gross_cents - v_professional_net_cents;

  new.amount_eur := v_professional_gross_cents::numeric / 100;
  new.amount := v_professional_gross_cents::numeric / 100;
  new.metadata := coalesce(new.metadata, '{}'::jsonb) || jsonb_build_object(
    'payment_breakdown', jsonb_build_object(
      'stripe_total_cents', v_stripe_total_cents,
      'professional_net_cents', v_professional_net_cents,
      'professional_vat_cents', v_vat_cents,
      'professional_gross_cents', v_professional_gross_cents,
      'disbursement_total_cents', v_disbursement_cents,
      'disbursement_keys', coalesce(v_checkout_metadata ->> 'disbursement_keys', ''),
      'disbursement_mandate_accepted', true
    )
  );

  return new;
end;
$function$;

drop trigger if exists trg_orders_apply_checkout_disbursement on public.orders;
create trigger trg_orders_apply_checkout_disbursement
before insert on public.orders
for each row
execute function public.apply_checkout_disbursement_to_catalog_order();

revoke all on function public.apply_checkout_disbursement_to_catalog_order() from public;
revoke all on function public.apply_checkout_disbursement_to_catalog_order() from anon;
revoke all on function public.apply_checkout_disbursement_to_catalog_order() from authenticated;
