# C2 — Preflight productivo del catálogo canónico

Fecha: 2026-09-18  
Estado: **DDL BLOQUEADO** por stop condition de migration ledger  
Ámbito de este documento: solo lectura

## 1. Proyecto inspeccionado

Supabase producción:

- proyecto: EXPERT
- ref: `ybtpqscmqrrjjmuoryap`
- región: `eu-west-2`
- estado observado: `ACTIVE_HEALTHY`
- PostgreSQL: 15

No se ejecutó DDL ni DML durante este preflight.

## 2. Migration ledger

Estado observado en producción:

- migrations registradas: **156**
- primera versión: `20260508082323`
- última versión: `20260918114535`
- filas con `statements` vacíos: **0**

Última migration observada:

```text
20260918114535 accounting_period_snapshots
```

El checkpoint del PR #194 documentaba previamente 155 filas y tip:

```text
20260918073212 nationality_post_payment_admin_followup
```

Por tanto, producción avanzó después de ese checkpoint.

La migration `20260918114535_accounting_period_snapshots` no fue localizada por nombre exacto en `main` ni en la rama del recovery durante este preflight.

### Stop condition activada

No iniciar ninguna migration C2 hasta:

1. recuperar/incorporar el SQL exacto de la migration productiva nueva;
2. revalidar el ledger actual contra Git;
3. cerrar o actualizar el plan del PR #194;
4. volver a ejecutar el preflight inmediatamente antes del primer DDL.

No escribir directamente en `supabase_migrations.schema_migrations`.

## 3. Colisiones de nombres

Los siguientes nombres objetivo C2 **no existen actualmente** en `public`:

```text
catalog_services
commercial_services
service_contents
commercial_offers
service_channel_configs
stripe_price_bindings
meta_catalog_items
meta_catalog_sets
meta_sync_jobs
meta_api_logs
```

Sin embargo, sí existen:

```text
public.services
public.categories
```

## 4. Estado de public.services

`public.services`:

- RLS activa;
- 0 filas;
- PK UUID;
- `slug` único;
- mezcla identidad, contenido, precio y Stripe en la misma fila.

Campos relevantes observados:

```text
id
category_id
name
slug
short_desc
long_desc
what_is
what_includes
requirements
deliverables
duration_estimate
price_from
price_display
stripe_product_id
stripe_price_id
stripe_checkout_url
is_featured
needs_review_recommended
status
order
created_at
updated_at
category_slug
type
urgency
```

Esto no coincide con la separación C1:

```text
service identity
localized content
commercial offers
channel config
Stripe bindings
```

### Dependencias

FKs existentes:

- `checkout_sessions.service_id -> services.id`
- `service_metrics.service_id -> services.id ON DELETE CASCADE`

Uso observado:

- `services`: 0 filas;
- `checkout_sessions.service_id IS NOT NULL`: 0 filas;
- `service_metrics.service_id IS NOT NULL`: 0 filas.

Aun así, la tabla no debe renombrarse, borrarse ni reciclarse durante C2 inicial.

## 5. Decisión de arquitectura para C2

**No reutilizar `public.services` como raíz canónica en la primera migration C2.**

Propuesta de raíz nueva:

```text
catalog_services
```

Motivos:

1. evita cambiar semántica a una tabla legacy ya referenciada;
2. evita mezclar cutover con creación de modelo;
3. permite shadow read real;
4. permite rollback simple;
5. mantiene C8 como fase explícita de retirada legacy.

`public.services` queda intacta hasta que el cutover esté probado.

## 6. public.categories

`public.categories`:

- 9 filas;
- RLS activa;
- lectura pública;
- taxonomía legacy existente.

Slugs observados:

```text
consultoria-estrategica
fiscalidad-contabilidad
formacion-basica
migracion-holded
formacion-avanzada
implementacion-tecnica
notariales-registrales
optimizacion-holded
tramites-e-informes
```

Esta taxonomía no coincide directamente con las categorías editoriales actuales del catálogo en código.

