create table if not exists public.kia_channel_link_tokens (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check (channel in ('telegram')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.kia_channel_link_tokens enable row level security;

revoke all on table public.kia_channel_link_tokens from anon, authenticated, service_role;
grant select, insert, update on table public.kia_channel_link_tokens to service_role;

create index if not exists kia_channel_link_tokens_profile_idx
  on public.kia_channel_link_tokens(profile_id, channel, expires_at desc);

create or replace function public.kia_consume_telegram_link_token(
  p_token_hash text,
  p_external_user_id text,
  p_external_chat_id text,
  p_external_username text default null
)
returns table(profile_id uuid, tenant_id uuid, identity_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token public.kia_channel_link_tokens%rowtype;
  v_profile record;
  v_identity public.kia_channel_identities%rowtype;
begin
  if coalesce(trim(p_token_hash), '') = ''
     or coalesce(trim(p_external_user_id), '') = ''
     or coalesce(trim(p_external_chat_id), '') = '' then
    raise exception 'KIA_TELEGRAM_LINK_INVALID_INPUT';
  end if;

  select * into v_token
  from public.kia_channel_link_tokens
  where channel = 'telegram'
    and token_hash = p_token_hash
  for update;

  if not found then
    raise exception 'KIA_TELEGRAM_LINK_INVALID';
  end if;
  if v_token.consumed_at is not null then
    raise exception 'KIA_TELEGRAM_LINK_ALREADY_USED';
  end if;
  if v_token.expires_at <= now() then
    raise exception 'KIA_TELEGRAM_LINK_EXPIRED';
  end if;

  select id, tenant_id, status into v_profile
  from public.profiles
  where id = v_token.profile_id;

  if not found
     or v_profile.status = 'inactive'
     or v_profile.tenant_id is null
     or v_profile.tenant_id <> v_token.tenant_id then
    raise exception 'KIA_TELEGRAM_LINK_PROFILE_INVALID';
  end if;

  select * into v_identity
  from public.kia_channel_identities
  where channel = 'telegram'
    and (external_user_id = p_external_user_id or external_chat_id = p_external_chat_id)
  limit 1
  for update;

  if found then
    if v_identity.profile_id <> v_token.profile_id
       or v_identity.tenant_id <> v_token.tenant_id
       or v_identity.external_user_id <> p_external_user_id
       or v_identity.external_chat_id <> p_external_chat_id then
      raise exception 'KIA_TELEGRAM_LINK_IDENTITY_CONFLICT';
    end if;

    update public.kia_channel_identities
    set status = 'active',
        verified_at = now(),
        revoked_at = null,
        external_username = p_external_username,
        updated_at = now()
    where id = v_identity.id
    returning * into v_identity;
  else
    insert into public.kia_channel_identities (
      tenant_id,
      profile_id,
      channel,
      external_user_id,
      external_chat_id,
      external_username,
      status,
      verified_at,
      created_by
    ) values (
      v_token.tenant_id,
      v_token.profile_id,
      'telegram',
      p_external_user_id,
      p_external_chat_id,
      p_external_username,
      'active',
      now(),
      v_token.profile_id
    ) returning * into v_identity;
  end if;

  update public.kia_channel_link_tokens
  set consumed_at = now()
  where id = v_token.id;

  return query select v_token.profile_id, v_token.tenant_id, v_identity.id;
end;
$$;

revoke all on function public.kia_consume_telegram_link_token(text, text, text, text) from public, anon, authenticated;
grant execute on function public.kia_consume_telegram_link_token(text, text, text, text) to service_role;

comment on table public.kia_channel_link_tokens is
  'Short-lived one-time hashed tokens for explicit EXPERT-to-Telegram identity linking.';
