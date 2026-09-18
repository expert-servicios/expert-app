# C1 — Catálogo comercial canónico en shadow mode

**Estado:** implementación inicial completada en código  
**Ámbito:** read-only, sin DDL, sin cambios de rutas públicas, sin escrituras Stripe/Meta

## Objetivo

C1 introduce una representación canónica en memoria que separa:

- identidad del servicio;
- contenido editorial;
- oferta comercial;
- aliases legacy;
- bindings de Stripe;
- warnings de coherencia.

La salida se utiliza únicamente para auditoría y preparación de migración.

## Identidad

Cada servicio público de `lib/utils/catalog.ts` genera una identidad canónica:

```text
serviceId
slug
categoryId
status
serviceType
```

El `serviceId` coincide temporalmente con el slug público actual.

## Aliases legacy

Los aliases se declaran en:

```text
lib/services/commercial-catalog-bindings.ts
```

Bindings actuales:

```text
holded-starter
  -> holded-pack-starter

nacionalidad-menor-nacido-espana
  -> nacionalidad-espanola-menor-nacido-en-espana

matriculacion-vehiculo
  -> matriculacion
```

El alias no crea un segundo servicio canónico y no modifica el identificador histórico de origen.

## Ofertas múltiples

Una variante comercial no se trata como alias si representa un alcance/precio distinto.

Primer caso modelado:

```text
serviceId: formacion-holded

offer: holded-2h
sourceId: formacion-holded-2h
amount: 18000 cents

offer: holded-4h
sourceId: formacion-holded-4h
amount: 32000 cents
```

Ambas ofertas conservan la identidad `formacion-holded`.

## Precio y modalidad

El adaptador legacy interpreta:

- precio fijo -> `priceMode=fixed`;
- `Desde ...` -> `priceMode=from`;
- `Consultar` -> `priceMode=quote`.

No convierte precios variables en precios contractuales fijos.

## IVA

El tratamiento de IVA solo se infiere cuando el texto legacy lo expresa de forma inequívoca.

En caso contrario:

```text
vatTreatment=manual_review
```

## Stripe

Stripe permanece como binding:

```text
stripePriceId
stripePriceEnvKey
```

Nunca determina el `serviceId` ni sustituye la oferta canónica.

## Conflictos

Si el precio público fijo y el precio Admin comparable difieren:

```text
legacy_price_conflict
```

No se elige automáticamente una fuente.

Las ofertas hijas no se comparan contra el precio general del servicio como si fueran equivalentes.

## Admin Marketing Hub

`/admin/marketing-hub` muestra ahora un resumen C1:

- servicios canónicos;
- total de ofertas shadow;
- servicios con aliases;
- servicios con ofertas múltiples;
- servicios con warnings.

El panel sigue siendo read-only.

## Archivos principales

```text
lib/services/commercial-catalog-bindings.ts
lib/services/canonical-commercial-catalog.ts
lib/services/commercial-catalog-audit.ts
tests/marketing/canonical-commercial-catalog.test.ts
tests/marketing/commercial-catalog-audit.test.ts
app/api/admin/meta/diagnostics/route.ts
app/(protected)/admin/marketing-hub/page.tsx
```

## Gate siguiente

Antes de C2:

1. CI verde;
2. revisar warnings y conflictos desde Admin;
3. confirmar qué ofertas deben quedar activas;
4. preflight completo de esquema y migrations Supabase;
5. solo después diseñar DDL, RLS, constraints e índices.

No se ejecutará ninguna migración productiva desde C1.
