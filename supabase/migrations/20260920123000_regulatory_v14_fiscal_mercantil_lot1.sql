-- KIA Regulatory Registry v1.4 - Fiscal/Mercantil lote 1
-- Modelos 720/721 y regimen especial de desplazados (149/151).
-- Fuentes oficiales AEAT, rulesets server-only y dependencias explicitas.

insert into public.regulatory_sources
  (source_key, authority, title, url, fetch_url, source_type, fetch_strategy, priority, topics, check_frequency, metadata)
values
  (
    'aeat_model_720',
    'AEAT',
    'AEAT - Modelo 720 bienes y derechos situados en el extranjero',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientos/GI34.shtml',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientos/GI34.shtml',
    'administrative',
    'html',
    'high',
    array['tax','informative_returns','model_720','international_tax'],
    'monthly',
    '{"official":true,"evidence_source":true,"service_specific":true}'::jsonb
  ),
  (
    'aeat_model_721',
    'AEAT',
    'AEAT - Modelo 721 monedas virtuales situadas en el extranjero',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GI55.shtml',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GI55.shtml',
    'administrative',
    'html',
    'high',
    array['tax','informative_returns','model_721','crypto','international_tax'],
    'monthly',
    '{"official":true,"evidence_source":true,"service_specific":true}'::jsonb
  ),
  (
    'aeat_beckham_149_151',
    'AEAT',
    'AEAT - Regimen especial de trabajadores, profesionales, emprendedores e inversores desplazados',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientos/G606.shtml',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientos/G606.shtml',
    'administrative',
    'html',
    'critical',
    array['tax','irpf','impatriates','model_149','model_151'],
    'monthly',
    '{"official":true,"evidence_source":true,"service_specific":true}'::jsonb
  )
on conflict (source_key) do update set
  authority=excluded.authority,
  title=excluded.title,
  url=excluded.url,
  fetch_url=excluded.fetch_url,
  source_type=excluded.source_type,
  fetch_strategy=excluded.fetch_strategy,
  priority=excluded.priority,
  topics=excluded.topics,
  check_frequency=excluded.check_frequency,
  metadata=excluded.metadata,
  active=true;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'MODEL_720_RULES',
  'Modelo 720 - bienes y derechos situados en el extranjero',
  1,'2026-01-01',null,s.id,
  '{
    "filing_window":{"from":"01-01","to":"03-31","reference":"year following the information year"},
    "categories":["foreign_accounts","securities_rights_insurance_and_income","foreign_real_estate_and_rights"],
    "initial_threshold_eur_per_category":50000,
    "subsequent_filing_increase_threshold_eur":20000,
    "rules":[
      "The EUR 50,000 threshold is evaluated separately for each statutory information category, subject to the valuation rules and exemptions applicable to that category.",
      "After a category has been reported, a later-year filing is generally required when the relevant value has increased by more than EUR 20,000 compared with the value that determined the last filing, without prejudice to cases such as loss of ownership that must also be reviewed.",
      "Do not include virtual currencies in Modelo 720 merely because they are crypto assets; Modelo 721 has its own scope."
    ],
    "calculation_policy":"Do not decide filing obligation from a single asset amount. Aggregate and classify by statutory category and apply exemptions first."
  }'::jsonb,
  '{"official_reference":"AEAT Modelo 720; arts. 42 bis, 42 ter and 54 bis RD 1065/2007","human_review_if_edge_case":true}'::jsonb
