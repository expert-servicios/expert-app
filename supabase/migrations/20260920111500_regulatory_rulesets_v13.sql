-- KIA Regulatory Registry v1.3
-- Versioned regulatory rule/table layer for EXPERT.
-- DDL is migration-only; browser access remains denied.

create table if not exists public.regulatory_rulesets (
  id uuid primary key default gen_random_uuid(),
  ruleset_key text not null,
  label text not null,
  schema_version integer not null default 1 check (schema_version > 0),
  valid_from date not null,
  valid_to date,
  source_id uuid references public.regulatory_sources(id) on delete set null,
  change_id uuid references public.regulatory_changes(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  verified_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(ruleset_key, schema_version, valid_from),
  check (valid_to is null or valid_to >= valid_from)
);

create index if not exists regulatory_rulesets_key_valid_idx
  on public.regulatory_rulesets(ruleset_key, valid_from desc);

alter table public.regulatory_rulesets enable row level security;
revoke all on table public.regulatory_rulesets from public, anon, authenticated;
grant select, insert, update, delete on table public.regulatory_rulesets to service_role;

drop policy if exists "regulatory_rulesets_deny_browser" on public.regulatory_rulesets;
create policy "regulatory_rulesets_deny_browser" on public.regulatory_rulesets
for all to anon, authenticated using (false) with check (false);

alter table public.regulatory_dependencies
  add column if not exists ruleset_key text;

alter table public.regulatory_dependencies
  drop constraint if exists regulatory_dependencies_check;
alter table public.regulatory_dependencies
  add constraint regulatory_dependencies_check
  check (source_id is not null or value_key is not null or ruleset_key is not null);

create index if not exists regulatory_dependencies_ruleset_idx
  on public.regulatory_dependencies(ruleset_key, dependency_type, dependency_key);

create unique index if not exists regulatory_dependencies_ruleset_unique
  on public.regulatory_dependencies(ruleset_key, dependency_type, dependency_key)
  where ruleset_key is not null;

insert into public.regulatory_sources
  (source_key, authority, title, url, fetch_url, source_type, fetch_strategy, priority, topics, check_frequency, metadata)
values
  (
    'aeat_retenciones_2026',
    'AEAT',
    'AEAT — Retenciones IRPF 2026',
    'https://sede.agenciatributaria.gob.es/Sede/Retenciones.shtml',
    'https://sede.agenciatributaria.gob.es/Sede/Retenciones.shtml',
    'administrative',
    'html',
    'critical',
    array['tax','labor','irpf','withholding'],
    'daily',
    '{"official":true,"evidence_source":true,"service_specific":false}'::jsonb
  ),
  (
    'aeat_verifactu_faq',
    'AEAT',
    'AEAT — Sistemas Informáticos de Facturación / VERI*FACTU FAQ',
    'https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/preguntas-frecuentes.html',
    'https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/preguntas-frecuentes.html',
    'administrative',
    'html',
    'critical',
    array['tax','invoicing','verifactu','rrsif'],
    'daily',
    '{"official":true,"evidence_source":true,"service_specific":false}'::jsonb
  ),
  (
    'boe_irnr_order_623_2026',
    'BOE',
    'Orden HAC/623/2026 — Modelo 210 IRNR',
    'https://www.boe.es/buscar/doc.php?id=BOE-A-2026-13573',
    'https://www.boe.es/buscar/doc.php?id=BOE-A-2026-13573',
    'legislation',
    'html',
    'critical',
    array['tax','irnr','model_210','non_residents'],
    'daily',
    '{"official":true,"official_identifier":"BOE-A-2026-13573","evidence_source":true,"service_specific":true}'::jsonb
  ),
  (
    'boe_valencia_tax_law_13_1997',
    'BOE',
    'Comunitat Valenciana — Ley 13/1997 tributos cedidos',
    'https://www.boe.es/buscar/act.php?id=BOE-A-1998-8202',
    'https://www.boe.es/buscar/act.php?id=BOE-A-1998-8202',
    'legislation',
    'html',
    'critical',
    array['tax','valencia','itp','ajd','isd','property'],
    'daily',
    '{"official":true,"official_identifier":"BOE-A-1998-8202","evidence_source":true,"service_specific":false}'::jsonb
  ),
  (
    'boe_company_growth_law_18_2022',
    'BOE',
    'Ley 18/2022 — creación y crecimiento de empresas',
    'https://www.boe.es/buscar/act.php?id=BOE-A-2022-15818',
    'https://www.boe.es/buscar/act.php?id=BOE-A-2022-15818',
    'legislation',
    'html',
    'high',
    array['corporate','company_creation','limited_company'],
    'monthly',
    '{"official":true,"official_identifier":"BOE-A-2022-15818","evidence_source":true,"service_specific":false}'::jsonb
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
  'RETA_2026_BRACKETS',
  'RETA — tramos de rendimientos y bases 2026',
  1,
  '2026-01-01',
  '2026-12-31',
  s.id,
  '{
    "currency":"EUR",
    "period":"month",
    "brackets":[
      {"table":"reduced","min_income":null,"max_income":670,"min_base":653.59,"max_base":718.94},
      {"table":"reduced","min_income":670,"max_income":900,"min_base":718.95,"max_base":900},
      {"table":"reduced","min_income":900,"max_income":1166.70,"max_exclusive":true,"min_base":849.67,"max_base":1166.70},
      {"table":"general","min_income":1166.70,"max_income":1300,"min_base":950.98,"max_base":1300},
      {"table":"general","min_income":1300,"max_income":1500,"min_base":960.78,"max_base":1500},
      {"table":"general","min_income":1500,"max_income":1700,"min_base":960.78,"max_base":1700},
      {"table":"general","min_income":1700,"max_income":1850,"min_base":1143.79,"max_base":1850},
      {"table":"general","min_income":1850,"max_income":2030,"min_base":1209.15,"max_base":2030},
      {"table":"general","min_income":2030,"max_income":2330,"min_base":1274.51,"max_base":2330},
      {"table":"general","min_income":2330,"max_income":2760,"min_base":1356.21,"max_base":2760},
      {"table":"general","min_income":2760,"max_income":3190,"min_base":1437.91,"max_base":3190},
      {"table":"general","min_income":3190,"max_income":3620,"min_base":1519.61,"max_base":3620},
      {"table":"general","min_income":3620,"max_income":4050,"min_base":1601.31,"max_base":4050},
      {"table":"general","min_income":4050,"max_income":6000,"min_base":1732.03,"max_base":5101.20},
      {"table":"general","min_income":6000,"max_income":null,"min_base":1928.10,"max_base":5101.20}
    ],
    "rates":{"common_contingencies":28.30,"professional_contingencies":1.30,"cessation":0.90,"training":0.10,"mei":0.90},
    "reduced_new_self_employed_fee":{"numeric_value":null,"rule":"Do not assume the 2023-2025 EUR 80 amount for 2026. Resolve against the official rule in force before quoting a fee."}
  }'::jsonb,
  '{"official_reference":"BOE-A-2026-7296","review_policy":"human_if_exception"}'::jsonb
from public.regulatory_sources s where s.source_key='boe_social_security_order_2026'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to, source_id=excluded.source_id, payload=excluded.payload,
  verified_at=now(), metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'IRPF_WITHHOLDING_2026',
  'IRPF — periodos de cálculo de retenciones 2026',
  1,'2026-01-01','2026-12-31',s.id,
  '{
    "periods":[
      {"valid_from":"2026-01-01","valid_to":"2026-09-09","official_calculator_version":"AEAT 01-01-2026 to 09-09-2026"},
      {"valid_from":"2026-09-10","valid_to":"2026-12-31","official_calculator_version":"AEAT from 10-09-2026"}
    ],
    "rule":"For payroll withholding calculations use the AEAT algorithm/calculator version matching the accrual/payment date. Do not reuse a pre-10 September result after 9 September."
  }'::jsonb,
  '{"official_reference":"AEAT Retenciones 2026","calculation_requires_official_algorithm":true}'::jsonb
