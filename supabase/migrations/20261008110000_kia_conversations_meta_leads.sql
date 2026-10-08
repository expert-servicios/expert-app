-- Extend canonical KIA conversations to support public leads from Meta
-- without fabricating profile identities. Existing profile-scoped flows remain unchanged.

alter table public.kia_conversations
  add column if not exists lead_id uuid references public.leads(id) on delete restrict;

alter table public.kia_conversations
  alter column profile_id drop not null;

alter table public.kia_conversations
  drop constraint if exists kia_conversations_channel_check;

alter table public.kia_conversations
  add constraint kia_conversations_channel_check
  check (channel in ('dashboard','telegram','waba','email','meta'));

alter table public.kia_conversations
  drop constraint if exists kia_conversations_origin_type_check;

alter table public.kia_conversations
  add constraint kia_conversations_origin_type_check
  check (origin_type in ('email','dashboard','telegram','waba','meta','system'));

alter table public.kia_conversations
  drop constraint if exists kia_conversations_identity_scope_check;

alter table public.kia_conversations
  add constraint kia_conversations_identity_scope_check
  check (
    (profile_id is not null and lead_id is null)
    or
    (profile_id is null and lead_id is not null)
  );

create index if not exists kia_conversations_lead_updated_idx
  on public.kia_conversations(lead_id, updated_at desc)
  where lead_id is not null;

alter table public.kia_conversation_messages
  alter column profile_id drop not null;

alter table public.kia_conversation_messages
  drop constraint if exists kia_conversation_messages_channel_check;

alter table public.kia_conversation_messages
  add constraint kia_conversation_messages_channel_check
  check (channel in ('dashboard','telegram','waba','email','meta'));

comment on column public.kia_conversations.lead_id is
  'Canonical public-lead identity for conversations that are not linked to an authenticated profile. Exactly one of profile_id or lead_id must be set.';
