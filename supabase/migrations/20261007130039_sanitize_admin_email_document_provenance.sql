create or replace function public.sanitize_admin_email_document_provenance()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.ingestion_source = 'admin_email' then
    new.ingestion_ref := null;
  end if;
  return new;
end;
$$;

revoke all on function public.sanitize_admin_email_document_provenance() from public, anon, authenticated;

drop trigger if exists documents_sanitize_admin_email_provenance on public.documents;
create trigger documents_sanitize_admin_email_provenance
before insert or update of ingestion_source, ingestion_ref
on public.documents
for each row
execute function public.sanitize_admin_email_document_provenance();

update public.documents
set ingestion_ref = null
where ingestion_source = 'admin_email'
  and ingestion_ref is not null;
