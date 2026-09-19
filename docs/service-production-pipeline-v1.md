# Pipeline de producción de servicios puntuales EXPERT

Estado: estándar operativo v1  
Fecha: 19/09/2026  
Ámbito: servicios puntuales empaquetados de EXPERT.  
Exclusiones funcionales: planes, suscripciones, Holded como línea específica y programas de Formación/Academy, salvo que adopten expresamente este estándar.

## Objetivo

Este documento convierte la creación de servicios puntuales en un proceso industrializable para un catálogo de aproximadamente 100 servicios.

Un servicio no es únicamente una landing. Para EXPERT, cada servicio debe convertirse en un producto coherente entre:

- catálogo comercial;
- landing ES;
- versión RU cuando proceda;
- checkout o presupuesto;
- Stripe;
- expediente y post-pago;
- KIA;
- artículos;
- base de conocimientos;
- SEO técnico;
- imagen social;
- paquete editorial/social;
- reseñas;
- cross-sell;
- panel Admin;
- canales de adquisición;
- tests y CI.

La regla principal es: **una única identidad de servicio, múltiples proyecciones**.

No se crean precios, slugs, condiciones económicas o alcances diferentes por canal o idioma.

---

## 1. Fuente canónica

La arquitectura canónica de producto se apoya en:

```text
public.catalog_services
public.service_contents
public.commercial_offers
public.stripe_price_bindings
public.service_aliases
public.service_channel_configs
```

Mientras la migración desde las estructuras legacy continúa, `lib/utils/catalog.ts` sigue siendo una fuente operativa pública relevante. Ninguna automatización debe asumir que una fuente legacy gana sobre otra sin reconciliación explícita.

### Identidad inmutable

Cada servicio debe tener:

- `slug` canónico estable;
- categoría;
- tipo de servicio;
- estado;
- aliases antiguos, si existen;
- una identidad única independiente del idioma.

Una traducción, campaña, artículo o precio Stripe nunca crea una identidad de servicio nueva.

---

## 2. Estados del servicio

### `draft`

Idea o servicio todavía incompleto.

Puede faltar:
- alcance;
- precio;
- documentación;
- checkout;
- fuentes oficiales.

No debe indexarse ni promocionarse.

### `commercial_ready`

La definición comercial está cerrada:

- nombre;
- alcance;
- precio o regla de presupuesto;
- IVA;
- tasas/suplidos;
- incluidos;
- exclusiones;
- público objetivo;
- documentación;
- proceso;
- billing persona/empresa;
- checkout o presupuesto.

### `content_ready`

Además:

- landing ES completa;
- mínimo 3 artículos blog;
- mínimo 3 guías KB;
- FAQ;
- fuentes oficiales;
- interlinking;
- KIA y checklists alineados.

### `locale_ready`

Además:

- versión RU disponible cuando proceda;
- paridad económica y funcional;
- canonical/hreflang;
- imagen social localizada;
- rutas internas localizadas.

### `channel_ready`

Además:

- paquete Facebook;
- paquete Instagram;
- paquete LinkedIn;
- paquete Google;
- UTM;
- imagen social;
- canal marcado `ready`;
- ningún contenido pendiente de revisión jurídica/comercial.

### `production_ready`

Además:

- SEO completo;
- checkout/presupuesto QA;
- reseñas;
- compartir;
- cross-sell;
- sitemap;
- tests;
- CI verde;
- preview verificado;
- sin referencias de marca blanca;
- producto sincronizable con Admin/canales.

Solo un servicio `production_ready` puede entrar en automatización de publicación o campañas.

---

## 3. Orden obligatorio para crear un servicio

### Fase A — definición de producto

1. Crear identidad canónica.
2. Confirmar slug.
3. Confirmar categoría.
4. Definir alcance exacto.
5. Definir cliente objetivo.
6. Definir billing: persona física / empresa / ambos.
7. Definir modalidad:
   - precio fijo;
   - desde;
   - presupuesto.
8. Definir IVA.
9. Separar tasas, suplidos y costes externos.
10. Definir incluidos.
11. Definir no incluidos.
12. Definir documentación.
13. Definir proceso.
14. Definir duración/SLA si puede prometerse.
15. Definir casos que requieren revisión previa.

No se crea Stripe antes de cerrar esta fase.

### Fase B — producto comercial / Stripe

Si el importe es fijo:

1. comprobar si el producto ya existe en Stripe;
2. evitar duplicados;
3. crear o vincular producto;
4. crear/vincular Price;
5. guardar binding;
6. comprobar importe, moneda e IVA;
7. probar checkout;
8. comprobar metadata:
   - `service_slug`;
   - billing;
   - usuario;
   - entidad cuando proceda;
   - suplidos;
   - modalidad.

Si el importe no es fijo:
- no crear checkout directo;
- usar presupuesto o selector estructurado validado.

