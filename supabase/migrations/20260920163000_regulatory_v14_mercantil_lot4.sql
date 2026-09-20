-- KIA Regulatory Registry v1.4 - Mercantil lote 4
-- Titularidad real, NIF de entidades / Modelo 036 y apoderamientos mercantiles.

insert into public.regulatory_sources
  (source_key, authority, title, url, fetch_url, source_type, fetch_strategy, priority, topics, check_frequency, metadata)
values
  (
    'boe_rctr_609_2023',
    'BOE',
    'Real Decreto 609/2023 - Registro Central de Titularidades Reales',
    'https://www.boe.es/buscar/act.php?id=BOE-A-2023-16159',
    'https://www.boe.es/buscar/act.php?id=BOE-A-2023-16159',
    'legislation','html','critical',
    array['corporate','beneficial_owner','rctr','registry','aml'],'monthly',
    '{"official":true,"evidence_source":true}'::jsonb
  ),
  (
    'boe_aml_beneficial_owner_304_2014',
    'BOE',
    'Real Decreto 304/2014 - identificacion del titular real',
    'https://www.boe.es/buscar/act.php?id=BOE-A-2014-4742',
    'https://www.boe.es/buscar/act.php?id=BOE-A-2014-4742',
    'legislation','html','critical',
    array['corporate','beneficial_owner','aml'],'monthly',
    '{"official":true,"evidence_source":true,"articles":[8,9]}'::jsonb
  ),
  (
    'aeat_entity_nif_g324',
    'AEAT',
    'AEAT - NIF de personas juridicas y entidades: provisional y definitivo',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientos/G324.shtml',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientos/G324.shtml',
    'administrative','html','critical',
    array['tax','census','model_036','entity_nif'],'monthly',
    '{"official":true,"evidence_source":true,"service_specific":true}'::jsonb
  ),
  (
    'boe_rrm_mercantile_powers',
    'BOE',
    'Reglamento del Registro Mercantil - poderes generales y representacion',
    'https://www.boe.es/buscar/act.php?id=BOE-A-1996-17533',
    'https://www.boe.es/buscar/act.php?id=BOE-A-1996-17533',
    'legislation','html','high',
    array['corporate','powers','commercial_registry','representation'],'monthly',
    '{"official":true,"evidence_source":true,"articles":[94,108,124]}'::jsonb
  )
on conflict (source_key) do update set
  authority=excluded.authority,title=excluded.title,url=excluded.url,fetch_url=excluded.fetch_url,
  source_type=excluded.source_type,fetch_strategy=excluded.fetch_strategy,priority=excluded.priority,
  topics=excluded.topics,check_frequency=excluded.check_frequency,metadata=excluded.metadata,active=true;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'BENEFICIAL_OWNERSHIP_RCTR_RULES',
  'Titularidad real - sociedades mercantiles y Registro Central de Titularidades Reales',
  1,'2026-01-01',null,s.id,
  '{
    "company_beneficial_owner":{
      "ownership_or_voting_threshold":"more than 25 percent, direct or indirect",
      "control_by_other_means":true,
      "fallback_when_no_natural_person_meets_control_test":"administrator or administrators; if administrator is a legal person, the natural person appointed by that legal-person administrator",
      "legal_basis":"RD 304/2014 art. 8"
    },
    "information_to_keep_current":{
      "fields":["name","surname","date_of_birth","identification_document","country_of_issue","country_of_residence","nationality","qualifying_criterion","direct_or_indirect_percentage_and_intermediate_entities_when_applicable","valid_email_for_notices"],
      "administrators_must_keep_adequate_precise_current_information":true
    },
    "mercantile_companies":{
      "annual_accounts_sheet":true,
      "change_declaration_to_commercial_registry":{
        "deadline_days":10,
        "start_rule":"from the day after the administrators become aware of the beneficial ownership change"
      },
      "central_registry_data_flow":"Commercial Registry data are transferred to the Central Beneficial Ownership Registry"
    },
    "entities_without_registry_declaration_path":{
      "initial_direct_rctr_deadline":"maximum 1 month from constitution",
      "change_update_deadline_days":10,
      "annual_confirmation_month":"January"
    },
    "registry_closure_link":"Failure to identify/report beneficial ownership through the required annual-accounts sheet can trigger the registry closure mechanism.",
    "rule":"Do not infer beneficial ownership from a simple shareholder list. Resolve direct and indirect ownership, voting rights and control by other means; use the administrator fallback only if no natural person qualifies."
  }'::jsonb,
  '{"official_reference":"RD 304/2014 arts. 8-9; RD 609/2023 and RCTR Regulation","human_review_if_indirect_control_or_chain":true}'::jsonb
