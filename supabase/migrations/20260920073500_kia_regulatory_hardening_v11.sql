-- KIA Regulatory Registry v1.1 hardening
-- Precise change impact, latest-published indicators, traceable resolution,
-- service-specific official sources and reliable pg_net timeouts.

alter table public.regulatory_changes
  add column if not exists change_evidence text,
  add column if not exists evidence_complete boolean not null default false,
  add column if not exists resolution_note text,
  add column if not exists resolution_evidence jsonb not null default '{}'::jsonb;

create table if not exists public.regulatory_change_dependencies (
  id uuid primary key default gen_random_uuid(),
  change_id uuid not null references public.regulatory_changes(id) on delete cascade,
  dependency_id uuid not null references public.regulatory_dependencies(id) on delete cascade,
  impact_reason text not null,
  confidence numeric(5,4),
  created_at timestamptz not null default now(),
  unique(change_id, dependency_id)
);

create index if not exists regulatory_change_dependencies_change_idx
  on public.regulatory_change_dependencies(change_id);
create index if not exists regulatory_change_dependencies_dependency_idx
  on public.regulatory_change_dependencies(dependency_id);

alter table public.regulatory_change_dependencies enable row level security;
revoke all on table public.regulatory_change_dependencies from public, anon, authenticated;
grant select, insert, update, delete on table public.regulatory_change_dependencies to service_role;

drop policy if exists "regulatory_change_dependencies_deny_browser" on public.regulatory_change_dependencies;
create policy "regulatory_change_dependencies_deny_browser"
  on public.regulatory_change_dependencies
  for all to anon, authenticated
  using (false) with check (false);

update public.regulatory_values
set metadata = coalesce(metadata, '{}'::jsonb) || '{"availability_mode":"latest_published"}'::jsonb
where value_key = 'IPC_ANNUAL';

insert into public.regulatory_sources
  (source_key, authority, title, url, fetch_url, source_type, fetch_strategy, priority, topics, check_frequency, metadata)
