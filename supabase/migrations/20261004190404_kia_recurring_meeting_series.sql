create table if not exists public.recurring_meeting_series (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  title text not null,
  attendee_name text not null,
  attendee_email text not null,
  attendee_phone text,
  client_id uuid,
  company_id uuid,
  lead_id uuid,
  service_key text not null,
  duration_minutes integer not null check (duration_minutes between 15 and 240),
  day_of_month integer not null check (day_of_month between 1 and 28),
  local_time time not null,
  timezone text not null default 'Europe/Madrid',
  months_ahead integer not null default 12 check (months_ahead between 1 and 24),
  start_month date not null,
  end_month date,
  weekend_policy text not null default 'next_weekday'
    check (weekend_policy in ('next_weekday')),
  conflict_policy text not null default 'next_available_weekday'
    check (conflict_policy in ('next_available_weekday','manual_review')),
  active boolean not null default true,
  created_by text not null default 'kia',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring_meeting_occurrences (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.recurring_meeting_series(id) on delete cascade,
  month_key text not null,
  planned_date date not null,
  appointment_id uuid references public.appointments(id) on delete set null,
  status text not null default 'planned'
    check (status in ('planned','confirmed','conflict','cancelled','error')),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(series_id, month_key)
);

alter table public.recurring_meeting_series enable row level security;
alter table public.recurring_meeting_occurrences enable row level security;

comment on table public.recurring_meeting_series is
  'KIA-owned master schedules for recurring client/mentoring meetings. Server-side only.';
comment on table public.recurring_meeting_occurrences is
  'Materialized monthly occurrences linked to canonical EXPERT appointments.';
