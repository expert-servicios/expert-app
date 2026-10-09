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

## Requisito transversal — interactividad completa de todas las fichas (decisión 09/10/2026)

**Ninguna ficha será una pantalla informativa sin acciones.** El panel debe permitir navegar, operar y relacionar registros desde el dato que el usuario está viendo, sin regresar al menú principal ni recorrer páginas interminables. **Documentado para fase futura; no implementar ahora.**

### Comportamiento de elementos y enlaces

- **Nombre de cliente/persona:** abre su ficha 360 (drawer o ruta completa según complejidad) sin perder búsqueda, filtros ni entidad activa.
- **Nombre de empresa:** abre Company 360; desde allí, acceder a personas vinculadas, expedientes, tareas, comunicaciones, documentos, facturación, bancos e integraciones.
- **Contabilidad, libros, balances, facturas, cobros, pagos y bancos:** cada indicador o cifra enlaza directamente con la vista contable correspondiente **de la empresa seleccionada**, mostrando la fuente (Holded/Stripe/EXPERT) y las acciones permitidas; nunca mezclar tenants.
- **Nombre de expediente, documento, correo, cita, tarea, presupuesto o factura:** abre el registro original con su contexto, historial y acciones, no una tarjeta estática.
- **Relaciones y referencias cruzadas:** enlaces persona ↔ empresa ↔ expediente ↔ documentos ↔ contabilidad ↔ movimientos ↔ tareas ↔ comunicaciones; navegación de ida/vuelta con filtros y posición preservados.
- **Acciones visibles:** botón o menú contextual claramente identificable en cada fila/ficha, con accesos por teclado y en móvil; evitar iconos ambiguos y enlaces que aparenten funcionar sin hacerlo.

### Operaciones de gestión que deben contemplarse (CRUD y productividad)

| Módulo | Acciones esperadas (según rol, estado del registro y normativa) |
| --- | --- |
| Personas y clientes | Crear nuevo, abrir, editar datos permitidos, activar/desactivar, vincular/desvincular empresas, ver expedientes y comunicaciones, exportar datos autorizados |
| Empresas | Crear, abrir, editar campos autorizados, enlazar personas/servicios/tenants, ver contabilidad e impuestos, archivar bajo controles, exportar ficha o listado |
| Expedientes | Crear, abrir, editar, asignar responsable, añadir hitos, enlazar documentos y correos, cerrar/reabrir con justificación, generar resumen, exportar |
| Tareas y citas | Crear, editar, reasignar, reprogramar, completar con evidencia, enlazar al registro de origen, cancelar conforme a permisos y exportar |
| Documentos | Subir, crear entregables, previsualizar, descargar, enlazar, clasificar, sustituir mediante versiones y archivar, con acceso temporal seguro |
| Facturación/contabilidad/bancos | Abrir origen, filtrar, conciliar o preparar propuestas **solo cuando esté expresamente autorizado**, exportar Excel, acceder a facturas/asientos/justificantes; no ejecutar escrituras o borrados automáticos |
| Integraciones | Abrir configuración y estado, probar lectura, consultar permisos y sincronizaciones, enlazar o desconectar con confirmación y auditoría |
| Comunicaciones | Ver hilo y adjuntos, responder/reenviar si procede, crear tarea o expediente, vincular cliente/empresa, filtrar y exportar según RGPD |

- Menús contextuales estándar: **Abrir, Nuevo, Editar, Modificar, Vincular, Desvincular, Duplicar cuando tenga sentido, Archivar/Eliminar cuando proceda, Compartir si está autorizado, Exportar**. Mostrar únicamente las acciones realmente implementadas y permitidas.
- **Crear nuevo** contextual (empresa desde cliente, tarea desde expediente, documento desde empresa, etc.), heredando contexto correctamente sin inventar datos.
- **Edición de registros individuales** en modal/drawer compacto, con validaciones, guardar/cancelar, indicador de cambios no guardados y confirmación de salida.
- **Acciones masivas** para tablas filtradas cuando tengan sentido: selección múltiple, cambios seguros en lote, exportación filtrada y permisos diferenciados; nunca modificar otro tenant por selección accidental.
- **Exportar a Excel (.xlsx)** como capacidad estándar de tablas y listados (personas, empresas, tareas, expedientes, documentos, facturas y bancos), exportando solo filas/columnas autorizadas y los filtros visibles. CSV opcional. Incluir encabezados, fechas/monedas en formato español, trazabilidad de la exportación y controles de privacidad.
- La exportación debe generarse en servidor cuando el volumen sea alto; no descargar miles de registros al navegador ni exponer campos ocultos.