Regla crítica: **no crear automáticamente un Price nuevo si ya existe un binding o coincidencia comercial que requiera revisión**.

### Fase C — landing ES

La landing española es la fuente editorial principal.

Debe incluir como mínimo:

- metadata;
- canonical;
- Open Graph;
- Twitter card;
- JSON-LD;
- hero;
- precio/regla de presupuesto;
- CTA principal;
- caso complejo;
- documentación;
- proceso;
- incluidos;
- exclusiones;
- FAQ;
- elección de vía;
- sidebar sticky cuando proceda;
- valoraciones;
- compartir;
- servicios complementarios;
- artículos;
- guías;
- CTA final.

### Fase D — SEO ES

Checklist:

- `metaTitle` único;
- `metaDescription` única;
- H1 único;
- slug legible;
- canonical;
- JSON-LD `Service`;
- FAQ schema cuando proceda;
- Open Graph;
- Twitter;
- sitemap;
- breadcrumbs;
- enlaces internos;
- texto suficiente para intención de búsqueda;
- evitar canibalización con otras landings;
- referencias oficiales para contenido regulado.

### Fase E — contenido satélite

Antes de `production_ready`:

#### Blog: mínimo 3

Cada pieza debe cubrir una intención distinta:

1. **decisión / problema**  
   Ej.: quién necesita el servicio, cuándo procede, comparativa.

2. **documentación / proceso**  
   Ej.: requisitos, documentos, pasos, plazos.

3. **error / caso práctico / actualización**  
   Ej.: errores frecuentes, cambio normativo, qué ocurre en un caso concreto.

Todos deben usar `relatedServiceSlugs`.

#### Base de conocimientos: mínimo 3

Debe priorizar contenido operativo:

1. checklist documental;
2. proceso paso a paso;
3. incidencias, seguridad, después del trámite o FAQ avanzada.

Todas deben usar `relatedServiceSlugs`.

#### Reglas editoriales

- no duplicar la landing;
- cada pieza debe resolver una intención concreta;
- enlazar a la landing;
- enlazar entre blog y KB cuando sea natural;
- incluir fuentes oficiales;
- indicar fecha de actualización;
- revisar cambios normativos antes de re-publicar.

---

## 4. Traducción y adaptación al ruso

La versión RU **no es un producto distinto**.

Debe compartir:

- servicio canónico;
- oferta;
- precio;
- IVA;
- suplidos;
- Stripe;
- checkout;
- requisitos;
- incluidos;
- exclusiones;
- SLA;
- proceso.

### Se traduce

- title;
- short description;
- description;
- bloques comerciales;
- FAQ;
- labels;
- CTAs;
- metadata;
- copy social;
- imagen social.

### No se traduce como identificador

- slug canónico interno;
- `service_id`;
- `stripePriceId`;
- códigos de modelos;
- nombres oficiales necesarios para reconocer sedes/documentos.

### Política de rutas

La ruta RU puede ser localizada, pero debe mapear a la misma identidad canónica.

Cada página RU debe tener:

- canonical RU;
- alternates ES/RU;
- `hreflang`;
- enlace visible ES ↔ RU;
- imagen OG RU;
- contenido compartido económicamente;
- checkout idéntico funcionalmente.

No se publica una versión RU parcial con precio o alcance diferente.

---

## 5. Imagen social

Cada servicio debe disponer de imagen social principal por idioma.

Endpoint estándar:

```text
/api/services/og?slug=<slug>&variant=square&lang=es
/api/services/og?slug=<slug>&variant=square&lang=ru
```

Variantes:

- square: 1200×1200;
- hero: 1600×900 cuando se necesite.

Debe mostrar:

- EXPERT;
- categoría;
- nombre del servicio;
- resumen;
- precio solo si es canónico;
- claim seguro;
- idioma correcto.

No debe mostrar:

- proveedor de marca blanca;
- claims no verificables;
- precios calculados a mano si existe una fuente canónica;
- texto ES en una pieza RU.

Para escalar a 100 servicios, los textos localizados de OG deben provenir de contenido estructurado y no de un mapa hardcoded por servicio.

---

## 6. Paquete de marketing

Cada servicio `channel_ready` debe tener:

### Facebook
- educativo;
- problema/solución;
- CTA.

### Instagram
- caption educativo;
- carrusel 5–7 slides;
- CTA;
- brief de Reel/HeyGen.

### LinkedIn
- experto;
- comparativa/cambio;
- CTA profesional.

### Google
- Search Ad;
- variante de intención;
- Business Profile cuando proceda.

Cada pieza debe incluir:

- id;
- canal;
- formato;
- título;
- copy corto;
- copy largo;
- CTA;
- destinationPath;
- UTM;
- estado.

Nunca se publica automáticamente un draft o review.

---

## 7. KIA

Antes de publicar:

