-- Prevent more than one quote-origin order from being persisted for the same quote.
-- Additive safety constraint. Production preflight on 2026-09-19 confirmed zero quote-origin orders.

create unique index if not exists orders_quote_id_unique_idx
  on public.orders (quote_id)
  where source = 'quote' and quote_id is not null;
