# Catálogo comercial canónico de EXPERT

**Estado:** decisión arquitectónica para implementación incremental  
**Fecha:** 2026-09-17  
**Ámbito:** catálogo web, Admin, Stripe, Meta Marketing Hub, KIA y futuros canales

## 1. Problema que resuelve

EXPERT mantiene hoy varias representaciones parciales del catálogo de servicios:

- `lib/utils/catalog.ts`: contenido público, slugs, descripciones, precio mostrado y datos de landing;
- `lib/data/services-catalog.ts`: representación abreviada para interfaces/conversación;
- `lib/utils/admin-catalog.ts`: catálogo administrativo con precios sugeridos y modalidad de cobro;
- Stripe: productos/precios utilizados para determinados checkouts;
- futuras proyecciones externas: Meta Catalog, Ads, Google, WhatsApp, email y otros canales.

Estas fuentes no son equivalentes y ya existen discrepancias reales de precio, identificadores y cobertura. Por tanto, ninguna de ellas debe propagarse automáticamente a Meta o a otro canal como si fuera una fuente económica universal.

La arquitectura objetivo debe responder de forma inequívoca a estas preguntas:

1. ¿Qué servicio es este?
2. ¿Cómo se describe públicamente?
3. ¿Cuál es su modalidad comercial?
4. ¿Cuál es su precio vigente y qué impuestos/tasas/suplidos quedan fuera?
5. ¿Qué `Price` de Stripe, si existe, corresponde exactamente a esa oferta?
6. ¿Puede publicarse en un canal concreto?
7. ¿Quién cambió el precio y desde cuándo es aplicable?

---

## 2. Decisión

EXPERT será la única fuente canónica de identidad y condiciones comerciales del servicio.

```text
                 EXPERT CANONICAL SERVICE CATALOG
                 ────────────────────────────────
                 identidad · oferta · precio · estado
                              │
              ┌───────────────┼────────────────┐
              │               │                │
              ▼               ▼                ▼
          Web pública        Admin             KIA
              │
              ├──────────────► Stripe (cobro)
              │
              ├──────────────► Meta (marketing)
              │
              ├──────────────► Google Ads
              │
              └──────────────► otros canales
```

### Regla principal

**Stripe, Meta y el resto de canales son proyecciones/adaptadores. No son fuentes maestras.**

Un cambio externo nunca actualizará automáticamente el precio canónico de EXPERT.

---

## 3. Identidad canónica

Cada servicio tendrá una identidad estable independiente de su nombre comercial, idioma, precio o canal.

Campos conceptuales:

```text
service_id          identificador interno estable
slug                identificador público estable
category_id         categoría funcional
status              draft | active | paused | retired
service_type        service | training | plan | procedure
created_at
updated_at
```

### Invariantes

- `service_id` no cambia por cambios de nombre o precio.
- `slug` no se recicla para otro servicio.
- una traducción no crea un servicio distinto;
- un cambio de tarifa no crea una identidad nueva;
- un servicio retirado no se borra si ya existe historial comercial;
- cualquier alias legacy debe apuntar explícitamente al `service_id` canónico.

---

## 4. Contenido editorial

Los textos comerciales son una capa separada de la economía del servicio.

Campos conceptuales:

```text
service_id
locale              es | ru | en
name
short_description
description
meta_title
meta_description
landing_path
image_url
status
```

### Regla

El contenido puede cambiar sin alterar el precio contractual.

Esto evita que una modificación SEO, una traducción o un cambio de imagen modifique accidentalmente la lógica de checkout.

---

## 5. Oferta comercial

Un servicio puede tener una o varias ofertas.

Ejemplos:

- consulta profesional 30 min;
- consulta profesional 1 h;
- formación 2 h;
- gestión completa;
- plan mensual;
- precio personalizado;
- promoción temporal futura.

Modelo conceptual:

```text
commercial_offer

id
service_id
code
billing_mode        one_time | recurring | quote
price_mode          fixed | from | quote
currency            EUR
amount_cents        nullable
vat_treatment       plus_vat | vat_included | exempt | outside_scope | manual_review
active_from
active_until
status              draft | active | paused | retired
```

### Precio

Cuando `price_mode = fixed`:

```text
amount_cents > 0
currency = EUR
```

Cuando `price_mode = from`:

```text
amount_cents = importe mínimo informativo
```

pero ningún canal podrá tratar ese importe como precio contractual cerrado sin una regla específica.

