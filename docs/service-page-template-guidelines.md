# Plantilla pública para páginas de servicios puntuales

Estado: directriz de diseño y producto  
Fecha original: 12/09/2026  
Última actualización: 19/09/2026  
Ámbito: páginas públicas de servicios puntuales ES/RU, sus landings específicas, checkout/presupuesto asociado y reglas de paridad entre idiomas.

## Objetivo

Todas las páginas de servicios puntuales deben seguir un patrón común para que el usuario pueda elegir con claridad entre:

1. contratar o solicitar el servicio completo;
2. pedir presupuesto si el caso es complejo;
3. hacerlo por su cuenta con formación one to one;
4. reservar una reunión informativa gratuita de 15 minutos.

El patrón evita crear páginas aisladas con CTAs distintos, precios poco claros o flujos de contratación incompatibles con el panel de administración.

## Referencia canónica obligatoria

La plantilla de referencia para nuevas páginas y para la sincronización ES/RU es el servicio:

**Nacionalidad española para menor nacido en España**

Archivos de referencia:

```text
app/(public)/servicios/extranjeria-nacionalidad/nacionalidad-espanola-menor-nacido-en-espana/page.tsx
app/(localized)/ru/uslugi/grazhdanstvo-ispanii-rebenok-rozhdennyy-v-ispanii/page.tsx
tests/services/nationality-service-content.test.ts
lib/services/nationality-minor.ts
```

Este servicio se toma como modelo porque ya resuelve de forma conjunta:

- página ES completa;
- página RU dedicada;
- precio y desglose económico verificables;
- separación entre honorarios y suplidos;
- checkout real;
- documentación;
- proceso;
- incluidos y no incluidos;
- FAQ;
- metadata y JSON-LD;
- navegación cruzada ES/RU;
- tests de consistencia;
- lógica financiera compartida fuera del copy traducido.

No se debe copiar literalmente su contenido ni su estructura económica a otros servicios. Se debe copiar **el patrón de producto y de implementación**.

### Regla principal de internacionalización

La versión española es la fuente funcional/comercial de verdad. La versión rusa traduce y adapta el copy, pero no crea:

- precios distintos;
- productos distintos;
- `stripePriceId` propios;
- reglas de billing distintas;
- tasas o suplidos distintos;
- alcance diferente;
- checkout alternativo.

Cuando un dato pueda compartirse como estructura o constante, debe compartirse. El idioma no debe duplicar lógica financiera.

## Principios de diseño

- Usar estructura clara y repetible.
- Separar servicio completo, caso complejo, formación guiada y reunión gratuita.
- No forzar checkout directo cuando el precio depende de variables del expediente.
- Usar Stripe directo solo cuando el servicio tenga precio cerrado y `stripePriceId` seguro.
- Para casos variables, usar solicitud/revisión y cotización admin personalizada.
- Mantener tono profesional, concreto y orientado a decisión.
- Mantener enlaces a fuentes oficiales, blog y base de conocimientos cuando existan.
- Usar Cal.com para reuniones. No usar naming anterior en páginas nuevas.

## Orden canónico de construcción y sincronización

Cada servicio `stable` se trabaja completo antes de pasar al siguiente.

### Paso 1 — cerrar la fuente ES

Antes de traducir:

1. confirmar nombre y slug;
2. confirmar alcance;
3. confirmar precio;
4. confirmar si es checkout directo o presupuesto;
5. validar `stripePriceId` si existe;
6. validar billing persona/empresa;
7. separar tasas, suplidos y costes externos;
8. confirmar documentación, proceso y exclusiones.

Si alguno de estos puntos está pendiente, el servicio se clasifica como `needs-review` o `blocked` y no entra todavía en traducción RU.

### Paso 2 — construir o revisar la página ES

Orden visual de referencia:

1. metadata, canonical y Open Graph;
2. JSON-LD del servicio y FAQ;
3. hero;
4. precio/desglose económico cuando proceda;
5. CTA principal y caso complejo;
6. aviso crítico del servicio cuando exista;
7. qué incluye;
8. documentación necesaria;
9. proceso paso a paso;
10. no incluido / límites del servicio;
11. FAQ;
12. sidebar sticky de conversión;
13. artículos, docs o CTA complementarios cuando existan.

