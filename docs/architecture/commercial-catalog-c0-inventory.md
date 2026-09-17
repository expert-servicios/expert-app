# C0 — Inventario comercial read-only

**Fecha:** 2026-09-17  
**Estado:** en curso / sin mutaciones  
**Ámbito:** catálogo público, catálogo Admin, catálogo conversacional y service registry

## Objetivo

Inventariar el estado real del catálogo antes de crear el modelo canónico persistente.

Este bloque no corrige precios, no cambia slugs, no modifica Stripe, no ejecuta DDL y no escribe en producción.

## Fuentes cruzadas

```text
lib/utils/catalog.ts
lib/utils/admin-catalog.ts
lib/data/services-catalog.ts
lib/services/service-registry.ts
```

El inventario ejecutable se encuentra en:

```text
lib/services/commercial-catalog-audit.ts
```

Tests:

```text
tests/marketing/commercial-catalog-audit.test.ts
```

## Hallazgos estructurales

### 1. La identidad del servicio no es uniforme entre fuentes

Se han identificado candidatos de alias que deben revisarse antes de cualquier consolidación:

```text
holded-starter
  -> candidato: holded-pack-starter

nacionalidad-menor-nacido-espana
  -> candidato: nacionalidad-espanola-menor-nacido-en-espana

matriculacion-vehiculo
  -> candidato: matriculacion
```

Estos mappings son únicamente candidatos documentados.

No se reescribe ninguna fuente automáticamente.

### 2. No todo id distinto es un alias

Ejemplo relevante:

```text
formacion-holded
formacion-holded-2h
formacion-holded-4h
```

La interpretación correcta no es necesariamente alias.

El patrón encaja mejor con:

```text
service = formacion-holded
commercial_offers = 2h / 4h / otras variantes
```

Este caso valida la separación arquitectónica entre identidad del servicio y oferta comercial.

### 3. Existen discrepancias reales de precio

El auditor detecta `price_mismatch` cuando existe precio fijo público y precio sugerido Admin distinto.

Ejemplo confirmado:

```text
irpf
public catalog: 150 € + IVA
admin suggested price: 90 €
```

El sistema no elige ninguno automáticamente.

La discrepancia bloquea el uso de la fuente Admin como autoridad económica para Meta.

### 4. Los precios variables no pueden convertirse silenciosamente en precio fijo

Se consideran ambiguos:

```text
Consultar
Desde ...
```

Estos casos generan:

```text
public_price_ambiguous
```

y deben convertirse posteriormente a:

```text
price_mode = quote
```

o

```text
price_mode = from
```

según la decisión comercial real.

### 5. Stripe binding y precio comercial son conceptos diferentes

`service-registry.ts` y `catalog.ts` exponen bindings de Stripe para determinados servicios.

El inventario registra:

```text
stripePriceId
stripePriceEnvKey
hasCheckout
flowType
isSubscription
```

pero no consulta ni modifica objetos Stripe live en C0.

Si aparece un Stripe binding asociado a precio público ambiguo, se marca:

```text
stripe_binding_without_fixed_public_price
```

### 6. El service registry ya aporta semántica útil

No debe duplicarse.

Actualmente diferencia:

```text
viability
readiness
direct_checkout
quote
subscription_readiness
```

El catálogo canónico futuro deberá conservar esta semántica o adaptarla explícitamente.

## Tipos de incidencia C0

El auditor actual puede producir:

```text
price_mismatch
public_price_ambiguous
missing_admin_item
admin_only_item
conversation_only_item
stripe_binding_without_fixed_public_price
registry_without_public_item
```

## Alias candidatos

Los candidatos se mantienen en:

```text
COMMERCIAL_ALIAS_CANDIDATES
```

Estado permitido actualmente:

```text
candidate
```

No existe todavía estado `approved` porque aprobar un alias implica una decisión funcional que puede afectar rutas, SEO, checkout, KIA y trazabilidad histórica.

## Matriz conceptual por fila

Cada id inventariado contiene:

```text
id
publicName
adminLabel
conversationTitle
publicPriceText
publicFixedPrice
adminSuggestedPrice
adminMode
stripePriceId
stripePriceEnvKey
flowType
hasCheckout
isSubscription
sources.*
issues[]
```

## Qué NO hace C0

- no determina el precio correcto;
- no corrige slugs;
- no crea aliases activos;
- no cambia páginas públicas;
- no modifica KIA;
- no cambia Stripe Prices;
- no crea tablas;
- no modifica Supabase;
- no publica servicios en Meta.

## Gate para C1

C1 podrá comenzar cuando:

1. los aliases candidatos estén revisados funcionalmente;
2. los casos `service` vs `commercial_offer` estén diferenciados;
3. las discrepancias de precio se hayan clasificado como:
   - precio público correcto;
   - precio Admin correcto;
   - ambos obsoletos;
   - ofertas comerciales diferentes;
4. los servicios `Consultar` / `Desde` tengan `price_mode` definido;
5. los bindings Stripe sean inventariados read-only antes de cualquier cambio live.

## Siguiente paso

C1 debe introducir tipos canónicos en código, todavía sin DDL:

```text
CanonicalService
LocalizedServiceContent
CommercialOffer
ChannelConfig
StripePriceBinding
ServiceAlias
```

Los adaptadores legacy deberán transformar las fuentes actuales hacia estos tipos sin cambiar el comportamiento de producción.
