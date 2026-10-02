# EXPERT Publishing — arquitectura API-first

Fecha: 02/10/2026

## Decisión

EXPERT es fuente de verdad para:
- contenido;
- revisión;
- consentimiento;
- calendario;
- publicación;
- IDs externos;
- métricas;
- atribución.

No depender de Metricool ni Canva para el flujo base.

## Componentes

### Editorial
`social_content_items`

Contiene master copy, adaptaciones por canal, CTA, brief visual, prioridad y gate de consentimiento.

### Cuentas
`social_channel_accounts`

Contiene metadatos no sensibles:
- proveedor;
- canal;
- external account id;
- nombre;
- auth mode;
- scopes;
- estado;
- secret_ref.

Nunca almacena tokens en claro.

### Calendario/jobs
`social_publication_jobs`

Cada combinación pieza+canal+hora genera un job auditable.

### Publishers previstos

- `lib/integrations/meta/publisher.ts`
- `lib/integrations/linkedin/publisher.ts`
- `lib/integrations/google-ads/client.ts`

### Cron

Ruta prevista:

`/api/cron/editorial-publisher`

Fail-closed con:
- `CRON_SECRET`;
- `EDITORIAL_PUBLISHING_ENABLED=false`.

## Meta

Infraestructura actual:
- config;
- Graph client;
- diagnostics;
- C2 catalog projection;
- sync jobs/logs.

Siguiente fase:
- Page publisher;
- Instagram publisher;
- Ads adapter;
- metrics sync.

## LinkedIn

Dos dominios:
1. social/community;
2. advertising.

No mezclar payloads ni permisos.

## Google Ads

Solo publicidad.

La API no es un canal orgánico. El calendario puede mostrar campañas/lanzamientos, pero semánticamente un Google Ads job es una operación publicitaria, no un post social.

## Asset generation

`asset_brief` es la especificación canónica.

Los activos pueden generarse por IA/API y almacenarse en infraestructura EXPERT antes de la publicación.

## Seguridad

1. tokens cifrados o Secret Manager;
2. ninguna credencial en navegador;
3. mínimos scopes;
4. OAuth state firmado;
5. refresh controlado;
6. logs sin secretos;
7. writes solo desde Admin/cron;
8. idempotencia;
9. retries limitados;
10. kill switch por proveedor.

## Métricas

Cada job podrá sincronizar:
- impressions;
- reach;
- clicks;
- reactions;
- comments;
- shares;
- spend;
- CPC/CPM/CTR;
- leads;
- conversions;
- conversion value.

No mezclar métricas orgánicas y Ads en un único KPI sin indicar la fuente.
