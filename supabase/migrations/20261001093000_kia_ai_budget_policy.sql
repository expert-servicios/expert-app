-- KIA AI cost policy and November profitability forecasting.
-- Period end is exclusive.

alter table public.kia_decision_logs
  add column if not exists service_slug text;

create index if not exists idx_kia_decision_logs_budget_period
  on public.kia_decision_logs (created_at, provider);

create index if not exists idx_kia_decision_logs_service_slug
  on public.kia_decision_logs (service_slug, created_at)
  where service_slug is not null;

create table if not exists public.kia_ai_budget_periods (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  currency text not null default 'EUR',
  usd_to_eur_rate numeric(12,6) not null default 1,
  target_spend_eur numeric(12,2) not null,
  alert_spend_eur numeric(12,2) not null,
  hard_cap_eur numeric(12,2) not null,
  reserve_eur numeric(12,2) not null default 0,
  provider_caps_eur jsonb not null default '{}'::jsonb,
  audience_caps_eur jsonb not null default '{}'::jsonb,
  thresholds jsonb not null default '[0.60,0.80,0.90,0.95,1.00]'::jsonb,
  target_ai_revenue_pct numeric(6,3) not null default 5,
  forecast jsonb not null default '{}'::jsonb,
  actuals jsonb not null default '{}'::jsonb,
  policy_version text not null,
  status text not null default 'active',
  last_evaluated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kia_ai_budget_periods_dates_check check (period_end > period_start),
  constraint kia_ai_budget_periods_spend_check check (
    target_spend_eur >= 0
    and alert_spend_eur >= target_spend_eur
    and hard_cap_eur >= alert_spend_eur
    and reserve_eur >= 0
    and reserve_eur <= hard_cap_eur
  ),
  constraint kia_ai_budget_periods_status_check check (status in ('planned','active','closed')),
  constraint kia_ai_budget_periods_unique unique (period_start, period_end)
);

create table if not exists public.kia_ai_budget_alerts (
  id uuid primary key default gen_random_uuid(),
  budget_period_id uuid not null references public.kia_ai_budget_periods(id) on delete cascade,
  alert_key text not null,
  severity text not null default 'high',
  spend_eur numeric(12,4),
  forecast_eur numeric(12,4),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint kia_ai_budget_alerts_severity_check check (severity in ('info','high','critical')),
  constraint kia_ai_budget_alerts_unique unique (budget_period_id, alert_key)
);

create index if not exists idx_kia_ai_budget_alerts_period
  on public.kia_ai_budget_alerts (budget_period_id, created_at desc);

alter table public.kia_ai_budget_periods enable row level security;
alter table public.kia_ai_budget_alerts enable row level security;

revoke all on public.kia_ai_budget_periods from anon, authenticated;
revoke all on public.kia_ai_budget_alerts from anon, authenticated;
grant select on public.kia_ai_budget_periods to authenticated;
grant select on public.kia_ai_budget_alerts to authenticated;
grant all on public.kia_ai_budget_periods to service_role;
grant all on public.kia_ai_budget_alerts to service_role;

drop policy if exists kia_ai_budget_periods_admin_read on public.kia_ai_budget_periods;
create policy kia_ai_budget_periods_admin_read
  on public.kia_ai_budget_periods
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin','owner')
        and coalesce(profiles.status,'active') <> 'inactive'
    )
  );

drop policy if exists kia_ai_budget_alerts_admin_read on public.kia_ai_budget_alerts;
create policy kia_ai_budget_alerts_admin_read
  on public.kia_ai_budget_alerts
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin','owner')
        and coalesce(profiles.status,'active') <> 'inactive'
    )
  );

insert into public.kia_ai_budget_periods (
  period_start,
  period_end,
  currency,
  usd_to_eur_rate,
  target_spend_eur,
  alert_spend_eur,
  hard_cap_eur,
  reserve_eur,
  provider_caps_eur,
  audience_caps_eur,
  thresholds,
  target_ai_revenue_pct,
  policy_version,
  status,
  forecast,
  actuals
)
values (
  date '2026-10-01',
  date '2026-11-01',
  'EUR',
  0.884506,
  150.00,
  200.00,
  300.00,
  60.00,
  '{"google":100,"anthropic":100,"openai":100}'::jsonb,
  '{
    "anonymous_session":0.05,
    "lead_daily":0.15,
    "qualified_lead":0.50,
    "client_revenue_pct":3.00,
    "high_value_margin_pct":5.00
  }'::jsonb,
  '[0.60,0.80,0.90,0.95,1.00]'::jsonb,
  5.000,
  '2026-10-v1',
  'active',
  '{"next_review":"2026-10-29","purpose":"baseline_for_november_2026"}'::jsonb,
  '{"provider_external_caps_eur":{"google":100,"anthropic":100,"openai":100}}'::jsonb
)
on conflict (period_start, period_end) do update
set
  currency = excluded.currency,
  usd_to_eur_rate = excluded.usd_to_eur_rate,
  target_spend_eur = excluded.target_spend_eur,
  alert_spend_eur = excluded.alert_spend_eur,
  hard_cap_eur = excluded.hard_cap_eur,
  reserve_eur = excluded.reserve_eur,
  provider_caps_eur = excluded.provider_caps_eur,
  audience_caps_eur = excluded.audience_caps_eur,
  thresholds = excluded.thresholds,
  target_ai_revenue_pct = excluded.target_ai_revenue_pct,
  policy_version = excluded.policy_version,
  status = excluded.status,
  updated_at = now();