Por tanto C2 no debe usar `public.categories.id` como FK canónica de forma automática.

Opciones para diseño posterior:

- `catalog_services.category_key text` inicialmente;
- o tabla nueva `catalog_categories`;
- o mapeo explícito antes de cualquier FK.

No se ha elegido todavía una de estas opciones.

## 7. RLS y grants legacy

Policies actuales:

```text
categories:
  SELECT public WHERE true

services:
  SELECT public WHERE status = 'active'
```

Los grants de tabla para `anon` y `authenticated` son amplios a nivel PostgreSQL, aunque RLS limita el acceso efectivo por fila.

El esquema canónico nuevo deberá aplicar una política más explícita:

- lectura pública solo de proyecciones publicables;
- escritura solo server-side/admin autorizada;
- tablas económicas y bindings sin escritura cliente;
- logs Meta y sync jobs server-side;
- sin secretos en tablas Meta.

## 8. Security Advisor baseline

Antes de C2 se guardó el baseline actual.

Hallazgos relevantes existentes antes de cualquier DDL C2:

- tablas RLS sin policies: 30 hallazgos informativos;
- `function_search_path_mutable`: 3 warnings en schema `stripe`;
- leaked password protection deshabilitado;
- versión PostgreSQL con patches de seguridad disponibles.

Estos hallazgos son **preexistentes** y no deben atribuirse a C2.

Después de cualquier DDL C2 deberá ejecutarse Security Advisor de nuevo y comparar delta.

## 9. Modelo físico propuesto — solo diseño, no migration

Cuando el ledger esté estabilizado:

```text
catalog_services
service_contents
commercial_offers
service_channel_configs
stripe_price_bindings
meta_catalog_items
meta_catalog_sets
meta_sync_jobs
meta_api_logs
```

### catalog_services

Responsabilidad:

- identidad estable;
- slug canónico;
- category key;
- service type;
- lifecycle status.

No precio.  
No contenido largo.  
No Stripe IDs.

### service_contents

Responsabilidad:

- locale;
- name;
- short description;
- description;
- meta fields;
- landing path;
- image reference.

### commercial_offers

Responsabilidad:

- offer code;
- billing mode;
- price mode;
- currency;
- amount cents;
- VAT treatment;
- effective dates;
- status.

No tasas oficiales mezcladas con honorarios.

### stripe_price_bindings

Responsabilidad:

- offer id;
- Stripe Price id;
- environment;
- status;
- reconciliation state.

Stripe no será fuente de verdad económica.

### service_channel_configs

Responsabilidad:

- enable/disable por canal;
- publishability;
- overrides editoriales permitidos;
- nunca sobrescribir precio canónico.

### meta_*

Responsabilidad:

- proyección/sync/logs Meta;
- sin secretos;
- sin autoridad sobre identidad o precio.

## 10. Gates antes de generar DDL

C2 solo puede continuar cuando:

- [ ] CI de PR #289 verde;
- [ ] migration `20260918114535` recuperada en Git;
- [ ] PR #194 actualizado/revalidado contra las 156 migrations;
- [ ] nuevo snapshot del ledger sin drift;
- [ ] aliases/ofertas C1 revisados;
- [ ] diseño final de category key aprobado;
- [ ] RLS/GRANT matrix definida;
- [ ] migration preparada mediante mecanismo oficial;
- [ ] dry-run/fresh validation posible.

## 11. Acciones prohibidas mientras el gate esté rojo

- no `apply_migration`;
- no ALTER de `public.services`;
- no renombrar tablas legacy;
- no backfill productivo;
- no corregir migration ledger manualmente;
- no publicar Meta desde datos canónicos aún;
- no sustituir checkout actual por shadow catalog.

## Conclusión

C2 está suficientemente preflighteado para diseñarse, pero **no para ejecutarse**.

La decisión conservadora es crear una raíz nueva `catalog_services` cuando el ledger esté estabilizado, mantener `public.services` intacta durante shadow/cutover y aplazar cualquier retirada legacy a C8.
