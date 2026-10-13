-- Recovery for confirmed official-source fetch failures on 2026-10-13.
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
