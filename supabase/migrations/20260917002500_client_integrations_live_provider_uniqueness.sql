-- Prevent concurrent connect flows from creating multiple non-revoked
-- integrations for the same provider and company/client scope.
--
-- Existing production preflight confirmed there are no duplicates matching
-- either predicate before this migration is applied.

create unique index if not exists client_integrations_company_provider_live_uidx
  on public.client_integrations (company_id, provider)
  where company_id is not null and status <> 'revoked';

create unique index if not exists client_integrations_client_provider_live_uidx
  on public.client_integrations (client_id, provider)
  where company_id is null and client_id is not null and status <> 'revoked';
