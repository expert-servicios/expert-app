# EXPERT Admin V2 — Contrato técnico subordinado de soporte delegado y KIA
> **Consolidación 17/10/2026:** actualización auxiliar de requisitos originalmente capturados en la PR #708. El Plan Maestro E0–E6 tiene prioridad; esta ratificación **no autoriza** ejecutar fases de soporte ni escrituras en Holded. Se ha conservado la totalidad del documento canónico de Admin V2 en main; las secciones siguientes son suplementos de requisitos, no un reemplazo del plan existente.

## 1. Operación del portal real sin suplantación

### 2 ter.7. Alcance operativo completo del «Portal cliente · Modo soporte» (ratificación 10/10/2026)

**Requisito de dirección, vinculante:** el Admin debe poder entrar en el **mismo espacio funcional del cliente**, con idénticos módulos y formularios reutilizados y con comandos internos adicionales, para **realizar directamente** las configuraciones, integraciones, gestión documental, operaciones y trabajo contable que EXPERT esté legitimada y técnicamente autorizada a ejecutar. La vista actual /admin/clientes/[id]/portal **solo muestra resumen, contexto, auditoría y enlaces**: no cumple aún este requisito de edición operativa unificada. No presentar «vista delegada existente» como «soporte operativo completo implementado».

**Recorrido objetivo:** Contactos 360 o Empresas 360 → «Abrir portal · Modo soporte» → seleccionar persona o entidad canónica y empresa autorizada → navegar dentro del mismo workspace por Resumen, Perfil, Empresas, Integraciones, Facturación/Contabilidad, Expedientes, Documentos, Agenda, Comunicaciones, Ajustes y KIA → configurar, previsualizar, editar/crear cuando esté autorizado → verificar persistencia real → volver a Contactos/Empresas conservando filtros. **Una entidad sin usuario de acceso** dispone del mismo contexto empresarial de soporte sin fabricar cuenta de cliente; no debe bloquear configuración ni vinculación Holded company-scoped.

**Principio de implementación:** reutilizar visualmente **la pantalla, componente de dominio, formulario, validaciones, datos y experiencia del Client Workspace**; incorporar adaptadores y comandos de Admin bajo controles de servidor. No clonar el dashboard, ni construir un «pseudo portal» de tarjetas de enlaces. Los módulos exclusivamente internos (marketing, conciliación global de EXPERT, operaciones de equipo, auditoría global, campañas, Inbox 360) siguen accesibles al Admin desde su shell o un acceso contextual, **sin exponerlos al cliente**.

#### Matriz concreta de módulos

| Módulo del portal | Qué podrá resolver el Admin desde modo soporte | Condición y fase |
| --- | --- | --- |
| Perfil, alta y empresas | Completar onboarding y datos autorizados, revisar identidad/verificación, vincular relaciones, representante/empresa, categorías y configuración del dashboard | Reutilizar formularios, validar sujeto y compañía; no alterar hechos oficiales confirmados sin rectificación. Fase S1 |
| Accesos y permisos | Configurar invitaciones, membresías, permisos concedidos, usuarios del portal y su estado | Auth sin suplantación, never reveal passwords/tokens. Confirmar cambios de acceso y registrar quién los autorizó. Fase S2 |
| Integraciones | Conectar, probar, ajustar o revocar integración Holded por empresa; permisos detectados/habilitados; vigencia del token; estado sincronización; Google/Calendar/Drive/otras con la autorización de proveedor válida | Reutilizar CompanyHoldedAdminPanel y ClientHoldedAdminPanel sin duplicar configuradores. OAuth externo puede requerir consentimiento del titular: Admin prepara vínculo y verifica resultado; credenciales nunca en frontend/chat. Fase S1–S2 |
| Facturación/Contabilidad | Consultar facturas emitidas/recibidas, clientes/proveedores, cuentas, diario, balances, tesorería, cobros/pagos, vencimientos, conciliación, anomalías, ajustes y evidencias; preparar propuestas y documentos | Modo lectura con fuente, periodo, fecha última sincronización y empresa explícitos. Cifras no verificadas se marcan. No mezclar la contabilidad propia de EXPERT con la cuenta laboratorio o empresas cliente. Fase S2 |
| Operaciones contables autorizadas | Crear/corregir borradores, propuestas de asiento, abonos, recordatorios y conciliación; ejecutar la operación permitida en Holded con aprobación específica si existe capacidad real de escritura | **No disponible por defecto.** Requiere mandato/alcance, permiso efectivo del token de esa empresa, tool/endpoint autorizado, preview del efecto, confirmación, idempotency key, readback y auditoría; sin borrar históricos ni generar asientos «de prueba» en datos reales. Activación gradual por tipo de operación. Fase S3 |
| Expedientes y documentos | Crear expediente/checklist, recibir/clasificar archivos, relacionar con empresa, preparar escritos, descargar entregables y revisar pendientes | Actor real, proveniencia, permisos de documentos, no acceso transversal. Fase S2 |
| Citas y comunicaciones | Reservar/reprogramar con disponibilidad real, gestionar solicitudes, preparar/responder comunicaciones autorizadas, crear tareas relacionadas, consultar estado envío/Meet | Consentimiento cuando corresponda, hilo/tarea/correlación y lectura posterior verificadas. Fase S2 |
| Suscripciones/Stripe, cobros | Ver estado de contratación y pagos EXPERT, corregir datos de facturación permitidos, preparar presupuesto, revisar fallos e incidencias | No crear cargos, contratos ni cambios de plan como si los hubiera aceptado el cliente; validar mandato, términos y confirmación. Fase S2 |
| KIA | Usar una sola instancia de Copilot para ver datos autorizados y preparar acciones desde el contexto seleccionado | Misma KIA, sujeto/empresa por SupportContext, identidad real Admin y política de tool específica; nunca usar permisos Admin globales para leer empresa no seleccionada. Fase S1–S3 |

