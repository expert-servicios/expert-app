-- KIA Regulatory Registry v1
-- Canonical, server-side only registry for official legal sources, snapshots,
-- detected changes, operational values and dependency mapping.

create table if not exists public.regulatory_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  authority text not null,
  title text not null,
  url text not null,
  fetch_url text not null,
  source_type text not null check (source_type in ('legislation','administrative','rss','indicator','dataset')),
  fetch_strategy text not null check (fetch_strategy in ('html','rss','json','xml','boe_daily')),
  priority text not null default 'normal' check (priority in ('normal','high','critical')),
  topics text[] not null default '{}',
  check_frequency text not null default 'daily' check (check_frequency in ('daily','monthly','manual')),
  active boolean not null default true,
  last_checked_at timestamptz,
  last_changed_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  last_fingerprint text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.regulatory_sources(id) on delete cascade,
  fetched_at timestamptz not null default now(),
  fingerprint text not null,
  source_published_at timestamptz,
  official_identifier text,
  title text,
  normalized_excerpt text,
  metadata jsonb not null default '{}'::jsonb,
  unique(source_id, fingerprint)
);

create table if not exists public.regulatory_changes (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.regulatory_sources(id) on delete cascade,
  previous_snapshot_id uuid references public.regulatory_snapshots(id) on delete set null,
  current_snapshot_id uuid not null references public.regulatory_snapshots(id) on delete cascade,
  status text not null default 'detected'
    check (status in ('detected','classified','ignored','needs_review','proposal_ready','resolved')),
  severity text check (severity is null or severity in ('info','low','medium','high','critical')),
  change_type text check (change_type is null or change_type in (
    'irrelevant','informational','content_update','operational_update',
    'calculation_update','product_update','critical_legal_change'
  )),
  relevant boolean,
  summary text,
  effective_date date,
  requires_human_review boolean not null default true,
  classification_confidence numeric(5,4),
  classified_by text,
  classification_model text,
  classified_at timestamptz,
  proposed_files jsonb not null default '[]'::jsonb,
  value_updates jsonb not null default '[]'::jsonb,
  dependency_hints jsonb not null default '[]'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_values (
  id uuid primary key default gen_random_uuid(),
  value_key text not null,
  label text not null,
  numeric_value numeric,
  text_value text,
  unit text,
  period_key text not null default 'current',
  valid_from date not null,
  valid_to date,
  source_id uuid references public.regulatory_sources(id) on delete set null,
  change_id uuid references public.regulatory_changes(id) on delete set null,
  verified_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(value_key, period_key, valid_from)
);

create table if not exists public.regulatory_dependencies (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.regulatory_sources(id) on delete cascade,
  value_key text,
  dependency_type text not null check (dependency_type in (
    'service','operational_blueprint','viability','blog','knowledge','kia_prompt',
    'calculator','course','social','seo','telegram','admin'
  )),
  dependency_key text not null,
  topic text,
  criticality text not null default 'normal' check (criticality in ('normal','high','critical')),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (source_id is not null or value_key is not null)
);

create table if not exists public.regulatory_review_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null check (run_type in ('daily_pulse','worker','monthly_audit','manual')),
  status text not null default 'running' check (status in ('running','succeeded','partial','failed')),
  triggered_by text not null default 'cron',
  scope jsonb not null default '{}'::jsonb,
  sources_checked integer not null default 0,
  sources_changed integer not null default 0,
  changes_classified integer not null default 0,
  critical_changes integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists regulatory_sources_active_frequency_idx
  on public.regulatory_sources(active, check_frequency);
create index if not exists regulatory_snapshots_source_fetched_idx
  on public.regulatory_snapshots(source_id, fetched_at desc);
create index if not exists regulatory_changes_status_created_idx
  on public.regulatory_changes(status, created_at);
create index if not exists regulatory_changes_severity_idx
  on public.regulatory_changes(severity, created_at desc);
create index if not exists regulatory_values_key_valid_idx
  on public.regulatory_values(value_key, valid_from desc);
create index if not exists regulatory_dependencies_source_idx
  on public.regulatory_dependencies(source_id, dependency_type, dependency_key);
create index if not exists regulatory_dependencies_value_idx
  on public.regulatory_dependencies(value_key, dependency_type, dependency_key);

alter table public.regulatory_sources enable row level security;
alter table public.regulatory_snapshots enable row level security;
alter table public.regulatory_changes enable row level security;
alter table public.regulatory_values enable row level security;
alter table public.regulatory_dependencies enable row level security;
alter table public.regulatory_review_runs enable row level security;

revoke all on table
  public.regulatory_sources,
  public.regulatory_snapshots,
  public.regulatory_changes,
  public.regulatory_values,
  public.regulatory_dependencies,
  public.regulatory_review_runs
from public, anon, authenticated;

grant select, insert, update, delete on table
  public.regulatory_sources,
  public.regulatory_snapshots,
  public.regulatory_changes,
  public.regulatory_values,
  public.regulatory_dependencies,
  public.regulatory_review_runs
to service_role;

create policy "regulatory_sources_deny_browser" on public.regulatory_sources
for all to anon, authenticated using (false) with check (false);
create policy "regulatory_snapshots_deny_browser" on public.regulatory_snapshots
for all to anon, authenticated using (false) with check (false);
create policy "regulatory_changes_deny_browser" on public.regulatory_changes
for all to anon, authenticated using (false) with check (false);
create policy "regulatory_values_deny_browser" on public.regulatory_values
for all to anon, authenticated using (false) with check (false);
create policy "regulatory_dependencies_deny_browser" on public.regulatory_dependencies
for all to anon, authenticated using (false) with check (false);
create policy "regulatory_review_runs_deny_browser" on public.regulatory_review_runs
for all to anon, authenticated using (false) with check (false);

insert into public.regulatory_sources
  (source_key, authority, title, url, fetch_url, source_type, fetch_strategy, priority, topics, check_frequency, metadata)
values
  (
    'boe_daily_sumario',
    'BOE',
    'Sumario diario del BOE',
    'https://www.boe.es/datosabiertos/api/api.php?lang=es',
    'https://www.boe.es/datosabiertos/api/boe/sumario/{date}',
    'legislation',
    'boe_daily',
    'critical',
    array['legal','tax','labor','social_security','corporate','immigration'],
    'daily',
    '{"official":true,"format":"json"}'::jsonb
  ),
  (
    'aeat_rss_hub',
    'AEAT',
    'AEAT — RSS y novedades',
    'https://sede.agenciatributaria.gob.es/Sede/informacion-institucional/suscripcion-rss-newsletter/rss.html',
    'https://sede.agenciatributaria.gob.es/Sede/informacion-institucional/suscripcion-rss-newsletter/rss.html',
    'administrative',
    'html',
    'critical',
    array['tax','accounting'],
    'daily',
    '{"official":true}'::jsonb
  ),
  (
    'seg_social_rss_hub',
    'Seguridad Social',
    'Seguridad Social — RSS legislativo y Sistema RED',
    'https://www.seg-social.es/wps/portal/wss/internet/RSS',
    'https://www.seg-social.es/wps/portal/wss/internet/RSS',
    'administrative',
    'html',
    'critical',
    array['social_security','labor'],
    'daily',
    '{"official":true,"channels":["Novedades Legislativas","Boletines Sistema RED","Avisos RED"]}'::jsonb
  ),
  (
    'ine_ipc_publications',
    'INE',
    'INE — publicaciones IPC',
    'https://www.ine.es/dyngs/Prensa/notasPrensa.htm',
    'https://www.ine.es/dyngs/Prensa/notasPrensa.htm',
    'indicator',
    'html',
    'high',
    array['inflation','ipc','rent_updates'],
    'daily',
    '{"official":true}'::jsonb
  ),
  (
    'bde_interest_rates',
    'Banco de España',
    'Banco de España — estadísticas de tipos de interés',
    'https://www.bde.es/webbe/es/estadisticas/temas/tipos-interes.html',
    'https://www.bde.es/webbe/es/estadisticas/temas/tipos-interes.html',
    'indicator',
    'html',
    'high',
    array['interest_rates','euribor','finance'],
    'daily',
    '{"official":true}'::jsonb
  )
on conflict (source_key) do update set
  authority = excluded.authority,
  title = excluded.title,
  url = excluded.url,
  fetch_url = excluded.fetch_url,
  source_type = excluded.source_type,
  fetch_strategy = excluded.fetch_strategy,
  priority = excluded.priority,
  topics = excluded.topics,
  check_frequency = excluded.check_frequency,
  metadata = excluded.metadata,
  active = true;

-- 2026 canonical operational values. These are seeded with explicit validity and
-- must be superseded by later official records rather than overwritten.
insert into public.regulatory_values
  (value_key, label, numeric_value, unit, period_key, valid_from, valid_to, metadata)
values
  ('SMI_MONTHLY', 'Salario Mínimo Interprofesional mensual', 1221.00, 'EUR/month', '2026', '2026-01-01', '2026-12-31', '{"official_reference":"BOE-A-2026-3815"}'),
  ('SMI_DAILY', 'Salario Mínimo Interprofesional diario', 40.70, 'EUR/day', '2026', '2026-01-01', '2026-12-31', '{"official_reference":"BOE-A-2026-3815"}'),
  ('SMI_ANNUAL', 'Salario Mínimo Interprofesional anual', 17094.00, 'EUR/year', '2026', '2026-01-01', '2026-12-31', '{"official_reference":"BOE-A-2026-3815"}'),
  ('LEGAL_INTEREST', 'Interés legal del dinero', 3.25, 'percent', '2026', '2026-01-01', '2026-12-31', '{"official_reference":"AEAT-2026"}'),
  ('TAX_LATE_INTEREST', 'Interés de demora tributario', 4.0625, 'percent', '2026', '2026-01-01', '2026-12-31', '{"official_reference":"AEAT-2026"}'),
  ('COMMERCIAL_LATE_INTEREST', 'Interés de demora operaciones comerciales', 10.40, 'percent', '2026-H2', '2026-07-01', '2026-12-31', '{"official_reference":"BOE-A-2026-14327"}'),
  ('SS_MAX_BASE', 'Base máxima de cotización Régimen General', 5101.20, 'EUR/month', '2026', '2026-01-01', '2026-12-31', '{"official_reference":"Orden PJC/297/2026"}'),
  ('MEI_RATE', 'Mecanismo de Equidad Intergeneracional', 0.90, 'percent', '2026', '2026-01-01', '2026-12-31', '{"official_reference":"Orden PJC/297/2026"}'),
  ('IPC_ANNUAL', 'IPC general interanual', 4.30, 'percent', '2026-08', '2026-08-01', '2026-08-31', '{"official_reference":"INE agosto 2026"}')
on conflict (value_key, period_key, valid_from) do nothing;

-- Core batch-1 dependency graph.
insert into public.regulatory_dependencies
  (source_id, dependency_type, dependency_key, topic, criticality)
select s.id, d.dependency_type, d.dependency_key, d.topic, d.criticality
from public.regulatory_sources s
cross join (values
  ('service','arraigo-social','immigration','critical'),
  ('operational_blueprint','arraigo-social','immigration','critical'),
  ('viability','arraigo-social','immigration','critical'),
  ('service','arraigo-laboral','immigration','critical'),
  ('operational_blueprint','arraigo-laboral','immigration','critical'),
  ('viability','arraigo-laboral','immigration','critical'),
  ('service','arraigo-familiar','immigration','critical'),
  ('operational_blueprint','arraigo-familiar','immigration','critical'),
  ('viability','arraigo-familiar','immigration','critical'),
  ('kia_prompt','immigration','immigration','high'),
  ('telegram','batch1-immigration','immigration','high')
) as d(dependency_type, dependency_key, topic, criticality)
where s.source_key = 'boe_daily_sumario'
on conflict do nothing;

insert into public.regulatory_dependencies
  (value_key, dependency_type, dependency_key, topic, criticality)
values
  ('SMI_MONTHLY','course','gestion-laboral','labor','critical'),
  ('SMI_MONTHLY','kia_prompt','labor','labor','critical'),
  ('SMI_MONTHLY','calculator','payroll','labor','critical'),
  ('MEI_RATE','course','gestion-laboral','social_security','critical'),
  ('MEI_RATE','kia_prompt','labor','social_security','critical'),
  ('SS_MAX_BASE','course','gestion-laboral','social_security','critical'),
  ('SS_MAX_BASE','calculator','payroll','social_security','critical'),
  ('IPC_ANNUAL','kia_prompt','tax','inflation','high'),
  ('LEGAL_INTEREST','kia_prompt','tax','tax','high'),
  ('TAX_LATE_INTEREST','kia_prompt','tax','tax','high'),
  ('COMMERCIAL_LATE_INTEREST','kia_prompt','legal','finance','high')
on conflict do nothing;

comment on table public.regulatory_sources is 'Canonical registry of official sources monitored by KIA Regulatory Pulse.';
comment on table public.regulatory_changes is 'Detected official-source changes. Never auto-merged or auto-published.';
comment on table public.regulatory_values is 'Canonical time-bounded operational values consumed by KIA/calculators.';
comment on table public.regulatory_dependencies is 'Impact graph from sources/values to EXPERT services, content and operations.';