No todos los servicios necesitan los mismos bloques, pero **el orden relativo debe mantenerse** para que la experiencia sea coherente.

### Paso 3 — crear la versión RU equivalente

La página RU debe conservar exactamente:

- mismo alcance;
- mismo precio;
- mismo tratamiento IVA;
- mismas tasas/suplidos;
- mismos requisitos;
- mismos incluidos/no incluidos;
- mismo proceso;
- mismo destino de checkout o presupuesto;
- misma lógica de billing.

Se traduce el contenido explicativo. Los términos oficiales españoles que el cliente necesitará reconocer en sedes y documentos pueden mantenerse en español dentro del texto ruso: `AEAT`, `Modelo 036`, `RETA`, `TIE`, `CIRCE`, etc.

### Paso 4 — navegación y SEO ES/RU

Comprobar:

- enlace visible ES ↔ RU;
- canonical correcto por idioma;
- `hreflang` ES/RU cuando la arquitectura de la ruta lo permita;
- Open Graph;
- index/noindex deliberado;
- sitemap solo si la página está lista para indexación;
- enlaces internos localizados.

### Paso 5 — checkout/presupuesto y post-pago

Comprobar en ambos idiomas:

- CTA;
- login/registro;
- carrito cuando aplique;
- perfil;
- selector de entidad;
- Stripe locale;
- suplidos;
- success/cancel;
- email;
- dashboard;
- pedido/expediente;
- errores visibles.

La traducción nunca debe modificar la lógica de cobro.

### Paso 6 — tests de paridad

Antes de cerrar el servicio:

- test de precio;
- test de `stripePriceId` o ausencia deliberada;
- test de tasa/suplido;
- test de copy crítico ES/RU;
- test de rutas;
- test de checkout/presupuesto;
- test SEO cuando proceda.

### Paso 7 — pasar al siguiente servicio

No iniciar traducciones masivas de una categoría mientras el servicio anterior no haya pasado CI/Vercel y no tenga paridad funcional.

## Estructura obligatoria de página

### 1. Hero

Debe incluir:

- enlace de vuelta a la categoría;
- etiqueta o contexto del servicio cuando proceda;
- `h1` con nombre del servicio;
- descripción breve;
- duración si está definida;
- CTAs principales.

CTAs de hero:

- Servicio completo:
  - si existe `stripePriceId`: botón de cesta / checkout;
  - si no existe `stripePriceId`: botón `Solicitar presupuesto`.
- Caso complejo.
- Hazlo por tu cuenta.
- Reunión gratuita 15 min.

Formato de enlaces:

```text
/solicitar-presupuesto?servicio=<slug>
/solicitar-presupuesto?servicio=<slug>&tipo=caso-complejo
/solicitar-presupuesto?servicio=formacion-one-to-one-2h&origen=<slug>
```

El formulario de presupuesto debe conservar el contexto recibido por query string:

- `servicio`: servicio principal solicitado;
- `tipo`: variante comercial, por ejemplo `caso-complejo`;
- `origen`: servicio desde el que se ofrece la formación one to one;
- `modalidad`: variante estructurada cuando exista, por ejemplo `full_service` o `guided`.

Ese contexto debe verse en pantalla y enviarse dentro de la descripción de la solicitud para que administración pueda identificar correctamente el origen de cada lead.

La reunión gratuita debe usar:

```ts
CalButton + getCalMeetingUrl()
```

con fallback:

```text
/contacto
```

### 2. Sidebar de conversión

El sidebar debe repetir las opciones principales para mantener conversión durante el scroll:

- precio o indicación `Consultar`;
- servicio completo / cesta / presupuesto;
- caso complejo;
- hazlo por tu cuenta;
- reunión gratuita 15 min;
- WhatsApp.

### 3. Bloque central `Elegir vía`

Toda página de servicio debe incluir un bloque central con cuatro tarjetas:

1. **Servicio completo**
   - Para contratar el trámite o solicitar revisión del expediente.
2. **Caso complejo**
   - Para incidencias, documentación incompleta, urgencias, requerimientos o estructuras no estándar.
