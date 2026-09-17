create or replace function public.preserve_paid_order_when_holded_skipped()
returns trigger
language plpgsql
set search_path = 'public', 'pg_temp'
as $$
begin
  if old.status = 'paid'
     and new.status = 'paid_invoice_error'
     and new.holded_invoice_id is null
     and new.holded_sync_error is null then
    new.status := 'paid';
  end if;
  return new;
end;
$$;

revoke all on function public.preserve_paid_order_when_holded_skipped() from public, anon, authenticated;

drop trigger if exists trg_orders_preserve_paid_when_holded_skipped on public.orders;
create trigger trg_orders_preserve_paid_when_holded_skipped
before update of status, holded_invoice_id, holded_sync_error on public.orders
for each row execute function public.preserve_paid_order_when_holded_skipped();