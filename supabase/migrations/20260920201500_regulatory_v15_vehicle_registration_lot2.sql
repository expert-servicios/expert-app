-- KIA Regulatory Registry v1.5 - Matriculacion / IEDMT lote 2
-- Primera matriculacion, importacion UE/no UE y Modelo 576.

insert into public.regulatory_sources
  (source_key, authority, title, url, fetch_url, source_type, fetch_strategy, priority, topics, check_frequency, metadata)
values
  (
    'aeat_iedmt_2026',
    'AEAT',
    'AEAT - Impuesto Especial sobre Determinados Medios de Transporte',
    'https://sede.agenciatributaria.gob.es/Sede/impuestos-tasas/impuesto-matriculacion.html',
    'https://sede.agenciatributaria.gob.es/Sede/impuestos-tasas/impuesto-matriculacion.html',
    'administrative','html','critical',
    array['traffic','iedmt','model_576','vehicle_registration'],'monthly',
    '{"official":true,"evidence_source":true,"year":2026}'::jsonb
  ),
  (
    'boe_excise_tax_law_38_1992',
    'BOE',
    'Ley 38/1992 de Impuestos Especiales - IEDMT',
    'https://www.boe.es/buscar/act.php?id=BOE-A-1992-28741',
    'https://www.boe.es/buscar/act.php?id=BOE-A-1992-28741',
    'legislation','html','critical',
    array['traffic','iedmt','vehicle_registration','co2'],'monthly',
    '{"official":true,"evidence_source":true,"articles":[65,66,69,70]}'::jsonb
  ),
  (
    'dgt_vehicle_import_eu',
    'DGT',
    'DGT - Matricular vehiculo proveniente de la UE',
    'https://www.dgt.es/nuestros-servicios/tu-vehiculo/quieres-traer-o-llevarte-un-vehiculo-del-extranjero/matricular-un-vehiculo-proveniente-de-la-ue/index.html',
    'https://www.dgt.es/nuestros-servicios/tu-vehiculo/quieres-traer-o-llevarte-un-vehiculo-del-extranjero/matricular-un-vehiculo-proveniente-de-la-ue/index.html',
    'administrative','html','high',
    array['traffic','vehicle_import','eu','registration'],'monthly',
    '{"official":true,"evidence_source":true}'::jsonb
  ),
  (
    'dgt_vehicle_import_non_eu',
    'DGT',
    'DGT - Importar vehiculo de fuera de la UE',
    'https://www.dgt.es/nuestros-servicios/tu-vehiculo/quieres-traer-o-llevarte-un-vehiculo-del-extranjero/importar-un-vehiculo-de-fuera-de-la-ue/',
    'https://www.dgt.es/nuestros-servicios/tu-vehiculo/quieres-traer-o-llevarte-un-vehiculo-del-extranjero/importar-un-vehiculo-de-fuera-de-la-ue/',
    'administrative','html','high',
    array['traffic','vehicle_import','customs','non_eu','registration'],'monthly',
    '{"official":true,"evidence_source":true}'::jsonb
  ),
  (
    'aeat_vehicle_import_customs',
    'AEAT',
    'AEAT - Importar un vehiculo',
    'https://www3.agenciatributaria.gob.es/Sede/vehiculos-embarcaciones/importar-vehiculo.html',
    'https://www3.agenciatributaria.gob.es/Sede/vehiculos-embarcaciones/importar-vehiculo.html',
    'administrative','html','high',
    array['customs','vehicle_import','non_eu','dua'],'monthly',
    '{"official":true,"evidence_source":true}'::jsonb
  )
