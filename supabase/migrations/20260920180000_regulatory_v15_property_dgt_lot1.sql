-- KIA Regulatory Registry v1.5 - Propiedad y DGT lote 1
-- Base imponible inmobiliaria CV, transferencia de vehiculos y tasas DGT 2026.

insert into public.regulatory_sources
  (source_key, authority, title, url, fetch_url, source_type, fetch_strategy, priority, topics, check_frequency, metadata)
values
  (
    'atv_valencia_reference_value',
    'Agencia Tributaria Valenciana',
    'ATV - Valor de referencia de inmuebles',
    'https://atv.gva.es/valor-de-referencia',
    'https://atv.gva.es/valor-de-referencia',
    'administrative','html','critical',
    array['property','itp','ajd','reference_value','valencia'],'monthly',
    '{"official":true,"evidence_source":true,"jurisdiction":"Comunitat Valenciana"}'::jsonb
  ),
  (
    'atv_valencia_model_600',
    'Agencia Tributaria Valenciana',
    'ATV - Modelo 600 ITP/AJD',
    'https://atv.gva.es/es/tributos-modelos-autoliquidacion',
    'https://atv.gva.es/es/tributos-modelos-autoliquidacion',
    'administrative','html','high',
    array['property','itp','ajd','model_600','valencia'],'monthly',
    '{"official":true,"evidence_source":true,"jurisdiction":"Comunitat Valenciana"}'::jsonb
  ),
  (
    'dgt_vehicle_transfer_2026',
    'DGT',
    'DGT - Compra de vehiculo usado y cambio de titularidad',
    'https://www.dgt.es/nuestros-servicios/tu-vehiculo/vas-a-comprar-o-vender-un-vehiculo-de-segunda-mano/comprar-un-vehiculo-de-segunda-mano/',
    'https://www.dgt.es/nuestros-servicios/tu-vehiculo/vas-a-comprar-o-vender-un-vehiculo-de-segunda-mano/comprar-un-vehiculo-de-segunda-mano/',
    'administrative','html','critical',
    array['traffic','vehicle_transfer','used_vehicle','dgt'],'monthly',
    '{"official":true,"evidence_source":true,"updated_2026":true}'::jsonb
  ),
  (
    'dgt_fees_2026',
    'DGT',
    'DGT - Tasas y servicios 2026',
    'https://revista.dgt.es/es/informacion-y-servicios.shtml',
    'https://revista.dgt.es/es/informacion-y-servicios.shtml',
    'administrative','html','high',
    array['traffic','fees','vehicle_transfer','registration','duplicates'],'monthly',
    '{"official":true,"evidence_source":true,"year":2026}'::jsonb
  )
on conflict (source_key) do update set
  authority=excluded.authority,title=excluded.title,url=excluded.url,fetch_url=excluded.fetch_url,
  source_type=excluded.source_type,fetch_strategy=excluded.fetch_strategy,priority=excluded.priority,
  topics=excluded.topics,check_frequency=excluded.check_frequency,metadata=excluded.metadata,active=true;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'VALENCIA_PROPERTY_TRANSFER_BASE_2026',
  'Comunitat Valenciana - base imponible ITP/AJD en transmisiones inmobiliarias',
  1,'2026-01-01',null,s.id,
  '{
    "reference_value":{
      "applies_when_available":true,
      "base_rule":"For transfers subject to ITP/AJD where the tax base is determined by the value of the real property, the reference value operates as the minimum taxable base when it exists and is certifiable.",
      "higher_value_rule":"If declared value, agreed price or consideration is higher than the reference value, use the higher amount.",
      "no_reference_value_rule":"If no reference value exists or cannot be certified, use the higher of declared value, agreed price/consideration and market value, subject to verification."
    },
    "ajd_real_estate_floor":"Where AJD tax base depends on real-property value, it cannot be lower than the reference value when that value exists.",
    "filing":{
      "model":"600",
      "general_deadline":"1 month from the taxable act or contract in Comunitat Valenciana"
    },
    "rate_source":"VALENCIA_ITPAJD_2026",
    "rule":"Resolve first whether the operation is subject to TPO, VAT plus AJD, exempt or otherwise specially treated. Then resolve the tax base. Do not calculate tax from purchase price alone when a reference value exists."
  }'::jsonb,
  '{"official_reference":"ATV Valor de referencia + Modelo 600 instructions","jurisdiction":"Comunitat Valenciana","human_review_if_vat_exemption_waiver_or_special_rate":true}'::jsonb
