-- KIA Regulatory Registry v1.5 - cierre final DGT / Capitania
-- Duplicados y permisos DGT + embarcaciones de recreo / Marina Mercante.

-- Complete the 2026 DGT fee ruleset without overlapping current versions.
update public.regulatory_rulesets
set valid_to = '2026-09-19',
    metadata = coalesce(metadata,'{}'::jsonb) || '{"superseded_by_schema_version":2,"reason":"complete rate 4.1 coverage"}'::jsonb
where ruleset_key = 'DGT_FEES_2026'
  and schema_version = 1
  and valid_from = '2026-01-01';

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'DGT_FEES_2026',
  'DGT - tasas principales 2026',
  2,'2026-09-20','2026-12-31',s.id,
  '{
    "fees_eur":{
      "vehicle_registration_rate_1_1":99.77,
      "moped_registration_rate_1_2":27.85,
      "vehicle_transfer_rate_1_5":55.70,
      "administrative_annotation_or_detailed_report_rate_4_1":8.67,
      "duplicate_driving_or_circulation_document_rate_4_4":20.81
    },
    "rule":"Use the exact fee type for the actual procedure. Do not infer that all duplicates use rate 4.4: an eITV duplicate and some administrative annotations use rate 4.1."
  }'::jsonb,
  '{"official_reference":"DGT 2026 rates and services","year":2026,"revision":"adds rate 4.1 coverage"}'::jsonb
from public.regulatory_sources s where s.source_key='dgt_fees_2026'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_sources
  (source_key, authority, title, url, fetch_url, source_type, fetch_strategy, priority, topics, check_frequency, metadata)
values
  (
    'dgt_driving_licence_duplicate_2026',
    'DGT',
    'DGT - Duplicado del permiso de conducir',
    'https://www.dgt.es/nuestros-servicios/permisos-de-conducir/ha-caducado-o-necesitas-una-copia-de-tu-permiso/duplicado-por-deterioro-perdida-robo-o-cambio-de-datos/index.html',
    'https://www.dgt.es/nuestros-servicios/permisos-de-conducir/ha-caducado-o-necesitas-una-copia-de-tu-permiso/duplicado-por-deterioro-perdida-robo-o-cambio-de-datos/index.html',
    'administrative','html','critical',
    array['traffic','driving_licence','duplicate','dgt'],'monthly',
    '{"official":true,"evidence_source":true,"updated":"2026-03-02"}'::jsonb
  ),
  (
    'dgt_vehicle_document_duplicate_2026',
    'DGT',
    'DGT - Duplicado y renovacion de documentacion del vehiculo',
    'https://www.dgt.es/nuestros-servicios/tu-vehiculo/documentacion-de-un-vehiculo/has-perdido-o-deteriorado-la-documentacion/',
    'https://www.dgt.es/nuestros-servicios/tu-vehiculo/documentacion-de-un-vehiculo/has-perdido-o-deteriorado-la-documentacion/',
    'administrative','html','critical',
    array['traffic','circulation_permit','eitv','duplicate','dgt'],'monthly',
    '{"official":true,"evidence_source":true,"year":2026}'::jsonb
  ),
  (
    'dgt_foreign_licence_exchange_2026',
    'DGT',
    'DGT - Paises con convenio de canje de permisos',
    'https://www.dgt.es/nuestros-servicios/permisos-de-conducir/permisos-extranjeros-y-de-fuerzas-y-cuerpos-de-seguridad/canjes-de-permisos/paises-con-convenio-de-canjes',
    'https://www.dgt.es/nuestros-servicios/permisos-de-conducir/permisos-extranjeros-y-de-fuerzas-y-cuerpos-de-seguridad/canjes-de-permisos/paises-con-convenio-de-canjes',
    'administrative','html','high',
    array['traffic','driving_licence','exchange','foreign_permit'],'monthly',
    '{"official":true,"evidence_source":true,"updated":"2026-06-26"}'::jsonb
  ),
  (
    'transportes_recreation_registration',
    'Direccion General de la Marina Mercante',
    'Sede Transportes - Inscripcion y abanderamiento/matriculacion de embarcaciones de recreo',
    'https://sede.transportes.gob.es/areas-actividad/marina-mercantemaritimo/registro-buques/embarcaciones-recreo/inscripcion-abanderamientomatriculacion',
    'https://sede.transportes.gob.es/areas-actividad/marina-mercantemaritimo/registro-buques/embarcaciones-recreo/inscripcion-abanderamientomatriculacion',
    'administrative','html','critical',
    array['maritime','recreational_craft','registration','flagging'],'monthly',
    '{"official":true,"evidence_source":true}'::jsonb
  ),
  (
    'transportes_recreation_registry_data',
    'Direccion General de la Marina Mercante',
    'Sede Transportes - Otros tramites relativos a datos registrales de embarcaciones de recreo',
    'https://sede.transportes.gob.es/areas-actividad/marina-mercantemaritimo/registro-buques/embarcaciones-recreo/otros-tramites-relativos-datos-registrales',
    'https://sede.transportes.gob.es/areas-actividad/marina-mercantemaritimo/registro-buques/embarcaciones-recreo/otros-tramites-relativos-datos-registrales',
    'administrative','html','critical',
    array['maritime','recreational_craft','ownership_transfer','registry'],'monthly',
    '{"official":true,"evidence_source":true}'::jsonb
  ),
  (
    'transportes_recreation_navigation_permit',
    'Direccion General de la Marina Mercante',
    'Sede Transportes - Certificado de Registro Espanol / Permiso de Navegacion',
    'https://sede.transportes.gob.es/areas-actividad/marina-mercantemaritimo/registro-buques/embarcaciones-recreo/certificado-registro-espanol-permiso-navegacion-embarcaciones-matriculadas',
    'https://sede.transportes.gob.es/areas-actividad/marina-mercantemaritimo/registro-buques/embarcaciones-recreo/certificado-registro-espanol-permiso-navegacion-embarcaciones-matriculadas',
    'administrative','html','high',
    array['maritime','recreational_craft','navigation_permit','duplicate','renewal'],'monthly',
    '{"official":true,"evidence_source":true}'::jsonb
  ),
  (
    'transportes_rate_025',
    'Direccion General de la Marina Mercante',
    'Sede Transportes - Tasa codigo 025',
    'https://sede.transportes.gob.es/pago-tasas/tasas-autoliquidables/codigo-025',
    'https://sede.transportes.gob.es/pago-tasas/tasas-autoliquidables/codigo-025',
    'administrative','html','high',
    array['maritime','fees','code_025','registry'],'monthly',
    '{"official":true,"evidence_source":true}'::jsonb
  )
