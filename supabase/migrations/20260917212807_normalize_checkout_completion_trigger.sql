create or replace function public.complete_checkout_session_from_order()
returns trigger
language plpgsql
set search_path = 'public', 'pg_temp'
as $$
declare
  v_session_id text;
begin
  v_session_id := nullif(new.metadata -> 'checkout_session' ->> 'id', '');
  if v_session_id is not null then
    update public.checkout_sessions
       set status = 'completed', updated_at = now()
     where stripe_session_id = v_session_id
       and status in ('open', 'pending');
  end if;
  return new;
end;
$$;

comment on function public.complete_checkout_session_from_order() is
  'For new orders only, mark the matching persisted Stripe checkout session completed.';

revoke all on function public.complete_checkout_session_from_order() from public, anon, authenticated;

drop trigger if exists trg_orders_complete_checkout_session on public.orders;
create trigger trg_orders_complete_checkout_session
after insert on public.orders
for each row execute function public.complete_checkout_session_from_order();