-- Case document checklist workflow.
-- Forward-only migration rebuilt after #143 ledger reconciliation.
-- Supports personal nationality cases without company attribution while keeping
-- business document flows company-scoped in application code.

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

create index if not exists case_document_notes_client_case_idx
  on public.case_document_notes (client_id, case_id);

alter table public.case_document_notes enable row level security;

revoke all on table public.case_document_notes from public, anon;
grant select, insert, update on table public.case_document_notes to authenticated;
grant select, insert, update, delete on table public.case_document_notes to service_role;

drop policy if exists case_document_notes_admin_all on public.case_document_notes;
create policy case_document_notes_admin_all
on public.case_document_notes
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'owner')
      and coalesce(p.status, 'active') <> 'inactive'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
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
using (
  client_id = auth.uid()
  and exists (
    select 1
    from public.cases c
    where c.id = case_document_notes.case_id
      and c.client_id = auth.uid()
  )
);

drop policy if exists case_document_notes_client_insert on public.case_document_notes;
create policy case_document_notes_client_insert
on public.case_document_notes
for insert
to authenticated
with check (
  client_id = auth.uid()
  and (updated_by is null or updated_by = auth.uid())
  and exists (
    select 1
    from public.cases c
    where c.id = case_document_notes.case_id
      and c.client_id = auth.uid()
  )
);

drop policy if exists case_document_notes_client_update on public.case_document_notes;
create policy case_document_notes_client_update
on public.case_document_notes
for update
to authenticated
using (
  client_id = auth.uid()
  and exists (
    select 1
    from public.cases c
    where c.id = case_document_notes.case_id
      and c.client_id = auth.uid()
  )
)
with check (
  client_id = auth.uid()
  and (updated_by is null or updated_by = auth.uid())
  and exists (
    select 1
    from public.cases c
    where c.id = case_document_notes.case_id
      and c.client_id = auth.uid()
  )
);

drop trigger if exists case_document_notes_updated_at on public.case_document_notes;
create trigger case_document_notes_updated_at
before update on public.case_document_notes
for each row execute function public.update_updated_at_column();

create unique index if not exists internal_tasks_one_open_nationality_submit_per_case
  on public.internal_tasks (case_id)
  where source = 'document'
    and title = 'Preparar y presentar solicitud de nacionalidad'
    and status in ('pendiente','en_progreso');

comment on table public.case_document_notes is
  'Per-checklist document comments. Client access is restricted to notes whose case is owned by auth.uid(); operational APIs use the server-side service role.';