from public.regulatory_sources s where s.source_key='aeat_retenciones_2026'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to, source_id=excluded.source_id, payload=excluded.payload,
  verified_at=now(), metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'VERIFACTU_DEADLINES',
  'RRSIF / VERI*FACTU — fechas obligatorias vigentes',
  1,'2025-12-03',null,s.id,
  '{
    "deadlines":[
      {"population":"corporate_income_tax_taxpayers","adapted_before":"2027-01-01"},
      {"population":"other_article_3_1_taxpayers_including_irpf_business","adapted_before":"2027-07-01"}
    ],
    "rule":"Do not state July 2026 as the general mandatory date. Determine population before returning a deadline."
  }'::jsonb,
  '{"official_reference":"RDL 15/2025 + AEAT FAQ updated 2026-07-21"}'::jsonb
from public.regulatory_sources s where s.source_key='aeat_verifactu_faq'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to, source_id=excluded.source_id, payload=excluded.payload,
  verified_at=now(), metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'IRNR_210_2026_TRANSITION',
  'Modelo 210 — transición de plazos Orden HAC/623/2026',
  1,'2026-07-01','2027-12-31',s.id,
  '{
    "transitional_rules":[
      {"income":"rental_ungrouped","accrual_from":"2026-04-01","accrual_to":"2026-09-30","rule":"quarterly legacy filing remains applicable for these accruals"},
      {"income":"rental","accrual_from":"2026-07-01","accrual_to":"2026-09-30","filing_from":"2026-10-01","filing_to":"2026-10-20"},
      {"income":"rental","accrual_from":"2026-10-01","accrual_to":"2026-12-31","filing_from":"2027-04-01","filing_to":"2027-04-20"},
      {"income":"imputed_real_estate","tax_year":2025,"filing_from":"2026-01-01","filing_to":"2026-12-31"},
      {"income":"imputed_real_estate","tax_year":2026,"filing_from":"2027-04-01","filing_to":"2027-12-31"}
    ],
    "rule":"Never answer Modelo 210 rental deadlines with a timeless 'quarterly' rule; resolve by accrual date and income type."
  }'::jsonb,
  '{"official_reference":"BOE-A-2026-13573","aeat_note":"modificaciones plazos Modelo 210"}'::jsonb
