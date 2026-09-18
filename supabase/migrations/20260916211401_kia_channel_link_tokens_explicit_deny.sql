-- KIA M7.2d hardening: make browser denial explicit for Telegram link tokens.
-- RLS already fails closed without policies; this policy documents and enforces
-- that anon/authenticated must never read or mutate short-lived linking tokens.

create policy "kia_channel_link_tokens_deny_browser"
on public.kia_channel_link_tokens
for all
to anon, authenticated
using (false)
with check (false);