### Seguridad y ergonomía de operaciones

- **Eliminar no es siempre borrar:** registros financieros, contables, fiscales, registrales y con obligaciones de conservación deben protegerse; ofrecer anulación, archivo, rectificación, sustitución o baja lógica según reglas. Históricos nunca se reescriben silenciosamente.
- Confirmación explícita para eliminar, desactivar, desvincular, enviar comunicaciones, escrituras contables, conciliaciones y acciones no reversibles; vista previa de consecuencias, impacto sobre relaciones y auditoría de quién/cuándo/qué cambió.
- Proteger NIF/CIF y demás datos oficiales verificados; mostrar fuente y mecanismo de rectificación en lugar de edición libre.
- RBAC y permisos por empresa, rol y acción aplicados **en servidor** (no solo deshabilitando botones). Acciones no autorizadas se ocultan o explican, nunca ejecutan.
- **KIA puede abrir la ficha o preparar una propuesta** desde el contexto seleccionado; necesita confirmación humana para operaciones sensibles y debe mostrar el resultado verificable.
- Enlaces profundos coherentes con IDs canónicos; preservar contexto al cerrar panel/modal, recargar o volver. Soporte teclado, foco, estados de carga, errores recuperables y confirmación de guardado.

### Pruebas de aceptación específicas

1. Hacer clic en el nombre de cliente abre la ficha correcta; desde la ficha abrir su empresa y regresar sin repetir la búsqueda.
2. Pulsar «Contabilidad» de EXPERT abre **su propio** tenant «Expert Consulting», nunca el de asesorías; DGM abre el entorno que le corresponda.
3. Desde una fila, crear y editar un registro autorizado con guardado validado; abrir el mismo registro desde otra sección refleja el cambio.
4. Desde un expediente, enlazar documento/correo/tarea y comprobar que la relación se ve desde ambos extremos sin duplicados.
5. Exportar a Excel el resultado de un filtro de 500+ registros respetando permisos y columnas, con archivo legible y totales correctos.
6. Las acciones de archivar, eliminar o desvincular muestran impacto y, cuando proceda, impiden borrar históricos financieros.
7. KIA guía a una persona nueva hasta el módulo correcto y prepara una acción sin ejecutarla si requiere autorización.
8. Todo botón y enlace visible funciona realmente, devuelve feedback y tiene pruebas; sin acciones decorativas, rutas rotas ni formularios que se expandan indefinidamente.


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
- **F3 — Fichas totalmente interactivas y operaciones controladas:** CRUD contextual, vínculos bidireccionales persona/empresa/expediente/contabilidad, edición, creación, archivo/borrado condicionado, exportación Excel y acciones por fila, con permisos y auditoría.
- **F4 — Copiloto KIA + QA:** panel compacto, guía contextual, tareas orientadas a roles, accesibilidad y pruebas con usuario novel.
- **F5 — Escala y observabilidad:** rendimiento con >500 entidades, errores, métricas de descubribilidad, auditoría, seguridad y pruebas de regresión.

## Límites y dependencias

- **Por ahora solo documentación:** no rediseñar componentes, no tocar datos, no abrir un PR funcional por este documento.
- Mantener intactos los trabajos en curso: PR de reseñas, integración propia Holded, conciliación y vigilancia de facturación IA.
- Antes de implementar: cerrar una propuesta de navegación y prototipo visual, revisar permisos, seleccionar 5-8 tareas reales (incluyendo CRUD, vínculos y Excel) y aprobar criterios de aceptación.
- Reutilizar APIs y modelos canónicos de Admin 360; evitar añadir otro CRM o otro directorio.
- Despliegue por etapas detrás de controles seguros; typecheck, lint, tests, build, Vercel y Security Advisor cuando corresponda.

## Resultado esperado

**Una tabla compacta para encontrar cualquier persona o entidad, una ficha 360 contextual para trabajar sin saltos y KIA integrado sin ocupar la pantalla.** La interfaz debe resultar obvia para un empleado nuevo y mantenerse rápida con cientos de clientes.

**Propietario de decisión de producto:** dirección EXPERT. **Estado de implementación:** pendiente; recuperar este documento cuando se retome el rediseño.