Cuando `price_mode = quote`:

```text
amount_cents = null
```

y la contratación requiere presupuesto u otro flujo aprobado.

---

## 6. IVA, tasas y suplidos

El precio profesional y los importes de terceros no se mezclarán.

### Honorarios

```text
base profesional
+ IVA según tratamiento aplicable
```

### Tasas oficiales

Se modelarán como importes externos vinculados al trámite cuando proceda, no como honorarios.

### Suplidos

Los suplidos seguirán una línea separada y no alterarán el precio base del servicio.

La existencia de un suplido no autoriza a Meta, Stripe o cualquier otro canal a presentar el total como honorario profesional.

### Invariante

```text
professional_revenue != official_fees != disbursements
```

La capa comercial debe conservar esta separación hasta checkout, conciliación e informes.

---

## 7. Stripe

Stripe es procesador/canal de cobro, no fuente maestra de precio.

Relación conceptual:

```text
commercial_offer
      │
      ▼
stripe_price_binding

id
offer_id
stripe_product_id
stripe_price_id
environment         test | live
status
last_verified_at
```

### Reglas

1. Un `stripe_price_id` nunca sustituye al `offer_id`.
2. El importe configurado en Stripe debe coincidir con la oferta canónica antes de habilitar checkout automático.
3. Una discrepancia debe provocar `manual_review`, no una corrección automática.
4. Los precios históricos de Stripe no se reescriben para adaptar una nueva tarifa.
5. Un cambio de tarifa puede requerir un nuevo Stripe Price, manteniendo el anterior para historial.
6. Servicios `quote` no necesitan obligatoriamente un Stripe Price predefinido.
7. Suplidos se mantienen separados de honorarios y revenue.

---

## 8. Meta Marketing Hub

Meta recibirá una proyección del catálogo canónico.

Ejemplo:

```text
commercial_offer + service_content
           │
           ▼
MetaCatalogAdapter
           │
           ▼
Meta Professional Services Catalog
```

Meta nunca decidirá:

- el precio válido;
- el IVA;
- si una tasa forma parte de honorarios;
- si un servicio está jurídicamente disponible;
- qué oferta sustituye a otra.

### Publicación automática permitida

Solo cuando se cumplan todos los requisitos definidos por el adaptador:

```text
service.status = active
offer.status = active
channel.meta.enabled = true
contenido requerido completo
landing válida
imagen válida
precio compatible con el formato Meta
ausencia de conflictos comerciales
```

Cualquier conflicto produce:

```text
manual_review
```

Nunca selección silenciosa de una de las fuentes divergentes.

---

## 9. Configuración por canal

Un servicio activo no tiene por qué publicarse en todos los canales.

Modelo conceptual:

```text
service_channel_config

service_id
offer_id
channel             web | meta | google | whatsapp | email
locale
enabled
priority
tags
custom_labels
landing_override
image_override
status
```

El override es de presentación, nunca de precio canónico salvo que exista una oferta comercial específica para ese canal aprobada y trazable.

---

## 10. Idiomas

ES/RU/EN serán traducciones de una misma identidad de servicio.

```text
service_id = svc_x

content_es
content_ru
content_en
```

Una traducción puede tener distinta creatividad o landing, pero no inventará una oferta económica distinta.

Si un mercado requiere otra tarifa, deberá existir una `commercial_offer` específica, no un precio escondido dentro del texto traducido.

---

## 11. Estado actual y fuente transitoria

Hasta implantar el modelo persistente:

### Contenido público

Fuente transitoria:

```text
lib/utils/catalog.ts
```

### Representación corta

```text
lib/data/services-catalog.ts
```

Se considera una proyección de UI/conversación. No tiene autoridad económica.

### Catálogo Admin

```text
lib/utils/admin-catalog.ts
```

Se considera catálogo auxiliar de operaciones y precios sugeridos legacy. No tiene autoridad para sobrescribir automáticamente el precio público o Stripe.

### Stripe

Se utiliza para cobro donde ya existe binding, pero no se utiliza para reconstruir silenciosamente el precio canónico.

### Meta

Durante M0/M1 consume únicamente el adaptador conservador y bloquea precios ambiguos o inconsistentes.

---

## 12. Auditor de coherencia

`auditMetaCatalog()` funciona como primer control preventivo.

Debe detectar, como mínimo:

```text
price_mismatch
missing_public_fixed_price
missing_admin_item
admin_alias_only
price_requires_manual_review
missing_short_description
missing_catalog_image
```

