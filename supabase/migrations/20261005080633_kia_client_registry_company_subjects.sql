-- Extend KIA client registry to support company-only internal subjects.
alter table public.client_registry_subjects
  add column if not exists company_id uuid references public.companies(id) on delete set null;

create unique index if not exists client_registry_subjects_company_uidx
  on public.client_registry_subjects(company_id)
  where company_id is not null and merged_into_subject_id is null;

alter table public.client_registry_subjects
  drop constraint if exists client_registry_subjects_check;

alter table public.client_registry_subjects
  add constraint client_registry_subjects_check
  check (
    lead_id is not null
    or client_id is not null
    or company_id is not null
    or email_normalized is not null
    or phone_normalized is not null
  );

alter table public.client_registry_events
  drop constraint if exists client_registry_events_company_id_fkey;

alter table public.client_registry_events
  add constraint client_registry_events_company_id_fkey
  foreign key (company_id) references public.companies(id) on delete set null;

alter table public.client_registry_reconcile_state
  add column if not exists company_cursor uuid;

comment on column public.client_registry_subjects.company_id is
  'Canonical company anchor for company-only/internal client ledgers.';
