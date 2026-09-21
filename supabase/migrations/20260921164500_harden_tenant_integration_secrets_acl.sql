-- Restore the original server-side-only ACL for tenant integration secrets.
-- The 2026-09-12 baseline ACL granted the standard API-role table privileges
-- before applying hardened exceptions, but this table was accidentally omitted
-- from that exception list. RLS/no-policy already denies row access; this
-- migration restores defense in depth without changing rows, policies or schema.

revoke all privileges on table public.tenant_integration_secrets from anon, authenticated;
