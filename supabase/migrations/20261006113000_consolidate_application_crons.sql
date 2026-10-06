-- Canonical scheduler consolidation: Vercel -> Supabase pg_cron.
-- IMPORTANT: apply only after the production deployment that removes vercel.json crons is READY.
-- All calls target expertconsulting.es and authenticate from Supabase Vault.
-- Existing email-queue-hourly and regulatory jobs remain managed separately.

do $$
begin
  if not exists (select 1 from vault.decrypted_secrets where name = 'cron_secret') then
    raise exception 'cron_secret missing from Supabase Vault';
  end if;
end $$;

select cron.schedule(
  'expert-kia-work-results',
  '*/5 * * * *',
  $job$
  select net.http_get(
    url := 'https://expertconsulting.es/api/cron/kia-work-results',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret'
        limit 1
      )
    ),
    timeout_milliseconds := 120000
  ) as request_id;
  $job$
);

select cron.schedule(
  'expert-checkout-expiry',
  '0 6 * * *',
  $job$
  select net.http_get(
    url := 'https://expertconsulting.es/api/cron/checkout-expiry',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret'
        limit 1
      )
    ),
    timeout_milliseconds := 60000
  ) as request_id;
  $job$
);

select cron.schedule(
  'expert-email-sync',
  '*/10 * * * *',
  $job$
  select net.http_get(
    url := 'https://expertconsulting.es/api/cron/email-sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret'
        limit 1
      )
    ),
    timeout_milliseconds := 120000
  ) as request_id;
  $job$
);

select cron.schedule(
  'expert-kia-email-agent',
  '2-59/10 * * * *',
  $job$
  select net.http_get(
    url := 'https://expertconsulting.es/api/cron/kia-email-agent',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret'
        limit 1
      )
    ),
    timeout_milliseconds := 120000
  ) as request_id;
  $job$
);

select cron.schedule(
  'expert-booking-task-reconcile',
  '5,20,35,50 * * * *',
  $job$
  select net.http_get(
    url := 'https://expertconsulting.es/api/cron/booking-task-reconcile',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret'
        limit 1
      )
    ),
    timeout_milliseconds := 120000
  ) as request_id;
  $job$
);

select cron.schedule(
  'expert-recurring-meeting-series',
  '10 7 * * *',
  $job$
  select net.http_get(
    url := 'https://expertconsulting.es/api/cron/recurring-meeting-series',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret'
        limit 1
      )
    ),
    timeout_milliseconds := 60000
  ) as request_id;
  $job$
);

select cron.schedule(
  'expert-fiscal-reminders',
  '0 8 * * *',
  $job$
  select net.http_get(
    url := 'https://expertconsulting.es/api/cron/fiscal-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret'
        limit 1
      )
    ),
    timeout_milliseconds := 120000
  ) as request_id;
  $job$
);

select cron.schedule(
  'expert-holded-sync',
  '15 7 * * *',
  $job$
  select net.http_get(
    url := 'https://expertconsulting.es/api/cron/holded-sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret'
        limit 1
      )
    ),
    timeout_milliseconds := 120000
  ) as request_id;
  $job$
);

select cron.schedule(
  'expert-kia-health',
  '0 9 * * *',
  $job$
  select net.http_get(
    url := 'https://expertconsulting.es/api/cron/kia-health',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret'
        limit 1
      )
    ),
    timeout_milliseconds := 60000
  ) as request_id;
  $job$
);

select cron.schedule(
  'expert-kia-ai-budget',
  '17 * * * *',
  $job$
  select net.http_get(
    url := 'https://expertconsulting.es/api/cron/kia-ai-budget',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret'
        limit 1
      )
    ),
    timeout_milliseconds := 60000
  ) as request_id;
  $job$
);

select cron.schedule(
  'expert-kia-client-ledger',
  '7,37 * * * *',
  $job$
  select net.http_get(
    url := 'https://expertconsulting.es/api/cron/kia-client-ledger',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret'
        limit 1
      )
    ),
    timeout_milliseconds := 120000
  ) as request_id;
  $job$
);

select cron.schedule(
  'expert-daily-summary',
  '30 8 * * *',
  $job$
  select net.http_get(
    url := 'https://expertconsulting.es/api/cron/daily-summary',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret'
        limit 1
      )
    ),
    timeout_milliseconds := 120000
  ) as request_id;
  $job$
);

select cron.schedule(
  'expert-subscription-monthly-meetings',
  '40 8 * * *',
  $job$
  select net.http_get(
    url := 'https://expertconsulting.es/api/cron/subscription-monthly-meetings',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret'
        limit 1
      )
    ),
    timeout_milliseconds := 120000
  ) as request_id;
  $job$
);

select cron.schedule(
  'expert-tenant-weekly-digest',
  '0 7 * * 1',
  $job$
  select net.http_get(
    url := 'https://expertconsulting.es/api/cron/tenant-weekly-digest',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret'
        limit 1
      )
    ),
    timeout_milliseconds := 120000
  ) as request_id;
  $job$
);
