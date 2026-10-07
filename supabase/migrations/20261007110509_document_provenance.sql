alter table public.documents
  add column if not exists document_date date,
  add column if not exists ingestion_source text not null default 'unknown',
  add column if not exists ingestion_ref text;

comment on column public.documents.document_date is
  'Business/document date. Keep separate from created_at, which is the incorporation timestamp in EXPERT.';
comment on column public.documents.ingestion_source is
  'How the document entered EXPERT, e.g. client_portal, tenant_portal, admin_email, historical_import, unknown.';
comment on column public.documents.ingestion_ref is
  'Optional stable reference to the external/import source without changing canonical storage ownership.';
