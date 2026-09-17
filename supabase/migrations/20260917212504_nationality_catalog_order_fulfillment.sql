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
    'Revisar documentación inicial y validar 1 año de residencia legal del menor',
    'Expediente creado automáticamente tras pago del servicio de nacionalidad. Validar viabilidad antes de abonar el suplido 790-026 y presentar.',
    jsonb_build_array(
      'Свидетельство о рождении ребёнка из испанского Registro Civil',
      'Полный действующий паспорт ребёнка',
      'NIE/TIE ребёнка и подтверждение даты начала легальной резиденции',
      'Предыдущая TIE и первоначальное решение о резиденции, если имеются',
      'Актуальный семейный или коллективный certificado de empadronamiento',
      'Полные действующие паспорта обоих родителей',
      'NIE/TIE обоих родителей',
      'Документы о полномочиях представительства, если подписывает только один родитель'
    )
  )
  on conflict (order_id) where order_id is not null
  do update set order_id = excluded.order_id
  returning id into v_case_id;

  update public.orders
     set stripe_session_id = coalesce(stripe_session_id, v_session_id),
         case_id = coalesce(case_id, v_case_id),
         updated_at = now()
   where id = new.id;

  return new;
end;
$$;

revoke all on function public.fulfill_nationality_catalog_order() from public, anon, authenticated;

drop trigger if exists trg_orders_fulfill_nationality_catalog on public.orders;
create trigger trg_orders_fulfill_nationality_catalog
  after insert on public.orders
  for each row
  execute function public.fulfill_nationality_catalog_order();