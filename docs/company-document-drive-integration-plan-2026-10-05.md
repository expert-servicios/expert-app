# EXPERT — Integración documental por empresa: Drive ↔ EXPERT ↔ KIA

Fecha: 2026-10-05  
Piloto: DISEÑO GLOBAL MERIDIANO, S.L. (DGM)

## Estado auditado

Ya existe:
- `public.documents` + Supabase Storage como registro canónico.
- Subida y descarga privada de documentos por expediente.
- Documentación 360º en Admin.
- Entregables y documentos en el portal de expedientes.
- Mirror secundario a Google Drive.
- KIA `get_case_documents` con descarga autorizada.

Falta:
- mapping estable `company_id ↔ carpeta Drive`;
- indexación/importación de una carpeta Drive existente;
- hub documental global del cliente por empresa;
- herramientas KIA a nivel empresa;
- flujo canónico de solicitud documental.

## Piloto DGM

Carpeta localizada: `DGM — Diseño Global Meridiano`.

Raíz:
- `00_Entrada_pendiente`
- `01_Documentos_generales`
- `02_Ejercicios`
- `03_Expedientes`
- `04_Bienes_y_contratos`

Se han verificado ejercicios 2021–2026, 26 carpetas de expedientes y carpetas por bienes/inmuebles y contratos.

Actualmente DGM tiene 0 filas en `public.documents`, por lo que KIA todavía no ve ese archivo organizado.

## Decisión arquitectónica

EXPERT mantiene la autoridad sobre:
- autorización;
- `company_id`, `client_id`, `case_id`;
- clasificación y estado;
- trazabilidad;
- checklist;
- acceso de KIA;
- copia canónica en Supabase Storage cuando el archivo se incorpora formalmente.

Drive queda como fuente externa/espejo operativo.

Nunca autorizar por nombre de carpeta. El vínculo estable será por `company_id`.

## Fases

### Fase 1 — Mapping empresa ↔ Drive
Crear `company_document_roots`:
- id uuid;
- company_id uuid;
- provider google/ms365;
- external_folder_id;
- display_name;
- status;
- sync_mode;
- last_indexed_at;
- last_error;
- timestamps;
- unique (company_id, provider).

Registrar DGM contra su carpeta organizada y modificar el mirror para resolver primero por `company_id`.

### Fase 2 — Indexación segura
Recorrer Drive de forma recursiva y registrar inventario:
- provider file id;
- path relativo;
- nombre;
- MIME;
- tamaño;
- fechas;
- parent id;
- hash/checksum si existe;
- empresa;
- categoría derivada de ruta.

Primero indexar; no copiar masivamente ni ejecutar OCR/IA.

### Fase 3 — Importación canónica
Desde Admin, seleccionar documentos/lotes:
- descargar server-side;
- validar;
- hash SHA-256;
- deduplicar;
- guardar en Storage;
- crear `documents`;
- conservar `drive_file_id = google:<id>`;
- asignar `company_id`;
- asociar expediente solo con evidencia clara.

### Fase 4 — Hub cliente `/dashboard/documentos`
- selector de empresa;
- búsqueda;
- filtros;
- ver/descargar;
- subir;
- elegir general o expediente;
- estados;
- solicitudes pendientes;
- historial y sustituciones.

### Fase 5 — KIA documental por empresa
Mantener `get_case_documents` y añadir R0:
- `get_company_documents`;
- `search_company_documents`.

KIA devolverá enlaces EXPERT autorizados, nunca URLs públicas de Drive.

### Fase 6 — Solicitudes documentales
Crear flujo canónico para:
- pendiente;
- recibido;
- revisado;
- sustituido/cancelado.

KIA explica qué falta y presenta CTA de subida. Los mensajes externos siguen sujetos a política/autorización.

### Fase 7 — Sincronización incremental
Después del piloto:
- Drive Activity/Changes;
- cola idempotente;
- reindexación incremental;
- conflictos visibles;
- nunca borrar automáticamente en EXPERT por un borrado en Drive.

## Orden DGM

1. registrar carpeta DGM;
2. indexar estructura;
3. mostrar inventario en Admin;
4. importar primero Documentos generales + 2025 + 2026 + bienes/contratos activos;
5. vincular expedientes;
6. habilitar búsqueda KIA;
7. probar consultas reales;
8. abrir hub cliente;
9. activar clasificación automática solo después del piloto.

## Seguridad

- credenciales Drive solo server-side;
- `company_id` obligatorio en autorización;
- descargas a través de EXPERT;
- URLs firmadas cortas;
- auditoría de actor/empresa/documento/acción;
- sin compartir carpetas Drive directamente por defecto;
- imports idempotentes por provider + external ID + hash;
- no mover/renombrar históricos durante indexación.

## Feature flags propuestas

- `COMPANY_DOCUMENT_ROOTS_ENABLED`
- `GOOGLE_DRIVE_INDEX_ENABLED`
- `GOOGLE_DRIVE_IMPORT_ENABLED`
- `KIA_COMPANY_DOCUMENTS_ENABLED`
- `CLIENT_DOCUMENTS_HUB_ENABLED`

DGM será canary antes del rollout general.
