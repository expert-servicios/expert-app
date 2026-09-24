-- KIA Regulatory Registry v1.4 - Mercantil lote 3
-- Cuentas anuales, cierre registral, legalizacion de libros y CIRCE/PAE/DUE.

insert into public.regulatory_sources
  (source_key, authority, title, url, fetch_url, source_type, fetch_strategy, priority, topics, check_frequency, metadata)
values
  (
    'boe_lsc_accounts',
    'BOE',
    'Ley de Sociedades de Capital - cuentas anuales, deposito, cierre y sanciones',
    'https://www.boe.es/buscar/act.php?id=BOE-A-2010-10544',
    'https://www.boe.es/buscar/act.php?id=BOE-A-2010-10544',
    'legislation','html','critical',
    array['corporate','annual_accounts','registry','sanctions'],'monthly',
    '{"official":true,"evidence_source":true,"articles":[164,253,279,282,283]}'::jsonb
  ),
  (
    'boe_rrm_accounts_closure',
    'BOE',
    'Reglamento del Registro Mercantil - cierre por falta de deposito de cuentas',
    'https://www.boe.es/buscar/act.php?id=BOE-A-1996-17533',
    'https://www.boe.es/buscar/act.php?id=BOE-A-1996-17533',
    'legislation','html','critical',
    array['corporate','annual_accounts','registry_closure'],'monthly',
    '{"official":true,"evidence_source":true,"articles":[378]}'::jsonb
  ),
  (
    'boe_commercial_code_books',
    'BOE',
    'Codigo de Comercio - legalizacion de libros',
    'https://www.boe.es/buscar/act.php?id=BOE-A-1885-6627',
    'https://www.boe.es/buscar/act.php?id=BOE-A-1885-6627',
    'legislation','html','high',
    array['corporate','accounting_books','legalization'],'monthly',
    '{"official":true,"evidence_source":true,"articles":[27]}'::jsonb
  ),
  (
    'pae_circe_due',
    'PAE Electronico',
    'PAE Electronico - CIRCE y Documento Unico Electronico',
    'https://www.paeelectronico.es/es-es/CreaEmpresaPorTiMismo/Paginas/CIRCE.aspx',
    'https://www.paeelectronico.es/es-es/CreaEmpresaPorTiMismo/Paginas/CIRCE.aspx',
    'administrative','html','high',
    array['corporate','circe','pae','due','company_creation'],'monthly',
    '{"official":true,"evidence_source":true,"service_specific":true}'::jsonb
  )
on conflict (source_key) do update set
  authority=excluded.authority,title=excluded.title,url=excluded.url,fetch_url=excluded.fetch_url,
  source_type=excluded.source_type,fetch_strategy=excluded.fetch_strategy,priority=excluded.priority,
  topics=excluded.topics,check_frequency=excluded.check_frequency,metadata=excluded.metadata,active=true;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'ANNUAL_ACCOUNTS_LSC_RULES',
  'Sociedades de capital - ciclo anual de cuentas, deposito y sanciones',
  1,'2026-01-01',null,s.id,
  '{
    "formulation":{
      "deadline_rule":"maximum 3 months from financial year end",
      "legal_basis":"LSC art. 253"
    },
    "ordinary_general_meeting":{
      "deadline_rule":"within the first 6 months of each financial year to approve, where appropriate, management, prior-year accounts and result allocation",
      "late_meeting_valid":true,
      "legal_basis":"LSC art. 164"
    },
    "deposit":{
      "deadline_rule":"within 1 month following approval of the annual accounts",
      "legal_basis":"LSC art. 279"
    },
    "registry_closure":{
      "general_rule":"documents relating to the company are not registered while the deposit breach persists",
      "exceptions":["dismissal_or_resignation_of_directors_managers_general_managers_or_liquidators","revocation_or_renunciation_of_powers","company_dissolution","appointment_of_liquidators","entries_ordered_by_judicial_or_administrative_authority"],
      "legal_basis":"LSC art. 282"
    },
    "sanctions":{
      "general_min_eur":1200,
      "general_max_eur":60000,
      "turnover_threshold_eur":6000000,
      "max_per_year_delay_if_above_turnover_threshold_eur":300000,
      "assessment":"depends on company size using assets and sales data",
      "legal_basis":"LSC art. 283"
    },
    "calculation_policy":"Derive dates from the actual financial year end and actual approval date. Never answer with a universal 30/31 July deadline."
  }'::jsonb,
  '{"official_reference":"LSC arts. 164, 253, 279, 282 and 283","human_review_if_accounts_not_approved":true}'::jsonb
from public.regulatory_sources s where s.source_key='boe_lsc_accounts'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'REGISTRY_CLOSURE_RRM_RULES',
  'Registro Mercantil - cierre por falta de deposito de cuentas',
  1,'2026-01-01',null,s.id,
  '{
    "trigger":"one year after financial year end without deposit of duly approved annual accounts",
    "exceptions":["dismissal_or_resignation_of_directors_managers_general_managers_or_liquidators","revocation_or_renunciation_of_powers","company_dissolution","appointment_of_liquidators","entries_ordered_by_judicial_or_administrative_authority"],
    "accounts_not_approved":{
      "closure_can_be_prevented":true,
      "evidence":["management_body_certificate_with_legitimized_signatures_explaining_nonapproval","authorized_copy_of_notarial_minutes_showing_nonapproval"],
      "initial_evidence_deadline":"before the one-year closure period expires",
      "continuation_evidence_every_months":6
    },
    "closure_ends_when":["pending_accounts_are_deposited","lack_of_approval_is_proved_in_the_regulatory_form"],
    "legal_basis":"RRM art. 378",
    "rule":"Do not describe registry closure as an absolute ban on every filing; apply the express statutory exceptions and the non-approval mechanism."
  }'::jsonb,
  '{"official_reference":"RRM art. 378","human_review_if_closure_or_nonapproval":true}'::jsonb
