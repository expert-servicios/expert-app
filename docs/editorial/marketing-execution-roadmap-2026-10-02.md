# Roadmap operativo — Marketing, Catálogo y Publicación EXPERT

Fecha: 02/10/2026  
Estado: plan operativo vigente  
Owner: Ksenia Ilicheva / EXPERT  
Ámbito: catálogo público, Editorial Hub, Meta, LinkedIn, Google Ads y contenido derivado de MentorDay.

---

## 1. Objetivo

Convertir EXPERT en la fuente canónica de:

- catálogo de servicios;
- contenido editorial;
- calendario de publicaciones;
- imágenes sociales;
- conexiones con canales;
- publicaciones orgánicas;
- campañas publicitarias;
- métricas y atribución;
- leads originados por contenido, servicios y mentorías.

Principio: **EXPERT decide, cada canal ejecuta**.

Meta Business Suite, LinkedIn y Google Ads son destinos y fuentes de métricas, no el sistema maestro.

---

## 2. Estado confirmado a 02/10/2026

### Repositorio

- PR #551 — Editorial Hub y backlog inicial: fusionada.
- PR #554 — artículo ES/RU sobre sanciones bancarias: fusionada, CI verde.
- PR #555 — KIA health runtime sobre main actual: fusionada, CI verde.
- PR #553 — KIA Accounting / controller financiero: CI verde y sin hilos pendientes; merge manual pendiente.
- PR #552 — documentación incorrecta de Google Ads Developer Token: cerrada sin fusionar.
- PR #542 — sustituida funcionalmente por #555.
- PR #520 y #521 — demasiado divergidas respecto a main; no fusionar directamente. Recuperar solo cambios vigentes mediante ramas nuevas.

### Meta

Confirmado por prueba de Marketing Hub:

- variables `META_MARKETING_*` presentes;
- integración habilitada;
- versión Graph API configurada;
- prueba read-only correcta.

Todavía no se activa publicación automática.

### Datos internos

Snapshot de Supabase:

- 100 contactos MentorDay cargados como posibles leads;
- 5 mentorías/engagements documentados;
- 14 piezas en Editorial Hub;
- 0 publication jobs;
- 0 channel accounts persistidos;
- 0 items Meta sincronizados;
- 0 jobs Meta ejecutados.

La infraestructura editorial existe, pero la proyección comercial C2 todavía debe poblarse antes de sincronizar Meta.

---

## 3. Decisiones de arquitectura vigentes

### 3.1. No reintroducir suscripciones retiradas

El catálogo público 2026 se centra en servicios puntuales.

No volver a introducir automáticamente en Meta:

- Plan Supervisión;
- Plan Avanzado;
- Plan Colaborativo;
- antiguos servicios periódicos archivados.

Si un plan reaparece en el futuro, debe hacerlo como decisión comercial explícita, no por arrastre de scripts legacy.

### 3.2. Catálogo canónico

La proyección hacia Meta debe salir de:

```text
catalog_services
service_contents
commercial_offers
service_channel_configs
```

Nunca de valores duplicados manualmente dentro de Meta.

### 3.3. Imágenes

Hay dos familias distintas.

#### Imagen de catálogo / ficha

Usar el generador dinámico canónico:

```text
/api/services/og?slug=<slug>&variant=square&lang=es
/api/services/og?slug=<slug>&variant=hero&lang=es
```

Variantes:

- square: 1200x1200;
- hero: 1600x900.

La imagen obtiene directamente:

- marca EXPERT;
- categoría;
- nombre;
- resumen;
- precio canónico;
- tasas/suplidos cuando proceda;
- versión RU cuando exista.

#### Creatividad publicitaria

Será una pieza diferente, generada para:

- Instagram;
- Facebook;
- LinkedIn;
- Ads;
- carruseles;
- Reels/short-form.

No sustituye la imagen canónica del servicio.

### 3.4. Calendario

El calendario maestro es EXPERT:

```text
social_content_items
        ↓ approved
social_publication_jobs
        ↓ scheduled_at
publisher
        ↓
Meta | LinkedIn | Google Ads
        ↓
external_object_id
        ↓
metrics
```