from public.regulatory_sources s where s.source_key='atv_valencia_reference_value'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'DGT_VEHICLE_TRANSFER_2026',
  'DGT - cambio de titularidad de vehiculo usado',
  1,'2026-01-01','2026-12-31',s.id,
  '{
    "deadline_days_from_contract":30,
    "responsible_party":"buyer",
    "preconditions":[
      "signed_sale_contract",
      "payment_exemption_or_non_liability_proof_for_transfer_tax_as_applicable",
      "vehicle_transferable_status"
    ],
    "blocking_or_special_cases":[
      "temporary_deregistration_requires_prior_resolution",
      "unpaid_local_vehicle_tax_can_block_transfer",
      "pending_sanctions_or_registry_incidents_may_require_resolution",
      "financial_encumbrances_or_reservation_of_title_require specific treatment"
    ],
    "tax":{
      "jurisdiction":"autonomous community determined under transfer-tax rules",
      "model":"620 or regional equivalent depending on autonomous community",
      "rate_policy":"Never use a national percentage range. Resolve the autonomous-community rule and vehicle valuation method."
    },
    "itv_and_insurance":{
      "itv_must_be_valid_to_drive":true,
      "insurance_required_before_driving":true
    },
    "fee_source":"DGT_FEES_2026",
    "rule":"The DGT 30-day transfer deadline is distinct from the regional tax filing deadline. Do not call IVTM 'plusvalia municipal'; IVTM is the municipal vehicle tax and is a different tax."
  }'::jsonb,
  '{"official_reference":"DGT used vehicle purchase/transfer guidance 2026","human_review_if_encumbrance_inheritance_donation_or_divorce":true}'::jsonb
from public.regulatory_sources s where s.source_key='dgt_vehicle_transfer_2026'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'DGT_FEES_2026',
  'DGT - tasas principales 2026',
  1,'2026-01-01','2026-12-31',s.id,
  '{
    "fees_eur":{
      "vehicle_registration_rate_1_1":99.77,
      "moped_registration_rate_1_2":27.85,
      "vehicle_transfer_rate_1_5":55.70,
      "duplicate_driving_or_circulation_document_rate_4_4":20.81
    },
    "rule":"Use the fee type that corresponds to the actual procedure. Do not reuse an approximate EUR range when an official annual fee is available."
  }'::jsonb,
  '{"official_reference":"DGT 2026 rates and services","year":2026}'::jsonb
from public.regulatory_sources s where s.source_key='dgt_fees_2026'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_dependencies
  (ruleset_key,dependency_type,dependency_key,topic,criticality,metadata)
values
  ('VALENCIA_PROPERTY_TRANSFER_BASE_2026','service','compraventa-inmueble','property','critical','{"impact_requires_classification":true}'::jsonb),
  ('VALENCIA_PROPERTY_TRANSFER_BASE_2026','service','herencia','property','high','{"impact_requires_classification":true}'::jsonb),
  ('VALENCIA_PROPERTY_TRANSFER_BASE_2026','service','donacion','property','high','{"impact_requires_classification":true}'::jsonb),
  ('VALENCIA_PROPERTY_TRANSFER_BASE_2026','kia_prompt','legal','property','critical','{"impact_requires_classification":true}'::jsonb),
  ('VALENCIA_PROPERTY_TRANSFER_BASE_2026','course','formacion-planificacion-fiscal','property','high','{"impact_requires_classification":true}'::jsonb),

  ('DGT_VEHICLE_TRANSFER_2026','service','transferencia-vehiculo','traffic','critical','{"impact_requires_classification":true}'::jsonb),
  ('DGT_VEHICLE_TRANSFER_2026','kia_prompt','dgt','traffic','critical','{"impact_requires_classification":true}'::jsonb),
  ('DGT_FEES_2026','service','transferencia-vehiculo','traffic','high','{"impact_requires_classification":true}'::jsonb),
  ('DGT_FEES_2026','service','matriculacion','traffic','high','{"impact_requires_classification":true}'::jsonb),
  ('DGT_FEES_2026','service','duplicado-permiso','traffic','high','{"impact_requires_classification":true}'::jsonb),
  ('DGT_FEES_2026','kia_prompt','dgt','traffic','high','{"impact_requires_classification":true}'::jsonb)
on conflict (ruleset_key,dependency_type,dependency_key)
where ruleset_key is not null
do update set topic=excluded.topic,criticality=excluded.criticality,active=true,metadata=excluded.metadata;
