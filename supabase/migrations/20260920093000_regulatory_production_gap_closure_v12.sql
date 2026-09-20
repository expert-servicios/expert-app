-- KIA Regulatory Registry v1.2 production gap closure.
-- Separate broad discovery feeds from exact evidence sources used by canonical values.

update public.regulatory_sources
set metadata = coalesce(metadata, '{}'::jsonb) || '{"discovery_only":true,"monitoring_role":"source_directory"}'::jsonb
where source_key in ('aeat_rss_hub','seg_social_rss_hub');

insert into public.regulatory_sources
  (source_key, authority, title, url, fetch_url, source_type, fetch_strategy, priority, topics, check_frequency, metadata)
values
  (
    'boe_smi_2026',
    'BOE',
    'Real Decreto 126/2026 — SMI 2026',
    'https://www.boe.es/buscar/doc.php?id=BOE-A-2026-3815',
    'https://www.boe.es/buscar/doc.php?id=BOE-A-2026-3815',
    'legislation',
    'html',
    'critical',
    array['labor','smi','payroll'],
    'monthly',
    '{"official":true,"official_identifier":"BOE-A-2026-3815","evidence_source":true,"service_specific":false}'::jsonb
  ),
  (
    'boe_social_security_order_2026',
    'BOE',
    'Orden PJC/297/2026 — cotización Seguridad Social 2026',
    'https://www.boe.es/eli/es/o/2026/03/30/pjc297',
    'https://www.boe.es/eli/es/o/2026/03/30/pjc297',
    'legislation',
    'html',
    'critical',
    array['social_security','labor','cotizacion','mei'],
    'monthly',
    '{"official":true,"official_identifier":"BOE-A-2026-7296","evidence_source":true,"service_specific":false}'::jsonb
  ),
  (
    'boe_commercial_late_interest_2026_h2',
    'BOE',
    'Interés de demora comercial — segundo semestre 2026',
    'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-14327',
    'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-14327',
    'legislation',
    'html',
    'high',
    array['interest_rates','commercial_late_interest','finance'],
    'monthly',
    '{"official":true,"official_identifier":"BOE-A-2026-14327","evidence_source":true,"service_specific":false}'::jsonb
  ),
  (
    'aeat_interest_reference_2026',
    'AEAT',
    'AEAT — interés legal y de demora aplicables en 2026',
    'https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/guia-principales-novedades/otras-cuestiones-interes.html',
    'https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/guia-principales-novedades/otras-cuestiones-interes.html',
    'administrative',
    'html',
    'high',
    array['tax','interest_rates','legal_interest'],
    'monthly',
    '{"official":true,"evidence_source":true,"service_specific":false,"valid_until_budget_change":true}'::jsonb
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

update public.regulatory_values v
set source_id = s.id,
    metadata = coalesce(v.metadata, '{}'::jsonb) || jsonb_build_object(
      'evidence_source_key', s.source_key,
      'evidence_url', s.url
    )
from public.regulatory_sources s
where
  (v.value_key in ('SMI_MONTHLY','SMI_DAILY','SMI_ANNUAL') and s.source_key = 'boe_smi_2026')
  or (v.value_key in ('SS_MAX_BASE','MEI_RATE') and s.source_key = 'boe_social_security_order_2026')
  or (v.value_key = 'COMMERCIAL_LATE_INTEREST' and s.source_key = 'boe_commercial_late_interest_2026_h2')
  or (v.value_key in ('LEGAL_INTEREST','TAX_LATE_INTEREST') and s.source_key = 'aeat_interest_reference_2026');

insert into public.regulatory_dependencies
  (source_id, dependency_type, dependency_key, topic, criticality, metadata)
select s.id, d.dependency_type, d.dependency_key, d.topic, d.criticality,
       '{"evidence_dependency":true,"impact_requires_classification":true}'::jsonb
from public.regulatory_sources s
cross join (values
  ('course','gestion-laboral','labor','critical'),
  ('kia_prompt','labor','labor','critical'),
  ('calculator','payroll','labor','critical'),
  ('admin','labor-operations','labor','critical')
) as d(dependency_type, dependency_key, topic, criticality)
where s.source_key = 'boe_smi_2026'
on conflict (source_id, dependency_type, dependency_key)
where source_id is not null
do update set active=true, topic=excluded.topic, criticality=excluded.criticality, metadata=excluded.metadata;

insert into public.regulatory_dependencies
  (source_id, dependency_type, dependency_key, topic, criticality, metadata)
select s.id, d.dependency_type, d.dependency_key, d.topic, d.criticality,
       '{"evidence_dependency":true,"impact_requires_classification":true}'::jsonb
from public.regulatory_sources s
cross join (values
  ('course','gestion-laboral','social_security','critical'),
  ('kia_prompt','labor','social_security','critical'),
  ('calculator','payroll','social_security','critical'),
  ('admin','labor-operations','social_security','critical')
) as d(dependency_type, dependency_key, topic, criticality)
where s.source_key = 'boe_social_security_order_2026'
on conflict (source_id, dependency_type, dependency_key)
where source_id is not null
do update set active=true, topic=excluded.topic, criticality=excluded.criticality, metadata=excluded.metadata;

insert into public.regulatory_dependencies
  (source_id, dependency_type, dependency_key, topic, criticality, metadata)
select s.id, d.dependency_type, d.dependency_key, d.topic, d.criticality,
       '{"evidence_dependency":true,"impact_requires_classification":true}'::jsonb
from public.regulatory_sources s
cross join (values
  ('kia_prompt','legal','finance','high'),
  ('calculator','interest','interest_rates','high'),
  ('admin','economic-indicators','interest_rates','high')
) as d(dependency_type, dependency_key, topic, criticality)
where s.source_key = 'boe_commercial_late_interest_2026_h2'
on conflict (source_id, dependency_type, dependency_key)
where source_id is not null
do update set active=true, topic=excluded.topic, criticality=excluded.criticality, metadata=excluded.metadata;

insert into public.regulatory_dependencies
  (source_id, dependency_type, dependency_key, topic, criticality, metadata)
select s.id, d.dependency_type, d.dependency_key, d.topic, d.criticality,
       '{"evidence_dependency":true,"impact_requires_classification":true}'::jsonb
from public.regulatory_sources s
cross join (values
  ('kia_prompt','tax','tax','high'),
  ('kia_prompt','legal','finance','high'),
  ('calculator','interest','interest_rates','high'),
  ('admin','fiscal-operations','tax','high')
) as d(dependency_type, dependency_key, topic, criticality)
where s.source_key = 'aeat_interest_reference_2026'
on conflict (source_id, dependency_type, dependency_key)
where source_id is not null
do update set active=true, topic=excluded.topic, criticality=excluded.criticality, metadata=excluded.metadata;