- KIA debe reconocer el slug;
- debe conocer precio y alcance canónicos;
- no debe inventar condiciones;
- debe distinguir checkout vs presupuesto;
- debe conocer documentación;
- debe conocer casos de revisión;
- debe ofrecer cross-sell coherente;
- debe usar fuentes oficiales si la materia cambia.

Un cambio importante de servicio obliga a revisar:
- prompts específicos;
- checklists;
- readiness/viability;
- artículos;
- KB;
- social;
- traducción RU.

---

## 8. Reseñas

Todo servicio puntual debe usar el flujo verificado:

- expediente real;
- token de un solo uso;
- 30 días;
- estrellas obligatorias;
- comentario opcional;
- consentimiento de publicación;
- moderación KIA sin puntuación ni identidad;
- revisión humana en ambiguos;
- puntuación negativa nunca se oculta por ser negativa.

Referencia:

```text
/politica-de-resenas
```

---

## 9. Servicios complementarios

Máximo 3.

Deben ser:

- relevantes;
- operativamente complementarios;
- no seleccionados por margen;
- preferentemente disponibles en el mismo idioma.

No incluir automáticamente:
- Holded;
- planes;
- Formación.

---

## 10. Admin y catálogo de canales

Cada servicio debe poder proyectarse al Admin y a los canales sin duplicar datos económicos.

Usar:

- `service_channel_configs`;
- `meta_catalog_items`;
- bindings Stripe;
- aliases;
- estado editorial.

No permitir overrides de:
- precio;
- IVA;
- amount;
- currency;
- billing mode.

---

## 11. Definition of Done

Un servicio `production_ready` debe cumplir todos estos gates.

### Producto
- [ ] identidad canónica;
- [ ] slug único;
- [ ] categoría;
- [ ] alcance;
- [ ] billing;
- [ ] precio/presupuesto;
- [ ] IVA;
- [ ] tasas/suplidos;
- [ ] incluidos;
- [ ] exclusiones;
- [ ] documentación;
- [ ] proceso;
- [ ] SLA/duración revisada;
- [ ] caso complejo.

### Checkout
- [ ] producto/binding Stripe sin duplicados;
- [ ] Price correcto;
- [ ] metadata;
- [ ] success/cancel;
- [ ] pedido;
- [ ] expediente;
- [ ] facturación persona/empresa correcta;
- [ ] suplidos separados cuando proceda.

### ES
- [ ] landing completa;
- [ ] metadata;
- [ ] JSON-LD;
- [ ] FAQ;
- [ ] fuentes oficiales;
- [ ] reseñas;
- [ ] compartir;
- [ ] cross-sell.

### RU
- [ ] página o decisión deliberada de no traducir;
- [ ] paridad económica;
- [ ] paridad de alcance;
- [ ] canonical/hreflang;
- [ ] OG RU;
- [ ] links internos RU;
- [ ] checkout compartido.

### Editorial
- [ ] ≥3 blog;
- [ ] ≥3 KB;
- [ ] interlinking;
- [ ] fechas;
- [ ] fuentes oficiales.

### Marketing
- [ ] Facebook;
- [ ] Instagram;
- [ ] LinkedIn;
- [ ] Google;
- [ ] UTM;
- [ ] OG social;
- [ ] estado `ready`.

### SEO
- [ ] title;
- [ ] description;
- [ ] H1;
- [ ] canonical;
- [ ] hreflang;
- [ ] sitemap;
- [ ] schema;
- [ ] enlaces internos;
- [ ] sin canibalización evidente.

### QA
- [ ] tests comerciales;
- [ ] tests ES/RU;
- [ ] tests de contenido;
- [ ] tests checkout;
- [ ] CI verde;
- [ ] Vercel preview;
- [ ] sin white-label leakage.

---

## 12. Política de cambios posteriores

Un servicio ya publicado vuelve a `review` si cambia:

- precio;
- IVA;
- tasa;
- alcance;
- requisito legal;
- documentación clave;
- SLA;
- organismo competente;
- checkout;
- producto Stripe;
- proveedor final visible;
- normativa.

Después del cambio se deben revisar todas las proyecciones antes de volver a `ready`.

---

## 13. Política de lotes

No trabajar 100 servicios simultáneamente.

Recomendación operativa:

- lotes de 5–10 servicios;
- cerrar cada lote al 100 %;
- medir conversión, incidencias y carga operativa;
- ajustar la plantilla;
- pasar al lote siguiente.

El estándar puede evolucionar, pero la versión aplicada a cada servicio debe quedar documentada.

---

## 14. Regla de publicación automatizada

Una automatización puede publicar o sincronizar un servicio solo cuando:

1. identidad canónica activa;
2. oferta activa;
3. contenido ES activo;
4. traducción requerida activa;
5. channel config `ready`;
6. tests verdes;
7. sin discrepancias económicas;
8. sin bloqueo legal/editorial.

Si falta cualquiera, la automatización debe fallar cerrada.
