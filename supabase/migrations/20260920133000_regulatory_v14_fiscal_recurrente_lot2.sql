-- KIA Regulatory Registry v1.4 - Fiscal recurrente lote 2
-- IRPF pagos fraccionados 130/131, IS pago fraccionado 202 e informativas 347/349/390.
-- Los vencimientos exactos 2026 se mantienen en AEAT_TAX_CALENDAR_2026.

insert into public.regulatory_sources
  (source_key, authority, title, url, fetch_url, source_type, fetch_strategy, priority, topics, check_frequency, metadata)
values
  (
    'aeat_model_130',
    'AEAT',
    'AEAT - Modelo 130 IRPF estimacion directa, pago fraccionado',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G601.shtml',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G601.shtml',
    'administrative','html','critical',
    array['tax','irpf','model_130','payments_on_account'],'daily',
    '{"official":true,"evidence_source":true,"service_specific":true}'::jsonb
  ),
  (
    'aeat_model_131',
    'AEAT',
    'AEAT - Modelo 131 IRPF estimacion objetiva, pago fraccionado',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G602.shtml',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G602.shtml',
    'administrative','html','high',
    array['tax','irpf','model_131','modules','payments_on_account'],'monthly',
    '{"official":true,"evidence_source":true,"service_specific":true}'::jsonb
  ),
  (
    'aeat_model_202',
    'AEAT',
    'AEAT - Modelo 202 IS pago fraccionado, instrucciones 2025 y siguientes',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GE00.shtml',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GE00.shtml',
    'administrative','html','critical',
    array['tax','corporate_tax','model_202','payments_on_account'],'daily',
    '{"official":true,"evidence_source":true,"service_specific":true}'::jsonb
  ),
  (
    'aeat_model_347',
    'AEAT',
    'AEAT - Modelo 347 operaciones con terceras personas',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GI27.shtml',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GI27.shtml',
    'administrative','html','high',
    array['tax','informative_returns','model_347'],'monthly',
    '{"official":true,"evidence_source":true,"service_specific":true}'::jsonb
  ),
  (
    'aeat_model_349',
    'AEAT',
    'AEAT - Modelo 349 operaciones intracomunitarias',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GI28.shtml',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GI28.shtml',
    'administrative','html','high',
    array['tax','vat','intracommunity','model_349'],'monthly',
    '{"official":true,"evidence_source":true,"service_specific":true}'::jsonb
  ),
  (
    'aeat_model_390',
    'AEAT',
    'AEAT - Modelo 390 resumen anual IVA',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G412.shtml',
    'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G412.shtml',
    'administrative','html','high',
    array['tax','vat','model_390'],'monthly',
    '{"official":true,"evidence_source":true,"service_specific":true}'::jsonb
  )
on conflict (source_key) do update set
  authority=excluded.authority,title=excluded.title,url=excluded.url,fetch_url=excluded.fetch_url,
  source_type=excluded.source_type,fetch_strategy=excluded.fetch_strategy,priority=excluded.priority,
  topics=excluded.topics,check_frequency=excluded.check_frequency,metadata=excluded.metadata,active=true;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'IRPF_PAYMENT_FRACTIONS_2026',
  'IRPF - pagos fraccionados Modelos 130 y 131, ejercicio 2026',
  1,'2026-01-01','2026-12-31',s.id,
  '{
    "model_130":{
      "method":"direct_estimation",
      "general_non_agricultural_rule":{
        "rate_percent":20,
        "base":"positive net income accumulated from 1 January through the end of the quarter",
        "subtract":["prior instalment payments of the year","withholdings and payments on account when applicable"]
      },
      "professional_70_percent_exception":true,
      "agricultural_livestock_forestry_70_percent_exception":true,
      "agricultural_livestock_forestry_fishing_rate_percent":2,
      "special_2026":{
        "ceuta_melilla_qualifying_income_rate_percent":8,
        "la_palma_qualifying_income":{"quarters":["3T","4T"],"rate_percent":8}
      }
    },
    "model_131":{
      "method":"objective_estimation",
      "non_agricultural_module_rates":{"more_than_one_employee_percent":4,"one_employee_percent":3,"no_employees_percent":2},
      "no_base_data_rate_on_quarter_sales_percent":2,
      "agricultural_livestock_forestry_rate_on_quarter_income_percent":2,
      "agricultural_livestock_forestry_70_percent_exception":true,
      "special_2026":{
        "ceuta_melilla_multiplier":0.4,
        "la_palma_qualifying_income":{"quarters":["3T","4T"],"multiplier":0.4}
      }
    },
    "filing_pattern":{"1T":"1-20 April","2T":"1-20 July","3T":"1-20 October","4T":"1-30 January following year"},
    "rule":"Never calculate 130 from the isolated quarter profit. Determine activity type, method, withholding exception and territorial special rules first. For 131 determine the module data and workforce case before applying a percentage."
  }'::jsonb,
  '{"official_reference":"AEAT Modelos 130/131; arts. 109-110 RIRPF; RDL 23/2026","recent_2026_change":"La Palma multiplier 0.4 for qualifying activities in 3T/4T 2026","human_review_if_special_regime":true}'::jsonb
