-- Close the authenticated direct-insert path on public.documents.
-- Client uploads already go through server-side routes that validate user,
-- case and company scope before writing with the service role.
drop policy if exists "client insert own documents" on public.documents;
revoke insert on table public.documents from authenticated;
revoke insert on table public.documents from anon;