3. **Hazlo por tu cuenta**
   - Formación one to one de 2 horas para preparar el trámite con checklist, revisión guiada y soporte humano.
4. **Reunión gratuita**
   - Reunión informativa de 15 minutos para ubicar el caso antes de decidir la vía.

Este bloque debe situarse después de la documentación/proceso principal y antes de artículos relacionados o CTA final.

## Reglas comerciales

### Servicio completo

Usar checkout/cesta solo si:

- el precio es cerrado;
- el alcance está definido;
- existe `stripePriceId` correcto;
- no hay variables relevantes que puedan cambiar el importe.

Si el servicio depende de número de personas, familiares, inmuebles, sociedades, certificados, urgencias o informes oficiales, no conectar checkout directo desde la landing salvo que exista un selector específico y validado.

### Caso complejo

Debe ofrecerse siempre porque permite filtrar expedientes no estándar.

Ejemplos de caso complejo:

- documentación incompleta;
- plazos vencidos o urgentes;
- requerimientos previos;
- sociedades, inmuebles o familiares múltiples;
- antecedentes, ausencias o incidencias administrativas;
- trámites que requieren informe externo u organismo adicional.

### Hazlo por tu cuenta

Debe enlazar a formación one to one de 2 horas:

```text
/solicitar-presupuesto?servicio=formacion-one-to-one-2h&origen=<slug>
```

La promesa comercial debe ser limitada:

- explicar el trámite;
- revisar checklist;
- guiar la preparación;
- resolver dudas prácticas;
- acompañar al cliente para que pueda presentar por su cuenta.

No debe prometer resultado administrativo ni sustitución del servicio completo.

### Reunión gratuita de 15 minutos

Debe describirse como reunión informativa/orientativa para ubicar el caso.

No debe prometer:

- revisión completa de expediente;
- análisis jurídico-fiscal profundo;
- resolución de dudas complejas;
- preparación documental.

La herramienta oficial de reservas es Cal.com.

## Regla sobre CTAs y landings específicas

Las cuatro vías comerciales siguen siendo el patrón general:

- servicio completo;
- caso complejo;
- hazlo por tu cuenta;
- reunión informativa.

Pero una landing específica no debe inventar una vía que no aplique al servicio. La referencia de nacionalidad demuestra que una landing dedicada puede priorizar el checkout real y el caso complejo cuando esa es la decisión principal.

Regla práctica:

- mantener las cuatro vías cuando aporten valor real;
- ocultar o trasladar una vía si no es aplicable;
- documentar cualquier excepción;
- nunca sustituir una vía por un checkout distinto entre ES y RU.

## Reglas de contenido del catálogo

Cada servicio nuevo en `lib/utils/catalog.ts` debe rellenar, siempre que sea posible:

- `slug`
- `categoria`
- `name`
- `shortDescription`
- `description`
- `metaTitle`
- `metaDescription`
- `price`
- `duration`
- `officialFee`
- `servicePriceDetail`
- `checkoutLegal`
- `audience`
- `requirements`
- `keyPoints`
- `includes`
- `documents`
- `process`
- `notIncluded`
- `reviewBeforeHiring`
- `finalCta`
- `faqs`

Solo añadir `stripePriceId` cuando el precio sea cerrado y el checkout esté validado.

## Blog y base de conocimientos

Cuando exista contenido relacionado:

- vincular artículos mediante `relatedServiceSlugs` en `lib/utils/blog.ts`;
- vincular guías mediante `relatedServiceSlugs` en `lib/utils/docs.ts`;
- incluir al menos 3 artículos relacionados si el servicio tiene suficiente contexto SEO;
- incluir guías de base de conocimientos cuando ayuden al usuario a decidir.

No inventar enlaces. Si todavía no existe contenido relacionado, crear borrador editorial o dejar documentado como pendiente.

## Fuentes oficiales

En servicios jurídicos, fiscales, extranjería, Seguridad Social, AEAT, registros o administración pública:

- usar fuentes oficiales;
- enlazar BOE, AEAT, Seguridad Social, ministerios, sedes electrónicas u organismos competentes;
- no basar la página en blogs externos;
- revisar cambios normativos antes de publicar.

## Diseño visual

