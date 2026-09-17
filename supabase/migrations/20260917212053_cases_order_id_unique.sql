-- One paid order must map to at most one operational case.
-- Required for idempotent post-payment fulfillment and Stripe webhook retries.
create unique index if not exists cases_order_id_unique_idx
  on public.cases (order_id)
  where order_id is not null;