on conflict (source_key) do update set
  authority=excluded.authority,title=excluded.title,url=excluded.url,fetch_url=excluded.fetch_url,
  source_type=excluded.source_type,fetch_strategy=excluded.fetch_strategy,priority=excluded.priority,
  topics=excluded.topics,check_frequency=excluded.check_frequency,metadata=excluded.metadata,active=true;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'DGT_DUPLICATES_PERMITS_2026',
  'DGT - duplicados, renovacion documental y canje de permisos 2026',
  1,'2026-01-01','2026-12-31',s.id,
  '{
    "driving_licence_duplicate":{
      "allowed_reasons":["loss","theft","deterioration","qualifying_personal_data_change"],
      "licence_must_be_in_force":true,
      "expired_document_action":"renewal_not_duplicate",
      "validity_rule":"duplicate keeps the original licence validity dates",
      "loss_theft_deterioration_fee_source":"DGT_FEES_2026 rate 4.4",
      "qualifying_personal_data_change_fee":"no additional fee under the current DGT procedure",
      "provisional_document":"issued when the duplicate is processed and valid for driving in Spain while the final card is delivered",
      "final_delivery_estimate":"approximately 1.5 months according to current DGT guidance",
      "digital_document":"miDGT driving licence has legal validity within Spain"
    },
    "circulation_permit":{
      "loss_theft_deterioration":"duplicate",
      "fee_source":"DGT_FEES_2026 rate 4.4",
      "data_or_vehicle_characteristics_change":"renewal, not necessarily duplicate; resolve the specific change and fee"
    },
    "technical_card":{
      "paper_itv":"request duplicate from an authorised ITV station",
      "electronic_eitv":"DGT can issue a duplicate for eligible electronic cards, generally vehicles with eITV from May 2016 onward",
      "eitv_fee_source":"DGT_FEES_2026 rate 4.1"
    },
    "foreign_licence_exchange":{
      "eu_eea":"no driving exam for the exchange route, subject to administrative requirements",
      "other_countries":"consult the current DGT country/agreement page and country-specific conditions; tests may be required depending on country and permit class",
      "rule":"Never rely on a static country list embedded in content."
    },
    "rule":"Classify the requested document and reason first. Duplicate, renewal, eITV copy and foreign-permit exchange are different procedures with different channels and fees."
  }'::jsonb,
  '{"official_reference":"DGT duplicate driving licence + vehicle documentation + exchange agreements 2026","human_review_if_foreign_permit_or_data_change":true}'::jsonb