---

## 4. Orden de ejecución obligatorio

### Fase 1 — cerrar PR #553

Objetivo:
separar definitivamente la integración técnica de Holded del controller contable.

Resultado esperado:

- `holded` = conexión, permisos, readiness e incidencias técnicas;
- `accounting` = facturación, cobros, pagos, conciliación, impagados y cierres;
- ninguna ejecución de pagos;
- ninguna eliminación silenciosa de facturas/asientos;
- acciones con efecto contable sujetas a aprobación humana.

Gate:
- CI verde;
- sin hilos;
- merge manual.

### Fase 2 — poblar catálogo C2

Ejecutar el backfill existente:

```text
npx tsx scripts/backfill-meta-catalog-c2.ts --apply
```

Antes de aplicar, revisar que el script no reintroduzca planes mensuales retirados.

Después comprobar en Marketing Hub:

- número de servicios C2;
- ofertas;
- imágenes;
- Meta-ready;
- servicios excluidos por precio `quote`;
- inconsistencias.

### Fase 3 — habilitar solo servicios realmente listos

Primer lote:

1. certificado-digital-persona-fisica;
2. certificado-digital-entidad;
3. pack-certificados-digitales;
4. nacionalidad-espanola-menor-nacido-en-espana;
5. arraigo-social.

Prioridad de sincronización inicial:

- los 3 certificados, ya `production_ready`;
- después nacionalidad menor;
- después arraigo social.

Regla:
ningún servicio entra en publicación/sincronización por estar simplemente presente en catálogo.

### Fase 4 — primera proyección real de Meta

Para cada servicio:

- retailer_id canónico;
- landing correcta;
- imagen square dinámica;
- precio desde fuente canónica;
- descripción;
- availability;
- channel config;
- estado ready.

Primera sincronización:
máximo 3 servicios.

No hacer sync masivo en el primer intento.

### Fase 5 — validar activos Meta

Validar individualmente:

- Business Portfolio;
- Facebook Page;
- Instagram Professional;
- Ad Account;
- Catalog;
- Dataset/Pixel;
- System User;
- permisos.

Registrar resultado en EXPERT como metadato no sensible.

### Fase 6 — publicación orgánica Meta

Orden:

1. Facebook;
2. Instagram.

Primera prueba:

- contenido aprobado;
- una cuenta;
- una pieza;
- publicación controlada;
- guardar `external_object_id`;
- releer publicación;
- registrar log;
- validar errores y reintento.

No activar cron general todavía.

### Fase 7 — conversiones / Dataset

Después de orgánico estable:

- validar Pixel/Dataset;
- definir eventos;
- mapear conversiones;
- activar CAPI donde aporte valor;
- evitar duplicidad browser/server;
- probar deduplicación;
- vincular lead/checkout con source/UTM.

Eventos mínimos:

- page_view;
- view_service;
- lead;
- begin_checkout;
- purchase;
- book_consultation.

### Fase 8 — LinkedIn

Primero perfil personal de Ksenia.

Después:

- página EXPERT;
- Ads.

Guardar por separado:

- `linkedin_member`;
- `linkedin_organization`;
- `linkedin_ads`.

No activar Ads hasta poder listar campañas en read-only.

### Fase 9 — Google Ads

Mantener Google Ads separado de Gemini/Workspace.

Secuencia:

1. Customer ID;
2. Google Ads API activa en Cloud;
3. OAuth;
4. lectura de customer;
5. listado de campañas;
6. campaña PAUSED de prueba;
7. solo después escritura productiva.

### Fase 10 — Publisher Cron

Activar únicamente cuando:

- Meta orgánico probado;
- LinkedIn probado si está habilitado;
- logs completos;
- publicación idempotente;
- reintentos limitados;
- bloqueo por job;
- alertas Admin;
- pieza sigue `approved` antes de publicar.

---

## 5. Imágenes y sistema visual

### Lote visual inicial

Generar creatividades para:

1. Certificado digital PF.
2. Certificado digital entidad.
3. Pack certificados.
4. Nacionalidad menor nacido en España.
5. Arraigo social.

