# EXPERT Admin 360 — rediseño compacto de experiencia y navegación (backlog futuro)

**Fecha de decisión:** 2026-10-09  
**Estado:** DOCUMENTADO / NO IMPLEMENTAR AHORA  
**Prioridad:** fase posterior al cierre de integraciones, conciliación, reseñas y demás frentes operativos abiertos.  
**Relación:** `docs/admin-360-unified-directory-plan.md` y `docs/admin-improvement-plan.md` (IMP-025, IMP-026, IMP-030, IMP-032, IMP-033).

## Decisión de producto

El Panel Admin debe ser un **espacio operativo único**, intuitivo para una persona nueva, capaz de gestionar **cientos o miles de clientes** y entidades sin desplazamientos verticales interminables. El operador debe encontrar lo que busca con un mínimo de navegación y poder actuar desde su contexto con asistencia de KIA. **No acometer este rediseño en la fase actual**: conservarlo como propuesta priorizada para próximas sesiones.

### Problemas observados por la dirección

- La ficha actual de empresa ocupa demasiada altura y apila cuadros, tarjetas y paneles.
- El listado de entidades debería mostrarse **por filas compactas, no por tarjetas grandes**.
- Los detalles de cada registro deberían poder abrirse en **ventana modal o panel lateral (drawer)**, en lugar de expandir campos y formularios dentro de una ficha gigante.
- Resulta costoso navegar hacia otro menú, volver, recuperar el cliente y continuar el trabajo; el desplazamiento vertical y la superposición de KIA reducen espacio.
- En la ficha de Company 360 no hay un botón evidente de **Editar datos de empresa**; distinguir campos administrativos editables de datos oficiales bloqueados.
- Las personas, empresas, clientes, contactos, expedientes y tenants de terceros no son la misma entidad ni deben duplicarse.

## Experiencia objetivo

### 1. Directorio como punto de entrada

- **Tabla compacta por defecto**, una fila por persona o empresa; opcionalmente vista de tarjetas, no predeterminada.
- Columnas configurables y discretas: nombre/razón social, NIF/CIF parcial según permiso, tipo, estado, contacto, relaciones, último movimiento, tareas por atender, integraciones y acciones.
- Cabecera y búsqueda global fijas; filtros y orden reutilizables, paginación/virtualización de datos, búsqueda en servidor (no descargar miles de registros al navegador).
- Filtros: persona/empresa, cliente/prospecto, con/sin acceso al portal, asesoría/cuenta propia, Holded y proveedor, incidencias, tareas, responsable, estado.
- Atributos de estado breves y semánticos; eliminar repetición de etiquetas, estadísticas redundantes y tarjetas decorativas.
- Selección de fila abre vista contextual con acciones; doble clic/teclado y enlaces profundos abren ficha completa cuando sea necesario.

### 2. Ficha 360 compacta y contextual

- Cabecera breve y fija con identificación, empresa activa, estado, selector de entidad y acciones principales.
- Pestañas/secciones cortas: Resumen, Personas/relaciones, Expedientes, Tareas, Comunicaciones, Documentos, Facturación/bancos, Integraciones, Hoja registral e Histórico.
- No cargar todo el contenido de todas las pestañas simultáneamente; cargar según la sección, mantener posición y filtros.
- Los módulos densos se abren **en drawer/modal de tamaño apropiado**, conservando el contexto y la selección de cliente. En tareas complejas o tablas grandes, pantalla dedicada con enlace y retorno directo.
- Formularios breves por acción, validación visible; evitar un modal encima de otro o scroll anidado.
- Enlaces relacionados a otros registros, comunicaciones y acciones sin obligar a navegar repetidamente al Directorio.
- Guardar y volver al mismo registro/pestaña; accesos directos copiables.

### 3. Edición de entidad y modelo de datos

- Incorporar acción visible **Editar datos** con modal o drawer compacto: contacto, teléfono, correo, domicilio, nombre comercial y campos operativos autorizados.
- **Razón social, NIF/CIF y campos oficiales confirmados por registros públicos:** solo lectura; mostrar origen, fecha de verificación y procedimiento de rectificación, nunca sobrescribirlos silenciosamente.
- Evitar duplicados por NIF/CIF; vínculos persona ↔ empresa explícitos.
- Separar el tenant de **EXPERT Asesorías** (empresas de clientes como DGM y ALVILS) de **Expert Consulting**, tenant de la contabilidad propia de EXPERT ESTUDIOS PROFESIONALES S.L.U.
- No inferir pertenencia a tenant únicamente por nombre comercial o por la credencial activa. Toda conexión bancaria/fiscal debe quedar vinculada a entidad canónica.
- Los cambios de vínculo de integraciones deben verificarse y registrarse; no reescribir asientos, facturas ni históricos de terceros.

### 4. KIA como copiloto, no como obstáculo de lectura

