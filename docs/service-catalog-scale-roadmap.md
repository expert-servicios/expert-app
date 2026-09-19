# Roadmap de escalado del catálogo EXPERT a ~100 servicios

Fecha: 19/09/2026  
Dependencia: `docs/service-production-pipeline-v1.md`

## Principio

El crecimiento del catálogo no se medirá por número de slugs creados, sino por número de servicios que llegan a `production_ready` sin divergencias entre producto, contenido, idioma, cobro y operación.

## Arquitectura objetivo

### Capa 1 — producto canónico
- `catalog_services`
- `commercial_offers`
- `stripe_price_bindings`
- aliases
- billing y VAT

### Capa 2 — contenido
- `service_contents` ES/RU
- landing
- metadata
- OG
- FAQ
- contenido estructurado

### Capa 3 — contenido satélite
- blog
- KB
- fuentes oficiales
- KIA

### Capa 4 — adquisición
- Meta
- Instagram
- LinkedIn
- Google
- email
- WhatsApp

### Capa 5 — operación
- pedido
- expediente
- tareas
- documentos
- pago
- factura
- reseña

## Fases

### Fase 1 — 10 servicios
Objetivo: perfeccionar plantilla y QA.

- 3 certificados como referencia `production_ready`.
- completar los restantes del lote 1.
- corregir cualquier fricción real de checkout/post-pago.
- cerrar política RU.

### Fase 2 — 25 servicios
Objetivo: eliminar trabajo repetitivo.

Automatizar:
- scaffolding de landing;
- registro de contenido;
- OG;
- sitemap;
- tests;
- readiness report;
- creación de borradores social.

Mantener aprobación humana para:
- precio;
- alcance;
- fiscal/legal;
- Stripe live;
- publicación.

### Fase 3 — 50 servicios
Objetivo: catálogo operativo multicanal.

- Admin muestra readiness por servicio;
- filtros por stage/categoría/idioma;
- acciones de generar borradores;
- Meta Catalog desde fuente canónica;
- colas de marketing;
- KIA consume catálogo canónico.

### Fase 4 — ~100 servicios
Objetivo: catálogo como sistema de producto.

Un alta debería consistir en:
1. definir ficha;
2. validar comercial/legal;
3. generar assets;
4. revisar;
5. activar.

El sistema debe bloquear automáticamente:
- duplicado Stripe;
- precio divergente;
- RU divergente;
- contenido insuficiente;
- SEO incompleto;
- canal no aprobado;
- checkout roto.

## Automatizaciones deseables

### Seguras para automatizar
- scaffold de ficheros;
- generación de OG;
- conteo blog/KB;
- tests;
- metadata draft;
- internal links draft;
- borradores social;
- UTM;
- sitemap;
- readiness report.

### Con aprobación humana
- copy legal;
- precio;
- IVA;
- suplidos;
- exclusiones;
- claims;
- Stripe live;
- publicación social;
- cambios normativos.

### Nunca automáticas sin reconciliación
- creación duplicada de producto/Price;
- modificación de histórico financiero;
- cambio de precio live;
- baja de producto;
- merge de servicios/aliases;
- publicación de claims jurídicos sin fuente.

## Indicadores

Por lote medir:
- servicios `production_ready`;
- tiempo medio draft → ready;
- tasa de checkout completado;
- incidencias post-pago;
- solicitudes de caso complejo;
- conversión por idioma;
- reseñas y media;
- leads por canal;
- contenido que genera tráfico;
- servicios sin ventas durante 90/180 días.

## Regla de mantenimiento

Cada trimestre:
- revisar top/bottom servicios;
- actualizar contenido normativo;
- retirar o pausar servicios obsoletos;
- consolidar aliases;
- revisar Stripe bindings;
- revisar SEO/canibalización;
- revisar cross-sell.

El catálogo debe crecer con control, no solo acumular páginas.
