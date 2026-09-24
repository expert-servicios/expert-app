-- Pin search_path for the three Stripe-schema functions currently reported
-- by Supabase Security Advisor. Function bodies and grants are unchanged.

ALTER FUNCTION stripe.set_updated_at()
  SET search_path = pg_catalog, stripe;

ALTER FUNCTION stripe.set_updated_at_metadata()
  SET search_path = pg_catalog, stripe;

ALTER FUNCTION stripe.check_rate_limit(text, integer, integer)
  SET search_path = pg_catalog, stripe;