- KIA disponible desde todo Admin, **colapsable a botón compacto**; panel lateral redimensionable, ocultable y no superpuesto sobre formularios.
- Asistencia por contexto: entidad/expediente/pestaña actual, resumen fiable, búsqueda, recomendaciones de siguiente acción y enlaces directos.
- KIA debe diferenciar **hecho verificado**, sugerencia y acción pendiente de confirmación; no inventar motivos de contacto ni completar tareas por inferencia.
- Acciones administrativas sensibles requieren autorización humana, previsualización de cambios, registro de auditoría y permisos company-scoped.
- Añadir ayudas en lenguaje sencillo, microtextos, estados vacíos útiles y accesos para usuarios sin conocimientos técnicos.
- QA de experiencia: validar tareas reales con operadores nuevos y casos multientidad; el asistente **KIA** acompaña, no suplanta las comprobaciones de calidad.

### 5. Rendimiento, accesibilidad y móvil

- Paginación en servidor, índices de búsqueda adecuados, estados de carga discretos, caché segura, evitar consultas N+1 y renderizado de cientos de tarjetas.
- Desktop primero para tablas operativas; móvil y tablet con filas condensadas, acciones prioritarias y drawers adaptados al tamaño de pantalla.
- Navegación por teclado, foco devuelto al registro al cerrar el modal, Escape para cerrar, títulos claros, lectura por tecnologías de asistencia, contraste y tamaños accesibles.
- No mostrar nombres/identificadores sensibles en notificaciones o previews no autorizados.
- Preferencia por reducción de scroll, de clics y de pérdida de contexto; no optimizar solo para estética.

## Flujos de referencia y criterios de aceptación

1. **Encontrar un cliente entre 500+:** búsqueda por nombre o NIF parcial autorizado; resultado filtrado, abrir ficha y regresar conservando consulta y posición.
2. **Abrir empresa desde persona:** ver sociedades y autónomos vinculados; navegar a empresa/expediente y volver sin pasar por menús globales.
3. **Editar teléfono:** una acción visible, drawer, validación, confirmación y retorno a la misma pestaña; NIF oficial protegido.
4. **Ver y conciliar en modo lectura:** desde ficha de EXPERT abrir bancos de su tenant propio; distinguir pendientes/reconciliados, sin combinar con bancos de DGM/ALVILS.
5. **Atender tarea o correo:** acceso directo a expediente, conversación y origen; marcar tareas solo con evidencia.
6. **Asistencia KIA:** un nuevo empleado pregunta cómo revisar una deuda; KIA abre el módulo correcto, cita la fuente y solicita autorización antes de acciones irreversibles.
7. **Vista con KIA abierta:** no tapa columnas críticas, botones, campos ni texto en desktop/móvil.
8. **Rendimiento:** listados con cientos/miles de registros sin cargas masivas, desplazamiento fluido y filtros consistentes.

## Fases futuras sugeridas (sin ejecutar)

- **F0 — Auditoría de UX:** inventario de rutas, capturas desktop/móvil, roles, puntos de duplicidad, métricas de tareas reales, prototipo sin migraciones.
- **F1 — Directorio compacto:** tabla, filtros, búsqueda, acciones por fila, estados, acceso de teclado y deep links.
- **F2 — Fichas 360 y navegación:** cabecera compacta, pestañas, drawers/modales, retorno contextual, selector multi-entidad.
- **F3 — Edición controlada y enlaces:** editar datos administrativos, relaciones persona-empresa, enlace a expediente/banco/factura, proteger datos registrales.
- **F4 — Copiloto KIA + QA:** panel compacto, guía contextual, tareas orientadas a roles, accesibilidad y pruebas con usuario novel.
- **F5 — Escala y observabilidad:** rendimiento con >500 entidades, errores, métricas de descubribilidad, auditoría, seguridad y pruebas de regresión.

## Límites y dependencias

- **Por ahora solo documentación:** no rediseñar componentes, no tocar datos, no abrir un PR funcional por este documento.
- Mantener intactos los trabajos en curso: PR de reseñas, integración propia Holded, conciliación y vigilancia de facturación IA.
- Antes de implementar: cerrar una propuesta de navegación y prototipo visual, revisar permisos, seleccionar 5-8 tareas reales y aprobar criterios de aceptación.
- Reutilizar APIs y modelos canónicos de Admin 360; evitar añadir otro CRM o otro directorio.
- Despliegue por etapas detrás de controles seguros; typecheck, lint, tests, build, Vercel y Security Advisor cuando corresponda.

## Resultado esperado

**Una tabla compacta para encontrar cualquier persona o entidad, una ficha 360 contextual para trabajar sin saltos y KIA integrado sin ocupar la pantalla.** La interfaz debe resultar obvia para un empleado nuevo y mantenerse rápida con cientos de clientes.

**Propietario de decisión de producto:** dirección EXPERT. **Estado de implementación:** pendiente; recuperar este documento cuando se retome el rediseño.
