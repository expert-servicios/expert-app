-- Connect 2026 immigration evidence to existing EXPERT Regulatory Registry; no new cron.
INSERT INTO public.regulatory_sources(source_key,authority,title,url,fetch_url,source_type,fetch_strategy,priority,topics,check_frequency,active,metadata)
VALUES
('boe_rd_316_2026_extranjeria','BOE','RD 316/2026: reforma extranjería','https://www.boe.es/buscar/doc.php?id=BOE-A-2026-8284','https://www.boe.es/buscar/doc.php?id=BOE-A-2026-8284','legislation','html','critical',ARRAY['immigration','arraigo'],'monthly',true,'{"published_on":"2026-04-15","effective_on":"2026-04-16","legal_review_required":true}'::jsonb),
('boe_ts_2026_19632_extranjeria','BOE','Sentencia TS publicada 22/09/2026 (19632)','https://www.boe.es/buscar/doc.php?id=BOE-A-2026-19632','https://www.boe.es/buscar/doc.php?id=BOE-A-2026-19632','legislation','html','critical',ARRAY['immigration','court-ruling'],'monthly',true,'{"published_on":"2026-09-22","scope_review":"pending","legal_review_required":true}'::jsonb),
('boe_ts_2026_19633_extranjeria','BOE','Sentencia TS publicada 22/09/2026 (19633)','https://www.boe.es/buscar/doc.php?id=BOE-A-2026-19633','https://www.boe.es/buscar/doc.php?id=BOE-A-2026-19633','legislation','html','critical',ARRAY['immigration','court-ruling'],'monthly',true,'{"published_on":"2026-09-22","scope_review":"pending","legal_review_required":true}'::jsonb)
ON CONFLICT(source_key) DO UPDATE SET metadata=public.regulatory_sources.metadata || EXCLUDED.metadata;
UPDATE public.regulatory_sources SET metadata=metadata||'{"official_registry":"docs/i18n/immigration-official-source-registry-2026-10-13.json","registry_reviewed_on":"2026-10-13","law_published_on":"2024-11-20","law_effective_on":"2025-05-20"}'::jsonb WHERE source_key='boe_rd_1155_2024';
-- Migraciones blocks server access (HTTP 403). Keep disabled references manual-only.
UPDATE public.regulatory_sources SET metadata=metadata||'{"monitoring_mode":"manual_reference","review_due_on":"2026-11-13","registry_reviewed_on":"2026-10-13"}'::jsonb WHERE source_key IN ('migraciones_arraigo_social','migraciones_arraigo_sociolaboral') AND NOT active;
-- Link each canonical legal text to its ES/RU published knowledge documents.
WITH linkage(source_key,doc_key,locale) AS (VALUES
('boe_rd_1155_2024','permiso-residencia-inicial-vias-y-documentos','es'),
('boe_rd_1155_2024','pervichnoe-razreshenie-na-prozhivanie-ispaniya','ru'),
('boe_rd_1155_2024','renovacion-residencia-temporal-y-larga-duracion','es'),
('boe_rd_1155_2024','prodlenie-rezidencii-dolgosrochnaya','ru'),
('boe_rd_316_2026_extranjeria','permiso-residencia-inicial-vias-y-documentos','es'),
('boe_rd_316_2026_extranjeria','pervichnoe-razreshenie-na-prozhivanie-ispaniya','ru'),
('boe_ts_2026_19632_extranjeria','permiso-residencia-inicial-vias-y-documentos','es'),
('boe_ts_2026_19632_extranjeria','pervichnoe-razreshenie-na-prozhivanie-ispaniya','ru'),
('boe_ts_2026_19633_extranjeria','permiso-residencia-inicial-vias-y-documentos','es'),
('boe_ts_2026_19633_extranjeria','pervichnoe-razreshenie-na-prozhivanie-ispaniya','ru')
)
INSERT INTO public.regulatory_dependencies(source_id,dependency_type,dependency_key,topic,criticality,metadata)
SELECT s.id,'knowledge',l.doc_key,'immigration','high',jsonb_build_object('locale',l.locale,'review_required',true,'registry','docs/i18n/immigration-official-source-registry-2026-10-13.json')
FROM linkage l JOIN public.regulatory_sources s USING(source_key)
ON CONFLICT(source_id,dependency_type,dependency_key) DO UPDATE SET metadata=public.regulatory_dependencies.metadata || EXCLUDED.metadata,active=true;