**Capacidades reales, no aspiracionales:** antes de mostrar «Guardar», «Contabilizar», «Conciliar», «Enviar», «Emitir», «Revocar» o «Conectar» debe existir un endpoint verificable y autorización efectiva. No inferir que Holded write está disponible por el mero hecho de poder leer. Cuando falte acceso, mostrar estado bloqueado, causa, opción de solicitar autorización o tarea; nunca una operación simulada.

#### Contrato de contexto, permisos y trazabilidad
- El Admin sigue autenticado **como Admin** en todo momento; no crear sesión/JWT del cliente ni cambiar el active_company_id del cliente. El contexto de soporte es actorId + subjectType/subjectId + companyId + role/grants + mode + correlationId + caducidad, resuelto de nuevo por petición y acotado a una relación verificada o permiso de soporte expresamente concedido.
- El mismo módulo UI podrá recibir un ClientDataAdapter o AdminSupportAdapter; los endpoints Admin nunca son invocables directamente con IDs de terceros por un cliente. En cada lectura/escritura validar actor activo, autorización de soporte, empresa, recurso, acción, permiso de proveedor y CSRF/origen; retornar 403 sin detalles ajenos cuando no procede.
- Separar **permiso EXPERT** (trabajar sobre cliente o entidad) de **permiso del tercero** (usar la cuenta Holded, Google, banco u otro). Un mandato profesional puede permitir operación sin intervención reiterada del cliente dentro de su alcance y vigencia; cuando OAuth/confirmación del proveedor lo exija, no se puede sustituir por ser Admin EXPERT.
- Barra fija «Modo soporte» con identidad del cliente/empresa, operador real, empresa seleccionada, capacidad lectura/edición vigente, tarea/caso y salida clara. Mantener el contexto entre pestañas del workspace y borrar caché, documentos en memoria y estado KIA al cambiar de sujeto/empresa o salir.
- Auditoría de **entrada, cambio, salida y de cada operación relevante**: actor y roles efectivos, sujeto, companyId, endpoint/tool, tipo de acción, origen y dispositivo aproximado, fecha, correlation/request id, previa y posterior versión/campos permitidos (nunca secretos), aprobación/mandato, idempotencia, resultado y verificación externa. Consultable desde historial de cliente/empresa y Admin 360, con retención conforme a política.
- La ruta legacy /admin/clientes/[id]/portal se conserva como punto de entrada/alias; la futura /admin/soporte/... se decidirá en inventario. Compatibilidad por feature flag support_mode_v1 y rollback sin mutación de identidades.

#### Secuencia de implantación de soporte sin parches
- **S0 — Matriz real:** inventariar todas las pantallas cliente y rutas Admin, agrupar por componente/servicio reutilizable, verificar modelos empresa/persona sin perfil, permisos de conexión/lectura/escritura y capacidad de KIA. Definir primero pruebas de denegación por sujeto/empresa.
- **S1 — Shell funcional:** SupportWorkspaceShell con la misma navegación/formularios del portal, empresa y contexto de soporte independientes, barra visible, historial y edición permitida de perfil/configuración con readback. Mantener la vista actual como fallback.
- **S2 — Cobertura operativa:** incorporar integraciones reales, facturas y contabilidad en lectura, documentos, expedientes, agenda, mensajes, contratación y configuración por empresa; sin volver a construir pantallas paralelas.
- **S3 — Escritos contables controlados:** piloto con empresa laboratorio autorizada, propuesta → simulación → aprobación → escritura limitada → verificación en Holded → log. Pruebas con token sin write, firma/capacidad revocada, duplicado/reintento y empresa distinta; desplegar operación a operación, nunca activación general.
- **S4 — E2E y cutover:** smoke tests cliente real + Admin delegado + empresa sin perfil + dos empresas de un mismo contacto; responsive móvil, seguridad/privacidad y KIA; retirar tarjetas/enlaces redundantes solo tras demostrar la navegación operativa.

