-- KIA Regulatory Registry - source health closure
-- Official monitoring fallbacks for sources blocked from serverless fetches
-- and explicit impact dependencies for supporting official sources.

update public.regulatory_sources
set fetch_url = case source_key
      when 'atv_valencia_reference_value'
        then 'https://sede.gva.es/es/detall-tramit?id_proc=16&version=red'
      when 'atv_valencia_model_600'
        then 'https://sede.gva.es/es/detall-tramit?id_proc=17&version=red'
      when 'atv_mortgage_cancellation_600'
        then 'https://sede.gva.es/es/detall-tramit?id_proc=17&version=red'
      when 'pae_circe_due'
        then 'https://paeelectronico.es/es-es/CreaEmpresaPorTiMismo/Paginas/Home.aspx'
      else fetch_url
    end,
    metadata = coalesce(metadata, '{}'::jsonb) || case source_key
      when 'atv_valencia_reference_value' then
        '{"monitoring_fallback_official":true,"monitoring_fallback_authority":"Generalitat Valenciana","monitoring_fallback_scope":"ITP property transfer procedure with official reference-value link","canonical_url_preserved":true}'::jsonb
      when 'atv_valencia_model_600' then
        '{"monitoring_fallback_official":true,"monitoring_fallback_authority":"Generalitat Valenciana","monitoring_fallback_scope":"ITP/AJD notarial documents and Modelo 600 procedure","canonical_url_preserved":true}'::jsonb
      when 'atv_mortgage_cancellation_600' then
        '{"monitoring_fallback_official":true,"monitoring_fallback_authority":"Generalitat Valenciana","monitoring_fallback_scope":"AJD notarial documents and Modelo 600 procedure","canonical_url_preserved":true}'::jsonb
      when 'pae_circe_due' then
        '{"monitoring_fallback_official":true,"monitoring_fallback_authority":"PAE Electronico","monitoring_fallback_scope":"CIRCE and PAE Virtual official landing page","canonical_url_preserved":true}'::jsonb
      else '{}'::jsonb
    end
where source_key in (
  'atv_valencia_reference_value',
  'atv_valencia_model_600',
  'atv_mortgage_cancellation_600',
  'pae_circe_due'
);

with source_ruleset_map(source_key, ruleset_key) as (
  values
    ('atv_valencia_model_600', 'VALENCIA_PROPERTY_TRANSFER_BASE_2026'),
    ('boe_excise_tax_law_38_1992', 'IEDMT_REGISTRATION_2026'),
    ('aeat_model_131', 'IRPF_PAYMENT_FRACTIONS_2026'),
    ('aeat_model_349', 'INFORMATIVE_RETURNS_2026'),
    ('aeat_model_390', 'INFORMATIVE_RETURNS_2026'),
    ('boe_aml_beneficial_owner_304_2014', 'BENEFICIAL_OWNERSHIP_RCTR_RULES'),
    ('dgt_vehicle_import_non_eu', 'VEHICLE_IMPORT_REGISTRATION_2026'),
    ('aeat_vehicle_import_customs', 'VEHICLE_IMPORT_REGISTRATION_2026'),
    ('dgt_foreign_licence_exchange_2026', 'DGT_DUPLICATES_PERMITS_2026'),
    ('dgt_vehicle_document_duplicate_2026', 'DGT_DUPLICATES_PERMITS_2026'),
    ('boe_lau_article_36', 'VALENCIA_RENTAL_DEPOSIT_2026'),
    ('transportes_recreation_navigation_permit', 'MARITIME_RECREATIONAL_CRAFT_2026'),
    ('transportes_rate_025', 'MARITIME_RECREATIONAL_CRAFT_2026'),
    ('transportes_recreation_registry_data', 'MARITIME_RECREATIONAL_CRAFT_2026')
),
copied_dependencies as (
  select
    s.id as source_id,
    d.dependency_type,
    d.dependency_key,
    d.topic,
    d.criticality,
    coalesce(d.metadata, '{}'::jsonb)
      || jsonb_build_object(
        'inherited_from_ruleset', m.ruleset_key,
        'supporting_source', true,
        'impact_requires_classification', true
      ) as metadata
  from source_ruleset_map m
  join public.regulatory_sources s
    on s.source_key = m.source_key
  join public.regulatory_dependencies d
    on d.ruleset_key = m.ruleset_key
   and d.active
)
insert into public.regulatory_dependencies
  (source_id, dependency_type, dependency_key, topic, criticality, metadata)
select
  source_id,
  dependency_type,
  dependency_key,
  topic,
  criticality,
  metadata
from copied_dependencies
on conflict (source_id, dependency_type, dependency_key)
where source_id is not null
do update set
  topic = excluded.topic,
  criticality = excluded.criticality,
  active = true,
  metadata = excluded.metadata;