### Principio

El auditor informa. No corrige.

Ningún mismatch permite:

- cambiar `lib/utils/catalog.ts`;
- cambiar `admin-catalog.ts`;
- crear/modificar Stripe Price;
- publicar el servicio en Meta;

sin decisión explícita posterior.

---

## 13. Arquitectura persistente objetivo

Los nombres definitivos se validarán contra el esquema Supabase antes de DDL, pero el modelo lógico propuesto es:

```text
services
service_contents
commercial_offers
service_channel_configs
stripe_price_bindings
meta_catalog_items
meta_catalog_sets
meta_sync_jobs
meta_api_logs
```

No se ejecutará DDL hasta completar preflight del esquema productivo y del historial de migraciones.

---

## 14. Auditoría de cambios comerciales

Los cambios sensibles deben ser trazables.

Para una modificación de precio se conservará:

```text
actor
service_id
offer_id
old_value
new_value
effective_from
reason
created_at
```

### Acciones que requieren confirmación humana

- modificar precio;
- cambiar tratamiento de IVA;
- convertir `quote` en `fixed`;
- activar una oferta;
- retirar una oferta con ventas históricas;
- asociar/desasociar Stripe Price live;
- habilitar publicación Meta de una oferta previamente bloqueada.

---

## 15. Flujo futuro de modificación

```text
Admin EXPERT
    │
    ▼
Editar oferta
    │
    ▼
Validación económica
    │
    ▼
Guardar versión canónica
    │
    ├──► Web
    ├──► Stripe binding check
    ├──► Meta sync
    ├──► KIA
    └──► otros canales
```

Si un adaptador falla:

```text
la oferta canónica permanece válida
channel_status = failed
reintento controlado
```

Nunca se revierte o borra la oferta maestra por un fallo de Meta/Stripe.

---

## 16. Plan de migración

### C0 — Inventario

- comparar `catalog.ts`, `services-catalog.ts` y `admin-catalog.ts`;
- identificar aliases;
- identificar discrepancias de precios;
- identificar servicios sin oferta fija;
- inventariar Stripe Price IDs existentes.

**Sin escrituras.**

### C1 — Modelo canónico en código

- introducir tipos compartidos para identidad, contenido y oferta;
- crear adaptadores legacy;
- mantener las rutas actuales funcionando;
- añadir tests de equivalencia.

**Sin DDL.**

### C2 — Esquema Supabase

Solo después de preflight:

- crear tablas persistentes;
- RLS;
- constraints;
- índices;
- audit trail;
- Security Advisor.

### C3 — Shadow read

- leer modelo nuevo en paralelo;
- comparar resultados con fuentes legacy;
- no cambiar salida pública todavía;
- registrar diferencias agregadas, sin datos sensibles.

### C4 — Web cutover

- web pública lee el catálogo canónico;
- rutas/slugs existentes se preservan;
- SEO y checkout se prueban antes de retirar legacy.

### C5 — Admin cutover

- Admin edita ofertas canónicas;
- se retiran precios sugeridos duplicados;
- operaciones históricas permanecen intactas.

### C6 — Stripe binding

- reconciliación read-only;
- detectar Price IDs huérfanos/discrepantes;
- ninguna modificación automática de objetos financieros históricos.

### C7 — Meta

- publicar únicamente ofertas `marketingReady`;
- piloto de 3–5 servicios;
- diagnostics;
- después sincronización completa.

### C8 — Retirada de duplicados legacy

Solo cuando todos los consumidores hayan migrado y CI demuestre que no existen lecturas residuales.

---

## 17. Stop conditions

Detener cualquier automatización si aparece:

- precio contradictorio entre fuentes;
- Stripe Price con importe distinto al canónico;
- alias ambiguo;
- dos ofertas activas incompatibles para mismo contexto;
- IVA/tratamiento fiscal no definido;
- tasa o suplido mezclado con honorarios;
- servicio sin landing válida;
- servicio retirado con intento de publicación;
- migración productiva inesperada o drift de esquema.

---

## 18. Criterio de éxito

La arquitectura se considerará consolidada cuando esta consulta tenga una sola respuesta autoritativa:

```text
¿Qué servicio se vende,
a qué precio,
con qué tratamiento económico,
desde cuándo,
y en qué canales puede publicarse?
```

Y Web, Admin, Stripe, Meta y KIA consuman esa respuesta sin mantener copias económicas independientes.
