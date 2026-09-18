create or replace function public.preserve_catalog_payment_breakdown_on_order_update()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
begin
  if old.source = 'catalog'
     and old.metadata ? 'payment_breakdown'
     and not (coalesce(new.metadata, '{}'::jsonb) ? 'payment_breakdown') then
    new.metadata := coalesce(new.metadata, '{}'::jsonb)
      || jsonb_build_object('payment_breakdown', old.metadata -> 'payment_breakdown');
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_orders_preserve_payment_breakdown on public.orders;
create trigger trg_orders_preserve_payment_breakdown
before update of metadata on public.orders
for each row
execute function public.preserve_catalog_payment_breakdown_on_order_update();

revoke all on function public.preserve_catalog_payment_breakdown_on_order_update() from public;
revoke all on function public.preserve_catalog_payment_breakdown_on_order_update() from anon;
revoke all on function public.preserve_catalog_payment_breakdown_on_order_update() from authenticated;
