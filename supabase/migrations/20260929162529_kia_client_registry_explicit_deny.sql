
create policy "client_registry_subjects_browser_deny"
on public.client_registry_subjects
for all
to anon, authenticated
using (false)
with check (false);

create policy "client_registry_events_browser_deny"
on public.client_registry_events
for all
to anon, authenticated
using (false)
with check (false);

create policy "client_registry_snapshots_browser_deny"
on public.client_registry_snapshots
for all
to anon, authenticated
using (false)
with check (false);
