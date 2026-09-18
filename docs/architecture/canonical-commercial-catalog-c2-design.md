# C2 — Diseño físico y matriz RLS del catálogo canónico

Fecha: 2026-09-18  
Estado: **diseño cerrado; ejecución bloqueada por ledger preflight**

Este documento define el modelo objetivo de C2 sin crear todavía ninguna migration.

## 1. Principios

- `public.services` legacy no se reutiliza ni altera.
- La nueva raíz será `public.catalog_services`.
- Identidad, contenido, precio y bindings externos permanecen separados.
- Stripe y Meta son proyecciones/adaptadores, nunca fuentes maestras.
- No se almacenan secretos Meta ni Stripe en estas tablas.
- No se mezclan honorarios profesionales con tasas oficiales o suplidos.
- No se permite escritura directa desde `anon` o `authenticated`.
- Toda mutación económica requiere backend autorizado y auditoría.

## 2. Tablas objetivo

### 2.1 catalog_services

Responsabilidad: identidad estable.

Campos propuestos:

```text
id uuid PK
slug text UNIQUE NOT NULL
category_key text NOT NULL
service_type text NOT NULL
status text NOT NULL
created_at timestamptz NOT NULL
updated_at timestamptz NOT NULL
```

Checks:

```text
service_type IN ('service','training','plan','procedure')
status IN ('draft','active','paused','retired')
```

No contiene precio, IVA, Stripe IDs ni contenido largo.

### 2.2 service_contents

Responsabilidad: contenido localizado.

```text
id uuid PK
service_id uuid FK -> catalog_services(id) ON DELETE CASCADE
locale text NOT NULL
name text NOT NULL
short_description text
description text
meta_title text
meta_description text
landing_path text NOT NULL
image_url text
status text NOT NULL
created_at timestamptz NOT NULL
updated_at timestamptz NOT NULL
```

Unique: `(service_id, locale)`

Checks:

```text
locale IN ('es','ru','en')
status IN ('draft','active','paused','retired')
```

### 2.3 commercial_offers

Responsabilidad: condiciones económicas versionables.

```text
id uuid PK
service_id uuid FK -> catalog_services(id) ON DELETE RESTRICT
code text NOT NULL
billing_mode text NOT NULL
price_mode text NOT NULL
currency text NOT NULL DEFAULT 'EUR'
amount_cents bigint
vat_treatment text NOT NULL
status text NOT NULL
valid_from timestamptz
valid_until timestamptz
created_at timestamptz NOT NULL
updated_at timestamptz NOT NULL
```

Unique: `(service_id, code)`

Checks:

```text
billing_mode IN ('one_time','recurring','quote')
price_mode IN ('fixed','from','quote')
vat_treatment IN ('plus_vat','vat_included','exempt','outside_scope','manual_review')
status IN ('draft','active','paused','retired')
currency = 'EUR'
```

Reglas:
- `price_mode='quote'` => `amount_cents IS NULL`
- `price_mode IN ('fixed','from')` => `amount_cents IS NOT NULL AND amount_cents >= 0`
- ninguna tasa oficial se incorpora a `amount_cents`.

### 2.4 service_aliases

Responsabilidad: resolver identificadores legacy sin duplicar servicios.

```text
id uuid PK
alias text UNIQUE NOT NULL
service_id uuid FK -> catalog_services(id) ON DELETE CASCADE
status text NOT NULL
reason text
created_at timestamptz NOT NULL
```

Check: `status IN ('candidate','approved','retired')`

Los aliases C1 actuales se insertarían inicialmente como `candidate`, salvo aprobación explícita antes del backfill.

### 2.5 service_channel_configs

Responsabilidad: habilitación por canal.

```text
id uuid PK
service_id uuid FK -> catalog_services(id) ON DELETE CASCADE
channel text NOT NULL
enabled boolean NOT NULL DEFAULT false
publish_status text NOT NULL DEFAULT 'blocked'
editorial_overrides jsonb NOT NULL DEFAULT '{}'
created_at timestamptz NOT NULL
updated_at timestamptz NOT NULL
```

Unique: `(service_id, channel)`

Checks:

```text
channel IN ('web','meta','google','whatsapp','email')
publish_status IN ('blocked','review','ready','published','paused')
```

`editorial_overrides` nunca puede redefinir precio, IVA ni identidad económica.

### 2.6 stripe_price_bindings

Responsabilidad: vincular una oferta canónica con Stripe.

```text
id uuid PK
offer_id uuid FK -> commercial_offers(id) ON DELETE RESTRICT
environment text NOT NULL
stripe_price_id text NOT NULL
status text NOT NULL
reconciliation_status text NOT NULL
last_reconciled_at timestamptz
created_at timestamptz NOT NULL
updated_at timestamptz NOT NULL
```

Unique:
- `(environment, stripe_price_id)`
- una sola binding activa por `offer_id + environment`

Checks:

```text
environment IN ('test','live')
status IN ('active','inactive','retired')
reconciliation_status IN ('unknown','matched','mismatch','manual_review')
```

