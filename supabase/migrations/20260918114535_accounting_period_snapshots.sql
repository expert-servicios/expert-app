-- Fase C del conector KIA-Holded (docs/kia-holded-cliente-implementation-plan.md):
-- snapshots trimestrales calculados a partir de client_accounting_records
-- (poblada por el sync de la Fase B), para dejar de depender de una llamada
-- en vivo a Holded cada vez que se abre "Estado de empresa" o KIA responde
-- una pregunta contable, y para poder mostrar series temporales.
--
-- lib/ai/kia/kia-context-builder.ts (loadAccounting) ya consulta esta tabla
-- desde antes (con try/catch que degradaba en silencio porque la tabla no
-- existia) esperando exactamente estas columnas: company_id, period_label,
-- created_at -- se respeta ese contrato.

create table if not exists accounting_period_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  integration_id uuid references client_integrations(id) on delete set null,
  period_label text not null, -- p.ej. '2026-Q3'
  year int not null,
  quarter smallint not null check (quarter between 1 and 4),
  sales_total numeric not null default 0,
  purchases_total numeric not null default 0,
  vat_repercutido numeric not null default 0,
  vat_soportado numeric not null default 0,
  vat_result numeric not null default 0,
  sales_count int not null default 0,
  purchases_count int not null default 0,
  monthly_data jsonb not null default '[]'::jsonb,
  source text not null default 'client_accounting_records',
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, period_label)
);

create index if not exists accounting_period_snapshots_company_idx
  on accounting_period_snapshots (company_id, year desc, quarter desc);

alter table accounting_period_snapshots enable row level security;

create policy "member read own accounting snapshots" on accounting_period_snapshots
  for select using (
    exists (
      select 1 from profile_companies pc
      where pc.company_id = accounting_period_snapshots.company_id
        and pc.profile_id = auth.uid()
    )
  );

create policy "admin all accounting snapshots" on accounting_period_snapshots
  for all using (is_admin()) with check (is_admin());

-- Deliberadamente SIN policy de insert/update/delete para el rol autenticado:
-- solo el service role (server-side, al calcular el resumen) escribe aqui.
-- Mismo patron que client_accounting_records / client_integration_secrets.
