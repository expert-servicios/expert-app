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
- Respetar la arquitectura de **marca blanca**: no exponer en páginas, metadatos, KIA, emails, campañas, FAQ ni piezas sociales el nombre del mayorista, intermediario o proveedor operativo que EXPERT utilice internamente. Solo se identifica al prestador/issuer final cuando sea necesario para explicar el producto al cliente (por ejemplo, Camerfirma en certificados Camerfirma).
- No inventar testimonios, estrellas ni contadores. Las valoraciones públicas proceden exclusivamente del flujo real de cierre de expediente y moderación.

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
13. valoraciones verificadas del servicio;
14. bloque visible para compartir la página;
15. servicios complementarios o acompañantes;
16. artículos, docs o CTA complementarios cuando existan.

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

## Servicios complementarios y cross-sell

Las páginas de servicios puntuales deben incluir un bloque de **servicios complementarios** pensado como ayuda a la decisión, no como catálogo indiscriminado.

Reglas:

- queda fuera de este cross-sell la categoría Holded, los planes/suscripciones y Formación;
- el CTA «Hazlo por tu cuenta» sigue siendo una vía comercial separada y no cuenta como servicio complementario;
- cuando exista una relación clara, usar una selección curada por servicio;
- si no existe selección específica, usar recomendaciones de categoría como fallback;
- limitar el bloque a un máximo de 3 servicios;
- permitir recomendaciones entre categorías cuando exista relación operativa real;
- no recomendar un servicio solo por tener mayor precio;
- el enlace siempre debe usar el slug y la categoría canónicos del servicio recomendado.

Implementación actual:

```ts
getCompanionServices(service)
```

en:

```text
lib/services/service-merchandising.ts
```

## Valoraciones de clientes

El flujo de valoración forma parte del cierre estándar del expediente.

Regla funcional:

1. cuando un expediente pasa a `finalizado`, la automatización `case.review_request` genera un enlace de un solo uso;
2. la puntuación de **1 a 5 estrellas es obligatoria**;
3. el comentario es **opcional**;
4. el cliente decide expresamente si autoriza la publicación;
5. Administración modera la reseña;
6. solo se puede mostrar públicamente una reseña si:
   - está aprobada;
   - el cliente autorizó la publicación;
   - está marcada como publicada.

Las páginas públicas deben calcular estrellas y media únicamente con reseñas que cumplan esas condiciones. Nunca se deben mezclar valoraciones de KIA, datos legacy o reseñas no moderadas con la reputación pública del servicio.

Componentes y rutas:

```text
app/(public)/gracias/opinion/page.tsx
app/api/reviews/submit/route.ts
app/(protected)/admin/resenas/
components/services/ServiceRatingSummary.tsx
lib/services/public-service-reviews.ts
```

## Compartir página e imagen social

Cada landing `production-ready` debe tener un bloque visible para compartir mediante:

- compartir nativo del dispositivo, cuando exista;
- WhatsApp;
- Telegram;
- LinkedIn;
- Facebook;
- copiar enlace.

La URL compartida será siempre la canonical de la página actual.

Cada idioma debe tener una **imagen social principal propia**, no una imagen española reutilizada en una landing rusa. Para las páginas generadas por catálogo se usa:

```text
/api/services/og?slug=<service_slug>&variant=square&lang=es
/api/services/og?slug=<service_slug>&variant=square&lang=ru
```

Requisitos:

- Open Graph y Twitter/X deben apuntar a la imagen del idioma;
- tamaño de referencia: 1200 x 1200 para pieza social cuadrada;
- título, resumen, categoría y claims de la imagen deben corresponder al idioma;
- la imagen debe mantener identidad EXPERT;
- no exponer proveedores de marca blanca;
- cualquier precio mostrado debe provenir de la fuente comercial canónica.

Componente visible:

```text
components/services/ServiceShareActions.tsx
```

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

## Blog, base de conocimientos y paquete social

Para los servicios incluidos en el catálogo de lanzamiento, el contenido relacionado deja de ser opcional.

Mínimo obligatorio por servicio antes de marcarlo `production-ready`:

- **3 artículos de blog** vinculados mediante `relatedServiceSlugs` en `lib/utils/blog.ts`;
- **3 guías de base de conocimientos** vinculadas mediante `relatedServiceSlugs` en `lib/utils/docs.ts`;
- cada pieza debe resolver una intención distinta: decisión, documentación/proceso y error/comparativa/caso práctico;
- interlinking entre landing, artículos y guías;
- metadata SEO propia para cada pieza;
- referencias oficiales cuando el contenido sea jurídico, fiscal, laboral o administrativo.

Además, cada servicio del lote de lanzamiento debe tener un **paquete social** preparado para:

- Facebook;
- Instagram;
- LinkedIn.

El paquete social debe incluir como mínimo:

- titular/hook;
- copy largo;
- copy corto;
- CTA;
- URL de destino;
- parámetros UTM por canal;
- tema o pieza de contenido de soporte;
- estado editorial (`draft / review / ready / published`).

La publicación automática en Meta o LinkedIn no debe activarse hasta que:
- la landing esté `production-ready`;
- los 3 artículos y 3 documentos estén publicados;
- el contenido social esté aprobado;
- la integración del canal esté validada.

No inventar enlaces. Si todavía no existe contenido suficiente, el servicio permanece en preparación editorial.

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
- [ ] Hay al menos 3 artículos de blog relacionados.
- [ ] Hay al menos 3 guías de base de conocimientos relacionadas.
- [ ] Landing, blog y guías tienen interlinking coherente.
- [ ] Existe paquete social preparado para Facebook, Instagram y LinkedIn.
- [ ] La página muestra valoraciones verificadas; las estrellas proceden solo de reseñas aprobadas, consentidas y publicadas.
- [ ] El flujo post-servicio exige 1–5 estrellas y deja el comentario opcional.
- [ ] Existe bloque visible para compartir (nativo, WhatsApp, Telegram, LinkedIn, Facebook y copiar enlace).
- [ ] Open Graph/Twitter usan una imagen social principal del idioma correcto.
- [ ] Existe bloque de hasta 3 servicios complementarios, sin Holded, planes ni Formación.
- [ ] No aparece ningún proveedor/intermediario de marca blanca en copy, metadata, KIA, emails ni campañas.
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
- [ ] La imagen Open Graph/Twitter está localizada al ruso.
- [ ] El bloque de compartir utiliza la URL RU y copy RU.
- [ ] Las valoraciones mantienen la misma fuente verificada que ES.
- [ ] Los servicios complementarios enlazan a una versión RU cuando exista; no se inventan rutas traducidas.
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
