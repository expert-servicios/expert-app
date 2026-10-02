# Editorial Hub — estrategia de contenidos EXPERT

Fecha: 02/10/2026

## Objetivo

Centralizar en EXPERT la producción y revisión de contenido para LinkedIn, Facebook e Instagram.

La fuente puede ser:

- mentorías;
- artículos;
- servicios;
- producto EXPERT/KIA;
- guías;
- casos;
- marca personal;
- conocimiento interno convertido en contenido público.

## Principio

No publicar por publicar.

Cada pieza debe responder al menos a uno de estos objetivos:

1. educar;
2. demostrar experiencia;
3. explicar un producto o servicio;
4. documentar aprendizajes;
5. generar conversación;
6. llevar tráfico a un recurso útil;
7. captar una consulta con intención real.

## Pilares iniciales

1. Mentorías y emprendimiento.
2. EXPERT / producto / automatización.
3. IA aplicada a asesoría.
4. Fiscalidad y gestión empresarial.
5. Holded y digitalización.
6. Servicios puntuales EXPERT.
7. Marca personal y trayectoria.
8. Proyectos MentorDay, solo con consentimiento cuando aplique.

## Flujo

Fuente → idea → borrador maestro → adaptación por canal → brief visual → revisión → aprobación → programación → publicación → métricas.

Estados:

- idea;
- draft;
- review;
- approved;
- scheduled;
- published;
- rejected.

## Regla para terceros

Si el contenido identifica a una persona, empresa o proyecto de mentoring:

- revisar fuente;
- confirmar exactitud;
- comprobar qué datos son públicos;
- registrar consentimiento cuando el contexto de mentoring o resultados lo requiera;
- no aprobar/programar/publicar mientras el consentimiento esté pendiente.

## Diferencias por canal

### LinkedIn

Canal prioritario para Ksenia.

Contenido:
- opinión profesional respaldada por experiencia;
- aprendizajes de mentoring;
- decisiones de producto;
- fiscalidad/gestión para empresarios;
- digitalización;
- casos y procesos.

Estilo:
- texto con punto de vista;
- ejemplos concretos;
- pocos hashtags;
- CTA discreto.

### Facebook

Más explicativo y directo.

Contenido:
- servicios;
- guías;
- artículos útiles;
- novedades;
- problemas frecuentes y soluciones.

### Instagram

Visual y condensado.

Formatos:
- carruseles;
- frases/ideas fuertes;
- mini-guías;
- reels breves más adelante.

## Ritmo inicial recomendado

No empezar con publicación diaria.

Primer mes:

- LinkedIn: 3 publicaciones por semana.
- Facebook: 2 publicaciones por semana.
- Instagram: 2 publicaciones por semana.

Reutilizar la misma idea con adaptación real, no copiar-pegar exacto entre redes.

## Semana tipo inicial

Lunes — aprendizaje / criterio profesional.
Miércoles — guía, producto o proceso EXPERT.
Viernes — mentoring, emprendimiento o experiencia de campo.

Facebook e Instagram reutilizan 2 de las 3 piezas, adaptadas.

## Primera tanda

La primera cola editorial se inicia con:

- 3 piezas MentorDay / marca personal;
- 2 piezas EXPERT/KIA;
- 5 derivados de artículos existentes;
- 2 servicios production_ready;
- 2 proyectos MentorDay en revisión por consentimiento.

## Arquitectura de publicación

EXPERT será la fuente y el orquestador. No se utilizará una capa externa de programación como dependencia principal.

Canales previstos:

- Meta Graph / Marketing API para Facebook, Instagram y campañas Meta;
- Google Ads API para campañas, grupos, anuncios y reporting;
- LinkedIn Posts API para publicaciones orgánicas y patrocinadas;
- LinkedIn Advertising API para cuentas publicitarias, campañas, creatividades y reporting.

Regla:

```text
Editorial Hub → approved → adaptador del canal → API oficial → ID externo → métricas
```

Las credenciales permanecen server-side y cada escritura externa debe generar un job auditable y un resultado persistido.

## Estado técnico actual

### Meta

EXPERT ya dispone de cliente Graph API server-side y configuración aislada `META_MARKETING_*`.

La implementación actual es deliberadamente read-only/fail-closed: puede comprobar configuración y catálogo, pero no debe crear campañas ni publicar contenido hasta incorporar los jobs de escritura auditables.

### Google Ads

El catálogo y la documentación de EXPERT contemplan Google como canal, pero el repositorio no contiene todavía un cliente `GOOGLE_ADS_*` ni endpoints de escritura.

La integración debe añadirse directamente sobre Google Ads API usando el proyecto Google Cloud con acceso de API, OAuth y la cuenta de Ads correspondiente.

### LinkedIn

Se implementarán dos adaptadores separados:

1. `linkedin-social`: Posts API para publicación orgánica del perfil/página y contenido patrocinado cuando corresponda.
2. `linkedin-ads`: Advertising API para campañas, presupuestos, targeting, creatividades y reporting.

No se mezclará la publicación orgánica con la gestión de Ads aunque compartan autenticación y algunos permisos.

## Generación visual

Los activos visuales no dependerán de Canva. El `asset_brief` del Editorial Hub será la especificación canónica para generar imágenes/carruseles mediante la capa de generación propia o APIs que se aprueben posteriormente.

La aprobación editorial seguirá ocurriendo en EXPERT antes de cualquier publicación automática.
