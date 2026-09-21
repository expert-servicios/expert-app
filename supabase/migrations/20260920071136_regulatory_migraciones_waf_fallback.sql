-- Migraciones pages are public for human navigation but deny server-to-server access (HTTP 403).
-- Keep them as official manual references and use BOE consolidated RD 1155/2024 as the automatic source.

update public.regulatory_sources
set
  active = false,
  last_error = null,
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'official', true,
    'monitoring_mode', 'manual_reference',
    'disabled_reason', 'official_site_denies_server_to_server_access_403',
    'automatic_fallback_source', 'boe_rd_1155_2024'
  )
where source_key in (
  'migraciones_arraigo_social',
  'migraciones_arraigo_familiar',
  'migraciones_arraigo_sociolaboral',
  'migraciones_reagrupacion_familiar',
  'migraciones_renovacion_hub'
);

update public.regulatory_dependencies d
set
  active = false,
  metadata = coalesce(d.metadata, '{}'::jsonb) || jsonb_build_object(
    'monitoring_mode', 'manual_reference',
    'automatic_fallback_source', 'boe_rd_1155_2024'
  )
from public.regulatory_sources s
where d.source_id = s.id
  and s.source_key in (
    'migraciones_arraigo_social',
    'migraciones_arraigo_familiar',
    'migraciones_arraigo_sociolaboral',
    'migraciones_reagrupacion_familiar',
    'migraciones_renovacion_hub'
  );

with service_keys(service_key) as (
  values
    ('arraigo-social'),
    ('arraigo-familiar'),
    ('arraigo-laboral'),
    ('reagrupacion-familiar'),
    ('renovacion-residencia')
)
insert into public.regulatory_dependencies
  (source_id, dependency_type, dependency_key, topic, criticality, metadata)
select
  s.id,
  dt.dependency_type,
  sk.service_key,
  'immigration',
  'critical',
  jsonb_build_object(
    'automatic_primary', true,
    'manual_reference_authority', 'Migraciones',
    'impact_requires_classification', true
  )
from public.regulatory_sources s
cross join service_keys sk
cross join (values ('service'),('operational_blueprint'),('viability')) as dt(dependency_type)
where s.source_key = 'boe_rd_1155_2024'
on conflict (source_id, dependency_type, dependency_key)
where source_id is not null
do update set
  active = true,
  topic = excluded.topic,
  criticality = excluded.criticality,
  metadata = excluded.metadata;

update public.regulatory_sources
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'automatic_primary_for_immigration_services', true,
  'service_specific', false
)
where source_key = 'boe_rd_1155_2024';
