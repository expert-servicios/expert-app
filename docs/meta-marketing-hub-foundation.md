# EXPERT Marketing Hub — Meta foundation

## Alcance de este bloque

Este PR prepara M0/M1 sin DDL, sin campañas y sin escrituras en Meta.

Incluye:

- configuración `META_MARKETING_*` separada del antiguo WABA retirado;
- cliente Graph API server-side con bearer token solo en servidor;
- diagnóstico admin;
- mapeo inicial del catálogo público `lib/utils/catalog.ts`;
- tratamiento fail-closed de configuración y precios ambiguos;
- tests de no exposición de secretos y pricing.

## Fuente canónica inicial

Para contenido y precio público se usa `lib/utils/catalog.ts`.

No se usa `lib/utils/admin-catalog.ts` como fuente económica para Meta porque contiene precios sugeridos administrativos que pueden diferir de los publicados.

`lib/data/services-catalog.ts` se considera una representación abreviada para interfaces/WhatsApp, no una fuente económica.

## Regla de precios

Solo se consideran automáticamente aptos los precios públicos fijos con formato equivalente a `150 € + IVA`.

Quedan en revisión manual:

- `Consultar`;
- `Desde ...`;
- precios no parseables;
- precios que requieran composición o suplementos.

La integración no inventa precios ni sustituye el criterio fiscal sobre IVA/suplidos.

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
- resumen del catálogo y elementos pendientes de revisión.

No devuelve valores secretos.

`POST /api/admin/meta/diagnostics`

Solo para admin/owner activo. Cuando `META_MARKETING_ENABLED=true` y la configuración mínima está completa, ejecuta una lectura del catálogo configurado (`id,name`).

## Gates antes de M1 persistente

1. Confirmar Business ID, App ID, Catalog ID y activos asociados.
2. Confirmar la versión Graph API elegida en Meta.
3. Resolver fuente económica canónica para servicios con discrepancias entre catálogo público/admin.
4. Definir qué servicios se publican y cuáles requieren revisión manual.
5. Solo después preparar migraciones `meta_*` con preflight, RLS y Security Advisor.

## Fuera de alcance

- sincronización `/items_batch`;
- campañas Ads;
- presupuestos;
- Conversions API;
- Lead Ads;
- tablas Supabase `meta_*`;
- cualquier escritura en producción.
