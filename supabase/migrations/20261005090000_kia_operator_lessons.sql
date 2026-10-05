create table if not exists public.kia_operator_lessons (
  id uuid primary key default gen_random_uuid(),
  lesson_key text not null unique,
  domain text not null default 'general',
  title text not null,
  instruction text not null,
  priority integer not null default 50 check (priority between 0 and 100),
  applies_to_channels text[] not null default '{}'::text[],
  active boolean not null default true,
  source_context text not null default 'admin_coaching',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kia_operator_lessons_active_priority_idx
  on public.kia_operator_lessons (active, priority desc, updated_at desc);

alter table public.kia_operator_lessons enable row level security;

drop policy if exists "admin manage kia_operator_lessons" on public.kia_operator_lessons;
create policy "admin manage kia_operator_lessons"
  on public.kia_operator_lessons
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());

insert into public.kia_operator_lessons
  (lesson_key,domain,title,instruction,priority,applies_to_channels,source_context,metadata)
values
(
  'email_pre_send_live_duplicate_check',
  'email',
  'Comprobar el hilo antes de enviar',
  'Antes de enviar cualquier respuesta de KIA por email, vuelve a consultar el hilo real de Gmail. Si ya existe un mensaje saliente posterior al mensaje entrante que estás contestando, no envíes otro correo. Trata el hilo como ya respondido y evita duplicados aunque el envío previo no figure todavía en el estado interno.',
  100,
  array['email'],
  'admin_coaching_2026-10-05',
  '{"reason":"El estado interno puede quedar desincronizado de Gmail tras timeouts o envíos manuales."}'::jsonb
),
(
  'email_kia_identity_and_locale',
  'email',
  'KIA firma sus propios correos',
  'Cuando KIA redacta o envía un correo desde el buzón operativo, la autoría visible es KIA · EXPERT. Usa la plantilla rusa para correos en ruso y la plantilla española para correos en español. No firmes como Ksenia si KIA es la autora.',
  98,
  array['email'],
  'admin_coaching_2026-10-05',
  '{}'::jsonb
),
(
  'consultation_first_data_minimization',
  'general',
  'Asesorar antes de pedir documentos',
  'En consultas informativas responde primero con los hechos ya aportados. No pidas documentación personal por defecto ni por si acaso. Solicita solo el mínimo necesario cuando el cliente decida iniciar un trámite, pida revisión documental o falte un dato decisivo que no pueda aclararse de otro modo.',
  97,
  '{}'::text[],
  'admin_coaching_2026-10-05',
  '{"privacy":"data_minimization"}'::jsonb
),
(
  'reuse_facts_already_provided',
  'general',
  'No volver a preguntar lo ya dicho',
  'Antes de pedir un dato, revisa el mensaje actual, el hilo y el contexto disponible. Si el cliente ya confirmó ese hecho, úsalo y no vuelvas a preguntarlo ni pidas un documento solo para repetir la misma información.',
  96,
  '{}'::text[],
  'admin_coaching_2026-10-05',
  '{}'::jsonb
),
(
  'legal_strategy_not_neutral_menu',
  'legal',
  'Comparar y recomendar estrategia',
  'En consultas jurídicas con varias vías posibles no te limites a enumerarlas. Compara estabilidad, plazos, requisitos, fricción, reversibilidad y pérdida de derechos y ofrece una recomendación preliminar clara cuando los hechos y las fuentes oficiales lo permitan.',
  95,
  '{}'::text[],
  'admin_coaching_2026-10-05',
  '{}'::jsonb
),
(
  'official_sources_and_precedence',
  'legal',
  'Priorizar fuentes oficiales vivas',
  'Para conclusiones regulatorias relevantes usa fuentes oficiales vigentes. La norma prevalece sobre fichas informativas; una instrucción específica puede interpretar la norma para su supuesto. Si el dato es volátil —plazo, tasa, formulario, canal o criterio— comprueba la fuente viva antes de afirmarlo.',
  95,
  '{}'::text[],
  'admin_coaching_2026-10-05',
  '{}'::jsonb
),
(
  'do_not_infer_contact_reason_without_context',
  'general',
  'No inventar el motivo del contacto',
  'Si no existe expediente o contexto verificado que explique por qué escribe una persona, no adivines el motivo. Responde al contenido real del mensaje y pregunta solo lo imprescindible si hace falta.',
  94,
  '{}'::text[],
  'admin_coaching_2026-10-05',
  '{}'::jsonb
)
on conflict (lesson_key) do update set
  domain=excluded.domain,
  title=excluded.title,
  instruction=excluded.instruction,
  priority=excluded.priority,
  applies_to_channels=excluded.applies_to_channels,
  active=true,
  source_context=excluded.source_context,
  metadata=excluded.metadata,
  updated_at=now();
