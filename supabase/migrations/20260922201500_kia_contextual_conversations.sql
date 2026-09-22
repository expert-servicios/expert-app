create table if not exists public.kia_conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check (channel in ('dashboard','telegram','waba','email')),
  company_id uuid references public.companies(id) on delete set null,
  case_id uuid references public.cases(id) on delete set null,
  service_slug text,
  topic text,
  status text not null default 'active' check (status in ('active','closed','archived')),
  origin_type text not null default 'dashboard' check (origin_type in ('email','dashboard','telegram','waba','system')),
  origin_ref text,
  metadata jsonb not null default '{}'::jsonb,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kia_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.kia_conversations(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check (channel in ('dashboard','telegram','waba','email')),
  role text not null check (role in ('user','assistant','professional','system')),
  body text not null,
  intent text,
  avatar_state text,
  external_message_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.kia_context_tokens (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  company_id uuid references public.companies(id) on delete cascade,
  case_id uuid references public.cases(id) on delete cascade,
  service_slug text,
  task_id uuid references public.internal_tasks(id) on delete set null,
  origin_type text not null check (origin_type in ('email','dashboard','telegram','system')),
  origin_ref text,
  intent_hint text,
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.kia_telegram_updates (
  update_id bigint primary key,
  external_chat_id text,
  external_user_id text,
  message_id bigint,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  status text not null default 'received' check (status in ('received','processed','ignored','failed')),
  error text
);

create index if not exists kia_conversations_profile_updated_idx
  on public.kia_conversations(profile_id, updated_at desc);
create index if not exists kia_conversations_case_updated_idx
  on public.kia_conversations(case_id, updated_at desc) where case_id is not null;
create index if not exists kia_conversations_tenant_status_idx
  on public.kia_conversations(tenant_id, status, updated_at desc);
create index if not exists kia_conversation_messages_conversation_created_idx
  on public.kia_conversation_messages(conversation_id, created_at);
create index if not exists kia_context_tokens_profile_expiry_idx
  on public.kia_context_tokens(profile_id, expires_at desc);
create index if not exists kia_context_tokens_case_idx
  on public.kia_context_tokens(case_id) where case_id is not null;

alter table public.kia_conversations enable row level security;
alter table public.kia_conversation_messages enable row level security;
alter table public.kia_context_tokens enable row level security;
alter table public.kia_telegram_updates enable row level security;

revoke all on table public.kia_conversations, public.kia_conversation_messages, public.kia_context_tokens, public.kia_telegram_updates from public, anon, authenticated;
grant select, insert, update, delete on table public.kia_conversations, public.kia_conversation_messages, public.kia_context_tokens, public.kia_telegram_updates to service_role;

comment on table public.kia_conversations is 'Canonical multichannel KIA conversation envelope. Server-side only.';
comment on table public.kia_conversation_messages is 'Auditable persisted KIA messages scoped to a conversation.';
comment on table public.kia_context_tokens is 'Hashed opaque context links for email/app/Telegram. Plain tokens are never stored.';
comment on table public.kia_telegram_updates is 'Telegram update ledger for durable idempotency by update_id.';
