-- Prevent repeated global KIA health NBAs from accumulating on every canary run.
-- Existing duplicates are resolved (status=done), never deleted.

update public.next_best_actions
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'dedup_key',
  coalesce(
    nullif(metadata ->> 'dedup_key', ''),
    'health:' || coalesce(nullif(metadata ->> 'source', ''), 'canary') || ':' ||
      coalesce(
        nullif(metadata ->> 'checkId', ''),
        nullif(metadata ->> 'anomaly_type', ''),
        md5(coalesce(title, '') || '|' || coalesce(description, ''))
      )
  )
)
where action_type = 'kia_health_critical_anomaly'
  and status = 'open'
  and client_id is null
  and lead_id is null
  and case_id is null;

with ranked as (
  select
    id,
    row_number() over (
      partition by action_type, metadata ->> 'dedup_key'
      order by created_at desc, id desc
    ) as rn
  from public.next_best_actions
  where action_type = 'kia_health_critical_anomaly'
    and status = 'open'
    and client_id is null
    and lead_id is null
    and case_id is null
    and metadata ? 'dedup_key'
)
update public.next_best_actions nba
set status = 'done',
    resolved_at = coalesce(nba.resolved_at, now())
from ranked r
where nba.id = r.id
  and r.rn > 1;

create unique index if not exists next_best_actions_open_global_dedup_uidx
  on public.next_best_actions(action_type, (metadata ->> 'dedup_key'))
  where status = 'open'
    and client_id is null
    and lead_id is null
    and case_id is null
    and metadata ? 'dedup_key';
