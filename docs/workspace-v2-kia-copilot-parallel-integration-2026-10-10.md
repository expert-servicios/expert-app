# EXPERT Workspace V2 × KIA — Contrato de integración y ejecución paralela
**Fecha:** 10/10/2026 · **Estado:** especificación de integración, NO funcionalidad desplegada.
**Backlogs coordinados:** Admin/Cliente [PR #708](https://github.com/expert-servicios/expert-app/pull/708) e inteligencia/Document/Artifact Studio [PR #707](https://github.com/expert-servicios/expert-app/pull/707).
**Documento rector:** [EXPERT Admin V2](expert-admin-v2-plan-maestro-2026-10-09.md).

## 1. Decisión de producto ratificada
Denominación global: **EXPERT Workspace V2**, con Admin Workspace, Client Workspace y Modo soporte. KIA es **un copiloto único, contextual y persistente**, montado como **lateral derecho completo** en Admin y Cliente. No es una ventana de chat aislada ni un segundo agente distinto por canal. Ambos workspaces reutilizan el mismo componente KiaDock, estado conversacional y core de IA; **no** comparten sin permiso datos, credenciales, rol ni empresa. La interfaz incorpora conversación ES/RU, audio, futuro multifichero y Artifact Studio, sin perder espacio útil en la zona central.

### Layout objetivo
- **Escritorio amplio (referencia ≥ 1440 px):** tres áreas simultáneas: navegación izquierda + workspace central + **KIA derecha a toda altura útil (100% del viewport)**. KIA visible por defecto salvo preferencia de contraer; ancho orientativo 360–480 px, ampliable 520–620 px para documento/artefacto y con resize accesible. Ajustar tras pruebas a 1280/1440/1920, zoom 125–200%, idiomas ES/RU. El contenido central debe conservar un mínimo razonable y no ocultar tablas ni controles; el usuario podrá contraer KIA sin perder conversación.
- **Escritorio/tablet intermedio:** barra derecha estrecha de acceso/contexto y drawer sobrepuesto temporalmente, no forzar dos columnas que estrangulen formularios.
- **Móvil:** hoja/pantalla completa con safe areas, teclado, controles voz/adjuntos, altura dinámica, botón de volver; sin solaparse con navegación ni recortar campos.
- **Header del dock:** avatar/estado KIA, empresa y objeto de trabajo, contexto verificable, estado de permisos, colapsar/expandir y acceso a conversación. Notificaciones y acciones en pestaña/atajo secundario, sin desactivar o duplicar el chat.
- **Uno por superficie:** WorkspaceFrame alberga rightPanel único. AdminRightPanel pasa a wrapper del KiaDock compartido; Client Workspace añade el mismo dock. El widget flotante del layout protegido se elimina o desactiva en estas rutas, manteniendo otros canales compatibles. Admin /admin/kia reusa el mismo controlador/conversación, evitando una segunda sesión implícita.
- **Modo soporte:** monta dock Admin real con subject+company seleccionados y barra visible; no inicia sesión de cliente ni hereda cliente distinto. Reutiliza los mismos módulos de Client Workspace.

## 2. Evidencia concreta del repositorio actual (main)
- components/workspace/WorkspaceFrame.tsx **ya admite rightPanel opcional**. Admin layout pasa AdminRightPanel; dashboard layout **no** pasa ningún rightPanel.
- app/(protected)/layout.tsx monta KiaCopilotWidget flotante para todos los autenticados y AdminRightPanel monta su propio KiaCopilotWidget embedded. Riesgo de **dos instancias/conversaciones** en Admin.
- components/admin/AdminRightPanel.tsx tiene panel derecho sticky a 2xl, overlay por debajo, 370 px estándar/620 px extendido; en pantalla amplia abre por defecto salvo preferencia guardada. Es una base reutilizable, pero no garantiza lateral completo por defecto en ambos workspaces.
- components/KiaCopilotWidget.tsx entrega currentPage/currentTask/pageData; Admin lee DOM de título/pestaña y acepta el evento expert:kia-page-context. Revisión proactiva Admin: a los 450 ms de abrir página/pestaña envía silenciosamente una petición de LLM; no existe aún un control transversal de consentimiento, evidencia ni presupuesto por módulo/usuario.
- lib/ai/kia/kia-proactive-suggestions.ts crea **sugerencias genéricas post-respuesta**; no es un motor de observación de actividad. Además, los chips proactivos se muestran en modo no Admin, pero quedan suprimidos en Admin.
- app/api/ai/kia/route.ts utiliza runPolicyEnforcedKiaDecision y recibe pageData desde el navegador; **el contexto aportado por el cliente es una pista no confiable**, jamás un permiso. La policy actual admin_copilot es solo lectura R1.
- /admin/clientes/[id]/portal dispone de modo soporte, pero no todas las pantallas reales están embebidas. El nuevo dock debe compartirse también en modo soporte.
- Existing page context event publishers detectados en EmailsPageClient, empresas y ficha de cliente. No hay contrato transversal uniforme ni contexto declarativo obligatorio para todos los módulos.

## 3. Contrato de actividad de página común: KiaWorkspaceContext V1

Cada módulo de Workspace publica desde componentes propios un **evento semántico limitado** a la UI (no enviar pantallazos ni contenido de todo el DOM), que el servidor revalida cuando haya que resolver datos o ejecutar herramientas:

| Campo | Tipo lógico | Semántica |
| --- | --- | --- |
| version | 1 | Versionado para cambios compatibles |
| surface | admin / client / support | Superficie; no equivale a rol autorizado |
| routeKey / module | enum conocido | Ej.: contacts, inbox, tasks, calendar, company, holded, accounting, cases, documents, payments, marketing, settings |
| subjectHint | person/company/case + ID opcional | Solo referencia; resolver ámbito/permiso otra vez en backend |
| companyHint / caseHint | ID opcional | Nunca conceden derechos por aparecer en evento/URL |
| activity | view / select / edit_start / validate_error / save_success / workflow_step / ask_help | Situación operativa, sin valores de campos |
| workflowStep / errorCode | enum permitido | Código no sensible; no incluir datos de cliente ni secretos en mensajes |
| contextVersion / occurredAt | identificador/fecha | Permite descartar eventos obsoletos o duplicados |
| locale | es / ru | Idioma de presentación; no autoriza datos |
| correlationId | identificador opaco | Une la sugerencia con operación de negocio auditada |

**Prohibiciones:** nunca serializar campos de formulario sin consentimiento, contraseñas, tokens Holded/OAuth, IBAN completos, DNI, historiales clínicos, texto íntegro de correo ni documentos al evento. No tomar HTML o URL completa como verdad de negocio. El servidor recuperará únicamente resúmenes mínimos desde endpoints ya autorizados, company-scoped y case-scoped, con fuente, fecha y estado.

**Responsabilidad de cada equipo:**
- Workspace V2 implementa *emitters/adapters*: useKiaWorkspaceContext, contexto desde selecciones reales, invalidación y panel.
- KIA Intelligence implementa *consumers/advisor*: validador, classificador actividad, selección skill/subagente, reglas proactivas, propuesta explicable, herramientas sujetas a policy, costes y tracing.
- Contrato único, tests compartidos; no lanzar un API paralelo de «KIA context».

## 4. Ayuda proactiva basada en hechos: no confundir pantalla con intención del usuario
Proceso previsto:
1. Workspace emite evento explícito de navegación/acción; KIA muestra contexto local inmediato sin llamar por fuerza al modelo.
2. Resolver evento por reglas deterministas baratas y **solo evidencia existente verificada** (p.ej. integración Holded degradada, documento pendiente, validación fallida, cita no confirmada, factura vencida comprobada).
3. Generar **máximo 1–2 consejos contextualizados**, sin mostrar una cascada de mensajes ni perturbar una tarea. En eventos pasivos, preferir aviso contextual/chip («Puedo ayudarte a revisar este error») que el usuario activa.
4. Invocar modelo o especialista solo si el usuario acepta, solicita ayuda o existe evento relevante con política y presupuesto permitidos; los eventos críticos se distinguen de simples cambios de pestaña.
5. Sugerencia trae source/evidenceId, actorScope, expiry, nivel de confianza, mensaje breve, acción autorizada, causa y posibilidad de descartar.
6. Control anti-spam: debounce, dedupe por actor+empresa+objeto+evento+versión, cooldown entre avisos, límite de peticiones/coste y cancelación cuando cambia contexto. Respetar preferencia de proactividad (on/off/silencio), horario y sesión.
7. **Nunca** enviar correo, crear tarea, reservar cita, escribir en Holded, cobrar, presentar trámite ni modificar expediente por mera navegación. Preparar borrador o pedir confirmación según política. Si no hay expediente, KIA no debe inventar por qué la persona consulta.

## 5. Integración por módulos — primeros casos de aceptación

| Módulo | Evento contextual | Ayuda KIA verificable | Alcance |
| --- | --- | --- | --- |
| Contactos / leads | Registro seleccionado, relación/origen confirmados | Resumir histórico autorizado, detectar información empresarial sin verificar, preparar siguiente acción | Admin; Cliente solo datos propios |
| Inbox / correo | Hilo seleccionado, tarea asociada, estado humano/KIA | Resumir y preparar respuesta, detectar plazo si hay evidencia, evitar duplicar tarea | Admin con autorización, humano confirma envíos |
| Agenda / tareas | Cita real, disponibilidad y tarea seleccionada | Preparar reunión, agenda y pasos pendientes; detectar conflicto probado | Cliente propia / Admin scope |
| Empresa / Holded | Empresa elegida, conexión, error conocido, capabilities | Explicar estado y guía de configuración, solicitar permiso que falta; no presumir escritura | Scope company/tenant estricto |
| Contabilidad / facturas | Documento, periodo, estado, anomalía validada | Explicar descuadre, proponer asiento/borrador, mostrar fuente y fecha | Lectura por defecto; escribir solo con aprobación/tokens efectivos |
| Documentos / expedientes | Checklist, archivo, paso de trámite real | Indicar documento concreto pendiente, preparar guía/plantilla, explicar siguiente paso | No inventar expediente ni fecha oficial |
| Servicios / pagos | Presupuesto y estado reales | Explicar precio, servicio o necesidad de confirmar pago | No cobrar ni suscribir autónomamente |
| Marketing / contenido | Borrador/editor seleccionado | Revisar texto, SEO/fuentes, proponer imagen y aprobación | Admin; sin publicación automática |
| Ajustes / integraciones | Paso fallido y error_code validado | Proponer solución contextual con documentación y prueba verificable | No revelar ni modificar secreto |

## 6. Identidad, aislamiento y modo soporte
- Key de conversación/contexto: actor real + surface + subjectType/subjectId autorizado + companyId explícito + caseId explícito, bajo contrato de sesiones existente. Cambiar sujeto o empresa **aborta peticiones en curso, invalida respuestas y limpia referencias, adjuntos, artefactos y cache** antes de mostrar otro contexto. No conservar sugerencias privadas entre tenants.
- En soporte, la identidad de operador sigue siendo Admin y las operaciones se auditan como tal; el sujeto del cliente es **solo target autorizado**, no identidad de login. El servidor comprueba todo el ámbito en cada petición.
- Los botones de ayuda proactiva son **propuestas**. Ejecutar herramienta exige la policy del canal, actor, empresa, permisos efectivos y consentimiento/aprobación cuando corresponda. El contexto UI nunca amplía scopes.
- Optimización: PII minimizada; telemetría de actividad por evento funcional, no keylogging ni grabación de pantalla; retención y RGPD validados. Evitar tocar modelos financieros históricos.

## 7. Coordinación de los dos roadmaps y entregables

| Entrega conjunta | Workspace V2 / PR #708 | KIA Intelligence / PR #707 | Dependencia de cierre |
| --- | --- | --- | --- |
| I0. Inventario | rutas, layouts, breakpoints, fuente de contexto | rutas KIA, policy, subagentes, trigger actual | matriz y gap list aceptados |
| I1. Dock único | WorkspaceFrame/Client/Admin/Support, una instancia y UI ES/RU | controller compartido, estado/conversación y hooks | no duplicados y render móvil |
| I2. Eventos | contexto declarativo y selectores por módulo | validador, normalizador y resolución autorizada | PII y company-scope |
| I3. Sugerencias | bandeja de consejo en dock y opt-out | motor de reglas, evidencia, coste, dedupe, skills | sin spam, no acciones espontáneas |
| I4. Acciones | confirm dialogs, readback, estado de permiso | tools por policy + trazabilidad | 403 negativos y aprobación |
| I5. Documentos/artefactos | visor/descarga/preview en panel lateral | ingesta múltiple, Document Studio, Artifact Studio | after #705 security gates |
| I6. Cutover | flags admin_v2, client_v2, support_mode_v1 y kia_dock_v2 independientes | kia_context_v1, kia_proactive_v1 y capacidades posteriores | CI, Vercel, mobile, rollback |

**No paralelizar migraciones incompatibles:** trabajar en ramas/PR separadas, compartir contrato acordado y fusionar incrementalmente cuando CI y seguridad estén verdes. Resolver primero #683 y hallazgos P1/P2 de #705; la planificación de #707/#708 no los desbloquea por sí sola.

## 8. Definition of Done para la integración
- Admin, Cliente y Soporte muestran exactamente **un KIA Dock** en la derecha a toda altura útil en desktop amplio y un patrón responsive correcto a tablet/móvil; la conversación no se duplica.
- Abrir contacto, cambiar empresa, entrar en expediente o corregir un formulario actualiza contexto contextual visible **sin perder la tarea** y sin enviar contenido sensible del formulario.
- Mismo conocimiento y especialistas; el canal decide capacidades. Un cliente no ve propuestas Admin ni datos de otra empresa.
- Admin soporte KIA nunca actúa como el cliente; cada acción es atribuida al Admin real.
- No se hacen llamadas IA por cada repaint, scroll, pulsación o tab sin criterio; proactividad deduplicada, silenciosa o desactivable.
- Pruebas E2E con dos usuarios, dos empresas, cliente sin expediente, Admin en modo soporte, integración Holded degradada, formulario con error, migración de ruta, mobile keyboard, ES/RU y solicitudes concurrentes con cambio de contexto.
- QA visual escritorio 1280/1440/1920, tablet y móvil; zoom; a11y teclado y VoiceOver/TalkBack. CI TypeScript/lint/tests, Vercel ambos proyectos, permisos RLS y Security Advisor si existe DDL.
- Despliegue gradual detrás de flags independientes con rollback; no declarar soporte completo ni proactividad avanzada como operativos antes de QA verificable.
