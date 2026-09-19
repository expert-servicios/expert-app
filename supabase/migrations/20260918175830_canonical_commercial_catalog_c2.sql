-- Recovered read-only from the production migration ledger on 2026-09-19.
-- Version: 20260918175830
-- Name: canonical_commercial_catalog_c2
-- Stored statements MD5: 21cb0764965e8861422f089fe49dc276
-- Production DDL is already applied. This file restores Git/ledger parity.
-- Do not replay it manually against production outside the controlled migration flow.

-- C2 canonical commercial catalog foundation.
-- Structure only: no backfill, no legacy table changes, no external API writes.

create table public.catalog_services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category_key text not null,
  service_type text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_services_slug_nonempty check (length(btrim(slug)) > 0),
  constraint catalog_services_category_key_nonempty check (length(btrim(category_key)) > 0),
  constraint catalog_services_service_type_check
    check (service_type in ('service', 'training', 'plan', 'procedure')),
  constraint catalog_services_status_check
    check (status in ('draft', 'active', 'paused', 'retired'))
);

create table public.service_contents (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.catalog_services(id) on delete cascade,
  locale text not null,
  name text not null,
  short_description text,
  description text,
  meta_title text,
  meta_description text,
  landing_path text not null,
  image_url text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_contents_service_locale_unique unique (service_id, locale),
  constraint service_contents_locale_check
    check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  constraint service_contents_name_nonempty check (length(btrim(name)) > 0),
  constraint service_contents_landing_path_check check (landing_path like '/%'),
  constraint service_contents_status_check
    check (status in ('draft', 'active', 'paused', 'retired'))
);

create table public.commercial_offers (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.catalog_services(id) on delete restrict,
  code text not null,
  billing_mode text not null,
  price_mode text not null,
  currency text not null default 'EUR',
  amount_cents bigint,
  vat_treatment text not null,
  recurring_interval text,
  recurring_interval_count integer,
  status text not null default 'draft',
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commercial_offers_service_code_unique unique (service_id, code),
  constraint commercial_offers_code_nonempty check (length(btrim(code)) > 0),
  constraint commercial_offers_billing_mode_check
    check (billing_mode in ('one_time', 'recurring', 'quote')),
  constraint commercial_offers_price_mode_check
    check (price_mode in ('fixed', 'from', 'quote')),
  constraint commercial_offers_currency_check check (currency = 'EUR'),
  constraint commercial_offers_vat_treatment_check
    check (vat_treatment in ('plus_vat', 'vat_included', 'exempt', 'outside_scope', 'manual_review')),
  constraint commercial_offers_status_check
    check (status in ('draft', 'active', 'paused', 'retired')),
  constraint commercial_offers_amount_check
    check (
      (price_mode = 'quote' and amount_cents is null)
      or
      (price_mode in ('fixed', 'from') and amount_cents is not null and amount_cents >= 0)
    ),
  constraint commercial_offers_recurring_check
    check (
      (
        billing_mode = 'recurring'
        and recurring_interval in ('day', 'week', 'month', 'year')
        and recurring_interval_count is not null
        and recurring_interval_count > 0
      )
      or
      (
        billing_mode <> 'recurring'
        and recurring_interval is null
        and recurring_interval_count is null
      )
    ),
  constraint commercial_offers_validity_check
    check (valid_until is null or valid_from is null or valid_until > valid_from)
);

create table public.service_aliases (
  id uuid primary key default gen_random_uuid(),
  alias text not null unique,
  service_id uuid not null references public.catalog_services(id) on delete cascade,
  status text not null default 'candidate',
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_aliases_alias_nonempty check (length(btrim(alias)) > 0),
  constraint service_aliases_status_check
    check (status in ('candidate', 'approved', 'retired'))
);

create table public.service_channel_configs (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.catalog_services(id) on delete cascade,
  channel text not null,
  enabled boolean not null default false,
  publish_status text not null default 'blocked',
  editorial_overrides jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_channel_configs_service_channel_unique unique (service_id, channel),
  constraint service_channel_configs_channel_check
    check (channel in ('web', 'meta', 'google', 'whatsapp', 'email')),
  constraint service_channel_configs_publish_status_check
    check (publish_status in ('blocked', 'review', 'ready', 'published', 'paused')),
  constraint service_channel_configs_editorial_object_check
    check (jsonb_typeof(editorial_overrides) = 'object'),
  constraint service_channel_configs_no_economic_override_check
    check (
      not (
        editorial_overrides ?| array[
          'price',
          'amount',
          'amount_cents',
          'currency',
          'vat_treatment',
          'price_mode',
          'billing_mode'
        ]
      )
    )
);

