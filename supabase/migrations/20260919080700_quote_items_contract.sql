-- Structured contractual lines for accepted quotes.
-- Forward-only, additive, no backfill and no mutation of historical quotes.

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  service_slug text not null,
  stripe_price_id text,
  description text not null,
  quantity integer not null,
  unit_amount_cents bigint not null,
  currency text not null default 'EUR',
  tax_behavior text not null default 'exclusive',
  position integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint quote_items_quantity_positive check (quantity > 0),
  constraint quote_items_unit_amount_nonnegative check (unit_amount_cents >= 0),
  constraint quote_items_position_nonnegative check (position >= 0),
  constraint quote_items_currency_iso check (currency ~ '^[A-Z]{3}$'),
  constraint quote_items_tax_behavior_check
    check (tax_behavior in ('exclusive','inclusive','unspecified')),
  constraint quote_items_quote_position_unique unique (quote_id, position)
);

create index if not exists quote_items_service_slug_idx
  on public.quote_items (service_slug);

alter table public.quote_items enable row level security;

revoke all on table public.quote_items from public, anon, authenticated;
grant select on table public.quote_items to authenticated;
grant select, insert, update, delete on table public.quote_items to service_role;

drop policy if exists quote_items_admin_select on public.quote_items;
create policy quote_items_admin_select
on public.quote_items
for select
to authenticated
using (public.is_admin());

drop policy if exists quote_items_client_select on public.quote_items;
create policy quote_items_client_select
on public.quote_items
for select
to authenticated
using (
  exists (
    select 1
    from public.quotes q
    where q.id = quote_items.quote_id
      and q.client_id = auth.uid()
  )
);

drop policy if exists quote_items_tenant_admin_select on public.quote_items;
create policy quote_items_tenant_admin_select
on public.quote_items
for select
to authenticated
using (
  public.is_tenant_admin()
  and exists (
    select 1
    from public.quotes q
    where q.id = quote_items.quote_id
      and q.tenant_id = public.auth_tenant_id()
  )
);

comment on table public.quote_items is
  'Immutable-at-checkout contractual quote line snapshots. Historical quotes are not backfilled.';
