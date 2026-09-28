alter table public.newsletter_subscribers
  alter column email drop not null;

alter table public.newsletter_subscribers
  add column if not exists channel text not null default 'email',
  add column if not exists audience_segment text,
  add column if not exists telegram_chat_id text,
  add column if not exists telegram_username text,
  add column if not exists telegram_subscribed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.newsletter_subscribers
  drop constraint if exists newsletter_subscribers_channel_check,
  add constraint newsletter_subscribers_channel_check
    check (channel in ('email','telegram'));

alter table public.newsletter_subscribers
  drop constraint if exists newsletter_subscribers_audience_segment_check,
  add constraint newsletter_subscribers_audience_segment_check
    check (
      audience_segment is null or audience_segment in (
        'particular_residente',
        'particular_no_residente',
        'autonomo',
        'empresa'
      )
    );

alter table public.newsletter_subscribers
  drop constraint if exists newsletter_subscribers_channel_identity_check,
  add constraint newsletter_subscribers_channel_identity_check
    check (
      (channel = 'email' and email is not null and telegram_chat_id is null)
      or
      (channel = 'telegram' and telegram_chat_id is not null)
    );

create unique index if not exists newsletter_subscribers_telegram_chat_uidx
  on public.newsletter_subscribers (telegram_chat_id)
  where telegram_chat_id is not null;

create index if not exists newsletter_subscribers_segment_channel_idx
  on public.newsletter_subscribers (audience_segment, channel)
  where unsubscribed_at is null;

drop policy if exists "public insert newsletter" on public.newsletter_subscribers;

revoke insert, update, delete on table public.newsletter_subscribers from anon, authenticated;


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

-- Canonicalize legacy email recipients to the same key format used by
-- current campaign dispatch. This makes historical and future idempotency
-- comparable and avoids case/whitespace duplicates.
update public.campaign_sends
set recipient_key = 'email:' || lower(trim(recipient_email)),
    recipient_channel = 'email'
where recipient_key is null
   or (
     recipient_channel = 'email'
     and recipient_key not like 'email:%'
   );

-- Historical lead campaigns could contain more than one row for the same
-- normalized recipient (for example, two consented lead records sharing an
-- email address). Keep one deterministic row per campaign/recipient before
-- adding the unique index. Prefer a successful send when one exists.
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
