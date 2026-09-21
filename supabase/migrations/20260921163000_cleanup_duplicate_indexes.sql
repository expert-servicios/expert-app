-- Remove exact duplicate indexes reported by Supabase Performance Advisor.
-- Preflight 2026-09-21 confirmed:
--   * each dropped index has an identical surviving peer;
--   * none of these indexes backs a PostgreSQL constraint;
--   * no table data or access policy is changed.
--
-- Keep the peer with observed planner usage where available and retain the
-- original leads_phone_unique name referenced by the historic upsert migration.

drop index if exists public.idx_cases_due_date;
drop index if exists public.idx_cases_status;

drop index if exists public.idx_auditor_reviews_created;
drop index if exists public.idx_auditor_rule_results_review;

drop index if exists public.leads_phone_unique_idx;

drop index if exists public.idx_whatsapp_conv_needs_review;
