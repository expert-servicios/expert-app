-- Case document checklist workflow.
-- Adds optional per-checklist comments, document-to-checklist links and
-- a durable admin task trigger point when the client sends documents for review.

alter table public.documents
  alter column company_id drop not null,
  add column if not exists checklist_item_key text,
  add column if not exists checklist_item_label text,
  add column if not exists client_comment text,
  add column if not exists replaced_by uuid references public.documents(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists documents_case_checklist_item_idx
  on public.documents (case_id, checklist_item_key)
  where checklist_item_key is not null;

create table if not exists public.case_document_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  item_key text not null,
  item_label text not null,
  comment text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, item_key)
);

alter table public.case_document_notes enable row level security;

drop policy if exists case_document_notes_admin_all on public.case_document_notes;
create policy case_document_notes_admin_all
on public.case_document_notes
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'owner')
      and coalesce(p.status, 'active') <> 'inactive'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'owner')
      and coalesce(p.status, 'active') <> 'inactive'
  )
);

drop policy if exists case_document_notes_client_select on public.case_document_notes;
create policy case_document_notes_client_select
on public.case_document_notes
for select
to authenticated
using (client_id = auth.uid());

drop policy if exists case_document_notes_client_insert on public.case_document_notes;
create policy case_document_notes_client_insert
on public.case_document_notes
for insert
to authenticated
with check (client_id = auth.uid());

drop policy if exists case_document_notes_client_update on public.case_document_notes;
create policy case_document_notes_client_update
on public.case_document_notes
for update
to authenticated
using (client_id = auth.uid())
with check (client_id = auth.uid());

create unique index if not exists internal_tasks_one_open_nationality_submit_per_case
  on public.internal_tasks (case_id)
  where source = 'document'
    and title = 'Preparar y presentar solicitud de nacionalidad'
    and status in ('pendiente','en_progreso');
