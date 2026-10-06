insert into public.kia_operator_lessons
  (lesson_key,domain,title,instruction,priority,applies_to_channels,source_context,metadata)
values (
  'scope_client_specific_learning',
  'general',
  'Separar aprendizaje global de contexto de cliente',
  'Cuando una corrección o decisión nace de un caso real, guarda hechos, cifras, personas y decisiones específicas dentro del contexto de esa empresa o expediente. Solo promociona a Operator Lessons, corpus o tests las reglas realmente reutilizables y no identificativas.',
  99,
  '{}'::text[],
  'admin_coaching_2026-10-05',
  '{"privacy":"scoped_learning","pattern":"case_to_general_rule"}'::jsonb
)
on conflict (lesson_key) do update set
  instruction=excluded.instruction,
  priority=excluded.priority,
  active=true,
  metadata=excluded.metadata,
  updated_at=now();
