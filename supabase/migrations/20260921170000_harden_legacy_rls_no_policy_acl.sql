-- Harden legacy RLS/no-policy tables that still expose broad API-role grants.
--
-- Read-only production preflight on 2026-09-21 confirmed that these five tables
-- have RLS enabled and no policies, but still retain broad anon/authenticated
-- table privileges inherited from the historical baseline.
--
-- Current application code does not rely on direct browser access to these
-- tables. kia_feedback is accessed through server-side admin/service-role code.
--
-- This migration changes ACL only:
-- - no rows are modified;
-- - no RLS policy is added or removed;
-- - service_role privileges remain untouched;
-- - RLS remains enabled.

revoke all privileges on table public.faqs from anon, authenticated;
revoke all privileges on table public.faq_submissions from anon, authenticated;
revoke all privileges on table public.kia_feedback from anon, authenticated;
revoke all privileges on table public.user_training_credits from anon, authenticated;
revoke all privileges on table public.usuarios from anon, authenticated;
