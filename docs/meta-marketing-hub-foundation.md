# EXPERT Marketing Hub — Meta foundation

## Alcance de este bloque

Este PR prepara M0/M1 sin DDL, sin campañas y sin escrituras en Meta.

Incluye:

- configuración `META_MARKETING_*` separada del antiguo WABA retirado;
- cliente Graph API server-side con bearer token solo en servidor;
- diagnóstico admin;
- mapeo inicial del catálogo público `lib/utils/catalog.ts`;
- tratamiento fail-closed de configuración y precios ambiguos;
- auditor de readiness y coherencia comercial;
- tests de no exposición de secretos y pricing.

## Decisión arquitectónica vinculante

La arquitectura comercial objetivo está documentada en:

`docs/architecture/canonical-commercial-catalog.md`

Esa decisión establece que EXPERT será la única fuente canónica de identidad y condiciones comerciales. Stripe, Meta y otros canales serán adaptadores/proyecciones y nunca fuentes maestras de precio.

Hasta completar la migración al catálogo canónico persistente, este módulo Meta opera de forma conservadora sobre las fuentes legacy existentes y bloquea cualquier conflicto para revisión manual.

## Fuente canónica inicial/transitoria

Para contenido y precio público se usa `lib/utils/catalog.ts` como fuente transitoria.

No se usa `lib/utils/admin-catalog.ts` como fuente económica para Meta porque contiene precios sugeridos administrativos que pueden diferir de los publicados.

`lib/data/services-catalog.ts` se considera una representación abreviada para interfaces/WhatsApp, no una fuente económica.

El objetivo no es convertir `catalog.ts` en base de datos definitiva, sino preservar una salida segura hasta que exista el modelo canónico descrito en `docs/architecture/canonical-commercial-catalog.md`.

## Regla de precios

Solo se consideran automáticamente aptos los precios públicos fijos con formato equivalente a `150 € + IVA`.

Quedan en revisión manual:

- `Consultar`;
- `Desde ...`;
- precios no parseables;
- precios que requieran composición o suplementos;
- discrepancias entre precio público y precio sugerido administrativo;
- aliases o identificadores no reconciliados.

La integración no inventa precios ni sustituye el criterio fiscal sobre IVA/tasas/suplidos.

## Auditor de catálogo

`auditMetaCatalog()` devuelve:

- número total de servicios;
- servicios listos para marketing;
- servicios en revisión manual;
- warnings por tipo;
- desglose por categoría;
- candidatos de piloto;
- auditoría de coherencia entre catálogo público y catálogo administrativo.

Entre los conflictos comerciales que deben bloquear automatización se incluyen:

```text
price_mismatch
missing_public_fixed_price
missing_admin_item
admin_alias_only
```

El auditor informa. No modifica precios, aliases, Stripe ni Meta.

## Variables de entorno

```
META_MARKETING_ENABLED=false
META_MARKETING_GRAPH_API_VERSION=
META_MARKETING_APP_ID=
META_MARKETING_APP_SECRET=
META_MARKETING_SYSTEM_USER_ACCESS_TOKEN=
META_MARKETING_BUSINESS_ID=
META_MARKETING_CATALOG_ID=
META_MARKETING_AD_ACCOUNT_ID=
META_MARKETING_PAGE_ID=
META_MARKETING_INSTAGRAM_ACCOUNT_ID=
META_MARKETING_DATASET_ID=
```

`APP_SECRET` y `SYSTEM_USER_ACCESS_TOKEN` son secretos. No deben almacenarse en Supabase ni Git.

## Diagnóstico

`GET /api/admin/meta/diagnostics`

Devuelve únicamente:

- estado de configuración;
- IDs de activos no secretos;
- booleanos de presencia de secretos;
- resumen del catálogo;
- readiness;
- conflictos comerciales;
- candidatos para piloto.

No devuelve valores secretos.

`POST /api/admin/meta/diagnostics`

Solo para admin/owner activo. Cuando `META_MARKETING_ENABLED=true` y la configuración mínima está completa, ejecuta una lectura del catálogo configurado (`id,name`).

## Gates antes de M1 persistente

1. Confirmar Business ID, App ID, Catalog ID y activos asociados.
2. Confirmar la versión Graph API elegida en Meta.
3. Revisar los conflictos identificados por el auditor comercial.
4. Aceptar la arquitectura de `docs/architecture/canonical-commercial-catalog.md` como fuente de verdad objetivo.
5. Identificar aliases legacy y ofertas comerciales activas.
6. Inventariar Stripe Price IDs existentes en modo read-only.
7. Definir qué servicios se publican y cuáles requieren revisión manual.
8. Solo después preparar migraciones `services/commercial_offers/meta_*` con preflight, RLS y Security Advisor.

## Siguiente secuencia recomendada

```text
M0/M1 foundation
  ↓
C0 inventario comercial read-only
  ↓
C1 modelo canónico en código, sin DDL
  ↓
preflight Supabase
  ↓
C2 persistencia canónica + RLS
  ↓
shadow read
  ↓
Meta pilot 3–5 servicios
```

No se salta directamente de `catalog.ts` a una sincronización completa de Meta.

## Fuera de alcance

- sincronización `/items_batch`;
- campañas Ads;
- presupuestos;
- Conversions API;
- Lead Ads;
- tablas Supabase `meta_*`;
- modificación automática de Stripe;
- corrección automática de precios legacy;
- cualquier escritura en producción.
