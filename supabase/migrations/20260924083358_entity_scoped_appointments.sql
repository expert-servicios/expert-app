-- Persist canonical EXPERT identity on new appointments.
-- Deliberately nullable and without data backfill: historical appointments are left untouched.

alter table public.appointments
  add column if not exists client_id uuid null references auth.users(id) on delete set null,
  add column if not exists company_id uuid null references public.companies(id) on delete set null;

create index if not exists appointments_client_id_idx
  on public.appointments(client_id)
  where client_id is not null;

create index if not exists appointments_company_id_idx
  on public.appointments(company_id)
  where company_id is not null;

create index if not exists appointments_client_company_date_idx
  on public.appointments(client_id, company_id, appointment_date desc)
  where client_id is not null;
