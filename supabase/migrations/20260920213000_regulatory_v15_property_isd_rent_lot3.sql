-- KIA Regulatory Registry v1.5 - Propiedad / ISD / alquiler lote 3
-- Cancelacion registral de hipoteca, ISD operativo CV y fianzas GVA/LAU.

insert into public.regulatory_sources
  (source_key, authority, title, url, fetch_url, source_type, fetch_strategy, priority, topics, check_frequency, metadata)
values
  (
    'atv_mortgage_cancellation_600',
    'Agencia Tributaria Valenciana',
    'ATV - Modelo 600 cancelacion de hipoteca',
    'https://atv.gva.es/documents/173852445/176137351/MODELO%2B600-CANCELACION%2BDE%2BHIPOTECA.pdf/9ca4a900-ceb5-4391-ae76-8b27ae8fe81f',
    'https://atv.gva.es/es/tributos-modelos-autoliquidacion',
    'administrative','html','critical',
    array['property','mortgage','cancellation','model_600','ajd'],'monthly',
    '{"official":true,"evidence_source":true,"jurisdiction":"Comunitat Valenciana"}'::jsonb
  ),
  (
    'gva_successions_650_2026',
    'Generalitat Valenciana',
    'GVA - Impuesto sobre Sucesiones, Modelo 650',
    'https://www.gva.es/es/inicio/procedimientos?id_proc=10',
    'https://www.gva.es/es/inicio/procedimientos?id_proc=10',
    'administrative','html','critical',
    array['tax','isd','successions','model_650','valencia'],'monthly',
    '{"official":true,"evidence_source":true,"jurisdiction":"Comunitat Valenciana","year":2026}'::jsonb
  ),
  (
    'gva_donations_651_2026',
    'Generalitat Valenciana',
    'GVA - Impuesto sobre Donaciones, Modelo 651',
    'https://sede.gva.es/es/detall-tramit?id_proc=11&version=red',
    'https://sede.gva.es/es/detall-tramit?id_proc=11&version=red',
    'administrative','html','critical',
    array['tax','isd','donations','model_651','valencia'],'monthly',
    '{"official":true,"evidence_source":true,"jurisdiction":"Comunitat Valenciana","year":2026}'::jsonb
  ),
  (
    'gva_rental_deposit_2026',
    'Generalitat Valenciana',
    'GVA - Deposito de fianza por arrendamiento de fincas urbanas',
    'https://sede.gva.es/es/inicio/procedimientos?id_proc=3023',
    'https://sede.gva.es/es/inicio/procedimientos?id_proc=3023',
    'administrative','html','critical',
    array['housing','rent','deposit','model_806','model_816','valencia'],'monthly',
    '{"official":true,"evidence_source":true,"jurisdiction":"Comunitat Valenciana","year":2026}'::jsonb
  ),
  (
    'boe_lau_article_36',
    'BOE',
    'Ley 29/1994 de Arrendamientos Urbanos - articulo 36 fianza',
    'https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003',
    'https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003',
    'legislation','html','critical',
    array['housing','rent','deposit','lau'],'monthly',
    '{"official":true,"evidence_source":true,"article":36}'::jsonb
  )
on conflict (source_key) do update set
  authority=excluded.authority,title=excluded.title,url=excluded.url,fetch_url=excluded.fetch_url,
  source_type=excluded.source_type,fetch_strategy=excluded.fetch_strategy,priority=excluded.priority,
  topics=excluded.topics,check_frequency=excluded.check_frequency,metadata=excluded.metadata,active=true;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'VALENCIA_MORTGAGE_CANCELLATION_2026',
  'Comunitat Valenciana - cancelacion registral de hipoteca',
  1,'2026-01-01',null,s.id,
  '{
    "economic_debt_vs_registry":{
      "loan_paid_does_not_remove_registry_charge":true,
      "registry_cancellation_optional_but_needed_to_remove_charge":true
    },
    "ordinary_route":[
      "obtain evidence that the secured obligation is extinguished",
      "creditor grants the public deed of mortgage cancellation through its authorised representative",
      "file Modelo 600 as AJD subject but exempt",
      "present deed and tax filing evidence to the Property Registry",
      "verify cancellation with updated registry information"
    ],
    "valencia_tax":{
      "model":"600",
      "ajd_status":"subject_but_exempt",
      "exemption_code":"M017 24",
      "tax_due_eur":0
    },
    "cost_policy":"Notarial and registry fees may remain even though AJD tax due is zero.",
    "special_route":"Legal-expiry cancellation can exist in specific statutory circumstances; do not apply it automatically without checking registry dates and interruptions.",
    "rule":"Do not say the bank automatically cancels the registry charge, and do not say cancellation is legally mandatory in every case. Distinguish debt extinction from registry cancellation."
  }'::jsonb,
  '{"official_reference":"ATV Modelo 600 cancelacion de hipoteca + Registradores de España","human_review_if_expiry_partial_cancellation_or_multiple_properties":true}'::jsonb