Un mismatch nunca modifica Stripe ni la oferta automáticamente.

### 2.7 meta_catalog_items

Responsabilidad: estado de proyección Meta.

```text
id uuid PK
service_id uuid FK -> catalog_services(id) ON DELETE RESTRICT
offer_id uuid FK -> commercial_offers(id) ON DELETE RESTRICT
locale text NOT NULL
retailer_id text NOT NULL
meta_item_id text
sync_status text NOT NULL
last_payload_hash text
last_synced_at timestamptz
last_error_code text
created_at timestamptz NOT NULL
updated_at timestamptz NOT NULL
```

No almacenar access tokens ni app secrets.

### 2.8 meta_catalog_sets

Responsabilidad: agrupaciones funcionales de ítems Meta.

### 2.9 meta_sync_jobs

Responsabilidad: cola/auditoría de sincronización.

Estados sugeridos:

```text
queued
running
succeeded
failed
blocked
cancelled
```

Debe guardar metadatos mínimos, nunca secretos ni payloads con credenciales.

### 2.10 meta_api_logs

Responsabilidad: observabilidad técnica saneada.

Permitido:
- endpoint lógico;
- operation;
- response status;
- Meta error code/subcode;
- trace id;
- timestamps.

Prohibido:
- access token;
- app secret;
- authorization header;
- payload completo con PII innecesaria.

## 3. Category key

C2 usará inicialmente `catalog_services.category_key text`.

No FK a `public.categories`.

Motivo: la taxonomía legacy de `public.categories` no coincide con las categorías editoriales actuales.

Una futura `catalog_categories` podrá añadirse cuando exista una taxonomía canónica aprobada.

## 4. Matriz RLS / grants

### catalog_services

| Actor | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| anon | solo activos publicables | no | no | no |
| authenticated | solo activos publicables | no | no | no |
| admin backend | sí | sí | sí | no físico por defecto |
| service_role | sí | sí | sí | solo operaciones controladas |

### service_contents

- lectura pública solo si servicio y contenido están activos y el canal Web está habilitado/publicable;
- escritura cliente: nunca;
- mutación admin: solo API server-side autorizada.

### commercial_offers

- `anon` y `authenticated`: no acceso directo por defecto;
- precios publicables se exponen mediante vista/API controlada;
- mutación solo server-side;
- retirada mediante `status='retired'`, no DELETE.

### service_aliases

- lectura pública no necesaria;
- escritura solo admin/service role;
- `candidate -> approved` requiere confirmación humana.

### service_channel_configs

- no escritura cliente;
- lectura desde backend/proyección;
- cambios de Meta `publish_status` requieren workflow controlado.

### stripe_price_bindings

- service-role/admin backend únicamente;
- sin DELETE histórico; usar `inactive`/`retired`.

### meta_*

- server-side únicamente;
- RLS activada;
- sin policies de cliente;
- sin secretos.

## 5. Índices mínimos

```text
catalog_services(slug) UNIQUE
catalog_services(status)
service_contents(service_id, locale) UNIQUE
commercial_offers(service_id, code) UNIQUE
commercial_offers(service_id, status)
commercial_offers(valid_from, valid_until)
service_aliases(alias) UNIQUE
service_channel_configs(service_id, channel) UNIQUE
stripe_price_bindings(environment, stripe_price_id) UNIQUE
meta_catalog_items(retailer_id) UNIQUE
meta_catalog_items(sync_status)
meta_sync_jobs(status, created_at)
```

No añadir índices adicionales sin consulta real que los justifique.

## 6. Auditoría

C2 debe registrar cambios de:
- precio;
- VAT treatment;
- status de oferta;
- binding Stripe;
- activación/desactivación por canal;
- publicación Meta.

Campos lógicos mínimos:

```text
actor
service_id
offer_id
old_value
new_value
reason
effective_at
created_at
```

Antes del DDL se verificará si `audit_logs` existente cubre este contrato para no crear un segundo sistema de auditoría.

## 7. Backfill futuro

Orden propuesto:

1. `catalog_services`
2. `service_contents`
3. `commercial_offers`
4. `service_aliases`
5. `service_channel_configs`
6. `stripe_price_bindings`
7. filas de proyección Meta

Stop conditions:
- slug duplicado;
- alias ambiguo;
- precio contradictorio;
- IVA no definido;
- Stripe mismatch;
- oferta activa incompatible;
- tasa/suplido mezclado con honorarios.

## 8. Shadow mode

Tras C2:
- Web seguirá leyendo legacy.
- Checkout seguirá leyendo legacy.
- Admin comparará legacy vs canónico.
- Meta no publicará automáticamente.
- se medirá paridad antes de cualquier cutover.

## 9. Condiciones para crear la migration real

Solo cuando:
- PR #289 CI verde;
- PR #194 CI verde;
- Supabase Ledger Preflight verde con 156 migrations;
- tip productivo congelado;
- Security Advisor baseline registrado;
- diseño C2 revisado;
- sin nueva drift productiva.

Hasta entonces este documento es especificación, no DDL.
