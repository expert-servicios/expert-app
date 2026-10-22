-- Targeted, auditable correction for contradictory AI impacts detected in
-- the 2026-10-13 BOE daily sumario; no other source or company data is touched.
-- Preserve AI classification/hints for later human review.
DELETE FROM public.regulatory_change_dependencies AS impact
USING public.regulatory_changes AS event,
      public.regulatory_sources AS source,
      public.regulatory_dependencies AS dependency
WHERE impact.change_id = event.id
  AND event.source_id = source.id
  AND impact.dependency_id = dependency.id
  AND event.id = '17e6667f-9c87-47c9-ba50-dff5046bec71'::uuid
  AND source.source_key = 'boe_daily_sumario'
  AND event.created_at::date = '2026-10-13'
  AND impact.id IN (
    '2b86f3d0-eadd-4598-8e17-b97ce1df9fa6'::uuid,
    '8f5637c4-f894-4ae5-b904-083c6f05ed7d'::uuid
  )
  AND (
    (dependency.dependency_type = 'telegram' AND dependency.dependency_key = 'batch1-immigration')
    OR (dependency.dependency_type = 'kia_prompt' AND dependency.dependency_key = 'immigration')
  )
  AND (impact.impact_reason ILIKE '%no immigration%' OR impact.impact_reason ILIKE '%no updates required for immigration%');

-- BOE medium content update must not bypass legal/editorial human review.
UPDATE public.regulatory_changes AS event
SET status = 'needs_review',
    requires_human_review = true,
    resolution_evidence = coalesce(event.resolution_evidence, '{}'::jsonb) ||
      jsonb_build_object(
        'qa_review_reason', 'BOE content update requires legal/editorial review; two negative immigration links were not real impacts',
        'qa_reviewed_on', '2026-10-13',
        'qa_flagged_by', 'regulatory_impact_gate_v2'
      )
FROM public.regulatory_sources AS source
WHERE event.source_id = source.id
  AND event.id = '17e6667f-9c87-47c9-ba50-dff5046bec71'::uuid
  AND source.source_key = 'boe_daily_sumario'
  AND event.created_at::date = '2026-10-13'
  AND event.status = 'classified'
  AND event.severity = 'medium'
  AND event.change_type = 'content_update'
  AND event.requires_human_review = false;
