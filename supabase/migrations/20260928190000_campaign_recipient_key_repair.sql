-- Forward-only repair for environments where newsletter_segments_and_telegram
-- was recorded before the campaign targeting / delivery-idempotency additions
-- were present in the migration file.

alter table public.campaigns
  add column if not exists audience_segment text;

alter table public.campaigns
  drop constraint if exists campaigns_audience_segment_check,
  add constraint campaigns_audience_segment_check
    check (
      audience_segment is null or audience_segment in (
        'particular_residente',
        'particular_no_residente',
        'autonomo',
        'empresa'
      )
    );

alter table public.campaign_sends
  add column if not exists recipient_channel text not null default 'email',
  add column if not exists recipient_key text;

-- The unique index may already exist in a fresh/reset environment. Drop it
-- before canonicalizing so case/whitespace variants can converge safely.
drop index if exists public.campaign_sends_campaign_recipient_key_uidx;

update public.campaign_sends
set recipient_key = 'email:' || lower(trim(recipient_email))
where recipient_channel = 'email';

update public.campaign_sends
set recipient_key = case
  when recipient_key like 'telegram:%' then recipient_key
  when recipient_email ~ '^telegram:.+@telegram[.]invalid$'
    then regexp_replace(recipient_email, '^telegram:(.+)@telegram[.]invalid$', 'telegram:\1')
  else 'telegram:legacy:' || id::text
end
where recipient_channel = 'telegram';

-- Prefer a confirmed send if historical rows collapse to the same canonical
-- campaign/recipient key, then retain the earliest deterministic record.
with ranked_campaign_sends as (
  select
    id,
    row_number() over (
      partition by campaign_id, recipient_key
      order by
        case when status = 'sent' then 0 else 1 end,
        sent_at asc nulls last,
        created_at asc,
        id asc
    ) as duplicate_rank
  from public.campaign_sends
)
delete from public.campaign_sends cs
using ranked_campaign_sends ranked
where cs.id = ranked.id
  and ranked.duplicate_rank > 1;

alter table public.campaign_sends
  alter column recipient_key set not null,
  drop constraint if exists campaign_sends_recipient_channel_check,
  add constraint campaign_sends_recipient_channel_check
    check (recipient_channel in ('email','telegram'));

create unique index if not exists campaign_sends_campaign_recipient_key_uidx
  on public.campaign_sends (campaign_id, recipient_key);
