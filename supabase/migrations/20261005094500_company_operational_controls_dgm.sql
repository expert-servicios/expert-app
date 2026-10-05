create table if not exists public.company_operational_controls (
  company_id uuid primary key references public.companies(id) on delete cascade,
  external_communication_blocked boolean not null default false,
  portal_activation_blocked boolean not null default false,
  accounting_write_blocked boolean not null default false,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.company_operational_controls enable row level security;

drop policy if exists "admin manage company operational controls" on public.company_operational_controls;
create policy "admin manage company operational controls"
  on public.company_operational_controls
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());

insert into public.company_operational_controls (
  company_id,
  external_communication_blocked,
  portal_activation_blocked,
  accounting_write_blocked,
  reason,
  metadata,
  updated_at
) values (
  '188a1871-0ea8-4b11-adac-c9acc41c4a4b',
  true,
  true,
  true,
  'DGM se encuentra en reconstrucción contable interna 2025-2026. No contactar al titular, no activar portal y no escribir en contabilidad hasta cerrar auditoría read-only.',
  '{"phase":"internal_rebuild","years":[2025,2026],"property_count":5}'::jsonb,
  now()
)
on conflict (company_id) do update set
  external_communication_blocked=excluded.external_communication_blocked,
  portal_activation_blocked=excluded.portal_activation_blocked,
  accounting_write_blocked=excluded.accounting_write_blocked,
  reason=excluded.reason,
  metadata=excluded.metadata,
  updated_at=now();