**Criterios de cierre adicionales:** (a) Admin configura Holded para una empresa sin usuario sin inventar identidad; (b) el cliente autenticado ve cambios autorizados del mismo módulo sin recibir controles staff; (c) KIA y Contabilidad actúan solo sobre la empresa expresamente seleccionada; (d) un token de lectura no habilita un asiento; (e) la primera escritura contable piloto, cuando se apruebe, se valida por lectura posterior sin duplicado; (f) cada transición y mutación queda atribuida al Admin real y puede auditarse; (g) no se deja un segundo configurador independiente para lo mismo.

**Consecuencia en el plan:** se reduce el alcance de los formularios duplicados de «Ficha 360 administrativa». La ficha de Contactos es una **tarjeta de identidad + relaciones + timeline + acciones**, mientras que la configuración completa se realiza desde **Portal en modo soporte**. Esto **no elimina** las funciones de back-office que nunca deberían existir en un portal cliente (campañas, Inbox general, conciliaciones globales, auditoría del equipo), ni convierte el soporte en impersonación.

---


## 2. KIA en el lateral de Workspace

## 11 bis. Integración transversal KIA Copiloto en EXPERT Workspace V2 (10/10/2026)

**Decisión ratificada:** Admin, Cliente y Modo soporte comparten un KIA Copiloto único ocupando el **lateral derecho completo** en escritorio amplio, colapsable/expandible y responsive. Es parte estructural de Workspace V2, no un widget flotante aparte. KIA y el panel se desarrollan en líneas coordinadas mediante contrato compartido y PRs incrementales.

**Contrato técnico y distribución de responsables:** [Workspace V2 × KIA — integración paralela, contexto de pantalla, ayuda proactiva y gates](workspace-v2-kia-copilot-parallel-integration-2026-10-10.md). Coordinación explícita con plan Intelligence [PR #707](https://github.com/expert-servicios/expert-app/pull/707); plan Admin/Cliente [PR #708](https://github.com/expert-servicios/expert-app/pull/708).

**Hallazgos de main:** WorkspaceFrame ya acepta rightPanel; AdminRightPanel lo monta, Client Layout no. El layout protegido monta otro widget flotante y genera riesgo de duplicar chat en Admin. Existe contexto de pantalla básico (currentPage/currentTask/pageData/evento expert:kia-page-context) y una revisión proactiva Admin que hace llamada al modelo tras cambio de página; no es aún la ayuda proactiva consolidada ni se considera autorizada a efectuar operaciones. En Cliente hay sugerencias genéricas sin detección semántica completa de tarea.

**Implementación transversal:** un KiaDock compartido en WorkspaceFrame, montado exactamente una vez por superficie; tres zonas visibles en desktop amplio (menú/área central/KIA) con altura completa, ancho adaptable y contraíble; overlay en viewport reducido, panel completo en móvil. Contexto de actividad explícito y tipado por módulo, sin extraer formularios/documentos del DOM ni confiar en IDs del navegador. KIA resuelve permisos y evidencias en servidor y puede proponer ayudas limitadas y útiles sin spamear, con opt-out, antideduplicación y costes controlados. La navegación/selección no concede permisos ni autoriza escritura; en soporte se preserva actor Admin real y empresa explícita.

**Orden integrado:** I0 inventario y contrato → I1 dock único → I2 eventos contextuales → I3 sugerencias con evidencia → I4 confirmaciones/tools → I5 Document/Artifact Studio → I6 rollout y QA. Mantener feature flags por superficie y rollback independiente. Este documento describe arquitectura; no implica desplegar la funcionalidad ahora.


## 3. Ajustes de las fases de Admin V2 conservados de la PR #708

Estas dos modificaciones de alcance complementan la tabla de fases del Plan Admin V2, sin autorizar su desarrollo:

| Fase | Especificación añadida | Control | Resultado futuro esperado |
| --- | --- | --- | --- |
| 1A. Modo soporte cliente | Reutilizar `ClientWorkspaceShell`, formularios y servicios de dominio con `AdminSupportAdapter`; contexto de cliente/empresa y auditoría | Actor Admin real, permisos server-side, no suplantación, flag `support_mode_v1` | Admin navega y configura en el mismo portal sin duplicar pantallas; cliente no recibe permisos Admin |
| 5. Finanzas | Planes/pagos Holded/Stripe y contabilidad en vista real de cliente y modo soporte; configuración por empresa y piloto posterior de operaciones contables autorizadas | Integridad, mandato, lectura/escritura diferenciadas, permisos efectivos Holded y confirmación | Cero cruce de tenants; Admin opera una empresa explícita, escrituras piloto solo con previsualización, aprobación, idempotencia y verificación posterior |

## 4. Precedencia

Este complemento conserva el alcance de S0–S4 y I0–I6 de PR #708; la secuencia E0–E6 es la única autorización de ejecución. Cualquier diferencia con el plan Admin V2 vigente debe verificarse y aplicarse por revisión humana antes de implementar.