Mantener el sistema visual actual:

- fondo principal `#F8F6F1`;
- azul marca `#0D1B2A`;
- dorado `#D4A017`;
- tarjetas blancas o azul oscuro según bloque;
- bordes suaves y jerarquía clara;
- CTAs visibles sin saturar.

El hero debe ser oscuro y sobrio. El bloque `Elegir vía` puede usar fondo azul oscuro para destacar decisión.

## Patrón técnico actual

Archivo principal:

```text
app/(public)/servicios/[categoria]/[servicio]/page.tsx
```

Helpers/componentes relevantes:

```ts
AddToCartButton
ViabilityButton
CalButton
getCalMeetingUrl
getDocsForService
getArticlesForService
getService
getServicesByCategory
```

Variables construidas en página:

```ts
const encodedServiceSlug = encodeURIComponent(service.slug);
const budgetHref = `/solicitar-presupuesto?servicio=${encodedServiceSlug}`;
const complexBudgetHref = `${budgetHref}&tipo=caso-complejo`;
const selfGuidedHref = `/solicitar-presupuesto?servicio=formacion-one-to-one-2h&origen=${encodedServiceSlug}`;
```

## Checklist antes de publicar o sincronizar un servicio

### Fuente ES

- [ ] El servicio está clasificado como `stable`.
- [ ] El slug está definido y no se duplica.
- [ ] La categoría existe.
- [ ] El precio está claro: cerrado, desde, consultar o presupuesto.
- [ ] Si hay `stripePriceId`, el precio de Stripe existe y corresponde al servicio.
- [ ] Los costes externos están claramente excluidos si procede.
- [ ] Hay `checkoutLegal` si el precio puede generar confusión.
- [ ] Hay documentación mínima y proceso.
- [ ] Se ha añadido `notIncluded` y `reviewBeforeHiring` si el trámite tiene riesgos.
- [ ] Hay CTA de caso complejo.
- [ ] Hay CTA de formación one to one.
- [ ] Hay CTA de reunión gratuita con Cal.com.
- [ ] El formulario de presupuesto conserva `servicio`, `tipo`, `origen` y `modalidad` cuando correspondan.
- [ ] Hay fuentes oficiales cuando procede.
- [ ] Hay artículos/docs relacionados o queda documentado como pendiente.
- [ ] Se revisa build de Vercel antes de marcar PR como listo.

### Paridad RU

- [ ] Existe página RU o ruta RU deliberadamente resuelta.
- [ ] El precio coincide con ES.
- [ ] El IVA coincide con ES.
- [ ] Las tasas/suplidos coinciden con ES.
- [ ] No existe un `stripePriceId` distinto por idioma.
- [ ] El checkout/presupuesto es el mismo flujo funcional.
- [ ] Incluidos, exclusiones, requisitos y documentos mantienen el mismo alcance.
- [ ] Hay enlace cruzado ES ↔ RU cuando procede.
- [ ] Metadata, canonical y hreflang están revisados.
- [ ] No queda copy español residual salvo términos oficiales deliberados.
- [ ] Hay tests de paridad para campos críticos.
- [ ] CI y Vercel están verdes antes de cerrar el servicio.

## Orden del backlog de internacionalización

Mientras esté activo el Epic #360:

1. terminar correcciones críticas abiertas de servicios ya definidos;
2. usar nacionalidad de menor como referencia canónica;
3. inventariar servicios y clasificarlos `stable / needs-review / blocked`;
4. sincronizar solo los `stable`, uno a uno;
5. priorizar servicios con checkout real y demanda comercial;
6. después completar páginas generales RU;
7. después docs/blog/guías por prioridad comercial y tráfico;
8. retomar rediseños de alcance/precio (`deliveryOptions[]`, etc.) solo cuando termine este bloque o aparezca un error crítico.

## Decisión final

La plantilla común es obligatoria para nuevas páginas de servicios puntuales y para la sincronización ES/RU. La landing de nacionalidad de menor nacido en España es la referencia canónica de implementación. Las landings específicas pueden adaptar los CTAs cuando exista una razón de producto documentada, pero deben mantener paridad funcional entre idiomas y una única fuente para la lógica económica.
