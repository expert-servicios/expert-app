-- Fase D del conector KIA-Holded (docs/kia-holded-cliente-implementation-plan.md):
-- deteccion de anomalias sobre client_accounting_records (poblada por el sync
-- de la Fase B). lib/ai/kia/kia-context-builder.ts (loadAccounting) ya
-- consulta esta tabla desde antes (con try/catch silencioso porque no
-- existia) esperando company_id, severity, status -- se respeta ese contrato.

create table if not exists accounting_anomalies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  integration_id uuid references client_integrations(id) on delete set null,
  anomaly_type text not null check (anomaly_type in ('overdue_unpaid_invoice','atypical_expense','vat_inconsistency')),
  severity text not null default 'media' check (severity in ('baja','media','alta','critical')),
  status text not null default 'open' check (status in ('open','pending','resolved','dismissed')),
  title text not null,
  description text,
  external_id text,
  record_type text,
  amount numeric,
  data jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, anomaly_type, external_id)
);

create index if not exists accounting_anomalies_company_idx
  on accounting_anomalies (company_id, status, severity);

alter table accounting_anomalies enable row level security;

create policy "member read own accounting anomalies" on accounting_anomalies
  for select using (
    exists (
      select 1 from profile_companies pc
      where pc.company_id = accounting_anomalies.company_id
        and pc.profile_id = auth.uid()
    )
  );

create policy "member update own accounting anomalies status" on accounting_anomalies
  for update using (
    exists (
      select 1 from profile_companies pc
      where pc.company_id = accounting_anomalies.company_id
        and pc.profile_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from profile_companies pc
      where pc.company_id = accounting_anomalies.company_id
        and pc.profile_id = auth.uid()
    )
  );

create policy "admin all accounting anomalies" on accounting_anomalies
  for all using (is_admin()) with check (is_admin());

-- No insert/delete policy is granted to authenticated users; server-side
-- service-role code owns anomaly creation/deletion.