create table public.stripe_price_bindings (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.commercial_offers(id) on delete restrict,
  environment text not null,
  stripe_price_id text not null,
  status text not null default 'active',
  reconciliation_status text not null default 'unknown',
  last_reconciled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stripe_price_bindings_env_price_unique unique (environment, stripe_price_id),
  constraint stripe_price_bindings_environment_check
    check (environment in ('test', 'live')),
  constraint stripe_price_bindings_status_check
    check (status in ('active', 'inactive', 'retired')),
  constraint stripe_price_bindings_reconciliation_status_check
    check (reconciliation_status in ('unknown', 'matched', 'mismatch', 'manual_review')),
  constraint stripe_price_bindings_price_nonempty check (length(btrim(stripe_price_id)) > 0)
);

create table public.meta_catalog_items (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.catalog_services(id) on delete restrict,
  offer_id uuid references public.commercial_offers(id) on delete restrict,
  locale text not null,
  retailer_id text not null unique,
  meta_item_id text,
  sync_status text not null default 'pending',
  last_payload_hash text,
  last_synced_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meta_catalog_items_locale_check
    check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  constraint meta_catalog_items_retailer_id_nonempty check (length(btrim(retailer_id)) > 0),
  constraint meta_catalog_items_sync_status_check
    check (sync_status in ('pending', 'ready', 'synced', 'failed', 'blocked', 'manual_review'))
);

create table public.meta_catalog_sets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  meta_set_id text,
  filter_config jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meta_catalog_sets_code_nonempty check (length(btrim(code)) > 0),
  constraint meta_catalog_sets_name_nonempty check (length(btrim(name)) > 0),
  constraint meta_catalog_sets_filter_object_check check (jsonb_typeof(filter_config) = 'object'),
  constraint meta_catalog_sets_status_check
    check (status in ('draft', 'active', 'paused', 'retired'))
);

create table public.meta_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  operation text not null,
  target_type text,
  target_id uuid,
  requested_by uuid,
  status text not null default 'queued',
  attempt_count integer not null default 0,
  error_code text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meta_sync_jobs_operation_nonempty check (length(btrim(operation)) > 0),
  constraint meta_sync_jobs_status_check
    check (status in ('queued', 'running', 'succeeded', 'failed', 'blocked', 'cancelled')),
  constraint meta_sync_jobs_attempt_count_check check (attempt_count >= 0),
  constraint meta_sync_jobs_time_check
    check (finished_at is null or started_at is null or finished_at >= started_at)
);

create table public.meta_api_logs (
  id uuid primary key default gen_random_uuid(),
  sync_job_id uuid references public.meta_sync_jobs(id) on delete set null,
  operation text not null,
  endpoint text,
  http_status integer,
  meta_error_code text,
  meta_error_subcode text,
  trace_id text,
  created_at timestamptz not null default now(),
  constraint meta_api_logs_operation_nonempty check (length(btrim(operation)) > 0),
  constraint meta_api_logs_http_status_check
    check (http_status is null or (http_status between 100 and 599))
);

create index catalog_services_status_idx
  on public.catalog_services(status);

create index service_contents_status_idx
  on public.service_contents(status);

create index commercial_offers_service_status_idx
  on public.commercial_offers(service_id, status);

create index commercial_offers_validity_idx
  on public.commercial_offers(valid_from, valid_until);

create index service_aliases_service_idx
  on public.service_aliases(service_id);

create index service_channel_configs_publish_idx
  on public.service_channel_configs(channel, publish_status, enabled);

create unique index stripe_price_bindings_active_offer_env_uidx
  on public.stripe_price_bindings(offer_id, environment)
  where status = 'active';

create index stripe_price_bindings_reconciliation_idx
  on public.stripe_price_bindings(reconciliation_status, environment);

create unique index meta_catalog_items_meta_item_uidx
  on public.meta_catalog_items(meta_item_id)
  where meta_item_id is not null;

create index meta_catalog_items_sync_status_idx
  on public.meta_catalog_items(sync_status);

create unique index meta_catalog_sets_meta_set_uidx
  on public.meta_catalog_sets(meta_set_id)
  where meta_set_id is not null;