on conflict (source_key) do update set
  authority=excluded.authority,title=excluded.title,url=excluded.url,fetch_url=excluded.fetch_url,
  source_type=excluded.source_type,fetch_strategy=excluded.fetch_strategy,priority=excluded.priority,
  topics=excluded.topics,check_frequency=excluded.check_frequency,metadata=excluded.metadata,active=true;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'IEDMT_REGISTRATION_2026',
  'IEDMT - primera matriculacion definitiva de vehiculos 2026',
  1,'2026-01-01','2026-12-31',s.id,
  '{
    "model_576":{
      "purpose":"self-assessment of the Special Tax on Certain Means of Transport when taxable and not covered by a declaration route for exemption/non-liability",
      "procedure_source":"AEAT Modelo 576"
    },
    "passenger_vehicle_co2_brackets_peninsula_balearic":{
      "up_to_120_g_km_percent":0,
      "over_120_below_160_percent":4.75,
      "from_160_below_200_percent":9.75,
      "from_200_percent":14.75
    },
    "canary_islands_default_brackets":{
      "up_to_120_g_km_percent":0,
      "over_120_below_160_percent":3.75,
      "from_160_below_200_percent":8.75,
      "from_200_percent":13.75
    },
    "important_exceptions":[
      "quads_and_special_categories",
      "vehicles_without_accredited_co2_measurement",
      "certain_n2_n3_motorhomes",
      "motorcycles_and_other_means_of_transport",
      "autonomous_community_rate_modifications_when_legally_applicable",
      "statutory_exemptions_and_non_liability_cases"
    ],
    "base_policy":"Determine whether the vehicle is new or used and apply the statutory valuation basis before the rate. Do not calculate from purchase price alone without checking the legally required base.",
    "rule":"Do not describe IEDMT as simply a tax for vehicles above a CO2 threshold. First determine taxable event, exemption/non-liability, vehicle category, official CO2 data, territory and tax base."
  }'::jsonb,
  '{"official_reference":"Ley 38/1992 arts. 65-70 + AEAT Modelo 576","human_review_if_exemption_special_category_or_no_co2":true}'::jsonb
from public.regulatory_sources s where s.source_key='aeat_iedmt_2026'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'VEHICLE_IMPORT_REGISTRATION_2026',
  'Vehiculos importados - matriculacion UE y fuera de UE',
  1,'2026-01-01','2026-12-31',s.id,
  '{
    "common_steps":[
      "prove ownership with contract or invoice and original vehicle documents",
      "obtain Spanish ITV technical sheet after the required inspection/homologation review",
      "resolve purchase/import taxes and IEDMT before definitive registration",
      "pay the applicable DGT registration fee",
      "complete Spanish registration with DGT"
    ],
    "eu":{
      "customs_clearance_required":false,
      "purchase_tax_cases":[
        "new vehicle from EU: prove Spanish VAT treatment or taxable-person status as applicable",
        "used vehicle bought from private seller: translated sale contract plus regional transfer-tax proof",
        "used vehicle bought from dealer: invoice and VAT documentation according to seller/case"
      ],
      "homologation":["European Certificate of Conformity when available","reduced technical sheet or individual/equivalent homologation when required"]
    },
    "non_eu":{
      "customs_clearance_required":true,
      "customs_document":"import certificate H1 after customs clearance",
      "customs_effects":["import duties where due","import VAT/other charges where due","commercial-policy and import formalities"],
      "homologation":"Vehicle must satisfy applicable European/Spanish homologation requirements; adaptations or additional approval may be necessary."
    },
    "iedmt_source":"IEDMT_REGISTRATION_2026",
    "dgt_fee_source":"DGT_FEES_2026",
    "rule":"Never merge EU and non-EU import flows. Customs clearance/H1 is a non-EU layer. Separately determine VAT/ITP, IEDMT, ITV/homologation and DGT registration."
  }'::jsonb,
  '{"official_reference":"DGT EU import/matriculation + DGT non-EU import + AEAT customs vehicle import","human_review_if_change_of_residence_diplomatic_exemption_or_special_homologation":true}'::jsonb
from public.regulatory_sources s where s.source_key='dgt_vehicle_import_eu'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_dependencies
  (ruleset_key,dependency_type,dependency_key,topic,criticality,metadata)
values
  ('IEDMT_REGISTRATION_2026','service','matriculacion','traffic','critical','{"impact_requires_classification":true}'::jsonb),
  ('IEDMT_REGISTRATION_2026','kia_prompt','dgt','traffic','critical','{"impact_requires_classification":true}'::jsonb),
  ('IEDMT_REGISTRATION_2026','course','formacion-administraciones-publicas','traffic','high','{"impact_requires_classification":true}'::jsonb),
  ('VEHICLE_IMPORT_REGISTRATION_2026','service','matriculacion','traffic','critical','{"impact_requires_classification":true}'::jsonb),
  ('VEHICLE_IMPORT_REGISTRATION_2026','kia_prompt','dgt','traffic','critical','{"impact_requires_classification":true}'::jsonb)
on conflict (ruleset_key,dependency_type,dependency_key)
where ruleset_key is not null
do update set topic=excluded.topic,criticality=excluded.criticality,active=true,metadata=excluded.metadata;