from public.regulatory_sources s where s.source_key='boe_irnr_order_623_2026'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to, source_id=excluded.source_id, payload=excluded.payload,
  verified_at=now(), metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'VALENCIA_ITPAJD_2026',
  'Comunitat Valenciana — ITP/AJD desde 1 junio 2026',
  1,'2026-06-01',null,s.id,
  '{
    "tpo_real_estate":{"general_rate_percent":9,"over_1000000_rate_percent":11},
    "ajd":{"general_other_cases_rate_percent":1.4},
    "rule":"Reduced rates and special cases exist. Use this ruleset only for the stated general cases and review eligibility before calculation."
  }'::jsonb,
  '{"official_reference":"Ley 13/1997 consolidated; changes by Ley 5/2025 effective 2026-06-01","jurisdiction":"Comunitat Valenciana"}'::jsonb
from public.regulatory_sources s where s.source_key='boe_valencia_tax_law_13_1997'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to, source_id=excluded.source_id, payload=excluded.payload,
  verified_at=now(), metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'VALENCIA_ISD_2026',
  'Comunitat Valenciana — bonificaciones ISD vigentes 2026',
  1,'2026-07-03',null,s.id,
  '{
    "family_bonus_percent":99,
    "mortis_causa_groups":["I","II"],
    "inter_vivos_relations":["spouse","parents","adopters","children","adoptees","grandchildren","grandparents"],
    "inter_vivos_public_document_required":true,
    "disability_bonus":{"percent":99,"physical_or_sensory_min_percent":65,"intellectual_or_mental_min_percent":33},
    "rule":"The 99% bonus is conditional and applies to the proportional quota corresponding to declared assets/rights. Review all statutory requirements before quoting a final tax amount."
  }'::jsonb,
  '{"official_reference":"Ley 13/1997 art. 12 bis; Ley 6/2023; Ley 3/2026","jurisdiction":"Comunitat Valenciana"}'::jsonb