create index meta_catalog_sets_status_idx
  on public.meta_catalog_sets(status);

create index meta_sync_jobs_status_created_idx
  on public.meta_sync_jobs(status, created_at);

create index meta_api_logs_sync_job_idx
  on public.meta_api_logs(sync_job_id, created_at);

create index meta_api_logs_created_idx
  on public.meta_api_logs(created_at);

create trigger catalog_services_updated_at
before update on public.catalog_services
for each row execute function public.update_updated_at_column();

create trigger service_contents_updated_at
before update on public.service_contents
for each row execute function public.update_updated_at_column();

create trigger commercial_offers_updated_at
before update on public.commercial_offers
for each row execute function public.update_updated_at_column();

create trigger service_aliases_updated_at
before update on public.service_aliases
for each row execute function public.update_updated_at_column();

create trigger service_channel_configs_updated_at
before update on public.service_channel_configs
for each row execute function public.update_updated_at_column();

create trigger stripe_price_bindings_updated_at
before update on public.stripe_price_bindings
for each row execute function public.update_updated_at_column();

create trigger meta_catalog_items_updated_at
before update on public.meta_catalog_items
for each row execute function public.update_updated_at_column();

create trigger meta_catalog_sets_updated_at
before update on public.meta_catalog_sets
for each row execute function public.update_updated_at_column();

create trigger meta_sync_jobs_updated_at
before update on public.meta_sync_jobs
for each row execute function public.update_updated_at_column();

alter table public.catalog_services enable row level security;

alter table public.service_contents enable row level security;

alter table public.commercial_offers enable row level security;

alter table public.service_aliases enable row level security;

alter table public.service_channel_configs enable row level security;

alter table public.stripe_price_bindings enable row level security;

alter table public.meta_catalog_items enable row level security;

alter table public.meta_catalog_sets enable row level security;

alter table public.meta_sync_jobs enable row level security;

alter table public.meta_api_logs enable row level security;

revoke all on table
  public.catalog_services,
  public.service_contents,
  public.commercial_offers,
  public.service_aliases,
  public.service_channel_configs,
  public.stripe_price_bindings,
  public.meta_catalog_items,
  public.meta_catalog_sets,
  public.meta_sync_jobs,
  public.meta_api_logs
from public, anon, authenticated;

grant select, insert, update, delete on table
  public.catalog_services,
  public.service_contents,
  public.commercial_offers,
  public.service_aliases,
  public.service_channel_configs,
  public.stripe_price_bindings,
  public.meta_catalog_items,
  public.meta_catalog_sets,
  public.meta_sync_jobs,
  public.meta_api_logs
to service_role;

create policy "service_role_all_catalog_services"
  on public.catalog_services for all to service_role using (true) with check (true);

create policy "service_role_all_service_contents"
  on public.service_contents for all to service_role using (true) with check (true);

create policy "service_role_all_commercial_offers"
  on public.commercial_offers for all to service_role using (true) with check (true);

create policy "service_role_all_service_aliases"
  on public.service_aliases for all to service_role using (true) with check (true);

create policy "service_role_all_service_channel_configs"
  on public.service_channel_configs for all to service_role using (true) with check (true);

create policy "service_role_all_stripe_price_bindings"
  on public.stripe_price_bindings for all to service_role using (true) with check (true);

create policy "service_role_all_meta_catalog_items"
  on public.meta_catalog_items for all to service_role using (true) with check (true);

create policy "service_role_all_meta_catalog_sets"
  on public.meta_catalog_sets for all to service_role using (true) with check (true);

create policy "service_role_all_meta_sync_jobs"
  on public.meta_sync_jobs for all to service_role using (true) with check (true);

create policy "service_role_all_meta_api_logs"
  on public.meta_api_logs for all to service_role using (true) with check (true);

comment on table public.catalog_services is
  'Canonical EXPERT service identity. No price, Stripe IDs, or long-form content.';

comment on table public.commercial_offers is
  'Canonical professional commercial offers. Official fees and disbursements must not be folded into amount_cents.';

comment on table public.stripe_price_bindings is
  'Projection from canonical commercial offers to Stripe Price IDs. Stripe is not the economic source of truth.';

comment on table public.meta_catalog_items is
  'Server-side Meta catalog projection state. Never stores access tokens or app secrets.';

comment on table public.meta_api_logs is
  'Sanitized Meta API observability only. Never store authorization headers, access tokens, app secrets, or unnecessary PII.';\n