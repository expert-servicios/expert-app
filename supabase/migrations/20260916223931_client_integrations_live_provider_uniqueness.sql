-- Local baseline aligned to production migration ledger version 20260916223931.
-- Production preflight 2026-09-17 verified both indexes already exist with
-- these exact predicates and there are zero live duplicate groups.
-- This file is ledger alignment only; do not replay the DDL manually.
create unique index if not exists client_integrations_company_provider_live_uidx
  on public.client_integrations (company_id, provider)
  where company_id is not null and status <> 'revoked';

create unique index if not exists client_integrations_client_provider_live_uidx
  on public.client_integrations (client_id, provider)
  where company_id is null and client_id is not null and status <> 'revoked';
