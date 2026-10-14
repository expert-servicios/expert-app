-- Private, server-only KIA meeting review inbox.
create table if not exists public.kia_meeting_review_items (
 id uuid primary key default gen_random_uuid(),
 source_key text not null unique check (length(source_key) between 10 and 600),
 appointment_id uuid not null references public.appointments(id),
 company_id uuid not null references public.companies(id),
 subject_id uuid not null references public.client_registry_subjects(id),
 file_id text not null,
 source_url text not null,
 notes_version text not null,
 title text not null check (length(title) between 3 and 300),
 kind text not null check (kind in ('fact','question','proposed_action','legal_or_tax_opinion','census_attribute')),
 status text not null default 'pending_review' check (status in ('pending_review','investigate','confirmed','dismissed')),
 review_note text,
 reviewed_by uuid references public.profiles(id),
 reviewed_at timestamptz,
 version integer not null default 1 check (version > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint kia_meeting_review_decision check (
 (status='pending_review' and reviewed_by is null and reviewed_at is null)
 or (status <> 'pending_review' and reviewed_by is not null and reviewed_at is not null)
 )
);
create index if not exists kia_meeting_review_company_status on public.kia_meeting_review_items(company_id,status,created_at desc);
create table if not exists public.kia_meeting_review_events (
 id uuid primary key default gen_random_uuid(),
 item_id uuid not null references public.kia_meeting_review_items(id),
 actor_id uuid not null references public.profiles(id),
 old_status text,
 new_status text not null,
 note text,
 created_at timestamptz not null default now()
);
create index if not exists kia_meeting_review_events_item on public.kia_meeting_review_events(item_id,created_at);
create or replace function public.kia_meeting_review_guard() returns trigger
language plpgsql set search_path=public as $$
begin
 if tg_op='UPDATE' then
  if old.status <> 'pending_review' or new.status not in ('investigate','confirmed','dismissed')
     or new.source_key is distinct from old.source_key or new.appointment_id is distinct from old.appointment_id
     or new.company_id is distinct from old.company_id or new.subject_id is distinct from old.subject_id
     or new.file_id is distinct from old.file_id or new.source_url is distinct from old.source_url
     or new.notes_version is distinct from old.notes_version or new.title is distinct from old.title
     or new.kind is distinct from old.kind or new.created_at is distinct from old.created_at
     or new.version <> old.version+1 then
    raise exception 'meeting_review_immutable_or_invalid_transition';
  end if;
  new.updated_at=now();
  insert into public.kia_meeting_review_events(item_id,actor_id,old_status,new_status,note)
  values(new.id,new.reviewed_by,old.status,new.status,new.review_note);
 else
  -- Imported items must always start unreviewed.
  if new.status <> 'pending_review' then raise exception 'meeting_review_must_start_pending'; end if;
 end if;
 return new;
end; $$;
drop trigger if exists trg_kia_meeting_review_update on public.kia_meeting_review_items;
create trigger trg_kia_meeting_review_update before update on public.kia_meeting_review_items
for each row execute function public.kia_meeting_review_guard();
create or replace function public.kia_meeting_review_event_immutable() returns trigger
language plpgsql as $$ begin raise exception 'meeting_review_audit_immutable'; end; $$;
drop trigger if exists trg_kia_meeting_review_event_immutable on public.kia_meeting_review_events;
create trigger trg_kia_meeting_review_event_immutable before update or delete on public.kia_meeting_review_events
for each row execute function public.kia_meeting_review_event_immutable();
alter table public.kia_meeting_review_items enable row level security;
alter table public.kia_meeting_review_events enable row level security;
revoke all on public.kia_meeting_review_items from public,anon,authenticated;
revoke all on public.kia_meeting_review_events from public,anon,authenticated;
grant select,insert,update on public.kia_meeting_review_items to service_role;
grant select,insert on public.kia_meeting_review_events to service_role;
