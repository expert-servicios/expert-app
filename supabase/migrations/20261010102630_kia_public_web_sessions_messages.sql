-- KIA public web chat persistence: server-only anonymous sessions and turns.
-- This migration only creates storage; it does NOT enable the public chat write/read API.
-- Browser cookies and signing secrets must NEVER be written to these tables.

create table public.kia_public_web_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique
    constraint kia_public_web_sessions_token_hash_format
    check (token_hash ~ '^[0-9a-f]{64}$'),
  state text not null default 'active'
    constraint kia_public_web_sessions_state_check
    check (state in ('active', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  lead_id uuid references public.leads(id) on delete set null,
  constraint kia_public_web_sessions_expiry_check
    check (
      expires_at > created_at
      and expires_at <= created_at + interval '8 days'
    )
);

comment on table public.kia_public_web_sessions is
  'KIA browser-session continuity only. No visitor identity or authentication is implied.';
comment on column public.kia_public_web_sessions.token_hash is
  'Opaque server-derived SHA-256/HMAC digest; never the original signed cookie or session identifier.';
comment on column public.kia_public_web_sessions.lead_id is
  'Optional link established only after an explicit verified identity action; never inferred by email/IP/name.';

create table public.kia_public_web_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.kia_public_web_sessions(id) on delete cascade,
  client_message_id uuid not null,
  role text not null
    constraint kia_public_web_messages_role_check
    check (role in ('user', 'assistant')),
  body text not null
    constraint kia_public_web_messages_body_check
    check (char_length(btrim(body)) between 1 and 4000),
  delivery_state text not null default 'received'
    constraint kia_public_web_messages_delivery_check
    check (delivery_state in ('received', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  constraint kia_public_web_messages_turn_dedupe
    unique (session_id, client_message_id, role)
);

comment on table public.kia_public_web_messages is
  'Redacted public KIA turns only. Each browser session remains isolated; system prompts/secrets are not stored.';
comment on column public.kia_public_web_messages.client_message_id is
  'One idempotency UUID per incoming turn; an assistant response reuses its request UUID.';

create index kia_public_web_sessions_expires_idx
  on public.kia_public_web_sessions(expires_at);
create index kia_public_web_sessions_lead_idx
  on public.kia_public_web_sessions(lead_id)
  where lead_id is not null;
create index kia_public_web_messages_session_created_idx
  on public.kia_public_web_messages(session_id, created_at desc, id);

alter table public.kia_public_web_sessions enable row level security;
alter table public.kia_public_web_messages enable row level security;

-- No browser policies: access is exclusively via server-side service-role calls.
-- PUBLIC also covers new/previously granted default privileges.
revoke all privileges on table
  public.kia_public_web_sessions,
  public.kia_public_web_messages
from public, anon, authenticated;

grant select, insert, update, delete on table
  public.kia_public_web_sessions,
  public.kia_public_web_messages
to service_role;

-- Purging expired sessions will cascade-delete their messages. Expiration/purge
-- scheduling is deliberately NOT activated by this schema-only migration.
