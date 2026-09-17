create unique index if not exists client_integrations_company_provider_live_uidx
  on public.client_integrations (company_id, provider)
  where company_id is not null and status <> 'revoked';

create unique index if not exists client_integrations_client_provider_live_uidx
  on public.client_integrations (client_id, provider)
  where company_id is null and client_id is not null and status <> 'revoked';