from public.regulatory_sources s where s.source_key='boe_rctr_609_2023'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'ENTITY_NIF_036_RULES',
  'NIF de personas juridicas - provisional, definitivo y Modelo 036',
  1,'2026-01-01',null,s.id,
  '{
    "provisional_nif":{
      "model":"036",
      "request_box":110,
      "status_rule":"remains provisional while constitution/statutes and public-registration evidence required for the entity have not all been supplied",
      "label_rule":"an entity in formation can appear with the wording EN CONSTITUCION until full constitution is documented"
    },
    "definitive_nif":{
      "model":"036",
      "declaration_type":"census modification",
      "request_box":120,
      "required_action":"supply pending documentation and any unreported changes from the provisional request",
      "pending_document_deadline":"1 month from registration in the corresponding public registry, or from execution of the relevant documents when registration is not required",
      "possible_aeat_request_if_late":true,
      "late_request_response_max_days":10,
      "noncompliance_risk":"provisional NIF may be revoked"
    },
    "automation_note":"Notary/registry cooperation agreements can transmit information needed for provisional or definitive NIF assignment, so do not assume a separate manual 036 is always required in a CIRCE/notarial flow.",
    "terminology":"Use NIF for the current tax identification number; avoid presenting CIF as the current legal name of the identifier.",
    "rule":"Check whether the NIF is provisional or definitive and whether pending registration/documentation has already reached AEAT before requesting a duplicate manual filing."
  }'::jsonb,
  '{"official_reference":"AEAT G324; Modelo 036 boxes 110 and 120","human_review_if_circe_or_notarial_data_transfer":true}'::jsonb
from public.regulatory_sources s where s.source_key='aeat_entity_nif_g324'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'MERCANTILE_POWERS_RRM_RULES',
  'Apoderamientos mercantiles - inscripcion y representacion',
  1,'2026-01-01',null,s.id,
  '{
    "general_powers":{
      "registration":"mandatory in the company Commercial Registry sheet",
      "also_registered":["delegations_of_powers","modification","revocation","substitution"]
    },
    "exceptions_to_mandatory_registration":["general_power_for_litigation","power_for_specific_acts"],
    "public_instrument":{
      "general_rule":"corporate powers intended for registration are formalised in the appropriate public instrument",
      "raising_corporate_resolutions_by_non_certifying_person":"requires the appropriate power deed; if that power is general for all kinds of corporate resolutions, it must be registered"
    },
    "representation":{
      "administrative_body_representation":"depends on the registered administration structure and statutory representation rules",
      "do_not_confuse":"organic representation by directors is distinct from voluntary representation by an attorney-in-fact"
    },
    "rule":"Classify the power before saying registration is mandatory. General commercial powers are registrable; litigation powers and powers for specific acts are statutory exceptions to mandatory registration."
  }'::jsonb,
  '{"official_reference":"RRM arts. 94, 108 and 124; DGSJFP Resolution 08/07/2025","human_review_if_scope_or_registration_unclear":true}'::jsonb
from public.regulatory_sources s where s.source_key='boe_rrm_mercantile_powers'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_dependencies
  (ruleset_key,dependency_type,dependency_key,topic,criticality,metadata)
values
  ('BENEFICIAL_OWNERSHIP_RCTR_RULES','service','cuentas-anuales','corporate','critical','{"impact_requires_classification":true}'::jsonb),
  ('BENEFICIAL_OWNERSHIP_RCTR_RULES','service','constitucion-sl','corporate','high','{"impact_requires_classification":true}'::jsonb),
  ('BENEFICIAL_OWNERSHIP_RCTR_RULES','service','constitucion-sl-circe','corporate','high','{"impact_requires_classification":true}'::jsonb),
  ('BENEFICIAL_OWNERSHIP_RCTR_RULES','service','apoderamientos-mercantiles','corporate','high','{"impact_requires_classification":true}'::jsonb),
  ('BENEFICIAL_OWNERSHIP_RCTR_RULES','course','formacion-alta-autonomo-sl','corporate','high','{"impact_requires_classification":true}'::jsonb),
  ('BENEFICIAL_OWNERSHIP_RCTR_RULES','kia_prompt','registries','corporate','critical','{"impact_requires_classification":true}'::jsonb),

  ('ENTITY_NIF_036_RULES','service','constitucion-sl','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('ENTITY_NIF_036_RULES','service','constitucion-sl-circe','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('ENTITY_NIF_036_RULES','service','contabilidad-mensual','tax','high','{"impact_requires_classification":true}'::jsonb),
  ('ENTITY_NIF_036_RULES','course','formacion-alta-autonomo-sl','tax','high','{"impact_requires_classification":true}'::jsonb),
  ('ENTITY_NIF_036_RULES','kia_prompt','tax','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('ENTITY_NIF_036_RULES','kia_prompt','pae','tax','high','{"impact_requires_classification":true}'::jsonb),

  ('MERCANTILE_POWERS_RRM_RULES','service','apoderamientos-mercantiles','corporate','critical','{"impact_requires_classification":true}'::jsonb),
  ('MERCANTILE_POWERS_RRM_RULES','service','constitucion-sl','corporate','high','{"impact_requires_classification":true}'::jsonb),
  ('MERCANTILE_POWERS_RRM_RULES','kia_prompt','registries','corporate','critical','{"impact_requires_classification":true}'::jsonb)
on conflict (ruleset_key,dependency_type,dependency_key)
where ruleset_key is not null
do update set topic=excluded.topic,criticality=excluded.criticality,active=true,metadata=excluded.metadata;
