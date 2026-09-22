-- Add the voluntary representation mandate as an explicit operational gate
-- for nationality-by-residence cases involving minors born in Spain.
--
-- This migration only changes future fulfillment behaviour. Existing cases are
-- not bulk-rewritten; active cases should be updated deliberately by an admin.

create or replace function public.fulfill_nationality_catalog_order()
returns trigger
language plpgsql
set search_path = 'public', 'pg_temp'
as $$
declare
  v_session_id text;
  v_case_id uuid;
begin
  if new.source is distinct from 'catalog'
     or new.status is distinct from 'paid'
     or position('nacionalidad-espanola-menor-nacido-en-espana' in coalesce(new.service_slugs, '')) = 0 then
    return new;
  end if;

  if new.client_id is null then
    raise exception 'Paid nationality catalog order % has no client_id; manual review required', new.id;
  end if;

  v_session_id := coalesce(
    nullif(new.stripe_session_id, ''),
    nullif(new.metadata -> 'checkout_session' ->> 'id', '')
  );

  if v_session_id is null then
    raise exception 'Paid nationality catalog order % has no checkout session; manual review required', new.id;
  end if;

  update public.checkout_sessions
     set status = 'completed',
         updated_at = now()
   where stripe_session_id = v_session_id;

  if not found then
    raise exception 'Checkout session % for paid nationality order % was not persisted; manual review required', v_session_id, new.id;
  end if;

  insert into public.cases (
    client_id, company_id, category, service, service_id, order_id,
    state, status, priority, next_action, admin_note, docs_checklist
  ) values (
    new.client_id,
    new.company_id,
    'extranjeria-nacionalidad',
    'Испанское гражданство для ребёнка, родившегося в Испании',
    'nacionalidad-espanola-menor-nacido-en-espana',
    new.id,
    'pendiente_documentacion',
    'nuevo',
    'media',
    'Validar residencia legal, patria potestad y formalizar mandato de representación voluntaria',
    'Expediente creado automáticamente tras pago. Antes de presentar: validar viabilidad, patria potestad y mandato de representación voluntaria firmado; después abonar el suplido 790-026.',
    jsonb_build_array(
      'Свидетельство о рождении ребёнка из испанского Registro Civil',
      'Полный действующий паспорт ребёнка',
      'NIE/TIE ребёнка и подтверждение даты начала легальной резиденции',
      'Предыдущая TIE и первоначальное решение о резиденции, если имеются',
      'Актуальный семейный или коллективный certificado de empadronamiento',
      'Полные действующие паспорта обоих родителей',
      'NIE/TIE обоих родителей',
      'Mandato de representación voluntaria, подписанный обоими родителями, когда оба осуществляют patria potestad',
      'Документы о полномочиях представительства, если подписывает только один родитель'
    )
  )
  on conflict (order_id) where order_id is not null
  do update set
    order_id = excluded.order_id,
    next_action = case
      when public.cases.next_action is null or public.cases.next_action = ''
        then excluded.next_action
      else public.cases.next_action
    end
  returning id into v_case_id;

  insert into public.internal_tasks (
    title, description, status, priority, case_id, client_id, company_id,
    due_date, source, metadata
  ) values (
    'Revisar expediente de nacionalidad recién pagado',
    'Pago confirmado. Revisar documentación inicial, validar 1 año de residencia legal del menor, patria potestad y viabilidad antes de abonar el suplido 790-026.',
    'pendiente',
    'alta',
    v_case_id,
    new.client_id,
    new.company_id,
    current_date + 1,
    'system',
    jsonb_build_object(
      'task_kind', 'nationality_post_payment_review',
      'service_slug', 'nacionalidad-espanola-menor-nacido-en-espana',
      'order_id', new.id,
      'stripe_session_id', v_session_id
    )
  )
  on conflict (case_id)
    where source = 'system'
      and title = 'Revisar expediente de nacionalidad recién pagado'
      and status in ('pendiente','en_progreso')
  do update set
    description = excluded.description,
    due_date = least(coalesce(public.internal_tasks.due_date, excluded.due_date), excluded.due_date),
    priority = 'alta',
    metadata = coalesce(public.internal_tasks.metadata, '{}'::jsonb) || excluded.metadata,
    updated_at = now();

  insert into public.internal_tasks (
    title, description, status, priority, case_id, client_id, company_id,
    due_date, source, metadata
  )
  select
    'Preparar mandato de representación voluntaria — Nacionalidad menor',
    'Generar el mandato con los datos del expediente y del representante EXPERT, solicitar la firma de ambos progenitores cuando ambos ejerzan la patria potestad y validar el documento firmado antes de presentar.',
    'pendiente',
    'alta',
    v_case_id,
    new.client_id,
    new.company_id,
    current_date + 1,
    'system',
    jsonb_build_object(
      'task_kind', 'nationality_voluntary_representation_mandate',
      'service_slug', 'nacionalidad-espanola-menor-nacido-en-espana',
      'order_id', new.id,
      'phase', 'representation_mandate',
      'requires_both_parents_signatures', true,
      'blocks_submission', true
    )
  where not exists (
    select 1
      from public.internal_tasks t
     where t.case_id = v_case_id
       and t.source = 'system'
       and t.title = 'Preparar mandato de representación voluntaria — Nacionalidad menor'
       and t.status in ('pendiente','en_progreso')
  );

  update public.orders
     set stripe_session_id = coalesce(stripe_session_id, v_session_id),
         case_id = coalesce(case_id, v_case_id),
         updated_at = now()
   where id = new.id;

  return new;
end;
$$;

revoke all on function public.fulfill_nationality_catalog_order() from public, anon, authenticated;
