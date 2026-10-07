drop policy if exists "client view own documents" on public.documents;

create policy "client view own documents"
  on public.documents
  for select
  to authenticated
  using (
    client_id = (select auth.uid())
    and kind <> 'internal'
  );
