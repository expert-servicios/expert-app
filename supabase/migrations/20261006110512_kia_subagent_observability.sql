alter table public.kia_decision_logs
  add column if not exists skill_id text,
  add column if not exists sub_agent_id text,
  add column if not exists detected_intent text,
  add column if not exists selection_basis text;

create index if not exists idx_kia_decision_logs_skill_created
  on public.kia_decision_logs (skill_id, created_at desc);

create index if not exists idx_kia_decision_logs_sub_agent_created
  on public.kia_decision_logs (sub_agent_id, created_at desc);
