alter table public.quotes
  add column if not exists service_slugs text[] not null default '{}'::text[],
  add column if not exists claim_email text;

comment on column public.quotes.service_slugs is 'Immutable service snapshot captured when a public quote request is created; admin may later add structured quote_items without losing original intent.';
comment on column public.quotes.claim_email is 'Normalized email address that received the quote capability link; used to validate claim tokens independently from mutable lead contact data.';
