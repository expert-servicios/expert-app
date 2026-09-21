-- Schedule KIA Regulatory Registry using the existing shared cron_secret in Supabase Vault.
-- All jobs are idempotently replaced by name.

do $$
begin
  perform cron.unschedule('regulatory-pulse-daily');
exception when others then
  null;
end $$;

do $$
begin
  perform cron.unschedule('regulatory-worker-hourly');
exception when others then
  null;
end $$;

do $$
begin
  perform cron.unschedule('regulatory-monthly-audit');
exception when others then
  null;
end $$;

select cron.schedule(
  'regulatory-pulse-daily',
  '17 5 * * *',
  $$
  select net.http_post(
    url := 'https://expertconsulting.es/api/cron/regulatory-pulse',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret'
      )
    ),
    body := '{}'::jsonb
  )
  where exists (
    select 1 from vault.decrypted_secrets where name = 'cron_secret'
  )
  $$
);

select cron.schedule(
  'regulatory-worker-hourly',
  '37 * * * *',
  $$
  select net.http_post(
    url := 'https://expertconsulting.es/api/cron/regulatory-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret'
      )
    ),
    body := '{}'::jsonb
  )
  where exists (
    select 1 from vault.decrypted_secrets where name = 'cron_secret'
  )
  $$
);

select cron.schedule(
  'regulatory-monthly-audit',
  '41 5 3 * *',
  $$
  select net.http_post(
    url := 'https://expertconsulting.es/api/cron/regulatory-monthly-audit',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret'
      )
    ),
    body := '{}'::jsonb
  )
  where exists (
    select 1 from vault.decrypted_secrets where name = 'cron_secret'
  )
  $$
);