from public.regulatory_sources s where s.source_key='aeat_model_720'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to, source_id=excluded.source_id, payload=excluded.payload,
  verified_at=now(), metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'MODEL_721_RULES',
  'Modelo 721 - monedas virtuales situadas en el extranjero',
  1,'2026-01-01',null,s.id,
  '{
    "filing_window":{"from":"01-01","to":"03-31","reference":"year following the information year"},
    "initial_joint_balance_threshold_eur":50000,
    "subsequent_filing_increase_threshold_eur":20000,
    "rules":[
      "If the aggregate 31 December balance of reportable virtual currencies abroad does not exceed EUR 50,000, the monetary threshold exemption applies, subject to the other statutory exclusions.",
      "After the first filing, a later-year filing is required when the aggregate 31 December balance has increased by more than EUR 20,000 compared with the amount that determined the last filing.",
      "A loss of previously reportable ownership, beneficiary, authorization, disposal power or beneficial ownership before 31 December can itself trigger reporting under the statutory rules.",
      "Fiat money held in an account with a foreign exchange is not reported as virtual currency in Modelo 721; it may fall within Modelo 720 if its separate requirements are met."
    ],
    "calculation_policy":"Determine custodian location, statutory status, exclusions and aggregate EUR balance before concluding that filing is required."
  }'::jsonb,
  '{"official_reference":"AEAT Modelo 721 FAQ; art. 42 quater RD 1065/2007; Orden HFP/886/2023","human_review_if_custody_or_location_unclear":true}'::jsonb
from public.regulatory_sources s where s.source_key='aeat_model_721'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to, source_id=excluded.source_id, payload=excluded.payload,
  verified_at=now(), metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'IMPARTIATES_149_151_RULES',
  'Regimen especial de desplazados - Modelos 149 y 151',
  1,'2026-01-01',null,s.id,
  '{
    "duration":{"first_period":"tax year in which Spanish tax residence is acquired under the regime","additional_periods":5},
    "model_149":{
      "purpose":["option","renunciation","exclusion","end_of_displacement"],
      "principal_option_deadline":"6 months from start of activity",
      "associated_taxpayer_option_deadline":"later of 6 months from the principal taxpayer activity start or 6 months from the associated taxpayer entry into Spain",
      "requires_tax_census_registration":true,
      "supporting_documents_before_option":true
    },
    "model_151":{"required_return_for_regime_taxpayer":true},
    "rules":[
      "Do not treat the popular name Beckham regime as a single employment-only route; the current regime also covers other statutory displacement cases.",
      "Eligibility must be checked against article 93 LIRPF and its regulatory development before assuming the option is available.",
      "The option deadline is material: do not infer that a late Model 149 can be regularized as an ordinary on-time option."
    ]
  }'::jsonb,
  '{"official_reference":"AEAT Modelo 149/151; art. 93 LIRPF; arts. 113-119 RIRPF","requires_case_eligibility_review":true}'::jsonb
from public.regulatory_sources s where s.source_key='aeat_beckham_149_151'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to, source_id=excluded.source_id, payload=excluded.payload,
  verified_at=now(), metadata=excluded.metadata;

insert into public.regulatory_dependencies
  (ruleset_key,dependency_type,dependency_key,topic,criticality,metadata)
values
  ('MODEL_720_RULES','service','modelo-720','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('MODEL_720_RULES','service','modelos-informativos','tax','high','{"impact_requires_classification":true}'::jsonb),
  ('MODEL_720_RULES','course','formacion-planificacion-fiscal','tax','high','{"impact_requires_classification":true}'::jsonb),
  ('MODEL_720_RULES','kia_prompt','tax','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('MODEL_721_RULES','service','modelos-informativos','tax','high','{"impact_requires_classification":true}'::jsonb),
  ('MODEL_721_RULES','course','formacion-planificacion-fiscal','tax','high','{"impact_requires_classification":true}'::jsonb),
  ('MODEL_721_RULES','kia_prompt','tax','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('IMPARTIATES_149_151_RULES','service','modelo-151','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('IMPARTIATES_149_151_RULES','course','formacion-planificacion-fiscal','tax','high','{"impact_requires_classification":true}'::jsonb),
  ('IMPARTIATES_149_151_RULES','kia_prompt','tax','tax','critical','{"impact_requires_classification":true}'::jsonb)
on conflict (ruleset_key,dependency_type,dependency_key)
where ruleset_key is not null
do update set topic=excluded.topic, criticality=excluded.criticality, active=true, metadata=excluded.metadata;
