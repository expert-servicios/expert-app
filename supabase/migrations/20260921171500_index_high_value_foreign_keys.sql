-- Add only the two high-value foreign-key indexes selected from the
-- 2026-09-21 production performance preflight.
--
-- Production evidence before this migration:
-- - public.leads.owner_id: ~704 rows, 7,897 sequential scans, no equivalent index.
-- - public.whatsapp_conversations.client_id: ~514 rows, 12,507 sequential scans, no equivalent index.
--
-- Existing indexes on both tables were inventoried first; these definitions do
-- not duplicate an existing index. No rows or historical financial data change.

create index if not exists leads_owner_id_idx
  on public.leads (owner_id);

create index if not exists whatsapp_conversations_client_id_idx
  on public.whatsapp_conversations (client_id);