from public.regulatory_sources s where s.source_key='boe_valencia_tax_law_13_1997'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to, source_id=excluded.source_id, payload=excluded.payload,
  verified_at=now(), metadata=excluded.metadata;

insert into public.regulatory_rulesets
  (ruleset_key,label,schema_version,valid_from,valid_to,source_id,payload,metadata)
select
  'SL_CAPITAL_RULES',
  'Sociedad Limitada — capital mínimo y salvaguardas',
  1,'2022-10-19',null,s.id,
  '{
    "minimum_capital_eur":1,
    "threshold_eur":3000,
    "below_threshold":{"legal_reserve_profit_percent":20,"liquidation_joint_liability_for_difference":true},
    "rule":"Do not describe EUR 3,000 as the minimum capital of an SL. It is the threshold below which statutory safeguards apply."
  }'::jsonb,
  '{"official_reference":"BOE-A-2022-15818; art. 4 LSC as amended by Ley 18/2022"}'::jsonb
from public.regulatory_sources s where s.source_key='boe_company_growth_law_18_2022'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to, source_id=excluded.source_id, payload=excluded.payload,
  verified_at=now(), metadata=excluded.metadata;

insert into public.regulatory_dependencies
  (ruleset_key,dependency_type,dependency_key,topic,criticality,metadata)