from public.regulatory_sources s where s.source_key='boe_rrm_accounts_closure'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'BOOK_LEGALIZATION_RULES',
  'Legalizacion de libros obligatorios - Codigo de Comercio',
  1,'2026-01-01',null,s.id,
  '{
    "deadline_rule":"before 4 months have elapsed following the financial year end",
    "legal_basis":"Codigo de Comercio art. 27.2",
    "scope_rule":"Apply to mandatory books and verify the specific book type and corporate form before answering documentary details.",
    "calculation_policy":"Calculate from the actual financial year end; do not hardcode 30 April except as an example for a 31 December year end."
  }'::jsonb,
  '{"official_reference":"Codigo de Comercio art. 27.2"}'::jsonb
from public.regulatory_sources s where s.source_key='boe_commercial_code_books'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'CIRCE_PAE_DUE_RULES',
  'CIRCE / PAE / Documento Unico Electronico - constitucion y tramites empresariales',
  1,'2026-01-01',null,s.id,
  '{
    "pae":{
      "role":"public or private offices, including notaries and commercial registries, plus virtual points, that facilitate company creation and entrepreneurial procedures",
      "uses_circe":true
    },
    "circe":{
      "role":"unified electronic business processing system",
      "supported_core_examples":["limited_liability_company_creation","self_employed_registration","certain_company_or_self_employed_cessation_processes"],
      "authentication":["Cl@ve","recognized_electronic_certificate"],
      "due_required":true
    },
    "due":{
      "role":"single electronic document that distributes the relevant information to participating authorities",
      "typical_data":["company_and_shareholder_data","workplace_and_activity","tax_census_information","social_security_data","notary_appointment_data"]
    },
    "limited_company":{
      "negative_name_certificate_required_before_creation":true,
      "notarial_deed_required":true,
      "notarial_channel":"verify the current channel and selected notary; CIRCE coordinates the notarial step but must not be described as eliminating it",
      "capital_rule_source":"SL_CAPITAL_RULES",
      "tax_census_source":"AEAT_CENSUS_MODEL_036"
    },
    "rule":"Do not promise a fully no-presence incorporation merely because CIRCE is electronic. Verify the current notarial channel and use SL_CAPITAL_RULES for capital."
  }'::jsonb,
  '{"official_reference":"Ley 14/2013 art. 13 + PAE Electronico CIRCE operational guidance","human_review_if_custom_articles_or_complex_shareholding":true}'::jsonb
from public.regulatory_sources s where s.source_key='pae_circe_due'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_dependencies
  (ruleset_key,dependency_type,dependency_key,topic,criticality,metadata)
values
  ('ANNUAL_ACCOUNTS_LSC_RULES','service','cuentas-anuales','corporate','critical','{"impact_requires_classification":true}'::jsonb),
  ('ANNUAL_ACCOUNTS_LSC_RULES','service','contabilidad-mensual','corporate','high','{"impact_requires_classification":true}'::jsonb),
  ('ANNUAL_ACCOUNTS_LSC_RULES','course','formacion-alta-autonomo-sl','corporate','high','{"impact_requires_classification":true}'::jsonb),
  ('ANNUAL_ACCOUNTS_LSC_RULES','kia_prompt','registries','corporate','critical','{"impact_requires_classification":true}'::jsonb),
  ('REGISTRY_CLOSURE_RRM_RULES','service','cuentas-anuales','corporate','critical','{"impact_requires_classification":true}'::jsonb),
  ('REGISTRY_CLOSURE_RRM_RULES','service','apoderamientos-mercantiles','corporate','high','{"impact_requires_classification":true}'::jsonb),
  ('REGISTRY_CLOSURE_RRM_RULES','kia_prompt','registries','corporate','critical','{"impact_requires_classification":true}'::jsonb),
  ('BOOK_LEGALIZATION_RULES','service','cuentas-anuales','corporate','high','{"impact_requires_classification":true}'::jsonb),
  ('BOOK_LEGALIZATION_RULES','service','contabilidad-mensual','corporate','high','{"impact_requires_classification":true}'::jsonb),
  ('BOOK_LEGALIZATION_RULES','course','formacion-fiscal-contable','corporate','high','{"impact_requires_classification":true}'::jsonb),
  ('BOOK_LEGALIZATION_RULES','kia_prompt','registries','corporate','high','{"impact_requires_classification":true}'::jsonb),
  ('CIRCE_PAE_DUE_RULES','service','constitucion-sl','corporate','critical','{"impact_requires_classification":true}'::jsonb),
  ('CIRCE_PAE_DUE_RULES','service','constitucion-sl-circe','corporate','critical','{"impact_requires_classification":true}'::jsonb),
  ('CIRCE_PAE_DUE_RULES','service','alta-autonomo','corporate','high','{"impact_requires_classification":true}'::jsonb),
  ('CIRCE_PAE_DUE_RULES','course','formacion-alta-autonomo-sl','corporate','high','{"impact_requires_classification":true}'::jsonb),
  ('CIRCE_PAE_DUE_RULES','kia_prompt','pae','corporate','critical','{"impact_requires_classification":true}'::jsonb)
on conflict (ruleset_key,dependency_type,dependency_key)
where ruleset_key is not null
do update set topic=excluded.topic,criticality=excluded.criticality,active=true,metadata=excluded.metadata;