from public.regulatory_sources s where s.source_key='atv_mortgage_cancellation_600'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'VALENCIA_SUCCESSIONS_650_2026',
  'Comunitat Valenciana - ISD sucesiones Modelo 650 operativo',
  1,'2026-01-01',null,s.id,
  '{
    "model":"650",
    "general_deadline":"6 months from date of death or final declaration of death",
    "extension":{
      "available":true,
      "additional_period":"same period, generally another 6 months",
      "request_deadline":"within the first 5 months from death"
    },
    "usufruct":{
      "termination_by_death_deadline":"6 months",
      "termination_for_other_reason_deadline":"1 month"
    },
    "benefit_source":"VALENCIA_ISD_2026",
    "valuation_source":"VALENCIA_PROPERTY_TRANSFER_BASE_2026 when real estate reference value is relevant",
    "rule":"Do not confuse the tax filing deadline with the civil decision to accept or renounce the inheritance. Determine tax jurisdiction, heirs, assets and valuation separately."
  }'::jsonb,
  '{"official_reference":"GVA Modelo 650 procedure 2026","human_review_if_nonresident_multiple_jurisdictions_or_usufruct":true}'::jsonb
from public.regulatory_sources s where s.source_key='gva_successions_650_2026'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'VALENCIA_DONATIONS_651_2026',
  'Comunitat Valenciana - ISD donaciones Modelo 651 operativo',
  1,'2026-01-01',null,s.id,
  '{
    "model":"651",
    "general_deadline":"1 month from the taxable act or contract",
    "jurisdiction":{
      "real_estate":"For Valencian filing competence, the donated real estate must be located in Comunitat Valenciana, subject to the statutory residence/connection rules.",
      "other_assets":"For Valencian filing competence, use the acquirer/donee habitual residence connection rule."
    },
    "benefit_source":"VALENCIA_ISD_2026",
    "real_estate_valuation_source":"VALENCIA_PROPERTY_TRANSFER_BASE_2026 when reference value applies",
    "public_document_rule":"Check VALENCIA_ISD_2026 before applying family bonus to inter vivos gifts because public-document and relationship requirements may apply.",
    "rule":"Do not use a universal 'donee residence' rule for every donation. Determine whether the gift is real estate or another asset and apply the correct territorial connection."
  }'::jsonb,
  '{"official_reference":"GVA Modelo 651 procedure 2026 + ATV Donaciones","human_review_if_nonresident_mixed_assets_or_multiple_regions":true}'::jsonb
from public.regulatory_sources s where s.source_key='gva_donations_651_2026'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'VALENCIA_RENTAL_DEPOSIT_2026',
  'Comunitat Valenciana - fianza de arrendamientos urbanos',
  1,'2026-01-01',null,s.id,
  '{
    "legal_amount":{
      "housing_months":1,
      "non_housing_months":2,
      "source":"LAU article 36"
    },
    "gva_deposit":{
      "responsible_party":"landlord",
      "deadline":"within 1 month following execution of the contract under the current 2026 GVA procedure",
      "start_note":"follow the current GVA procedural page if legacy form instructions show an older deadline",
      "electronic_model":"816",
      "in_person_model":"806",
      "electronic_mandatory_for":"persons/entities legally required to interact electronically with the Administration",
      "required_core_documents":["lease contract","cadastral reference"]
    },
    "late_deposit":{
      "up_to_3_months_after_voluntary_deadline_percent":5,
      "between_3_and_6_months_percent":10,
      "between_6_and_12_months_percent":15,
      "over_12_months_percent":20,
      "note":"If the late surcharge is not paid together with the principal when applicable, the administration may assess the statutory surcharge and interest."
    },
    "tenant_refund_interest":"The statutory cash deposit balance accrues legal interest after 1 month from key handover if not returned by the landlord, under LAU article 36.",
    "rule":"Separate the tenant-to-landlord legal deposit from the landlord-to-Generalitat deposit obligation. Use the current GVA procedure for the administrative filing deadline."
  }'::jsonb,
  '{"official_reference":"GVA procedure G3023 updated 2026 + LAU art. 36","jurisdiction":"Comunitat Valenciana","legacy_deadline_conflict_resolved":"current GVA procedure prevails operationally over older 806 instructions"}'::jsonb
from public.regulatory_sources s where s.source_key='gva_rental_deposit_2026'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_dependencies
  (ruleset_key,dependency_type,dependency_key,topic,criticality,metadata)
values
  ('VALENCIA_MORTGAGE_CANCELLATION_2026','service','hipoteca-cancelacion','property','critical','{"impact_requires_classification":true}'::jsonb),
  ('VALENCIA_MORTGAGE_CANCELLATION_2026','kia_prompt','legal','property','critical','{"impact_requires_classification":true}'::jsonb),
  ('VALENCIA_SUCCESSIONS_650_2026','service','herencia','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('VALENCIA_SUCCESSIONS_650_2026','kia_prompt','ccaa','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('VALENCIA_DONATIONS_651_2026','service','donacion','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('VALENCIA_DONATIONS_651_2026','kia_prompt','ccaa','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('VALENCIA_RENTAL_DEPOSIT_2026','knowledge','rental-deposit-valencia','housing','critical','{"impact_requires_classification":true}'::jsonb),
  ('VALENCIA_RENTAL_DEPOSIT_2026','service','contabilidad-mensual','housing','medium','{"impact_requires_classification":true}'::jsonb),
  ('VALENCIA_RENTAL_DEPOSIT_2026','kia_prompt','ccaa','housing','critical','{"impact_requires_classification":true}'::jsonb)
on conflict (ruleset_key,dependency_type,dependency_key)
where ruleset_key is not null
do update set topic=excluded.topic,criticality=excluded.criticality,active=true,metadata=excluded.metadata;
