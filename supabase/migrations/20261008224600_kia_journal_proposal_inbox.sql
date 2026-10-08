-- KIA: company-scoped proposed journal entries. No Holded execution in this migration.
create table if not exists public.kia_journal_proposals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  created_by uuid not null references public.profiles(id),
  entry_date date not null,
  reason text not null check (char_length(btrim(reason)) between 3 and 500),
  evidence_refs text[] not null check (coalesce(array_length(evidence_refs, 1), 0) > 0),
  lines jsonb not null check (jsonb_typeof(lines) = 'array' and jsonb_array_length(lines) between 2 and 100),
  total_debit_cents bigint not null check (total_debit_cents > 0),
  total_credit_cents bigint not null check (total_credit_cents > 0),
  fingerprint text not null check (length(fingerprint) = 64),
  status text not null default 'pending_review' check (status in ('pending_review','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kia_journal_proposals_balanced check (total_debit_cents = total_credit_cents),
  constraint kia_journal_proposals_decision check ((status = 'pending_review' and reviewed_by is null and reviewed_at is null) or (status in ('approved','rejected') and reviewed_by is not null and reviewed_at is not null)),
  constraint kia_journal_proposals_fingerprint_company_unique unique (company_id, fingerprint)
);
create index if not exists kia_journal_proposals_company_status_date_idx on public.kia_journal_proposals(company_id, status, created_at desc);

create table if not exists public.kia_journal_proposal_events (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.kia_journal_proposals(id),
  actor_id uuid not null references public.profiles(id),
  event_type text not null check (event_type in ('submitted', 'approved', 'rejected')),
  old_status text,
  new_status text not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists kia_journal_proposal_events_proposal_time_idx on public.kia_journal_proposal_events(proposal_id, created_at);

create or replace function public.kia_journal_proposal_audit_trigger()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if old.status <> 'pending_review' or new.status not in ('approved','rejected')
      or new.company_id is distinct from old.company_id
      or new.created_by is distinct from old.created_by
      or new.entry_date is distinct from old.entry_date
      or new.reason is distinct from old.reason
      or new.evidence_refs is distinct from old.evidence_refs
      or new.lines is distinct from old.lines
      or new.total_debit_cents is distinct from old.total_debit_cents
      or new.total_credit_cents is distinct from old.total_credit_cents
      or new.fingerprint is distinct from old.fingerprint
      or new.created_at is distinct from old.created_at then
      raise exception 'KIA journal proposal is immutable; review may only advance pending status';
    end if;
    new.updated_at = now();
    insert into public.kia_journal_proposal_events(proposal_id,actor_id,event_type,old_status,new_status,note)
      values(new.id,new.reviewed_by,new.status,old.status,new.status,new.review_note);
  else
    insert into public.kia_journal_proposal_events(proposal_id,actor_id,event_type,new_status)
      values(new.id,new.created_by,'submitted',new.status);
  end if;
  return new;
end;
$$;
drop trigger if exists kia_journal_proposal_audit_insert on public.kia_journal_proposals;
create trigger kia_journal_proposal_audit_insert after insert on public.kia_journal_proposals
  for each row execute function public.kia_journal_proposal_audit_trigger();
drop trigger if exists kia_journal_proposal_audit_update on public.kia_journal_proposals;
create trigger kia_journal_proposal_audit_update before update on public.kia_journal_proposals
  for each row execute function public.kia_journal_proposal_audit_trigger();

alter table public.kia_journal_proposals enable row level security;
alter table public.kia_journal_proposal_events enable row level security;
revoke all on public.kia_journal_proposals from public, anon, authenticated;
revoke all on public.kia_journal_proposal_events from public, anon, authenticated;
grant select, insert, update on public.kia_journal_proposals to service_role;
grant select, insert on public.kia_journal_proposal_events to service_role;
-- There are deliberately no anon/authenticated policies. Server API must check active EXPERT staff and company id.
-- Review status is an internal decision only; no routine sends these proposals to Holded.