values
  ('RETA_2026_BRACKETS','service','alta-autonomo','social_security','critical','{"impact_requires_classification":true}'::jsonb),
  ('RETA_2026_BRACKETS','service','baja-cese-actividad','social_security','high','{"impact_requires_classification":true}'::jsonb),
  ('RETA_2026_BRACKETS','course','formacion-alta-autonomo-sl','social_security','critical','{"impact_requires_classification":true}'::jsonb),
  ('RETA_2026_BRACKETS','kia_prompt','labor','social_security','critical','{"impact_requires_classification":true}'::jsonb),
  ('IRPF_WITHHOLDING_2026','course','gestion-laboral','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('IRPF_WITHHOLDING_2026','service','holded-modulo-laboral','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('IRPF_WITHHOLDING_2026','service','holded-migracion-laboral','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('IRPF_WITHHOLDING_2026','kia_prompt','labor','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('VERIFACTU_DEADLINES','service','contabilidad-mensual','invoicing','critical','{"impact_requires_classification":true}'::jsonb),
  ('VERIFACTU_DEADLINES','service','holded-pack-starter','invoicing','high','{"impact_requires_classification":true}'::jsonb),
  ('VERIFACTU_DEADLINES','service','holded-migracion-sin-inventario','invoicing','high','{"impact_requires_classification":true}'::jsonb),
  ('VERIFACTU_DEADLINES','service','holded-migracion-con-inventario','invoicing','high','{"impact_requires_classification":true}'::jsonb),
  ('VERIFACTU_DEADLINES','kia_prompt','tax','invoicing','critical','{"impact_requires_classification":true}'::jsonb),
  ('IRNR_210_2026_TRANSITION','service','no-residentes','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('IRNR_210_2026_TRANSITION','kia_prompt','tax','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('IRNR_210_2026_TRANSITION','knowledge','tax','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('VALENCIA_ITPAJD_2026','service','compraventa-inmueble','property','critical','{"impact_requires_classification":true}'::jsonb),
  ('VALENCIA_ITPAJD_2026','service','transferencia-vehiculo','tax','high','{"impact_requires_classification":true,"note":"vehicle rules differ; do not reuse real-estate rate"}'::jsonb),
  ('VALENCIA_ITPAJD_2026','kia_prompt','legal','property','critical','{"impact_requires_classification":true}'::jsonb),
  ('VALENCIA_ISD_2026','service','herencia','isd','critical','{"impact_requires_classification":true}'::jsonb),
  ('VALENCIA_ISD_2026','service','donacion','isd','critical','{"impact_requires_classification":true}'::jsonb),
  ('VALENCIA_ISD_2026','kia_prompt','legal','isd','critical','{"impact_requires_classification":true}'::jsonb),
  ('SL_CAPITAL_RULES','service','constitucion-sl','corporate','critical','{"impact_requires_classification":true}'::jsonb),
  ('SL_CAPITAL_RULES','service','constitucion-sl-circe','corporate','critical','{"impact_requires_classification":true}'::jsonb),
  ('SL_CAPITAL_RULES','course','formacion-alta-autonomo-sl','corporate','critical','{"impact_requires_classification":true}'::jsonb)
on conflict (ruleset_key,dependency_type,dependency_key)
where ruleset_key is not null
do update set topic=excluded.topic, criticality=excluded.criticality, active=true, metadata=excluded.metadata;

comment on table public.regulatory_rulesets is
  'Versioned official regulatory tables/rules. Server-side only; never auto-published.';


-- Census forms: Modelo 037 was abolished from 2025-02-03. Keep one canonical rule
-- so service copy and KIA never resurrect it as a current filing route.
insert into public.regulatory_sources
  (source_key, authority, title, url, fetch_url, source_type, fetch_strategy, priority, topics, check_frequency, metadata)
values (
  'boe_census_model_036_2025',
  'BOE',
  'Orden HAC/1526/2024 — Modelo 036 y supresión del 037',
  'https://www.boe.es/buscar/doc.php?id=BOE-A-2025-410',
  'https://www.boe.es/buscar/doc.php?id=BOE-A-2025-410',
  'legislation',
  'html',
  'high',
  array['tax','census','model_036','self_employed'],
  'monthly',
  '{"official":true,"official_identifier":"BOE-A-2025-410","evidence_source":true,"service_specific":false}'::jsonb
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
  'AEAT_CENSUS_MODEL_036',
  'AEAT — declaración censal vigente para empresarios y profesionales',
  1,'2025-02-03',null,s.id,
  '{
    "current_form":"036",
    "abolished_forms":[{"form":"037","abolished_from":"2025-02-03"}],
    "rule":"Do not offer Modelo 037 as a current filing route. Alta, modificación y baja censal se canalizan por Modelo 036 según el supuesto aplicable."
  }'::jsonb,
  '{"official_reference":"BOE-A-2025-410","aeat_calendar_2026":true}'::jsonb
from public.regulatory_sources s where s.source_key='boe_census_model_036_2025'
on conflict (ruleset_key,schema_version,valid_from) do update set
  valid_to=excluded.valid_to, source_id=excluded.source_id, payload=excluded.payload,
  verified_at=now(), metadata=excluded.metadata;

insert into public.regulatory_dependencies
  (ruleset_key,dependency_type,dependency_key,topic,criticality,metadata)
values
  ('AEAT_CENSUS_MODEL_036','service','alta-autonomo','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('AEAT_CENSUS_MODEL_036','service','baja-cese-actividad','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('AEAT_CENSUS_MODEL_036','service','constitucion-sl','tax','high','{"impact_requires_classification":true}'::jsonb),
  ('AEAT_CENSUS_MODEL_036','service','constitucion-sl-circe','tax','high','{"impact_requires_classification":true}'::jsonb),
  ('AEAT_CENSUS_MODEL_036','kia_prompt','tax','tax','critical','{"impact_requires_classification":true}'::jsonb),
  ('AEAT_CENSUS_MODEL_036','course','formacion-alta-autonomo-sl','tax','critical','{"impact_requires_classification":true}'::jsonb)
on conflict (ruleset_key,dependency_type,dependency_key)
where ruleset_key is not null
do update set topic=excluded.topic, criticality=excluded.criticality, active=true, metadata=excluded.metadata;
