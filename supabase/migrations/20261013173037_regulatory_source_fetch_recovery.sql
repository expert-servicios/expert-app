-- Recovery for confirmed official-source fetch failures on 2026-10-13.
-- Seed official reference identities on a rebuilt database without replacing
-- any existing source or its status/metadata in production. The conditional
-- recovery below remains the only operation against existing records.
INSERT INTO public.regulatory_sources
  (source_key, authority, title, url, fetch_url, source_type,
   fetch_strategy, priority, topics, check_frequency, active, metadata)
VALUES
  ('migraciones_normativa','Ministerio de Inclusión, Seguridad Social y Migraciones',
   'Normativa e instrucciones de Migraciones',
   'https://www.inclusion.gob.es/web/migraciones/normativa',
   'https://www.inclusion.gob.es/web/migraciones/normativa',
   'administrative','html','high',ARRAY['immigration','eu_law','international_law','jurisprudence'],
   'monthly',false,'{"official":true,"monitoring_mode":"manual_reference"}'::jsonb),
  ('migraciones_hojas_informativas','Ministerio de Inclusión, Seguridad Social y Migraciones',
   'Hojas informativas de Extranjería',
   'https://www.inclusion.gob.es/es/web/migraciones/hojas-informativas',
   'https://www.inclusion.gob.es/es/web/migraciones/hojas-informativas',
   'administrative','html','high',ARRAY['immigration','procedures','requirements','forms'],
   'daily',false,'{"official":true,"monitoring_mode":"manual_reference"}'::jsonb),
  ('migraciones_presentacion_electronica','Ministerio de Inclusión, Seguridad Social y Migraciones',
   'Presentación electrónica de solicitudes de estancia y residencia',
   'https://www.inclusion.gob.es/es/web/migraciones/presentacion-electronica-de-solicitudes-de-estancia-de-residencia-de-residencia-y-trabajo-y-de-tarjeta-de-familiar-de-ciudadano-de-la-union-europea',
   'https://www.inclusion.gob.es/es/web/migraciones/presentacion-electronica-de-solicitudes-de-estancia-de-residencia-de-residencia-y-trabajo-y-de-tarjeta-de-familiar-de-ciudadano-de-la-union-europea',
   'administrative','html','critical',ARRAY['immigration','electronic_filing','mercurio','residence','work','eu_family'],
   'daily',false,'{"official":true,"monitoring_mode":"manual_reference"}'::jsonb),
  ('uge_movilidad_internacional','Ministerio de Inclusión, Seguridad Social y Migraciones / UGE-CE',
   'Unidad de Grandes Empresas y Colectivos Estratégicos — movilidad internacional',
   'https://www.inclusion.gob.es/web/unidadgrandesempresas',
   'https://www.inclusion.gob.es/web/unidadgrandesempresas',
   'administrative','html','critical',ARRAY['immigration','international_mobility','uge','applications','requirements','criteria'],
   'daily',false,'{"official":true,"monitoring_mode":"manual_reference"}'::jsonb),
  ('mjusticia_registro_civil_portal','Ministerio de Justicia',
   'Registro Civil — información y trámites',
   'https://www.mjusticia.gob.es/es/ciudadania/registros/registro-civil',
   'https://www.mjusticia.gob.es/es/ciudadania/registros/registro-civil',
   'administrative','html','critical',ARRAY['civil_registry','birth','marriage','death','certificates','registration','rectification'],
   'daily',false,'{"official":true,"monitoring_mode":"manual_reference","legal_review_required":true}'::jsonb)
ON CONFLICT (source_key) DO NOTHING;

-- No new jobs, no user-data modifications, no automatic legal publishing.
-- Only disable a known HTTP 403 source when it is still failing without baseline.
-- The URL remains available as an official manual reference in the registry.
UPDATE public.regulatory_sources
SET active = false,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'monitoring_mode', 'manual_reference',
      'manual_review_due_on', '2026-11-13',
      'automated_fetch_issue', 'HTTP 403',
      'fetch_issue_reviewed_on', '2026-10-13'
    )
WHERE source_key IN (
  'migraciones_normativa',
  'migraciones_hojas_informativas',
  'migraciones_presentacion_electronica',
  'uge_movilidad_internacional'
)
AND active = true
AND last_error = 'HTTP 403'
AND last_fingerprint IS NULL;

-- The old Registro Civil deep-link returns 404. Replace only when still broken.
-- Official Ministry of Justice registry overview is verified and is not a
-- substitute for a legal text, so keep legal review as a separate gate.
UPDATE public.regulatory_sources
SET url = 'https://www.mjusticia.gob.es/es/ciudadania/registros',
    fetch_url = 'https://www.mjusticia.gob.es/es/ciudadania/registros',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'fetch_url_repaired_on', '2026-10-13',
      'previous_fetch_url', 'https://www.mjusticia.gob.es/es/ciudadania/registros/registro-civil',
      'legal_review_required', true
    )
WHERE source_key = 'mjusticia_registro_civil_portal'
AND last_error = 'HTTP 404'
AND fetch_url = 'https://www.mjusticia.gob.es/es/ciudadania/registros/registro-civil';

-- Active dependencies must never reference a source disabled by this recovery.
-- Only those sources explicitly marked as manual references by this migration
-- are in scope; no existing primary BOE fallback links are touched.
UPDATE public.regulatory_dependencies AS dependency
SET active = false,
    metadata = coalesce(dependency.metadata, '{}'::jsonb) ||
      '{"monitoring_mode":"manual_reference"}'::jsonb
FROM public.regulatory_sources AS source
WHERE dependency.source_id = source.id
  AND source.source_key IN (
    'migraciones_normativa',
    'migraciones_hojas_informativas',
    'migraciones_presentacion_electronica',
    'uge_movilidad_internacional'
  )
  AND source.active = false
  AND source.metadata->>'monitoring_mode' = 'manual_reference'
  AND dependency.active = true;
