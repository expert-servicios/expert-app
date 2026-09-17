-- KIA M4.5.1: make browser denial explicit for the authoritative access-grant table.
-- RLS already fails closed without policies; this policy documents and enforces
-- that anon/authenticated must never read or mutate elevated KIA grants.

create policy "kia_access_grants_deny_browser"
on public.kia_access_grants
for all
to anon, authenticated
using (false)
with check (false);