from public.regulatory_sources s where s.source_key='dgt_driving_licence_duplicate_2026'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'MARITIME_RECREATIONAL_CRAFT_2026',
  'Marina Mercante - embarcaciones de recreo, registro y permisos',
  1,'2026-01-01',null,s.id,
  '{
    "registration_and_flagging":{
      "general_regime":"flagging/registration is the general regime for recreational craft in lists 6 and 7",
      "special_regime_upto_12m":{
        "conditions":["length equal to or below 12 metres","craft and propulsion equipment carry the required CE marking"],
        "effects":["exempt from flagging and registration obligation","exempt from dispatch obligation under the special regime","registration certificate required before entry into service"],
        "optional_general_regime":true
      }
    },
    "ownership_transfer":{
      "recreational_craft_rule":"seller must notify transfer and buyer may also notify it",
      "deadline":"maximum 3 months from transfer date",
      "source":"RD 1435/2010 art. 17.3 and current Transportes procedure"
    },
    "registry_changes":[
      "technical data correction",
      "port of registry",
      "list",
      "name",
      "classification",
      "ownership transfer",
      "operating mode",
      "mortgage creation modification novation or cancellation"
    ],
    "navigation_permit":{
      "renewal_cycle_years":5,
      "renewal_request_window":"request renewal 3 months before expiry",
      "exchange_for_deterioration":"new certificate keeps the prior expiry date, unless requested within the final 3 months when it is treated as renewal",
      "duplicate_available":true
    },
    "fee_code_025":{
      "applies_to":["change of ownership/name/list/classification","works or engine change","registration or deregistration","other registry annotations requested by the interested party"],
      "amount_policy":"Do not hardcode a single amount. Calculate the official code 025 fee for the actual act and vessel tonnage/registry data."
    },
    "recreational_qualifications":"Competence for recreational qualifications/exams can differ between the central maritime administration and autonomous-community administrations. Verify the competent authority and specific title before giving instructions.",
    "rule":"Do not say every recreational craft must follow the same registration/dispatch route. Resolve length, CE status, list/use and the exact registry act first."
  }'::jsonb,
  '{"official_reference":"Sede Transportes recreational craft procedures + RD 1435/2010 + fee code 025","human_review_if_special_regime_foreign_flag_commercial_use_or_mortgage":true}'::jsonb
from public.regulatory_sources s where s.source_key='transportes_recreation_registration'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_dependencies
  (ruleset_key,dependency_type,dependency_key,topic,criticality,metadata)
values
  ('DGT_DUPLICATES_PERMITS_2026','service','duplicado-permiso','traffic','critical','{"impact_requires_classification":true}'::jsonb),
  ('DGT_DUPLICATES_PERMITS_2026','kia_prompt','dgt','traffic','critical','{"impact_requires_classification":true}'::jsonb),
  ('MARITIME_RECREATIONAL_CRAFT_2026','service','tramites-embarcaciones','maritime','critical','{"impact_requires_classification":true}'::jsonb),
  ('MARITIME_RECREATIONAL_CRAFT_2026','kia_prompt','dgt','maritime','critical','{"impact_requires_classification":true}'::jsonb),
  ('MARITIME_RECREATIONAL_CRAFT_2026','knowledge','maritime-recreational-craft','maritime','high','{"impact_requires_classification":true}'::jsonb)
on conflict (ruleset_key,dependency_type,dependency_key)
where ruleset_key is not null
do update set topic=excluded.topic,criticality=excluded.criticality,active=true,metadata=excluded.metadata;
