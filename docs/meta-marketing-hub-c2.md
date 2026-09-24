# EXPERT Marketing Hub — fundamento C2

Fecha: 19/09/2026  
Estado: read-only foundation

## Objetivo

Marketing Hub permite revisar desde Admin si el catálogo canónico y los servicios están preparados para proyectarse a Meta.

Esta versión sustituye el antiguo enfoque C0/C1 shadow.

## Fuente de verdad

Marketing Hub v2 lee:

- `catalog_services`;
- `service_contents`;
- `commercial_offers`;
- `stripe_price_bindings`;
- `service_channel_configs`;
- `meta_catalog_items`;
- `meta_sync_jobs`;
- `service-production-manifest.ts`;
- `service-production-readiness.ts`.

No usa `admin-catalog.ts` como fuente comercial y no parsea el precio visible de una landing para decidir cuánto publicar en Meta.

## Seguridad

La integración está fail-closed:

- `META_MARKETING_ENABLED=false` mantiene cualquier llamada externa bloqueada;
- app secret y system-user token son server-side;
- diagnostics nunca devuelve los secretos;
- el endpoint exige admin/owner activo;
- POST solo hace una lectura `id,name` del catálogo configurado;
- no hay escritura Meta;
- no hay campañas;
- no hay presupuestos publicitarios;
- no se crean ni modifican productos;
- no se cambian precios.

## Variables

```env
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

## Gate para futuras escrituras

No activar sincronización de catálogo hasta que:

1. servicio = `production_ready`;
2. `service_channel_configs.channel = meta`;
3. `enabled = true`;
4. `publish_status = ready`;
5. oferta activa y reconciliada;
6. binding Stripe live sin mismatch;
7. contenido/localización requeridos activos;
8. preview y tests verdes;
9. IDs Meta reales validados.

La primera escritura debe implementarse como job auditable en `meta_sync_jobs`, con resultado/log en `meta_api_logs`; nunca como una llamada fire-and-forget desde una página pública.
