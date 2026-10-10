# KIA web public: proposed persistence schema (review only)

**This SQL is a design proposal, not an applied migration.** Create the actual migration with the Supabase CLI on a checked-out repository once schema review is approved; run migration drift checks and security advisors before release. No production database changes in this PR.

```sql
create table public.kia_public_web_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (length(token_hash) = 64),
  state text not null default 'active' check (state in ('active','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  lead_id uuid null references public.leads(id) on delete set null,
  constraint no_expired_initial_session check (expires_at > created_at)
);

create table public.kia_public_web_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.kia_public_web_sessions(id) on delete cascade,
  client_message_id uuid not null,
  role text not null check (role in ('user','assistant','system')),
  body text not null check (char_length(body) between 1 and 4000),
  delivery_state text not null default 'received'
    check (delivery_state in ('received','sent','failed')),
  created_at timestamptz not null default now(),
  unique (session_id, client_message_id, role)
);

create index kia_public_web_messages_session_created_idx
  on public.kia_public_web_messages(session_id, created_at desc);

create index kia_public_web_sessions_expiry_idx
  on public.kia_public_web_sessions(expires_at);

alter table public.kia_public_web_sessions enable row level security;
alter table public.kia_public_web_messages enable row level security;

-- Deliberately no visitor policies. Server-side service role access only.
revoke all on public.kia_public_web_sessions from anon, authenticated, public;
revoke all on public.kia_public_web_messages from anon, authenticated, public;
grant select, insert, update, delete on public.kia_public_web_sessions to service_role;
grant select, insert, update, delete on public.kia_public_web_messages to service_role;
```

## Integration contract

- The cookie contains only a signed, expiring random session identifier (never a lead or user ID). The server derives an HMAC/SHA256 lookup hash from the validated token/session ID. Do not persist the original cookie.
- The browser cannot access Supabase tables directly; use a server-only Next.js route with same-origin checks, reCAPTCHA, rate limiting and a feature flag.
- A verified cookie grants access **only** to that session's messages. Test visitor A versus visitor B, expired tokens, token tampering and session fixation.
- A session does **not** equal a personal identity or CRM lead. Create/link a lead only on a verified, explicit action. Never use matching names, emails, phone numbers or IP.
- On every message verify active state and `expires_at > now()`; use an idempotent client message ID and server-generated event identifiers.
- Retention needs documented business/legal review: proposed expiry 7 days and later purge of expired anonymous content unless a verified lawful business record must be retained. Schedule purge only after approval.
- For manual takeover, defer KIA auto-reply to a professional without revealing privileged details. Log failed delivery for reconciliation, not a second contradictory reply.
- No endpoint or schema activation until the SQL has been transformed into a reproducible migration and tested on a nonproduction database.