### Entregables por servicio

- 1 imagen de catálogo canónica 1200x1200;
- 1 hero 1600x900;
- 1 creatividad social 1:1;
- 1 creatividad feed 4:5;
- 1 story/reel cover 9:16;
- 1 carrusel de 5-7 slides cuando el tema lo permita.

### Norma visual

Consistencia:

- EXPERT visible;
- navy / crema / dorado;
- tipografía limpia;
- no saturar de texto;
- máximo una promesa principal;
- precio solo si es canónico y vigente;
- no usar claims absolutos;
- no mostrar proveedores de marca blanca.

---

## 6. MentorDay dentro del ecosistema editorial

Los 100 contactos MentorDay forman una audiencia relacional separada.

No tratarlos como clientes ni como marketing opt-in automático.

Uso permitido dentro de EXPERT:

- historial de contacto;
- proyecto;
- edición;
- país;
- sector;
- resumen KIA;
- seguimiento;
- consentimiento;
- oportunidades reales surgidas posteriormente.

Contenido público:

- casos autorizados;
- aprendizajes anónimos;
- metodología;
- artículos derivados;
- proyectos con permiso;
- logos solo con autorización.

No publicar correos, teléfonos, notas privadas, documentos internos ni datos financieros personales.

---

## 7. Backlog de contenido

### Pilar A — servicios

Cada servicio debe alimentar:

- landing;
- blog;
- KB;
- FAQ;
- social;
- ads;
- KIA.

### Pilar B — MentorDay

Temas iniciales:

- interés no es validación;
- cómo diseñar un primer piloto medible;
- autónomo vs SL al empezar;
- cuándo automatizar y cuándo no;
- cómo preparar una sesión de mentoría;
- de una recomendación a un plan 30/60/90;
- validación académica vs evidencia de mercado.

### Pilar C — EXPERT / KIA

- cómo trabajamos;
- automatización fiscal/contable;
- expedientes;
- firma;
- calendario;
- KIA;
- Holded;
- controller contable;
- digitalización del despacho.

---

## 8. Definition of Done del bloque Marketing v1

El bloque puede considerarse operativo cuando:

- [ ] PR #553 fusionada.
- [ ] catálogo C2 poblado.
- [ ] no hay planes retirados reintroducidos.
- [ ] 3 servicios production_ready proyectados correctamente.
- [ ] 3 imágenes square y hero validadas.
- [ ] catálogo Meta probado con 3 items.
- [ ] Facebook orgánico probado.
- [ ] Instagram orgánico probado.
- [ ] external IDs persistidos.
- [ ] logs correctos.
- [ ] Dataset/Pixel validado.
- [ ] eventos básicos definidos.
- [ ] LinkedIn OAuth preparado.
- [ ] Google Ads read-only preparado.
- [ ] calendario crea jobs.
- [ ] publisher permanece desactivado hasta terminar pruebas.
- [ ] documentación actualizada.

---

## 9. Acciones humanas requeridas a Ksenia

### Ahora

1. Fusionar manualmente PR #553 si GitHub sigue mostrando CI verde y sin nuevos hilos.
2. Dar acceso a un entorno donde podamos ejecutar el backfill C2 o ejecutar:
   `npx tsx scripts/backfill-meta-catalog-c2.ts --apply`
   después de la revisión final del script.
3. No cambiar más variables Meta mientras las pruebas actuales sigan verdes.

### Más adelante

Para LinkedIn:

- crear/confirmar Developer App;
- confirmar LinkedIn Page de EXPERT;
- autorizar OAuth cuando preparemos el callback;
- confirmar Campaign Manager si se usarán Ads.

Para Google Ads:

- confirmar Customer ID;
- confirmar proyecto Cloud;
- autorizar OAuth cuando el cliente esté implementado.

---

## 10. Regla de trabajo

No abrir diez frentes simultáneamente.

Secuencia:

```text
cerrar → probar → documentar → medir → siguiente bloque
```

Prioridad actual:

```text
#553
→ C2
→ 3 servicios Meta
→ Meta orgánico
→ conversiones
→ LinkedIn
→ Google Ads
→ cron
```