values
  (
    'migraciones_arraigo_social',
    'Migraciones',
    'Migraciones — Hoja 28 Arraigo social',
    'https://www.inclusion.gob.es/web/migraciones/w/autorizacion-residencia-temporal-por-circunstancias-excepcionales.-arraigo-social',
    'https://www.inclusion.gob.es/web/migraciones/w/autorizacion-residencia-temporal-por-circunstancias-excepcionales.-arraigo-social',
    'administrative','html','critical',
    array['immigration','arraigo','arraigo_social'],
    'daily',
    '{"official":true,"service_specific":true}'::jsonb
  ),
  (
    'migraciones_arraigo_familiar',
    'Migraciones',
    'Migraciones — Hoja 31 Arraigo familiar',
    'https://www.inclusion.gob.es/web/migraciones/w/autorizacion-residencia-temporal-por-circunstancias-excepcionales.-arraigo-familiar',
    'https://www.inclusion.gob.es/web/migraciones/w/autorizacion-residencia-temporal-por-circunstancias-excepcionales.-arraigo-familiar',
    'administrative','html','critical',
    array['immigration','arraigo','arraigo_familiar'],
    'daily',
    '{"official":true,"service_specific":true}'::jsonb
  ),
  (
    'migraciones_arraigo_sociolaboral',
    'Migraciones',
    'Migraciones — Hoja 29 Arraigo sociolaboral',
    'https://inclusion.gob.es/web/migraciones/w/29.-autorizacion-de-residencia-temporal-por-circunstancias-excepcionales.-arraigo-sociolaboral.',
    'https://inclusion.gob.es/web/migraciones/w/29.-autorizacion-de-residencia-temporal-por-circunstancias-excepcionales.-arraigo-sociolaboral.',
    'administrative','html','critical',
    array['immigration','arraigo','arraigo_sociolaboral','labor'],
    'daily',
    '{"official":true,"service_specific":true}'::jsonb
  ),
  (
    'migraciones_reagrupacion_familiar',
    'Migraciones',
    'Migraciones — Hoja 8 Reagrupación familiar',
    'https://www.inclusion.gob.es/web/migraciones/w/autorizacion-de-residencia-temporal-por-reagrupacion-familiar',
    'https://www.inclusion.gob.es/web/migraciones/w/autorizacion-de-residencia-temporal-por-reagrupacion-familiar',
    'administrative','html','critical',
    array['immigration','family_reunification'],
    'daily',
    '{"official":true,"service_specific":true}'::jsonb
  ),
  (
    'justicia_nacionalidad_residencia',
    'Ministerio de Justicia',
    'Justicia — Nacionalidad española por residencia',
    'https://sede.mjusticia.gob.es/es/tramites/nacionalidad-espanola',
    'https://sede.mjusticia.gob.es/es/tramites/nacionalidad-espanola',
    'administrative','html','critical',
    array['nationality','immigration','civil_registry'],
    'daily',
    '{"official":true,"service_specific":true}'::jsonb
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

-- Replace generic BOE service links for arraigo with the official service-specific Migraciones pages.
delete from public.regulatory_dependencies d
using public.regulatory_sources s
where d.source_id = s.id
  and s.source_key = 'boe_daily_sumario'
  and d.dependency_type in ('service','operational_blueprint','viability')
  and d.dependency_key in ('arraigo-social','arraigo-familiar','arraigo-laboral');

with mapping(source_key, service_key, topic) as (
  values
    ('migraciones_arraigo_social','arraigo-social','immigration'),
    ('migraciones_arraigo_familiar','arraigo-familiar','immigration'),
    ('migraciones_arraigo_sociolaboral','arraigo-laboral','immigration'),
    ('migraciones_reagrupacion_familiar','reagrupacion-familiar','immigration'),
    ('justicia_nacionalidad_residencia','nacionalidad-espanola','nationality'),
    ('justicia_nacionalidad_residencia','nacionalidad-espanola-menor-nacido-en-espana','nationality')
)
insert into public.regulatory_dependencies
  (source_id, dependency_type, dependency_key, topic, criticality)
select s.id, dt.dependency_type, m.service_key, m.topic, 'critical'
from mapping m
join public.regulatory_sources s on s.source_key = m.source_key
cross join (values ('service'),('operational_blueprint'),('viability')) as dt(dependency_type)
on conflict do nothing;

-- Generic services still need a regulatory graph even when the exact administrative
-- sheet depends on the underlying permit or private certificate provider.
with mapping(service_key, topic, criticality) as (
  values
    ('renovacion-residencia','immigration','critical'),
    ('certificado-digital-persona-fisica','digital_identity','high'),
    ('certificado-digital-entidad','digital_identity','high'),
    ('pack-certificados-digitales','digital_identity','high')
)
insert into public.regulatory_dependencies
  (source_id, dependency_type, dependency_key, topic, criticality)
select s.id, dt.dependency_type, m.service_key, m.topic, m.criticality
from mapping m
join public.regulatory_sources s on s.source_key = 'boe_daily_sumario'
cross join (values ('service'),('operational_blueprint'),('viability')) as dt(dependency_type)
on conflict do nothing;

create or replace function public.apply_regulatory_value_reviewed(
  p_value_key text,
  p_label text,
  p_numeric_value numeric,
  p_text_value text,
  p_unit text,
  p_period_key text,
  p_valid_from date,
  p_valid_to date,
  p_source_id uuid,
  p_change_id uuid,
  p_metadata jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_id uuid;
  v_previous_id uuid;
begin
  if p_valid_to is not null and p_valid_to < p_valid_from then
    raise exception 'valid_to cannot be before valid_from';
  end if;

  if exists (
    select 1
    from public.regulatory_values
    where value_key = p_value_key
      and valid_from > p_valid_from
      and (p_valid_to is null or valid_from <= p_valid_to)
  ) then
    raise exception 'new regulatory value overlaps a future value';
  end if;

  select id
  into v_previous_id
  from public.regulatory_values
  where value_key = p_value_key
    and valid_from < p_valid_from
    and (valid_to is null or valid_to >= p_valid_from)
  order by valid_from desc
  limit 1
  for update;

  insert into public.regulatory_values (
    value_key, label, numeric_value, text_value, unit, period_key,
    valid_from, valid_to, source_id, change_id, verified_at, metadata
  )
  values (
    p_value_key, p_label, p_numeric_value, p_text_value, p_unit, p_period_key,
    p_valid_from, p_valid_to, p_source_id, p_change_id, now(), coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (value_key, period_key, valid_from) do update set
    label = excluded.label,
    numeric_value = excluded.numeric_value,
    text_value = excluded.text_value,
    unit = excluded.unit,
    valid_to = excluded.valid_to,
    source_id = excluded.source_id,
    change_id = excluded.change_id,
    verified_at = excluded.verified_at,
    metadata = excluded.metadata
  returning id into v_id;

  if v_previous_id is not null then
    update public.regulatory_values
    set valid_to = p_valid_from - 1
    where id = v_previous_id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.apply_regulatory_value_reviewed(
  text,text,numeric,text,text,text,date,date,uuid,uuid,jsonb
) from public, anon, authenticated;
grant execute on function public.apply_regulatory_value_reviewed(
  text,text,numeric,text,text,text,date,date,uuid,uuid,jsonb
) to service_role;

-- pg_net defaults to 5s. Regulatory pulse takes longer because it checks several
-- remote official sources serially. Use a 30s transport timeout to avoid false failures.
do $$
begin perform cron.unschedule('regulatory-pulse-daily');
exception when others then null;
end $$;
do $$
begin perform cron.unschedule('regulatory-worker-hourly');
exception when others then null;
end $$;
do $$
begin perform cron.unschedule('regulatory-monthly-audit');
exception when others then null;
end $$;

select cron.schedule(
  'regulatory-pulse-daily',
  '17 5 * * *',
  $job$
  select net.http_post(
    url := 'https://expertconsulting.es/api/cron/regulatory-pulse',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  )
  where exists (select 1 from vault.decrypted_secrets where name = 'cron_secret')
  $job$
);

select cron.schedule(
  'regulatory-worker-hourly',
  '37 * * * *',
  $job$
  select net.http_post(
    url := 'https://expertconsulting.es/api/cron/regulatory-worker',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  )
  where exists (select 1 from vault.decrypted_secrets where name = 'cron_secret')
  $job$
);

select cron.schedule(
  'regulatory-monthly-audit',
  '41 5 3 * *',
  $job$
  select net.http_post(
    url := 'https://expertconsulting.es/api/cron/regulatory-monthly-audit',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  )
  where exists (select 1 from vault.decrypted_secrets where name = 'cron_secret')
  $job$
);

comment on table public.regulatory_change_dependencies is
  'Explicit KIA-reviewed impact links from one detected change to affected EXPERT dependencies.';