from public.regulatory_sources s where s.source_key='aeat_model_130'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'MODEL_202_RULES_2026',
  'Impuesto sobre Sociedades - pago fraccionado Modelo 202, 2026',
  1,'2026-01-01','2026-12-31',s.id,
  '{
    "periods":["1P April","2P October","3P December"],
    "article_40_2":{
      "base":"net full tax liability of the latest qualifying tax period whose filing deadline had expired by day 1 of the payment month",
      "general_rate_percent":18
    },
    "article_40_3":{
      "base":"taxable base corresponding to the first 3, 9 or 11 months, or equivalent elapsed period when tax year differs from calendar year",
      "optional_general_rule":true,
      "mandatory_if_prior_12_month_turnover_over_eur":6000000
    },
    "filing_obligation":{
      "turnover_over_6000000":"filing mandatory even if no payment is due",
      "other_entities":"no filing when the rules produce no payment, subject to statutory exceptions",
      "excluded_rates_percent":[0,1]
    },
    "deadlines_2026":{"1P":"2026-04-20","2P":"2026-10-20","3P":"2026-12-21"},
    "recent_2026_change":{
      "effective_context":"payments for tax periods started in 2026 whose filing window begins from the entry into force of RDL 22/2026",
      "ceuta_melilla_related_reduction_percent":60,
      "official_rule":"LIS additional provision 20, added by RDL 22/2026"
    },
    "rule":"Determine article 40.2 versus 40.3, turnover threshold, tax rate/regime and current 2026 special measures before calculating or deciding filing obligation."
  }'::jsonb,
  '{"official_reference":"AEAT Modelo 202 instructions 2025 and following; art. 40 LIS; RDL 22/2026","recent_2026_change":"Ceuta/Melilla related minimum-payment reduction raised to 60% for qualifying 2026 payments","human_review_if_special_regime":true}'::jsonb
from public.regulatory_sources s where s.source_key='aeat_model_202'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'INFORMATIVE_RETURNS_2026',
  'Declaraciones informativas recurrentes - 347, 349, 390 y calendario 180/190',
  1,'2026-01-01','2026-12-31',s.id,
  '{
    "model_347":{
      "periodicity":"annual",
      "general_counterparty_threshold_eur":3005.06,
      "filing_window_2026_for_2025_operations":{"from":"2026-02-01","to":"2026-03-02"},
      "rule":"The threshold is not by itself sufficient: apply exclusions and the specific subject rules before deciding filing."
    },
    "model_349":{
      "periodicities":["monthly","quarterly"],
      "quarterly_threshold_rule":"Quarterly filing can apply when neither the reference quarter nor the previous four calendar quarters exceeds EUR 50,000 of relevant intra-EU supplies/services excluding VAT.",
      "quarterly_deadlines":"first 20 natural days after quarter; Q4 first 30 natural days of January",
      "monthly_deadlines":"first 20 natural days of following month; July has the statutory August/September exception; December first 30 natural days of January",
      "truncated_quarter_rule":true
    },
    "model_390":{
      "periodicity":"annual",
      "filing_window_2026_for_2025":{"from":"2026-01-01","to":"2026-01-30"},
      "rule":"Do not assume every Modelo 303 filer must also submit Modelo 390; verify statutory exonerations."
    },
    "models_180_190":{
      "periodicity":"annual",
      "deadline_source":"AEAT_TAX_CALENDAR_2026",
      "deadline_2026_for_2025":"2026-02-02"
    },
    "rule":"Use AEAT_TAX_CALENDAR_2026 for exact filing dates and the model-specific source for obligation, periodicity, thresholds and exclusions."
  }'::jsonb,
  '{"official_reference":"AEAT model-specific guidance + AEAT taxpayer calendar 2026","human_review_if_periodicity_or_exemption_unclear":true}'::jsonb
from public.regulatory_sources s where s.source_key='aeat_model_347'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to,source_id=excluded.source_id,payload=excluded.payload,verified_at=now(),metadata=excluded.metadata;

insert into public.regulatory_dependencies
  (ruleset_key,dependency_type,dependency_key,topic,criticality,metadata)
values
  ('IRPF_PAYMENT_FRACTIONS_2026','service','impuestos-trimestrales','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('IRPF_PAYMENT_FRACTIONS_2026','service','contabilidad-mensual','tax','high','{"impact_requires_classification":true}'::jsonb),
  ('IRPF_PAYMENT_FRACTIONS_2026','course','formacion-fiscal-contable','tax','high','{"impact_requires_classification":true}'::jsonb),
  ('IRPF_PAYMENT_FRACTIONS_2026','kia_prompt','tax','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('MODEL_202_RULES_2026','service','impuesto-sociedades','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('MODEL_202_RULES_2026','service','contabilidad-mensual','tax','high','{"impact_requires_classification":true}'::jsonb),
  ('MODEL_202_RULES_2026','course','formacion-fiscal-contable','tax','high','{"impact_requires_classification":true}'::jsonb),
  ('MODEL_202_RULES_2026','kia_prompt','tax','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('INFORMATIVE_RETURNS_2026','service','modelos-informativos','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('INFORMATIVE_RETURNS_2026','service','iva-trimestral','tax','high','{"impact_requires_classification":true}'::jsonb),
  ('INFORMATIVE_RETURNS_2026','service','contabilidad-mensual','tax','high','{"impact_requires_classification":true}'::jsonb),
  ('INFORMATIVE_RETURNS_2026','course','formacion-fiscal-contable','tax','high','{"impact_requires_classification":true}'::jsonb),
  ('INFORMATIVE_RETURNS_2026','kia_prompt','tax','tax','high','{"impact_requires_classification":true}'::jsonb),
  ('AEAT_TAX_CALENDAR_2026','service','modelos-informativos','tax','critical','{"impact_requires_classification":true}'::jsonb)
on conflict (ruleset_key,dependency_type,dependency_key)
where ruleset_key is not null
do update set topic=excluded.topic,criticality=excluded.criticality,active=true,metadata=excluded.metadata;
