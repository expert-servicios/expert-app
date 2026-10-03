# Admin Meta Catalog Manager — Plan operativo

Fecha: 03/10/2026

## Objetivo

Convertir `Admin > Marketing Hub` en el centro operativo del catálogo Meta de EXPERT para gestionar de extremo a extremo:

- servicios y ofertas canónicas;
- contenidos ES/RU;
- imágenes;
- validación de readiness;
- sincronización Meta;
- errores, reintentos y auditoría.

La pantalla debe ser compacta, operativa y comprensible sin conocimiento técnico.

## Principios UX

1. **Catálogo primero**: la tabla operativa ocupa la parte principal de la pantalla.
2. **Estados inequívocos**: separar `Borrador`, `Listo`, `Sincronizando`, `Sincronizado`, `Cambios pendientes`, `Error`.
3. **ES/RU visibles en una línea**: cada fila muestra disponibilidad y estado por idioma.
4. **Imagen visible**: miniatura en línea y ampliación con clic.
5. **Diagnóstico secundario**: métricas técnicas/configuración quedan compactadas y no dominan la pantalla.
6. **Acciones contextuales**: editar, revisar imagen, sincronizar y reintentar desde la propia fila.
7. **Fail-closed**: ningún servicio puede sincronizarse si precio, contenido, imagen o permisos no cumplen.

## Fase 1 — Catálogo compacto y estado real Meta ✅ completada

### Entregables
- Cabecera compacta con conexión Meta y acciones globales.
- Resumen compacto de servicios, listos, sincronizados y errores.
- Tabla principal con:
  - miniatura clicable;
  - nombre + retailer_id;
  - ES/RU;
  - precio final;
  - estado Meta real;
  - Meta item ID;
  - última sincronización.
- Diferenciación visual entre `marketingReady` y `synced`.
- Visor de imagen en modal.
- Diagnóstico/configuración movidos a bloque secundario.

### Criterio de hecho
La usuaria puede saber de un vistazo qué existe realmente en Meta y qué solo está preparado.

## Fase 2 — Editor multidioma ES/RU ✅ completada

### Entregables
- Edición por servicio con tabs ES/RU.
- Campos:
  - nombre;
  - descripción corta;
  - descripción;
  - landing;
  - imagen por idioma o compartida.
- Indicador de completitud por idioma.
- Preview antes de publicar.
- Validación obligatoria.

### Criterio de hecho
Un servicio puede quedar completo en ES y RU sin editar base de datos manualmente.

## Fase 3 — Gestión de imágenes 🚧 en curso

### Entregables
- Upload manual.
- Imagen común o específica por idioma.
- Preview cuadrado Meta.
- Sustitución y versionado básico.
- Validaciones de formato/dimensiones.
- Preparación para generación asistida por IA.

### Criterio de hecho
La usuaria puede gestionar todos los activos visuales desde Admin.

## Fase 4 — Sincronización operativa completa

### Entregables
- Sync individual.
- Sync de selección.
- Sync por idioma.
- Sync masiva de servicios ready.
- Reintento seguro de errores.
- Detección de cambios pendientes respecto al último payload.
- Logs legibles y auditables.

### Criterio de hecho
No hace falta intervención de desarrollo para mantener el catálogo Meta.

## Fase 5 — Automatización editorial

### Entregables
- Borrador ES asistido por IA.
- Adaptación RU.
- Propuesta de imagen.
- Generación/variantes de creatividades.
- Checklist automático.
- Alertas de servicios listos no sincronizados.

## Fase 6 — Catálogo RU inicial

Primer lote:
1. certificado-digital-persona-fisica;
2. certificado-digital-entidad;
3. pack-certificados-digitales.

Incluye:
- copy RU;
- imagen RU o compartida según diseño;
- staging;
- validación;
- sync;
- verificación de Meta item IDs RU.

## Modelo de estado recomendado

### Editorial
- draft
- review
- ready
- archived

### Meta
- not_ready
- ready
- pending
- synced
- stale
- failed
- manual_review

## Orden de implantación

1. Fase 1 completa.
2. Fase 2 estructura ES/RU.
3. Fase 3 imágenes.
4. Fase 4 sync generalizada.
5. Fase 6 primer lote RU.
6. Fase 5 automatización IA progresiva.
